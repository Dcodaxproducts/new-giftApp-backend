import { Injectable } from '@nestjs/common';
import { NotificationRecipientType, Prisma, WalletLedgerDirection, WalletLedgerStatus, WalletLedgerType, WalletOwnerType } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { CUSTOMER_CART_WITH_ITEMS_INCLUDE } from './customer-cart.repository';
import { NotificationDispatchService } from '../../notifications/notification-dispatch.service';

export const CUSTOMER_ORDER_INCLUDE = Prisma.validator<Prisma.OrderInclude>()({
  items: { include: { gift: { select: { id: true, name: true, imageUrls: true, price: true, currency: true } } } },
  payments: true,
});

type CheckoutTransaction = Prisma.TransactionClient;
type CreateOrderData = Prisma.Args<CheckoutTransaction['order'], 'create'>['data'];
type CreateOrderItemData = Prisma.Args<CheckoutTransaction['orderItem'], 'create'>['data'];

@Injectable()
export class CustomerOrdersRepository {
  constructor(private readonly prisma: PrismaService, private readonly notificationDispatch: NotificationDispatchService) {}

  findManyForCustomerOrders(params: { where: Prisma.OrderWhereInput; skip: number; take: number }) {
    return this.prisma.order.findMany({ where: params.where, include: CUSTOMER_ORDER_INCLUDE, orderBy: { createdAt: 'desc' }, skip: params.skip, take: params.take });
  }

  countForCustomerOrders(where: Prisma.OrderWhereInput) {
    return this.prisma.order.count({ where });
  }

  findManyAndCountForCustomerOrders(params: { where: Prisma.OrderWhereInput; skip: number; take: number }) {
    return this.prisma.$transaction([
      this.prisma.order.findMany({ where: params.where, include: CUSTOMER_ORDER_INCLUDE, orderBy: { createdAt: 'desc' }, skip: params.skip, take: params.take }),
      this.prisma.order.count({ where: params.where }),
    ]);
  }

  findOwnedOrderById(userId: string, id: string) {
    return this.prisma.order.findFirst({ where: { id, userId }, include: CUSTOMER_ORDER_INCLUDE });
  }

  findOwnedOrderWithItems(userId: string, id: string) {
    return this.findOwnedOrderById(userId, id);
  }

  findActiveCartForCheckout(userId: string, cartId?: string) {
    return this.prisma.cart.findFirst({ where: { ...(cartId ? { id: cartId } : {}), userId }, include: CUSTOMER_CART_WITH_ITEMS_INCLUDE });
  }

  findGiftsForCheckout<T extends Prisma.GiftInclude>(params: { giftIds: string[]; where: Prisma.GiftWhereInput; include: T }) {
    return this.prisma.gift.findMany({ where: { id: { in: params.giftIds }, ...params.where }, include: params.include });
  }

  runCheckoutTransaction<T>(callback: (tx: CheckoutTransaction) => Promise<T>) {
    return this.prisma.$transaction(callback);
  }

  createOrderWithItems(tx: CheckoutTransaction, data: CreateOrderData) {
    return tx.order.create({ data });
  }

  createOrderItem(tx: CheckoutTransaction, data: CreateOrderItemData) {
    return tx.orderItem.create({ data });
  }

  findActivePayoutSettings(tx: CheckoutTransaction) {
    return tx.systemSettings.findFirst({ orderBy: { createdAt: 'asc' } });
  }

  findActiveCommissionTiers(tx: CheckoutTransaction) {
    return tx.commissionTier.findMany({ where: { deletedAt: null, isActive: true }, orderBy: { orderVolumeThreshold: 'desc' } });
  }

  async sumProviderOrderEarnings(tx: CheckoutTransaction, providerId: string) {
    const aggregate = await tx.walletLedger.aggregate({ where: { type: WalletLedgerType.ORDER_EARNING, direction: WalletLedgerDirection.CREDIT, status: WalletLedgerStatus.SUCCESS, wallet: { ownerType: WalletOwnerType.PROVIDER, ownerId: providerId } }, _sum: { amount: true } });
    return Number(aggregate._sum.amount ?? 0);
  }

  findCustomerWallet(userId: string) {
    return this.prisma.wallet.findUnique({ where: { ownerType_ownerId: { ownerType: WalletOwnerType.USER, ownerId: userId } } });
  }

  markCartCheckedOut(tx: CheckoutTransaction, cartId: string) {
    return tx.cartItem.deleteMany({ where: { cartId } });
  }

  createOrderNotification(tx: CheckoutTransaction, params: { recipientId: string; recipientType: NotificationRecipientType; title: string; message: string; orderId: string }) {
    return this.notificationDispatch.createAndEmit({ recipientId: params.recipientId, recipientType: params.recipientType, title: params.title, message: params.message, type: 'ORDER', metadataJson: { orderId: params.orderId } });
  }

  // Cancels a paid order: refunds the customer's wallet and moves the deduction (cancellation fee)
  // to the platform wallet, then marks the order CANCELLED — all atomically and idempotently.
  cancelOrderWithRefund(params: { orderId: string; userId: string; deductionPercent: Prisma.Decimal; refundAmount: number; deductionAmount: number; currency: string }) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Refund the customer (only once per order).
      if (params.refundAmount > 0) {
        const wallet = await tx.wallet.findUnique({ where: { ownerType_ownerId: { ownerType: WalletOwnerType.USER, ownerId: params.userId } } });
        if (wallet) {
          const already = await tx.walletLedger.findFirst({ where: { walletId: wallet.id, orderId: params.orderId, type: WalletLedgerType.REFUND } });
          if (!already) {
            await tx.walletLedger.create({ data: { walletId: wallet.id, orderId: params.orderId, type: WalletLedgerType.REFUND, direction: WalletLedgerDirection.CREDIT, amount: new Prisma.Decimal(params.refundAmount), currency: params.currency, status: WalletLedgerStatus.SUCCESS, transactionId: this.transactionId(), description: 'Order cancellation refund.' } });
            await tx.wallet.update({ where: { id: wallet.id }, data: { balance: { increment: new Prisma.Decimal(params.refundAmount) } } });
          }
        }
      }
      // 2. Move the cancellation deduction to the platform wallet (only once per order).
      if (params.deductionAmount > 0) {
        const platform = await this.getOrCreatePlatformWallet(tx, params.currency);
        const already = await tx.walletLedger.findFirst({ where: { walletId: platform.id, orderId: params.orderId, type: WalletLedgerType.PLATFORM_FEE } });
        if (!already) {
          await tx.walletLedger.create({ data: { walletId: platform.id, orderId: params.orderId, type: WalletLedgerType.PLATFORM_FEE, direction: WalletLedgerDirection.CREDIT, amount: new Prisma.Decimal(params.deductionAmount), currency: params.currency, status: WalletLedgerStatus.SUCCESS, transactionId: this.transactionId(), description: 'Order cancellation deduction.' } });
          await tx.wallet.update({ where: { id: platform.id }, data: { balance: { increment: new Prisma.Decimal(params.deductionAmount) } } });
        }
      }
      // 3. Mark the order cancelled.
      return tx.order.update({ where: { id: params.orderId }, data: { status: 'CANCELLED', cancellationDeductionPercent: params.deductionPercent, cancellationRefundAmount: new Prisma.Decimal(params.refundAmount), cancelledAt: new Date() }, include: CUSTOMER_ORDER_INCLUDE });
    });
  }

  private async getOrCreatePlatformWallet(tx: CheckoutTransaction, currency: string) {
    // Platform wallet is a singleton with no user owner (ownerId is a FK to User, so it must be null).
    const existing = await tx.wallet.findFirst({ where: { ownerType: WalletOwnerType.PLATFORM } });
    return existing ?? tx.wallet.create({ data: { ownerType: WalletOwnerType.PLATFORM, ownerId: null, currency } });
  }

  private transactionId(): string { return `TXN-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`; }
}
