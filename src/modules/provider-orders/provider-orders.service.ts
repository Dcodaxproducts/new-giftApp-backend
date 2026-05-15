import { BadRequestException, Injectable, NotFoundException, StreamableFile } from '@nestjs/common';
import { NotificationRecipientType, OrderStatus, PaymentMethod, PaymentStatus, Prisma, ProviderEarningsLedgerDirection, ProviderEarningsLedgerStatus, ProviderEarningsLedgerType, ProviderOrderRejectReason, ProviderOrderStatus, RefundRejectReason, RefundRequestStatus, UserRole } from '@prisma/client';
import { AuthUserContext } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../database/prisma.service';
import { AcceptProviderOrderDto, FulfillProviderOrderDto, ListProviderOrdersDto, MessageBuyerDto, ProviderOrderHistoryDto, ProviderOrderHistoryStatus, ProviderOrderSortBy, ProviderOrderSortOrder, ProviderOrderStatusFilter, ProviderOrdersExportDto, ProviderOrdersSummaryDto, ProviderPerformanceDto, ProviderPerformanceRange, ProviderRecentOrdersDto, ProviderRevenueAnalyticsDto, ProviderRevenueRange, RejectProviderOrderDto, UpdateProviderOrderChecklistDto, UpdateProviderOrderStatusDto } from './dto/provider-orders.dto';
import { PROVIDER_ORDER_LIST_INCLUDE, ProviderOrdersRepository } from './provider-orders.repository';

type ProviderOrderView = Prisma.ProviderOrderGetPayload<{ include: { order: true; items: true; refundRequests: true } }>;
type ProviderOrderDetail = ProviderOrderView;

@Injectable()
export class ProviderOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly providerOrdersRepository: ProviderOrdersRepository,
  ) {}

  async list(user: AuthUserContext, query: ListProviderOrdersDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const where = this.where(user.uid, query);
    const orderBy = this.orderBy(query.sortBy, query.sortOrder);
    const [items, total] = await this.providerOrdersRepository.findManyAndCountProviderOrders({ where, include: this.listInclude(), orderBy, skip: (page - 1) * limit, take: limit });
    return { data: items.map((item) => this.toListItem(item)), meta: { page, limit, total, totalPages: Math.ceil(total / limit) }, message: 'Provider orders fetched successfully.' };
  }


  async history(user: AuthUserContext, query: ProviderOrderHistoryDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const where = this.historyWhere(user.uid, query);
    const [items, total] = await this.providerOrdersRepository.findManyAndCountProviderOrders({ where, include: this.listInclude(), orderBy: this.orderBy(query.sortBy, query.sortOrder), skip: (page - 1) * limit, take: limit });
    return { data: items.map((item) => this.toHistoryItem(item)), meta: { page, limit, total, totalPages: Math.ceil(total / limit) }, message: 'Provider order history fetched successfully.' };
  }

  async recent(user: AuthUserContext, query: ProviderRecentOrdersDto) {
    const limit = Math.min(query.limit ?? 5, 50);
    const items = await this.providerOrdersRepository.findRecentProviderOrders(user.uid, limit);
    return { data: items.map((item) => ({ id: item.id, orderNumber: item.orderNumber ?? item.id, status: item.status, amount: Number(item.totalPayout ?? item.total), currency: item.currency, createdAt: item.createdAt })), message: 'Recent provider orders fetched successfully.' };
  }

  async performance(user: AuthUserContext, query: ProviderPerformanceDto) {
    const range = this.performanceRange(query);
    const previous = this.previousRange(range.from, range.to);
    const [orders, previousOrders] = await this.providerOrdersRepository.findPerformanceRows({ providerId: user.uid, range, previous });
    const completedOrders = orders.filter((item) => (new Set<ProviderOrderStatus>([ProviderOrderStatus.DELIVERED, ProviderOrderStatus.COMPLETED])).has(item.status)).length;
    const nonCancelled = orders.filter((item) => !(new Set<ProviderOrderStatus>([ProviderOrderStatus.CANCELLED, ProviderOrderStatus.REJECTED, ProviderOrderStatus.REFUNDED])).has(item.status)).length;
    const previousCompleted = previousOrders.filter((item) => (new Set<ProviderOrderStatus>([ProviderOrderStatus.DELIVERED, ProviderOrderStatus.COMPLETED])).has(item.status)).length;
    const previousNonCancelled = previousOrders.filter((item) => !(new Set<ProviderOrderStatus>([ProviderOrderStatus.CANCELLED, ProviderOrderStatus.REJECTED, ProviderOrderStatus.REFUNDED])).has(item.status)).length;
    const completionRate = nonCancelled === 0 ? 0 : this.money((completedOrders / nonCancelled) * 100);
    const previousCompletionRate = previousNonCancelled === 0 ? 0 : this.money((previousCompleted / previousNonCancelled) * 100);
    const weeklyRevenue = this.money(orders.reduce((sum, item) => sum + this.revenueValue(item), 0));
    const previousRevenue = this.money(previousOrders.reduce((sum, item) => sum + this.revenueValue(item), 0));
    return { data: { completionRate, completionRateTarget: 95, completionDelta: this.money(completionRate - previousCompletionRate), weeklyRevenue, weeklyRevenueDelta: this.deltaPercent(weeklyRevenue, previousRevenue), totalOrders: orders.length, completedOrders, pendingOrders: orders.filter((item) => item.status === ProviderOrderStatus.PENDING).length, cancelledOrders: orders.filter((item) => (new Set<ProviderOrderStatus>([ProviderOrderStatus.CANCELLED, ProviderOrderStatus.REJECTED])).has(item.status)).length, currency: orders[0]?.currency ?? 'PKR' }, message: 'Provider order performance fetched successfully.' };
  }

  async revenueAnalytics(user: AuthUserContext, query: ProviderRevenueAnalyticsDto) {
    const range = this.revenueRange(query);
    const previous = this.previousRange(range.from, range.to);
    const [orders, previousOrders] = await this.providerOrdersRepository.findRevenueAnalyticsRows({ providerId: user.uid, range, previous, statuses: [ProviderOrderStatus.ACCEPTED, ProviderOrderStatus.PROCESSING, ProviderOrderStatus.PACKED, ProviderOrderStatus.READY_FOR_PICKUP, ProviderOrderStatus.SHIPPED, ProviderOrderStatus.OUT_FOR_DELIVERY, ProviderOrderStatus.DELIVERED, ProviderOrderStatus.COMPLETED] });
    const totalRevenue = this.money(orders.reduce((sum, item) => sum + this.revenueValue(item), 0));
    const previousRevenue = this.money(previousOrders.reduce((sum, item) => sum + this.revenueValue(item), 0));
    return { data: { totalRevenue, currency: orders[0]?.currency ?? 'PKR', deltaPercent: this.deltaPercent(totalRevenue, previousRevenue), points: this.revenuePoints(orders, query.range ?? ProviderRevenueRange.DAILY, range.from) }, message: 'Provider revenue analytics fetched successfully.' };
  }

  ratingsAnalytics() { return { data: { averageRating: 0, reviewCount: 0, distribution: { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 } }, message: 'Provider ratings analytics fetched successfully.' }; }

  async export(user: AuthUserContext, query: ProviderOrdersExportDto): Promise<StreamableFile> {
    const where = this.exportWhere(user.uid, query);
    const items = await this.providerOrdersRepository.findProviderOrdersForExport({ where, include: this.listInclude() });
    const rows = [['Order Number', 'Customer', 'Status', 'Amount', 'Currency', 'Created At'], ...items.map((item) => [item.orderNumber ?? item.order.orderNumber, item.order.recipientName, item.status, String(Number(item.totalPayout ?? item.total)), item.currency, item.createdAt.toISOString()])];
    return new StreamableFile(Buffer.from(rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n')), { type: 'text/csv', disposition: 'attachment; filename="provider-orders.csv"' });
  }

  async summary(user: AuthUserContext, query: ProviderOrdersSummaryDto) {
    const now = new Date();
    const start = query.fromDate ? new Date(query.fromDate) : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const end = query.toDate ? new Date(query.toDate) : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
    const base: Prisma.ProviderOrderWhereInput = { providerId: user.uid };
    const todayWhere: Prisma.ProviderOrderWhereInput = { ...base, createdAt: { gte: start, lte: end } };
    const [today, pendingCount, processingCount, shippedCount, completedCount, cancelledCount] = await this.providerOrdersRepository.findProviderOrderSummary({ base, todayWhere });
    const todayRevenue = this.money(today.reduce((sum, item) => sum + Number(item.totalPayout ?? item.total), 0));
    return { data: { todayOrderCount: today.length, todayRevenue, pendingCount, processingCount, shippedCount, completedCount, cancelledCount, currency: today[0]?.currency ?? 'PKR' }, message: 'Provider order summary fetched successfully.' };
  }

  async details(user: AuthUserContext, id: string) {
    const order = await this.getOwnedProviderOrderForRead(user.uid, id);
    const address = await this.providerOrdersRepository.findCustomerAddressForProviderOrder({ deliveryAddressId: order.order.deliveryAddressId, userId: order.order.userId });
    return { data: this.toDetails(order, address), message: 'Provider order fetched successfully.' };
  }

  async accept(user: AuthUserContext, id: string, dto: AcceptProviderOrderDto) {
    const order = await this.getOwnedProviderOrder(user.uid, id);
    if (order.status !== ProviderOrderStatus.PENDING) throw new BadRequestException('Only pending provider orders can be accepted');
    const updated = await this.prisma.$transaction(async (tx) => {
      const item = await tx.providerOrder.update({ where: { id: order.id }, data: { status: ProviderOrderStatus.ACCEPTED, acceptedAt: new Date() } });
      await tx.providerOrderTimeline.create({ data: { providerOrderId: order.id, createdById: user.uid, status: ProviderOrderStatus.ACCEPTED, title: 'Accepted', description: dto.note?.trim() ?? 'Provider accepted the order.' } });
      await tx.order.update({ where: { id: order.orderId }, data: { status: OrderStatus.PROCESSING } });
      await tx.notification.create({ data: { recipientId: order.order.userId, recipientType: NotificationRecipientType.REGISTERED_USER, title: 'Order accepted', message: 'Your gift order was accepted by the provider.', type: 'CUSTOMER_ORDER_ACCEPTED', metadataJson: { orderId: order.orderId, providerOrderId: order.id } } });
      return item;
    });
    return { data: { id: updated.id, orderNumber: updated.orderNumber ?? order.order.orderNumber, status: updated.status }, message: 'Order accepted successfully.' };
  }

  async reject(user: AuthUserContext, id: string, dto: RejectProviderOrderDto) {
    const order = await this.getOwnedProviderOrder(user.uid, id);
    if (order.status !== ProviderOrderStatus.PENDING) throw new BadRequestException('Only pending provider orders can be rejected');
    const providerCount = await this.prisma.providerOrder.count({ where: { orderId: order.orderId } });
    const updated = await this.prisma.$transaction(async (tx) => {
      const item = await tx.providerOrder.update({ where: { id: order.id }, data: { status: ProviderOrderStatus.REJECTED, rejectedAt: new Date(), rejectionReason: dto.reason, rejectionComment: dto.comment?.trim() } });
      await tx.providerOrderTimeline.create({ data: { providerOrderId: order.id, createdById: user.uid, status: ProviderOrderStatus.REJECTED, title: 'Rejected', description: dto.comment?.trim() ?? dto.reason, metadataJson: { reason: dto.reason } } });
      if (providerCount === 1) await tx.order.update({ where: { id: order.orderId }, data: { status: OrderStatus.CANCELLED, paymentStatus: order.order.paymentStatus === PaymentStatus.SUCCEEDED ? PaymentStatus.REFUNDED : order.order.paymentStatus } });
      await tx.notification.create({ data: { recipientId: order.order.userId, recipientType: NotificationRecipientType.REGISTERED_USER, title: 'Order rejected', message: 'A provider rejected your gift order. Our team will review it.', type: 'CUSTOMER_ORDER_REJECTED', metadataJson: { orderId: order.orderId, providerOrderId: order.id, reason: dto.reason } } });
      const admins = await tx.user.findMany({ where: { role: UserRole.SUPER_ADMIN, isActive: true, deletedAt: null }, select: { id: true } });
      for (const admin of admins) await tx.notification.create({ data: { recipientId: admin.id, recipientType: NotificationRecipientType.ADMIN, title: 'Order requires review', message: 'A provider rejected an assigned order.', type: 'ADMIN_ORDER_REQUIRES_REVIEW', metadataJson: { orderId: order.orderId, providerOrderId: order.id, reason: dto.reason } } });
      return item;
    });
    return { data: { id: updated.id, orderNumber: updated.orderNumber ?? order.order.orderNumber, status: updated.status, rejectionReason: updated.rejectionReason }, message: 'Order rejected successfully.' };
  }


  async updateStatus(user: AuthUserContext, id: string, dto: UpdateProviderOrderStatusDto) {
    const order = await this.getOwnedProviderOrder(user.uid, id);
    if ((new Set<ProviderOrderStatus>([ProviderOrderStatus.REJECTED, ProviderOrderStatus.CANCELLED, ProviderOrderStatus.REFUNDED])).has(order.status)) throw new BadRequestException('Cannot update a closed provider order');
    if (!(new Set<ProviderOrderStatus>([ProviderOrderStatus.ACCEPTED, ProviderOrderStatus.PROCESSING, ProviderOrderStatus.PACKED, ProviderOrderStatus.READY_FOR_PICKUP, ProviderOrderStatus.SHIPPED, ProviderOrderStatus.OUT_FOR_DELIVERY, ProviderOrderStatus.DELIVERED, ProviderOrderStatus.COMPLETED, ProviderOrderStatus.CANCELLED])).has(dto.status)) throw new BadRequestException('Unsupported provider order status');
    this.assertTransition(order.status, dto.status);
    if ((new Set<ProviderOrderStatus>([ProviderOrderStatus.DELIVERED, ProviderOrderStatus.COMPLETED])).has(dto.status) && order.order.paymentStatus !== PaymentStatus.SUCCEEDED) throw new BadRequestException('Cannot mark unpaid order as fulfilled');
    const updated = await this.prisma.$transaction(async (tx) => {
      const item = await tx.providerOrder.update({ where: { id: order.id }, data: { status: dto.status, trackingNumber: dto.trackingNumber?.trim(), carrier: dto.carrier?.trim(), estimatedDeliveryAt: dto.estimatedDeliveryAt ? new Date(dto.estimatedDeliveryAt) : undefined } });
      await tx.providerOrderTimeline.create({ data: { providerOrderId: order.id, createdById: user.uid, status: dto.status, title: this.statusTitle(dto.status), description: dto.note?.trim() ?? this.statusDescription(dto.status, dto.carrier), metadataJson: { trackingNumber: dto.trackingNumber, carrier: dto.carrier, estimatedDeliveryAt: dto.estimatedDeliveryAt } } });
      await this.syncParentOrder(tx, order.orderId);
      if ((new Set<ProviderOrderStatus>([ProviderOrderStatus.PROCESSING, ProviderOrderStatus.PACKED, ProviderOrderStatus.SHIPPED, ProviderOrderStatus.OUT_FOR_DELIVERY, ProviderOrderStatus.DELIVERED, ProviderOrderStatus.COMPLETED])).has(dto.status)) await tx.notification.create({ data: { recipientId: order.order.userId, recipientType: NotificationRecipientType.REGISTERED_USER, title: this.statusTitle(dto.status), message: this.customerStatusMessage(dto.status), type: `ORDER_${dto.status}`, metadataJson: { orderId: order.orderId, providerOrderId: order.id, trackingNumber: dto.trackingNumber, carrier: dto.carrier } } });
      if (([ProviderOrderStatus.DELIVERED, ProviderOrderStatus.COMPLETED] as ProviderOrderStatus[]).includes(dto.status)) await this.createOrderEarningLedger(tx, order);
      await tx.notification.create({ data: { recipientId: user.uid, recipientType: NotificationRecipientType.PROVIDER, title: 'Order status updated', message: `Order status updated to ${dto.status}.`, type: 'PROVIDER_ORDER_STATUS_UPDATED', metadataJson: { orderId: order.orderId, providerOrderId: order.id, status: dto.status } } });
      return item;
    });
    return { data: { id: updated.id, orderNumber: updated.orderNumber ?? order.order.orderNumber, status: updated.status, trackingNumber: updated.trackingNumber, carrier: updated.carrier }, message: 'Order status updated successfully.' };
  }

  async fulfill(user: AuthUserContext, id: string, dto: FulfillProviderOrderDto) {
    const order = await this.getOwnedProviderOrder(user.uid, id);
    this.assertCanFulfill(order);
    const carrier = dto.carrier.trim();
    const trackingNumber = dto.trackingNumber.trim();
    if (!carrier) throw new BadRequestException('Carrier is required');
    if (!trackingNumber) throw new BadRequestException('Tracking number is required');
    const dispatchAt = new Date(dto.dispatchAt);
    const estimatedDeliveryAt = dto.estimatedDeliveryAt ? new Date(dto.estimatedDeliveryAt) : null;
    const updated = await this.prisma.$transaction(async (tx) => {
      const item = await tx.providerOrder.update({ where: { id: order.id }, data: { status: ProviderOrderStatus.SHIPPED, dispatchAt, fulfilledAt: new Date(), estimatedDeliveryAt, carrier, trackingNumber } });
      await tx.providerOrderTimeline.create({ data: { providerOrderId: order.id, createdById: user.uid, status: ProviderOrderStatus.SHIPPED, title: 'Order fulfilled', description: dto.note?.trim() ?? `Order dispatched via ${carrier}.`, metadataJson: { carrier, trackingNumber, estimatedDeliveryAt: estimatedDeliveryAt?.toISOString() } } });
      await this.syncParentOrder(tx, order.orderId);
      if (dto.notifyCustomer ?? true) await tx.notification.create({ data: { recipientId: order.order.userId, recipientType: NotificationRecipientType.REGISTERED_USER, title: 'Your order is on the way', message: `Order #${order.orderNumber ?? order.order.orderNumber} has been dispatched. Tracking number: ${trackingNumber}.`, type: 'ORDER_SHIPPED', metadataJson: { orderId: order.orderId, providerOrderId: order.id, trackingNumber } } });
      return item;
    });
    return { data: { id: updated.id, orderNumber: updated.orderNumber ?? order.order.orderNumber, status: updated.status, dispatchAt: updated.dispatchAt, estimatedDeliveryAt: updated.estimatedDeliveryAt, carrier: updated.carrier, trackingNumber: updated.trackingNumber }, message: 'Order fulfilled successfully.' };
  }

  async timeline(user: AuthUserContext, id: string) {
    const order = await this.getOwnedProviderOrderForRead(user.uid, id);
    const timeline = await this.providerOrdersRepository.findProviderOrderTimeline(order.id);
    const data = [{ status: 'ORDERED', title: 'Ordered', description: 'System confirmed the order.', createdAt: order.createdAt }, ...timeline.map((item) => ({ status: item.status, title: item.title, description: item.description, createdAt: item.createdAt }))];
    return { data, message: 'Order timeline fetched successfully.' };
  }

  async checklist(user: AuthUserContext, id: string) {
    const order = await this.getOwnedProviderOrderForRead(user.uid, id);
    const checklist = await this.getOrCreateChecklistForRead(order.id);
    return { data: this.toChecklist(checklist), message: 'Order checklist fetched successfully.' };
  }

  async updateChecklist(user: AuthUserContext, id: string, dto: UpdateProviderOrderChecklistDto) {
    const order = await this.getOwnedProviderOrder(user.uid, id);
    await this.getOrCreateChecklist(order.id);
    const updated = await this.prisma.providerOrderChecklist.update({ where: { providerOrderId: order.id }, data: { itemsPacked: dto.itemsPacked, giftMessageAttached: dto.giftMessageAttached, addressVerified: dto.addressVerified, customerContactChecked: dto.customerContactChecked, readyForCourier: dto.readyForCourier, customItemsJson: dto.customItems === undefined ? undefined : dto.customItems as Prisma.InputJsonValue } });
    return { data: this.toChecklist(updated), message: 'Order checklist updated successfully.' };
  }

  async messageBuyer(user: AuthUserContext, id: string, dto: MessageBuyerDto) {
    const order = await this.getOwnedProviderOrder(user.uid, id);
    const message = dto.message.trim();
    if (!message) throw new BadRequestException('Message is required');
    await this.prisma.$transaction([
      this.prisma.orderMessage.create({ data: { orderId: order.orderId, providerOrderId: order.id, senderId: user.uid, senderRole: UserRole.PROVIDER, recipientId: order.order.userId, message, channel: dto.channel } }),
      this.prisma.notification.create({ data: { recipientId: order.order.userId, recipientType: NotificationRecipientType.REGISTERED_USER, title: 'Message from provider', message, type: 'PROVIDER_MESSAGE_RECEIVED', metadataJson: { orderId: order.orderId, providerOrderId: order.id, channel: dto.channel } } }),
    ]);
    return { success: true, message: 'Message sent to buyer successfully.' };
  }

  rejectReasons() {
    return { data: [{ key: ProviderOrderRejectReason.OUT_OF_STOCK, label: 'Out of Stock' }, { key: ProviderOrderRejectReason.BUSINESS_CLOSED, label: 'Business Closed' }, { key: ProviderOrderRejectReason.CANNOT_DELIVER_TO_AREA, label: 'Cannot deliver to area' }, { key: ProviderOrderRejectReason.PRICING_ERROR, label: 'Pricing Error' }, { key: ProviderOrderRejectReason.OTHER, label: 'Other' }], message: 'Reject reasons fetched successfully.' };
  }


  private historyWhere(providerId: string, query: ProviderOrderHistoryDto): Prisma.ProviderOrderWhereInput { const where = this.where(providerId, { ...query, status: ProviderOrderStatusFilter.ALL }); this.applyStatusFilter(where, query.status as unknown as ProviderOrderStatusFilter | undefined); return where; }
  private exportWhere(providerId: string, query: ProviderOrdersExportDto): Prisma.ProviderOrderWhereInput { const where: Prisma.ProviderOrderWhereInput = { providerId, createdAt: query.fromDate || query.toDate ? { gte: query.fromDate ? new Date(query.fromDate) : undefined, lte: query.toDate ? new Date(query.toDate) : undefined } : undefined }; this.applyStatusFilter(where, query.status as ProviderOrderStatusFilter | undefined); return where; }
  private toHistoryItem(item: ProviderOrderView) { return this.toListItem(item); }
  private revenueValue(item: { totalPayout: Prisma.Decimal | null; total: Prisma.Decimal }): number { return Number(item.totalPayout ?? item.total); }
  private deltaPercent(current: number, previous: number): number { if (previous === 0) return current === 0 ? 0 : 100; return this.money(((current - previous) / previous) * 100); }
  private performanceRange(query: ProviderPerformanceDto): { from: Date; to: Date } { const now = new Date(); if (query.range === ProviderPerformanceRange.CUSTOM && query.fromDate && query.toDate) return { from: new Date(query.fromDate), to: new Date(query.toDate) }; if (query.range === ProviderPerformanceRange.TODAY) return { from: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())), to: now }; if (query.range === ProviderPerformanceRange.THIS_MONTH) return { from: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)), to: now }; const day = now.getUTCDay(); const diff = (day + 6) % 7; return { from: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - diff)), to: now }; }
  private revenueRange(query: ProviderRevenueAnalyticsDto): { from: Date; to: Date } { const now = new Date(); if (query.fromDate && query.toDate) return { from: new Date(query.fromDate), to: new Date(query.toDate) }; if (query.range === ProviderRevenueRange.MONTHLY) return { from: new Date(Date.UTC(now.getUTCFullYear(), 0, 1)), to: now }; if (query.range === ProviderRevenueRange.WEEKLY) return { from: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 28)), to: now }; return { from: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 6)), to: now }; }
  private previousRange(from: Date, to: Date): { from: Date; to: Date } { const span = to.getTime() - from.getTime(); return { from: new Date(from.getTime() - span), to: new Date(from.getTime() - 1) }; }
  private revenuePoints(items: { createdAt: Date; totalPayout: Prisma.Decimal | null; total: Prisma.Decimal }[], range: ProviderRevenueRange, from: Date) { const buckets = new Map<string, number>(); for (const item of items) { const label = this.pointLabel(item.createdAt, range); buckets.set(label, (buckets.get(label) ?? 0) + this.revenueValue(item)); } if (buckets.size === 0) buckets.set(this.pointLabel(from, range), 0); return [...buckets.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([label, value]) => ({ label, value: this.money(value) })); }
  private pointLabel(date: Date, range: ProviderRevenueRange): string { if (range === ProviderRevenueRange.MONTHLY) return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`; if (range === ProviderRevenueRange.WEEKLY) return `W${Math.ceil(date.getUTCDate() / 7)}`; return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getUTCDay()]; }

  private where(providerId: string, query: ListProviderOrdersDto): Prisma.ProviderOrderWhereInput {
    const where: Prisma.ProviderOrderWhereInput = { providerId };
    if (query.status) this.applyStatusFilter(where, query.status);
    else where.status = ProviderOrderStatus.PENDING;
    if (query.fromDate || query.toDate) where.createdAt = { gte: query.fromDate ? new Date(query.fromDate) : undefined, lte: query.toDate ? new Date(query.toDate) : undefined };
    if (query.search) where.OR = [{ orderNumber: { contains: query.search, mode: 'insensitive' } }, { order: { orderNumber: { contains: query.search, mode: 'insensitive' } } }, { order: { recipientName: { contains: query.search, mode: 'insensitive' } } }, { items: { some: { nameSnapshot: { contains: query.search, mode: 'insensitive' } } } }];
    return where;
  }

  private applyStatusFilter(where: Prisma.ProviderOrderWhereInput, status?: ProviderOrderStatusFilter): void {
    if (!status || status === ProviderOrderStatusFilter.ALL) return;
    const refundStatus = this.refundStatus(status);
    if (refundStatus) { where.refundRequests = { some: { status: refundStatus } }; return; }
    if (status === ProviderOrderStatusFilter.CANCELLED) { where.status = { in: [ProviderOrderStatus.CANCELLED, ProviderOrderStatus.REJECTED] }; return; }
    if (status === ProviderOrderStatusFilter.READY_TO_FULFILL) { where.status = ProviderOrderStatus.READY_FOR_PICKUP; return; }
    where.status = status as unknown as ProviderOrderStatus;
  }

  private refundStatus(status: ProviderOrderStatusFilter | ProviderOrderHistoryStatus): RefundRequestStatus | null {
    if (status === ProviderOrderStatusFilter.REFUND_REQUESTED || status === ProviderOrderHistoryStatus.REFUND_REQUESTED) return RefundRequestStatus.REQUESTED;
    if (status === ProviderOrderStatusFilter.REFUND_PROCESSING || status === ProviderOrderHistoryStatus.REFUND_PROCESSING) return RefundRequestStatus.REFUND_PROCESSING;
    if (status === ProviderOrderStatusFilter.REFUNDED || status === ProviderOrderHistoryStatus.REFUNDED) return RefundRequestStatus.REFUNDED;
    if (status === ProviderOrderStatusFilter.REFUND_REJECTED || status === ProviderOrderHistoryStatus.REFUND_REJECTED) return RefundRequestStatus.REJECTED;
    return null;
  }

  private orderBy(sortBy?: ProviderOrderSortBy, sortOrder?: ProviderOrderSortOrder): Prisma.ProviderOrderOrderByWithRelationInput { const direction = sortOrder === ProviderOrderSortOrder.ASC ? 'asc' : 'desc'; if (sortBy === ProviderOrderSortBy.AMOUNT) return { total: direction }; if (sortBy === ProviderOrderSortBy.STATUS) return { status: direction }; return { createdAt: direction }; }
  private listInclude() { return PROVIDER_ORDER_LIST_INCLUDE; }
  private async getOwnedProviderOrderForRead(providerId: string, id: string): Promise<ProviderOrderDetail> { const order = await this.providerOrdersRepository.findProviderOrderById(providerId, id, this.listInclude()); if (!order) throw new NotFoundException('Provider order not found'); return order; }
  private async getOwnedProviderOrder(providerId: string, id: string): Promise<ProviderOrderDetail> { const order = await this.prisma.providerOrder.findFirst({ where: { id, providerId }, include: this.listInclude() }); if (!order) throw new NotFoundException('Provider order not found'); return order; }
  private latestRefund(item: ProviderOrderView) { return item.refundRequests[0] ?? null; }
  private refundSummary(item: ProviderOrderView) { const refund = this.latestRefund(item); return refund ? { id: refund.id, status: refund.status, requestedAmount: Number(refund.requestedAmount), requestedAt: refund.requestedAt } : null; }
  private displayStatus(item: ProviderOrderView): string { const refund = this.latestRefund(item); if (refund?.status === RefundRequestStatus.REQUESTED) return 'REFUND_REQUESTED'; if (refund?.status === RefundRequestStatus.REFUND_PROCESSING) return 'REFUND_PROCESSING'; if (refund?.status === RefundRequestStatus.REFUNDED) return 'REFUNDED'; if (refund?.status === RefundRequestStatus.REJECTED) return 'REFUND_REJECTED'; if (item.status === ProviderOrderStatus.READY_FOR_PICKUP) return 'READY_TO_FULFILL'; return item.status; }
  private statusLabel(status: string): string { return status.split('_').map((part) => part.charAt(0) + part.slice(1).toLowerCase()).join(' '); }
  private cancellation(item: ProviderOrderDetail) { if (!([ProviderOrderStatus.CANCELLED, ProviderOrderStatus.REJECTED] as ProviderOrderStatus[]).includes(item.status)) return null; return { reason: item.rejectionReason ? this.rejectReasonLabel(item.rejectionReason) : 'Order cancelled', cancelledBy: item.status === ProviderOrderStatus.REJECTED ? 'Provider' : 'System', cancelledAt: item.rejectedAt ?? item.updatedAt }; }
  private refundDetails(item: ProviderOrderDetail) { const refund = this.latestRefund(item); return refund ? { id: refund.id, status: refund.status, requestedAmount: Number(refund.requestedAmount), approvedAmount: refund.approvedAmount === null ? null : Number(refund.approvedAmount), transactionId: refund.transactionId, customerReason: refund.customerReason, providerDecisionReason: refund.rejectionReason, providerComment: refund.providerComment, refundedAt: refund.refundedAt } : null; }
  private toListItem(item: ProviderOrderView) { const status = this.displayStatus(item); return { id: item.id, orderId: item.orderId, providerOrderId: item.id, orderNumber: item.orderNumber ?? item.order.orderNumber, customerName: item.order.recipientName, amount: Number(item.totalPayout ?? item.total), status, statusLabel: this.statusLabel(status), refund: this.refundSummary(item), paymentStatus: item.order.paymentStatus, customer: { name: item.order.recipientName, phone: item.order.recipientPhone }, itemPreview: item.items.slice(0, 2).map((orderItem) => ({ name: orderItem.nameSnapshot, imageUrl: orderItem.imageUrl })), itemCount: item.items.reduce((sum, orderItem) => sum + orderItem.quantity, 0), totalPayout: Number(item.totalPayout ?? item.total), currency: item.currency, createdAt: item.createdAt, receivedAgoText: this.timeAgo(item.createdAt) }; }
  private toDetails(item: ProviderOrderDetail, address: { line1: string; city: string; state: string | null; postalCode: string | null; deliveryInstructions: string | null } | null) { const status = this.displayStatus(item); return { id: item.id, orderNumber: item.orderNumber ?? item.order.orderNumber, status, statusLabel: this.statusLabel(status), paymentStatus: item.order.paymentStatus, receivedAt: item.createdAt, receivedAgoText: this.timeAgo(item.createdAt), customer: { name: item.order.recipientName, phone: item.order.recipientPhone }, deliveryAddress: address ? { line1: address.line1, city: address.city, state: address.state, postalCode: address.postalCode, gateCode: address.deliveryInstructions } : null, items: item.items.map((orderItem) => ({ id: orderItem.orderItemId, giftId: orderItem.giftId, variantId: orderItem.variantId, name: orderItem.nameSnapshot, variantName: orderItem.variantNameSnapshot, quantity: orderItem.quantity, unitPrice: Number(orderItem.unitPrice), total: Number(orderItem.total), imageUrl: orderItem.imageUrl })), summary: { subtotal: Number(item.subtotal), tax: Number(item.tax), deliveryFee: Number(item.deliveryFee), platformFee: Number(item.platformFee), totalPayout: Number(item.totalPayout ?? item.total), currency: item.currency }, fulfillment: { dispatchAt: item.dispatchAt, estimatedDeliveryAt: item.estimatedDeliveryAt, carrier: item.carrier, trackingNumber: item.trackingNumber }, cancellation: this.cancellation(item), refund: this.refundDetails(item), giftMessage: item.order.giftMessage, scheduledDeliveryAt: item.order.scheduledDeliveryAt }; }

  private assertCanFulfill(order: ProviderOrderDetail): void {
    const eligible = new Set<ProviderOrderStatus>([ProviderOrderStatus.ACCEPTED, ProviderOrderStatus.PROCESSING, ProviderOrderStatus.PACKED, ProviderOrderStatus.READY_FOR_PICKUP]);
    if (!eligible.has(order.status)) throw new BadRequestException('Only accepted or prepared provider orders can be fulfilled');
    if ((new Set<ProviderOrderStatus>([ProviderOrderStatus.REJECTED, ProviderOrderStatus.CANCELLED, ProviderOrderStatus.REFUNDED])).has(order.status)) throw new BadRequestException('Cannot fulfill a closed provider order');
    const isPaid = order.order.paymentStatus === PaymentStatus.SUCCEEDED;
    const isCodPending = order.order.paymentMethod === PaymentMethod.COD && order.order.paymentStatus === PaymentStatus.PENDING;
    if (!isPaid && !isCodPending) throw new BadRequestException('Cannot fulfill unpaid order');
  }

  private assertTransition(current: ProviderOrderStatus, next: ProviderOrderStatus): void {
    const allowed: Record<ProviderOrderStatus, ProviderOrderStatus[]> = {
      PENDING: [ProviderOrderStatus.ACCEPTED, ProviderOrderStatus.CANCELLED],
      ACCEPTED: [ProviderOrderStatus.PROCESSING, ProviderOrderStatus.CANCELLED],
      PROCESSING: [ProviderOrderStatus.PACKED, ProviderOrderStatus.CANCELLED],
      PACKED: [ProviderOrderStatus.READY_FOR_PICKUP, ProviderOrderStatus.SHIPPED, ProviderOrderStatus.CANCELLED],
      READY_FOR_PICKUP: [ProviderOrderStatus.DELIVERED, ProviderOrderStatus.CANCELLED],
      SHIPPED: [ProviderOrderStatus.OUT_FOR_DELIVERY, ProviderOrderStatus.CANCELLED],
      OUT_FOR_DELIVERY: [ProviderOrderStatus.DELIVERED, ProviderOrderStatus.CANCELLED],
      DELIVERED: [ProviderOrderStatus.COMPLETED],
      COMPLETED: [],
      CANCELLED: [],
      REJECTED: [],
      REFUNDED: [],
    };
    if (!allowed[current].includes(next)) throw new BadRequestException(`Invalid status transition from ${current} to ${next}`);
  }

  private async createOrderEarningLedger(tx: Prisma.TransactionClient, order: ProviderOrderDetail): Promise<void> {
    if (order.order.paymentStatus !== PaymentStatus.SUCCEEDED) return;
    await tx.providerEarningsLedger.upsert({
      where: { providerOrderId_type: { providerOrderId: order.id, type: ProviderEarningsLedgerType.ORDER_EARNING } },
      update: {},
      create: {
        providerId: order.providerId,
        providerOrderId: order.id,
        type: ProviderEarningsLedgerType.ORDER_EARNING,
        direction: ProviderEarningsLedgerDirection.CREDIT,
        amount: order.totalPayout ?? order.total,
        currency: order.currency,
        status: ProviderEarningsLedgerStatus.AVAILABLE,
        description: `Order #${order.orderNumber ?? order.order.orderNumber} payout`,
        metadataJson: { orderId: order.orderId },
      },
    });
  }

  private async syncParentOrder(tx: Prisma.TransactionClient, orderId: string): Promise<void> {
    const providerOrders = await tx.providerOrder.findMany({ where: { orderId } });
    if (providerOrders.length === 0) return;
    const statuses = providerOrders.map((item) => item.status);
    let status: OrderStatus | null = null;
    if (providerOrders.length === 1) status = this.toParentStatus(statuses[0]);
    else if (statuses.every((item) => item === ProviderOrderStatus.COMPLETED)) status = OrderStatus.COMPLETED;
    else if (statuses.every((item) => (new Set<ProviderOrderStatus>([ProviderOrderStatus.CANCELLED, ProviderOrderStatus.REJECTED])).has(item))) status = OrderStatus.CANCELLED;
    else if (statuses.some((item) => item === ProviderOrderStatus.COMPLETED)) status = OrderStatus.PARTIALLY_COMPLETED;
    else if (statuses.some((item) => (new Set<ProviderOrderStatus>([ProviderOrderStatus.SHIPPED, ProviderOrderStatus.OUT_FOR_DELIVERY, ProviderOrderStatus.DELIVERED])).has(item))) status = OrderStatus.PARTIALLY_SHIPPED;
    else if (statuses.some((item) => (new Set<ProviderOrderStatus>([ProviderOrderStatus.ACCEPTED, ProviderOrderStatus.PROCESSING, ProviderOrderStatus.PACKED, ProviderOrderStatus.READY_FOR_PICKUP])).has(item))) status = OrderStatus.PARTIALLY_PROCESSING;
    if (status) await tx.order.update({ where: { id: orderId }, data: { status } });
  }

  private toParentStatus(status: ProviderOrderStatus): OrderStatus {
    if (status === ProviderOrderStatus.ACCEPTED || status === ProviderOrderStatus.PROCESSING || status === ProviderOrderStatus.PACKED) return OrderStatus.PROCESSING;
    if (status === ProviderOrderStatus.READY_FOR_PICKUP) return OrderStatus.READY_FOR_PICKUP;
    if (status === ProviderOrderStatus.SHIPPED) return OrderStatus.SHIPPED;
    if (status === ProviderOrderStatus.OUT_FOR_DELIVERY) return OrderStatus.OUT_FOR_DELIVERY;
    if (status === ProviderOrderStatus.DELIVERED) return OrderStatus.DELIVERED;
    if (status === ProviderOrderStatus.COMPLETED) return OrderStatus.COMPLETED;
    if (status === ProviderOrderStatus.CANCELLED || status === ProviderOrderStatus.REJECTED) return OrderStatus.CANCELLED;
    return OrderStatus.PROCESSING;
  }

  private async getOrCreateChecklistForRead(providerOrderId: string) { return (await this.providerOrdersRepository.findProviderOrderChecklist(providerOrderId)) ?? this.prisma.providerOrderChecklist.create({ data: { providerOrderId } }); }
  private async getOrCreateChecklist(providerOrderId: string) { return (await this.prisma.providerOrderChecklist.findUnique({ where: { providerOrderId } })) ?? this.prisma.providerOrderChecklist.create({ data: { providerOrderId } }); }
  private toChecklist(item: { providerOrderId: string; itemsPacked: boolean; giftMessageAttached: boolean; addressVerified: boolean; customerContactChecked: boolean; readyForCourier: boolean; customItemsJson: Prisma.JsonValue }) { return { orderId: item.providerOrderId, itemsPacked: item.itemsPacked, giftMessageAttached: item.giftMessageAttached, addressVerified: item.addressVerified, customerContactChecked: item.customerContactChecked, readyForCourier: item.readyForCourier, customItems: Array.isArray(item.customItemsJson) ? item.customItemsJson : [] }; }
  private rejectReasonLabel(reason: ProviderOrderRejectReason | RefundRejectReason): string { return this.rejectReasons().data.find((item) => item.key === reason)?.label ?? this.statusLabel(reason); }
  private statusTitle(status: ProviderOrderStatus): string { return this.statusLabel(status); }
  private statusDescription(status: ProviderOrderStatus, carrier?: string): string { if (status === ProviderOrderStatus.SHIPPED) return carrier ? `In progress via ${carrier}.` : 'Order has been shipped.'; if (status === ProviderOrderStatus.PACKED) return 'Ready for courier.'; if (status === ProviderOrderStatus.OUT_FOR_DELIVERY) return 'Order is out for delivery.'; if (status === ProviderOrderStatus.DELIVERED) return 'Order has been delivered.'; if (status === ProviderOrderStatus.COMPLETED) return 'Order has been completed.'; return `Order moved to ${this.statusTitle(status)}.`; }
  private customerStatusMessage(status: ProviderOrderStatus): string { if (status === ProviderOrderStatus.PROCESSING) return 'Your order is being prepared.'; if (status === ProviderOrderStatus.PACKED) return 'Your order has been packed.'; if (status === ProviderOrderStatus.SHIPPED) return 'Your order has been shipped.'; if (status === ProviderOrderStatus.OUT_FOR_DELIVERY) return 'Your order is out for delivery.'; if (status === ProviderOrderStatus.DELIVERED) return 'Your order has been delivered.'; if (status === ProviderOrderStatus.COMPLETED) return 'Your order is complete.'; return 'Your order status was updated.'; }

  private timeAgo(date: Date): string { const diff = Math.max(0, Date.now() - date.getTime()); const minutes = Math.floor(diff / 60_000); if (minutes < 60) return `${minutes}m ago`; const hours = Math.floor(minutes / 60); if (hours < 24) return `${hours}h ago`; return `${Math.floor(hours / 24)}d ago`; }
  private money(value: number): number { return Number(value.toFixed(2)); }
}
