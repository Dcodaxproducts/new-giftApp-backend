import { BadRequestException, Injectable } from '@nestjs/common';
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

  // Pays for an order entirely from the customer's wallet (no Stripe at checkout). Gift credits are
  // spent first, then the cash balance. Throws (rolling back the checkout tx) if funds are short.
  async debitCustomerWalletForOrder(tx: CheckoutTransaction, params: { userId: string; orderId: string; amount: number; currency: string }) {
    const wallet = await tx.wallet.findUnique({ where: { ownerType_ownerId: { ownerType: WalletOwnerType.USER, ownerId: params.userId } } });
    if (!wallet) throw new BadRequestException('Wallet not found. Please top up your wallet before ordering.');
    const giftCredits = Number(wallet.giftCredits);
    const balance = Number(wallet.balance);
    if (giftCredits + balance + 1e-9 < params.amount) throw new BadRequestException('Insufficient wallet balance. Please top up your wallet.');
    const giftCreditsUsed = this.round(Math.min(giftCredits, params.amount));
    const balanceUsed = this.round(params.amount - giftCreditsUsed);
    await tx.walletLedger.create({ data: { walletId: wallet.id, orderId: params.orderId, type: WalletLedgerType.ORDER_PAYMENT, direction: WalletLedgerDirection.DEBIT, amount: new Prisma.Decimal(params.amount), currency: params.currency, status: WalletLedgerStatus.SUCCESS, transactionId: this.transactionId(), description: 'Order payment from wallet.' } });
    await tx.wallet.update({ where: { id: wallet.id }, data: { giftCredits: { decrement: new Prisma.Decimal(giftCreditsUsed) }, balance: { decrement: new Prisma.Decimal(balanceUsed) } } });
    return { giftCreditsUsed, balanceUsed };
  }

  markCartCheckedOut(tx: CheckoutTransaction, cartId: string) {
    return tx.cartItem.deleteMany({ where: { cartId } });
  }

  private round(value: number): number { return Number(value.toFixed(2)); }
  private transactionId(): string { return `TXN-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`; }

  createOrderNotification(tx: CheckoutTransaction, params: { recipientId: string; recipientType: NotificationRecipientType; title: string; message: string; orderId: string }) {
    return this.notificationDispatch.createAndEmit({ recipientId: params.recipientId, recipientType: params.recipientType, title: params.title, message: params.message, type: 'ORDER', metadataJson: { orderId: params.orderId } });
  }

  cancelOrder(orderId: string, data: { cancellationDeductionPercent: Prisma.Decimal; cancellationRefundAmount: Prisma.Decimal }) {
    return this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'CANCELLED',
        cancellationDeductionPercent: data.cancellationDeductionPercent,
        cancellationRefundAmount: data.cancellationRefundAmount,
        cancelledAt: new Date(),
      },
      include: CUSTOMER_ORDER_INCLUDE,
    });
  }
}
