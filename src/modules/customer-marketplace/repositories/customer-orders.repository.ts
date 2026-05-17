import { Injectable } from '@nestjs/common';
import { CartStatus, NotificationRecipientType, Prisma, ProviderEarningsLedgerDirection, ProviderEarningsLedgerStatus, ProviderEarningsLedgerType } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { CUSTOMER_CART_WITH_ITEMS_INCLUDE } from './customer-cart.repository';

export const CUSTOMER_ORDER_INCLUDE = Prisma.validator<Prisma.OrderInclude>()({
  items: { include: { gift: { select: { id: true, name: true, imageUrls: true } }, variant: { select: { id: true, name: true } } } },
  providerOrders: true,
  payment: true,
});

type CheckoutTransaction = Prisma.TransactionClient;
type CreateOrderData = Prisma.Args<CheckoutTransaction['order'], 'create'>['data'];
type CreateOrderItemData = Prisma.Args<CheckoutTransaction['orderItem'], 'create'>['data'];
type CreateProviderOrderData = Prisma.Args<CheckoutTransaction['providerOrder'], 'create'>['data'];
type CreateProviderOrderItemData = Prisma.Args<CheckoutTransaction['providerOrderItem'], 'create'>['data'];


@Injectable()
export class CustomerOrdersRepository {
  constructor(private readonly prisma: PrismaService) {}

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
    return this.prisma.cart.findFirst({ where: { ...(cartId ? { id: cartId } : {}), userId, status: CartStatus.ACTIVE }, include: CUSTOMER_CART_WITH_ITEMS_INCLUDE });
  }

  findPaymentForUser(userId: string, paymentId: string) {
    return this.prisma.payment.findFirst({ where: { id: paymentId, userId } });
  }

  findDeliveryAddressForUser(userId: string, addressId: string) {
    return this.prisma.customerAddress.findFirst({ where: { id: addressId, userId, deletedAt: null } });
  }

  findGiftsForCheckout(params: { giftIds: string[]; where: Prisma.GiftWhereInput; include: Prisma.GiftInclude }) {
    return this.prisma.gift.findMany({ where: { id: { in: params.giftIds }, ...params.where }, include: params.include });
  }

  runCheckoutTransaction<T>(callback: (tx: CheckoutTransaction) => Promise<T>) {
    return this.prisma.$transaction(callback);
  }

  createOrderWithItems(tx: CheckoutTransaction, data: CreateOrderData) {
    return tx.order.create({ data });
  }

  decrementGiftStock(tx: CheckoutTransaction, giftId: string, quantity: number) {
    return tx.gift.update({ where: { id: giftId }, data: { stockQuantity: { decrement: quantity } } });
  }

  decrementVariantStock(tx: CheckoutTransaction, variantId: string, quantity: number) {
    return tx.giftVariant.update({ where: { id: variantId }, data: { stockQuantity: { decrement: quantity } } });
  }

  createOrderItem(tx: CheckoutTransaction, data: CreateOrderItemData) {
    return tx.orderItem.create({ data });
  }

  createProviderSubOrder(tx: CheckoutTransaction, data: CreateProviderOrderData) {
    return tx.providerOrder.create({ data });
  }

  findActivePayoutSettings(tx: CheckoutTransaction) {
    return tx.adminPayoutSettings.findFirst({ orderBy: { createdAt: 'asc' } });
  }

  findActiveCommissionTiers(tx: CheckoutTransaction) {
    return tx.commissionTier.findMany({ where: { deletedAt: null, isActive: true }, orderBy: { orderVolumeThreshold: 'desc' } });
  }

  async sumProviderOrderEarnings(tx: CheckoutTransaction, providerId: string) {
    const aggregate = await tx.providerEarningsLedger.aggregate({ where: { providerId, type: ProviderEarningsLedgerType.ORDER_EARNING, direction: ProviderEarningsLedgerDirection.CREDIT, status: { in: [ProviderEarningsLedgerStatus.AVAILABLE, ProviderEarningsLedgerStatus.PAYOUT_PENDING, ProviderEarningsLedgerStatus.PAID] } }, _sum: { amount: true } });
    return Number(aggregate._sum.amount ?? 0);
  }

  findProviderOrderItems(tx: CheckoutTransaction, orderId: string, providerId: string) {
    return tx.orderItem.findMany({ where: { orderId, providerId }, include: { gift: { select: { name: true, imageUrls: true } }, variant: { select: { name: true } } } });
  }

  createProviderOrderItem(tx: CheckoutTransaction, data: CreateProviderOrderItemData) {
    return tx.providerOrderItem.create({ data });
  }

  markCartCheckedOut(tx: CheckoutTransaction, cartId: string) {
    return Promise.all([
      tx.cartItem.deleteMany({ where: { cartId } }),
      tx.cart.update({ where: { id: cartId }, data: { status: CartStatus.CHECKED_OUT } }),
    ]);
  }

  linkPaymentToOrder(tx: CheckoutTransaction, paymentId: string, orderId: string) {
    return tx.payment.update({ where: { id: paymentId }, data: { orderId } });
  }

  createOrderNotification(tx: CheckoutTransaction, params: { recipientId: string; recipientType: NotificationRecipientType; title: string; message: string; orderId: string }) {
    return tx.notification.create({ data: { recipientId: params.recipientId, recipientType: params.recipientType, title: params.title, message: params.message, type: 'ORDER', metadataJson: { orderId: params.orderId } } });
  }

}
