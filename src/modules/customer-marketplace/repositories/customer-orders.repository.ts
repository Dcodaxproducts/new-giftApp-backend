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
    return tx.adminPayoutSettings.findFirst({ orderBy: { createdAt: 'asc' } });
  }

  findActiveCommissionTiers(tx: CheckoutTransaction) {
    return tx.commissionTier.findMany({ where: { deletedAt: null, isActive: true }, orderBy: { orderVolumeThreshold: 'desc' } });
  }

  async sumProviderOrderEarnings(tx: CheckoutTransaction, providerId: string) {
    const aggregate = await tx.walletLedger.aggregate({ where: { type: WalletLedgerType.ORDER_EARNING, direction: WalletLedgerDirection.CREDIT, status: WalletLedgerStatus.SUCCESS, wallet: { ownerType: WalletOwnerType.PROVIDER, ownerId: providerId } }, _sum: { amount: true } });
    return Number(aggregate._sum.amount ?? 0);
  }

  markCartCheckedOut(tx: CheckoutTransaction, cartId: string) {
    return tx.cartItem.deleteMany({ where: { cartId } });
  }

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
