import { Injectable } from '@nestjs/common';
import { OrderStatus, ProviderEarningsLedgerDirection, ProviderEarningsLedgerStatus, ProviderEarningsLedgerType, ProviderOrderStatus, Prisma, UserStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { DispatchNotificationInput, NotificationDispatchService } from '../notifications/notification-dispatch.service';

export const PROVIDER_ORDER_LIST_INCLUDE = Prisma.validator<Prisma.OrderInclude>()({
  items: { include: { gift: { select: { id: true, name: true, imageUrls: true } }, variant: { select: { id: true, name: true } } } },
  refundRequests: { orderBy: { requestedAt: 'desc' }, take: 1 },
});

type ProviderOrderTransaction = Prisma.TransactionClient;
type ProviderOrderUpdateData = Prisma.Args<ProviderOrderTransaction['order'], 'update'>['data'];
type NotificationCreateData = DispatchNotificationInput;

@Injectable()
export class ProviderOrdersRepository {
  constructor(private readonly prisma: PrismaService, private readonly notificationDispatch: NotificationDispatchService) {}

  findManyProviderOrders(params: { where: Prisma.OrderWhereInput; include: typeof PROVIDER_ORDER_LIST_INCLUDE; orderBy: Prisma.OrderOrderByWithRelationInput; skip: number; take: number }) {
    return this.prisma.order.findMany({ where: params.where, include: params.include, orderBy: params.orderBy, skip: params.skip, take: params.take });
  }

  countProviderOrders(where: Prisma.OrderWhereInput) {
    return this.prisma.order.count({ where });
  }

  findManyAndCountProviderOrders(params: { where: Prisma.OrderWhereInput; include: typeof PROVIDER_ORDER_LIST_INCLUDE; orderBy: Prisma.OrderOrderByWithRelationInput; skip: number; take: number }) {
    return this.prisma.$transaction([this.findManyProviderOrders(params), this.countProviderOrders(params.where)]);
  }

  findProviderOrderById(providerId: string, id: string, include: typeof PROVIDER_ORDER_LIST_INCLUDE = PROVIDER_ORDER_LIST_INCLUDE) {
    return this.prisma.order.findFirst({ where: { id, providerId }, include });
  }

  findCustomerAddressForProviderOrder(order: { deliveryAddressId: string; userId: string }) {
    return this.prisma.customerAddress.findFirst({ where: { id: order.deliveryAddressId, userId: order.userId } });
  }

  findProviderOrderSummary(params: { base: Prisma.OrderWhereInput; todayWhere: Prisma.OrderWhereInput }) {
    return this.prisma.$transaction([
      this.prisma.order.findMany({ where: params.todayWhere }),
      this.prisma.order.count({ where: { ...params.base, providerStatus: ProviderOrderStatus.PENDING } }),
      this.prisma.order.count({ where: { ...params.base, providerStatus: { in: [ProviderOrderStatus.ACCEPTED, ProviderOrderStatus.PROCESSING, ProviderOrderStatus.PACKED] } } }),
      this.prisma.order.count({ where: { ...params.base, providerStatus: ProviderOrderStatus.SHIPPED } }),
      this.prisma.order.count({ where: { ...params.base, providerStatus: { in: [ProviderOrderStatus.DELIVERED, ProviderOrderStatus.COMPLETED] } } }),
      this.prisma.order.count({ where: { ...params.base, providerStatus: { in: [ProviderOrderStatus.CANCELLED, ProviderOrderStatus.REJECTED, ProviderOrderStatus.REFUNDED] } } }),
    ]);
  }

  findRecentProviderOrders(providerId: string, limit: number) {
    return this.prisma.order.findMany({ where: { providerId }, include: PROVIDER_ORDER_LIST_INCLUDE, orderBy: { createdAt: 'desc' }, take: limit });
  }

  findPerformanceRows(params: { providerId: string; range: { from: Date; to: Date }; previous: { from: Date; to: Date } }) {
    return Promise.all([
      this.prisma.order.findMany({ where: { providerId: params.providerId, createdAt: { gte: params.range.from, lte: params.range.to } } }),
      this.prisma.order.findMany({ where: { providerId: params.providerId, createdAt: { gte: params.previous.from, lte: params.previous.to } } }),
    ]);
  }

  findRevenueAnalyticsRows(params: { providerId: string; range: { from: Date; to: Date }; previous: { from: Date; to: Date }; statuses: ProviderOrderStatus[] }) {
    return Promise.all([
      this.prisma.order.findMany({ where: { providerId: params.providerId, createdAt: { gte: params.range.from, lte: params.range.to }, providerStatus: { in: params.statuses } } }),
      this.prisma.order.findMany({ where: { providerId: params.providerId, createdAt: { gte: params.previous.from, lte: params.previous.to }, providerStatus: { in: params.statuses } } }),
    ]);
  }

  findRatingAnalyticsRows(providerId: string) {
    return this.prisma.review.findMany({ where: { providerId, deletedAt: null } });
  }

  findProviderOrdersForExport(params: { where: Prisma.OrderWhereInput; include: typeof PROVIDER_ORDER_LIST_INCLUDE }) {
    return this.prisma.order.findMany({ where: params.where, include: params.include, orderBy: { createdAt: 'desc' } });
  }

  runActionTransaction<T>(callback: (tx: ProviderOrderTransaction) => Promise<T>) {
    return this.prisma.$transaction(callback);
  }

  findProviderOrderForAction(providerId: string, id: string, include: typeof PROVIDER_ORDER_LIST_INCLUDE = PROVIDER_ORDER_LIST_INCLUDE) {
    return this.findProviderOrderById(providerId, id, include);
  }

  markProviderOrderAccepted(tx: ProviderOrderTransaction, id: string) {
    return tx.order.update({ where: { id }, data: { providerStatus: ProviderOrderStatus.ACCEPTED, acceptedAt: new Date(), status: OrderStatus.PROCESSING } });
  }

  markProviderOrderRejected(tx: ProviderOrderTransaction, params: { id: string; reason: Prisma.OrderUpdateInput['rejectionReason']; comment?: string }) {
    return tx.order.update({ where: { id: params.id }, data: { providerStatus: ProviderOrderStatus.REJECTED, rejectedAt: new Date(), rejectionReason: params.reason, rejectionComment: params.comment, status: OrderStatus.CANCELLED } });
  }

  updateProviderOrderStatus(tx: ProviderOrderTransaction, id: string, data: ProviderOrderUpdateData) {
    return tx.order.update({ where: { id }, data });
  }

  fulfillProviderOrder(tx: ProviderOrderTransaction, params: { id: string; dispatchAt: Date; estimatedDeliveryAt: Date | null; carrier: string; trackingNumber: string }) {
    return tx.order.update({ where: { id: params.id }, data: { providerStatus: ProviderOrderStatus.SHIPPED, status: OrderStatus.SHIPPED, dispatchAt: params.dispatchAt, fulfilledAt: new Date(), estimatedDeliveryAt: params.estimatedDeliveryAt, carrier: params.carrier, trackingNumber: params.trackingNumber } });
  }

  updateParentOrderStatus(tx: ProviderOrderTransaction, orderId: string, data: Prisma.OrderUpdateInput) {
    return tx.order.update({ where: { id: orderId }, data });
  }

  syncParentOrderStatus(tx: ProviderOrderTransaction, orderId: string, status: OrderStatus) {
    return this.updateParentOrderStatus(tx, orderId, { status });
  }

  createCustomerOrderNotification(tx: ProviderOrderTransaction, data: NotificationCreateData) {
    return this.notificationDispatch.createAndEmit(data);
  }

  findActiveSuperAdminIds(tx: ProviderOrderTransaction) {
    return tx.user.findMany({ where: { role: 'SUPER_ADMIN', status: UserStatus.APPROVED }, select: { id: true } });
  }

  upsertOrderEarningLedger(tx: ProviderOrderTransaction, params: { providerId: string; orderId: string; amount: Prisma.Decimal; currency: string; description: string }) {
    return tx.providerEarningsLedger.upsert({
      where: { orderId_type: { orderId: params.orderId, type: ProviderEarningsLedgerType.ORDER_EARNING } },
      update: {},
      create: { providerId: params.providerId, orderId: params.orderId, type: ProviderEarningsLedgerType.ORDER_EARNING, direction: ProviderEarningsLedgerDirection.CREDIT, amount: params.amount, currency: params.currency, status: ProviderEarningsLedgerStatus.AVAILABLE, description: params.description, metadataJson: { orderId: params.orderId } },
    });
  }
}
