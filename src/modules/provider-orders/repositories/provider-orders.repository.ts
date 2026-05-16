import { Injectable } from '@nestjs/common';
import { OrderStatus, ProviderEarningsLedgerDirection, ProviderEarningsLedgerStatus, ProviderEarningsLedgerType, ProviderOrderStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';

export const PROVIDER_ORDER_LIST_INCLUDE = Prisma.validator<Prisma.ProviderOrderInclude>()({
  order: true,
  items: true,
  refundRequests: { orderBy: { requestedAt: 'desc' }, take: 1 },
});

type ProviderOrderTransaction = Prisma.TransactionClient;
type ProviderOrderUpdateData = Prisma.Args<ProviderOrderTransaction['providerOrder'], 'update'>['data'];
type ProviderOrderTimelineCreateData = Prisma.Args<ProviderOrderTransaction['providerOrderTimeline'], 'create'>['data'];
type NotificationCreateData = Prisma.Args<ProviderOrderTransaction['notification'], 'create'>['data'];
type OrderMessageCreateData = Prisma.Args<ProviderOrderTransaction['orderMessage'], 'create'>['data'];
type ProviderOrderChecklistUpdateData = Prisma.Args<PrismaService['providerOrderChecklist'], 'update'>['data'];

@Injectable()
export class ProviderOrdersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findManyProviderOrders(params: { where: Prisma.ProviderOrderWhereInput; include: Prisma.ProviderOrderInclude; orderBy: Prisma.ProviderOrderOrderByWithRelationInput; skip: number; take: number }) {
    return this.prisma.providerOrder.findMany({ where: params.where, include: params.include, orderBy: params.orderBy, skip: params.skip, take: params.take });
  }

  countProviderOrders(where: Prisma.ProviderOrderWhereInput) {
    return this.prisma.providerOrder.count({ where });
  }

  findManyAndCountProviderOrders(params: { where: Prisma.ProviderOrderWhereInput; include: Prisma.ProviderOrderInclude; orderBy: Prisma.ProviderOrderOrderByWithRelationInput; skip: number; take: number }) {
    return this.prisma.$transaction([
      this.findManyProviderOrders(params),
      this.countProviderOrders(params.where),
    ]);
  }

  findProviderOrderById(providerId: string, id: string, include: Prisma.ProviderOrderInclude = PROVIDER_ORDER_LIST_INCLUDE) {
    return this.prisma.providerOrder.findFirst({ where: { id, providerId }, include });
  }

  findCustomerAddressForProviderOrder(order: { deliveryAddressId: string; userId: string }) {
    return this.prisma.customerAddress.findFirst({ where: { id: order.deliveryAddressId, userId: order.userId } });
  }

  findProviderOrderTimeline(providerOrderId: string) {
    return this.prisma.providerOrderTimeline.findMany({ where: { providerOrderId }, orderBy: { createdAt: 'asc' } });
  }

  findProviderOrderChecklist(providerOrderId: string) {
    return this.prisma.providerOrderChecklist.findUnique({ where: { providerOrderId } });
  }

  findProviderOrderSummary(params: { base: Prisma.ProviderOrderWhereInput; todayWhere: Prisma.ProviderOrderWhereInput }) {
    return this.prisma.$transaction([
      this.prisma.providerOrder.findMany({ where: params.todayWhere }),
      this.prisma.providerOrder.count({ where: { ...params.base, status: ProviderOrderStatus.PENDING } }),
      this.prisma.providerOrder.count({ where: { ...params.base, status: { in: [ProviderOrderStatus.ACCEPTED, ProviderOrderStatus.PROCESSING, ProviderOrderStatus.PACKED] } } }),
      this.prisma.providerOrder.count({ where: { ...params.base, status: ProviderOrderStatus.SHIPPED } }),
      this.prisma.providerOrder.count({ where: { ...params.base, status: { in: [ProviderOrderStatus.DELIVERED, ProviderOrderStatus.COMPLETED] } } }),
      this.prisma.providerOrder.count({ where: { ...params.base, status: { in: [ProviderOrderStatus.CANCELLED, ProviderOrderStatus.REJECTED, ProviderOrderStatus.REFUNDED] } } }),
    ]);
  }

  findRecentProviderOrders(providerId: string, limit: number) {
    return this.prisma.providerOrder.findMany({ where: { providerId }, orderBy: { createdAt: 'desc' }, take: limit });
  }

  findPerformanceRows(params: { providerId: string; range: { from: Date; to: Date }; previous: { from: Date; to: Date } }) {
    return Promise.all([
      this.prisma.providerOrder.findMany({ where: { providerId: params.providerId, createdAt: { gte: params.range.from, lte: params.range.to } } }),
      this.prisma.providerOrder.findMany({ where: { providerId: params.providerId, createdAt: { gte: params.previous.from, lte: params.previous.to } } }),
    ]);
  }

  findRevenueAnalyticsRows(params: { providerId: string; range: { from: Date; to: Date }; previous: { from: Date; to: Date }; statuses: ProviderOrderStatus[] }) {
    return Promise.all([
      this.prisma.providerOrder.findMany({ where: { providerId: params.providerId, createdAt: { gte: params.range.from, lte: params.range.to }, status: { in: params.statuses } } }),
      this.prisma.providerOrder.findMany({ where: { providerId: params.providerId, createdAt: { gte: params.previous.from, lte: params.previous.to }, status: { in: params.statuses } } }),
    ]);
  }

  findRatingAnalyticsRows(providerId: string) {
    return this.prisma.review.findMany({ where: { providerId, deletedAt: null } });
  }

  findProviderOrdersForExport(params: { where: Prisma.ProviderOrderWhereInput; include: Prisma.ProviderOrderInclude }) {
    return this.prisma.providerOrder.findMany({ where: params.where, include: params.include, orderBy: { createdAt: 'desc' } });
  }

  runActionTransaction<T>(callback: (tx: ProviderOrderTransaction) => Promise<T>) {
    return this.prisma.$transaction(callback);
  }

  findProviderOrderForAction(providerId: string, id: string, include: Prisma.ProviderOrderInclude = PROVIDER_ORDER_LIST_INCLUDE) {
    return this.findProviderOrderById(providerId, id, include);
  }

  countProviderOrdersForOrder(orderId: string) {
    return this.prisma.providerOrder.count({ where: { orderId } });
  }

  markProviderOrderAccepted(tx: ProviderOrderTransaction, id: string) {
    return tx.providerOrder.update({ where: { id }, data: { status: ProviderOrderStatus.ACCEPTED, acceptedAt: new Date() } });
  }

  markProviderOrderRejected(tx: ProviderOrderTransaction, params: { id: string; reason: Prisma.ProviderOrderUpdateInput['rejectionReason']; comment?: string }) {
    return tx.providerOrder.update({ where: { id: params.id }, data: { status: ProviderOrderStatus.REJECTED, rejectedAt: new Date(), rejectionReason: params.reason, rejectionComment: params.comment } });
  }

  updateProviderOrderStatus(tx: ProviderOrderTransaction, id: string, data: ProviderOrderUpdateData) {
    return tx.providerOrder.update({ where: { id }, data });
  }

  fulfillProviderOrder(tx: ProviderOrderTransaction, params: { id: string; dispatchAt: Date; estimatedDeliveryAt: Date | null; carrier: string; trackingNumber: string }) {
    return tx.providerOrder.update({ where: { id: params.id }, data: { status: ProviderOrderStatus.SHIPPED, dispatchAt: params.dispatchAt, fulfilledAt: new Date(), estimatedDeliveryAt: params.estimatedDeliveryAt, carrier: params.carrier, trackingNumber: params.trackingNumber } });
  }

  createProviderOrderTimelineEntry(tx: ProviderOrderTransaction, data: ProviderOrderTimelineCreateData) {
    return tx.providerOrderTimeline.create({ data });
  }

  updateParentOrderStatus(tx: ProviderOrderTransaction, orderId: string, data: Prisma.OrderUpdateInput) {
    return tx.order.update({ where: { id: orderId }, data });
  }

  findProviderOrdersForParentSync(tx: ProviderOrderTransaction, orderId: string) {
    return tx.providerOrder.findMany({ where: { orderId } });
  }

  syncParentOrderStatus(tx: ProviderOrderTransaction, orderId: string, status: OrderStatus) {
    return this.updateParentOrderStatus(tx, orderId, { status });
  }

  createCustomerOrderNotification(tx: ProviderOrderTransaction, data: NotificationCreateData) {
    return tx.notification.create({ data });
  }

  findActiveSuperAdminIds(tx: ProviderOrderTransaction) {
    return tx.user.findMany({ where: { role: 'SUPER_ADMIN', isActive: true, deletedAt: null }, select: { id: true } });
  }

  async getOrCreateChecklistForRead(providerOrderId: string) {
    return (await this.findProviderOrderChecklist(providerOrderId)) ?? this.prisma.providerOrderChecklist.create({ data: { providerOrderId } });
  }

  getOrCreateChecklist(providerOrderId: string) {
    return this.prisma.providerOrderChecklist.upsert({ where: { providerOrderId }, update: {}, create: { providerOrderId } });
  }

  updateProviderOrderChecklist(providerOrderId: string, data: ProviderOrderChecklistUpdateData) {
    return this.prisma.providerOrderChecklist.update({ where: { providerOrderId }, data });
  }

  createOrderBuyerMessage(tx: ProviderOrderTransaction, data: OrderMessageCreateData) {
    return tx.orderMessage.create({ data });
  }

  upsertOrderEarningLedger(tx: ProviderOrderTransaction, params: { providerId: string; providerOrderId: string; amount: Prisma.Decimal; currency: string; description: string; orderId: string }) {
    return tx.providerEarningsLedger.upsert({
      where: { providerOrderId_type: { providerOrderId: params.providerOrderId, type: ProviderEarningsLedgerType.ORDER_EARNING } },
      update: {},
      create: {
        providerId: params.providerId,
        providerOrderId: params.providerOrderId,
        type: ProviderEarningsLedgerType.ORDER_EARNING,
        direction: ProviderEarningsLedgerDirection.CREDIT,
        amount: params.amount,
        currency: params.currency,
        status: ProviderEarningsLedgerStatus.AVAILABLE,
        description: params.description,
        metadataJson: { orderId: params.orderId },
      },
    });
  }
}
