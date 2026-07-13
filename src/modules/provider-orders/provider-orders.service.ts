import { BadRequestException, Injectable, NotFoundException, StreamableFile } from '@nestjs/common';
import { OrderStatus, Prisma, RefundRequestStatus } from '@prisma/client';
import { AuthUserContext } from '../../common/decorators/current-user.decorator';
import { getPagination } from '../../common/pagination/pagination.util';
import { ListProviderOrdersDto, ProviderOrderHistoryDto, ProviderOrderSortBy, ProviderOrderSortOrder, ProviderOrderStatusFilter, ProviderOrdersExportDto, ProviderOrdersSummaryDto, ProviderPerformanceDto, ProviderPerformanceRange, ProviderRecentOrdersDto, ProviderRevenueAnalyticsDto, ProviderRevenueRange, UpdateProviderOrderStatusDto } from './dto/provider-orders.dto';
import { PROVIDER_ORDER_LIST_INCLUDE, ProviderOrdersRepository } from './provider-orders.repository';

type ProviderOrderView = Prisma.OrderGetPayload<{ include: typeof PROVIDER_ORDER_LIST_INCLUDE }>;
type ProviderOrderDetail = ProviderOrderView;

@Injectable()
export class ProviderOrdersService {
  constructor(private readonly providerOrdersRepository: ProviderOrdersRepository) {}

  async list(user: AuthUserContext, query: ListProviderOrdersDto) {
    const { page, limit, skip, take } = getPagination(query);
    const [items, total] = await this.providerOrdersRepository.findManyAndCountProviderOrders({ where: this.where(user.uid, query), include: this.listInclude(), orderBy: this.orderBy(query.sortBy, query.sortOrder), skip, take });
    return { data: items.map((item) => this.toListItem(item)), meta: { page, limit, total, totalPages: Math.ceil(total / limit) }, message: 'Provider orders fetched successfully.' };
  }

  async history(user: AuthUserContext, query: ProviderOrderHistoryDto) {
    const { page, limit, skip, take } = getPagination(query);
    const [items, total] = await this.providerOrdersRepository.findManyAndCountProviderOrders({ where: this.historyWhere(user.uid, query), include: this.listInclude(), orderBy: this.orderBy(query.sortBy, query.sortOrder), skip, take });
    return { data: items.map((item) => this.toListItem(item)), meta: { page, limit, total, totalPages: Math.ceil(total / limit) }, message: 'Provider order history fetched successfully.' };
  }

  async recent(user: AuthUserContext, query: ProviderRecentOrdersDto) {
    const { limit } = getPagination(query);
    const items = await this.providerOrdersRepository.findRecentProviderOrders(user.uid, limit);
    return { data: items.map((item) => ({ id: item.id, orderNumber: item.orderNumber, status: item.status, amount: Number(item.total), createdAt: item.createdAt })), message: 'Recent provider orders fetched successfully.' };
  }

  async performance(user: AuthUserContext, query: ProviderPerformanceDto) {
    const range = this.performanceRange(query);
    const previous = this.previousRange(range.from, range.to);
    const [orders, previousOrders] = await this.providerOrdersRepository.findPerformanceRows({ providerId: user.uid, range, previous });
    const completedOrders = orders.filter((item) => this.completedStatuses().has(item.status)).length;
    const nonCancelled = orders.filter((item) => !this.closedStatuses().has(item.status)).length;
    const previousCompleted = previousOrders.filter((item) => this.completedStatuses().has(item.status)).length;
    const previousNonCancelled = previousOrders.filter((item) => !this.closedStatuses().has(item.status)).length;
    const completionRate = nonCancelled === 0 ? 0 : this.money((completedOrders / nonCancelled) * 100);
    const previousCompletionRate = previousNonCancelled === 0 ? 0 : this.money((previousCompleted / previousNonCancelled) * 100);
    const weeklyRevenue = this.money(orders.reduce((sum, item) => sum + this.revenueValue(item), 0));
    const previousRevenue = this.money(previousOrders.reduce((sum, item) => sum + this.revenueValue(item), 0));
    return { data: { completionRate, completionRateTarget: 95, completionDelta: this.money(completionRate - previousCompletionRate), weeklyRevenue, weeklyRevenueDelta: this.deltaPercent(weeklyRevenue, previousRevenue), totalOrders: orders.length, completedOrders, pendingOrders: orders.filter((item) => item.status === OrderStatus.PENDING).length, cancelledOrders: orders.filter((item) => this.cancelledStatuses().has(item.status)).length, currency: 'USD' }, message: 'Provider order performance fetched successfully.' };
  }

  async revenueAnalytics(user: AuthUserContext, query: ProviderRevenueAnalyticsDto) {
    const range = this.revenueRange(query);
    const previous = this.previousRange(range.from, range.to);
    const [orders, previousOrders] = await this.providerOrdersRepository.findRevenueAnalyticsRows({ providerId: user.uid, range, previous, statuses: [OrderStatus.ACCEPTED, OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED, OrderStatus.COMPLETED] });
    const totalRevenue = this.money(orders.reduce((sum, item) => sum + this.revenueValue(item), 0));
    const previousRevenue = this.money(previousOrders.reduce((sum, item) => sum + this.revenueValue(item), 0));
    return { data: { totalRevenue, currency: 'USD', deltaPercent: this.deltaPercent(totalRevenue, previousRevenue), points: this.revenuePoints(orders, query.range ?? ProviderRevenueRange.DAILY, range.from) }, message: 'Provider revenue analytics fetched successfully.' };
  }

  ratingsAnalytics() { return { data: { averageRating: 0, reviewCount: 0, distribution: { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 } }, message: 'Provider ratings analytics fetched successfully.' }; }

  async export(user: AuthUserContext, query: ProviderOrdersExportDto): Promise<StreamableFile> {
    const items = await this.providerOrdersRepository.findProviderOrdersForExport({ where: this.exportWhere(user.uid, query), include: this.listInclude() });
    const rows = [['Order Number', 'Customer', 'Status', 'Amount', 'Created At'], ...items.map((item) => [item.orderNumber, item.recipientName, item.status, String(Number(item.total)), item.createdAt.toISOString()])];
    return new StreamableFile(Buffer.from(rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n')), { type: 'text/csv', disposition: 'attachment; filename="provider-orders.csv"' });
  }

  async summary(user: AuthUserContext, query: ProviderOrdersSummaryDto) {
    const now = new Date();
    const start = query.fromDate ? new Date(query.fromDate) : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const end = query.toDate ? new Date(query.toDate) : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
    const base: Prisma.OrderWhereInput = { providerId: user.uid };
    const todayWhere: Prisma.OrderWhereInput = { ...base, createdAt: { gte: start, lte: end } };
    const [today, pendingCount, processingCount, shippedCount, completedCount, cancelledCount] = await this.providerOrdersRepository.findProviderOrderSummary({ base, todayWhere });
    return { data: { todayOrderCount: today.length, todayRevenue: this.money(today.reduce((sum, item) => sum + Number(item.total), 0)), pendingCount, processingCount, shippedCount, completedCount, cancelledCount, currency: 'USD' }, message: 'Provider order summary fetched successfully.' };
  }

  async details(user: AuthUserContext, id: string) {
    const order = await this.getOwnedProviderOrderForRead(user.uid, id);
    return { data: this.toDetails(order), message: 'Provider order fetched successfully.' };
  }

  async updateOrderStatus(user: AuthUserContext, id: string, dto: UpdateProviderOrderStatusDto) {
    const order = await this.getOwnedProviderOrder(user.uid, id);
    if (this.closedStatuses().has(order.status)) throw new BadRequestException('Cannot update a closed order');
    this.assertTransition(order.status, dto.status);
    if (dto.status === OrderStatus.REJECTED && !dto.reason) throw new BadRequestException('Reason is required when rejecting an order');
    const updated = await this.providerOrdersRepository.runActionTransaction(async (tx) => {
      // Accepting the order is when the customer's wallet is actually charged (no charge at creation).
      if (order.status === OrderStatus.PENDING && dto.status === OrderStatus.ACCEPTED) {
        await this.providerOrdersRepository.debitCustomerWalletForOrder(tx, { userId: order.userId, orderId: order.id, amount: order.total });
      }
      const item = await this.providerOrdersRepository.updateProviderOrderStatus(tx, order.id, { status: dto.status, rejectionReason: dto.status === OrderStatus.REJECTED ? dto.reason : undefined });
      if (this.completedStatuses().has(dto.status)) await this.createOrderEarningLedger(tx, order);
      return item;
    });
    return { data: { id: updated.id, orderNumber: updated.orderNumber, status: updated.status }, message: 'Order status updated successfully.' };
  }

  async timeline(user: AuthUserContext, id: string) {
    const order = await this.getOwnedProviderOrderForRead(user.uid, id);
    return { data: [{ status: 'ORDERED', title: 'Ordered', description: 'System confirmed the order.', createdAt: order.createdAt }, { status: order.status, title: this.statusLabel(order.status), description: `Order moved to ${this.statusLabel(order.status)}.`, createdAt: order.updatedAt }], message: 'Order timeline fetched successfully.' };
  }

  rejectReasons() { return { data: [{ key: 'OUT_OF_STOCK', label: 'Out of Stock' }, { key: 'BUSINESS_CLOSED', label: 'Business Closed' }, { key: 'CANNOT_DELIVER_TO_AREA', label: 'Cannot deliver to area' }, { key: 'PRICING_ERROR', label: 'Pricing Error' }, { key: 'OTHER', label: 'Other' }], message: 'Reject reasons fetched successfully.' }; }

  private historyWhere(providerId: string, query: ProviderOrderHistoryDto): Prisma.OrderWhereInput { const where = this.where(providerId, { ...query, status: ProviderOrderStatusFilter.ALL }); this.applyStatusFilter(where, query.status as unknown as ProviderOrderStatusFilter | undefined); return where; }
  private exportWhere(providerId: string, query: ProviderOrdersExportDto): Prisma.OrderWhereInput { const where: Prisma.OrderWhereInput = { providerId, createdAt: query.fromDate || query.toDate ? { gte: query.fromDate ? new Date(query.fromDate) : undefined, lte: query.toDate ? new Date(query.toDate) : undefined } : undefined }; this.applyStatusFilter(where, query.status as ProviderOrderStatusFilter | undefined); return where; }
  private revenueValue(item: { total: Prisma.Decimal }): number { return Number(item.total); }
  private deltaPercent(current: number, previous: number): number { if (previous === 0) return current === 0 ? 0 : 100; return this.money(((current - previous) / previous) * 100); }
  private performanceRange(query: ProviderPerformanceDto): { from: Date; to: Date } { const now = new Date(); if (query.range === ProviderPerformanceRange.CUSTOM && query.fromDate && query.toDate) return { from: new Date(query.fromDate), to: new Date(query.toDate) }; if (query.range === ProviderPerformanceRange.TODAY) return { from: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())), to: now }; if (query.range === ProviderPerformanceRange.THIS_MONTH) return { from: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)), to: now }; const day = now.getUTCDay(); const diff = (day + 6) % 7; return { from: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - diff)), to: now }; }
  private revenueRange(query: ProviderRevenueAnalyticsDto): { from: Date; to: Date } { const now = new Date(); if (query.fromDate && query.toDate) return { from: new Date(query.fromDate), to: new Date(query.toDate) }; if (query.range === ProviderRevenueRange.MONTHLY) return { from: new Date(Date.UTC(now.getUTCFullYear(), 0, 1)), to: now }; if (query.range === ProviderRevenueRange.WEEKLY) return { from: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 28)), to: now }; return { from: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 6)), to: now }; }
  private previousRange(from: Date, to: Date): { from: Date; to: Date } { const span = to.getTime() - from.getTime(); return { from: new Date(from.getTime() - span), to: new Date(from.getTime() - 1) }; }
  private revenuePoints(items: { createdAt: Date; total: Prisma.Decimal }[], range: ProviderRevenueRange, from: Date) { const buckets = new Map<string, number>(); for (const item of items) { const label = this.pointLabel(item.createdAt, range); buckets.set(label, (buckets.get(label) ?? 0) + this.revenueValue(item)); } if (buckets.size === 0) buckets.set(this.pointLabel(from, range), 0); return [...buckets.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([label, value]) => ({ label, value: this.money(value) })); }
  private pointLabel(date: Date, range: ProviderRevenueRange): string { if (range === ProviderRevenueRange.MONTHLY) return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`; if (range === ProviderRevenueRange.WEEKLY) return `W${Math.ceil(date.getUTCDate() / 7)}`; return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getUTCDay()]; }
  private where(providerId: string, query: ListProviderOrdersDto): Prisma.OrderWhereInput { const where: Prisma.OrderWhereInput = { providerId }; if (query.status) this.applyStatusFilter(where, query.status); else where.status = OrderStatus.PENDING; if (query.fromDate || query.toDate) where.createdAt = { gte: query.fromDate ? new Date(query.fromDate) : undefined, lte: query.toDate ? new Date(query.toDate) : undefined }; if (query.search) where.OR = [{ orderNumber: { contains: query.search, mode: 'insensitive' } }, { recipientName: { contains: query.search, mode: 'insensitive' } }, { items: { some: { gift: { name: { contains: query.search, mode: 'insensitive' } } } } }]; return where; }
  private applyStatusFilter(where: Prisma.OrderWhereInput, status?: ProviderOrderStatusFilter): void { if (!status || status === ProviderOrderStatusFilter.ALL) return; where.status = status as unknown as OrderStatus; }
  private orderBy(sortBy?: ProviderOrderSortBy, sortOrder?: ProviderOrderSortOrder): Prisma.OrderOrderByWithRelationInput { const direction = sortOrder === ProviderOrderSortOrder.ASC ? 'asc' : 'desc'; if (sortBy === ProviderOrderSortBy.AMOUNT) return { total: direction }; if (sortBy === ProviderOrderSortBy.STATUS) return { status: direction }; return { createdAt: direction }; }
  private listInclude() { return PROVIDER_ORDER_LIST_INCLUDE; }
  private async getOwnedProviderOrderForRead(providerId: string, id: string): Promise<ProviderOrderDetail> { const order = await this.providerOrdersRepository.findProviderOrderById(providerId, id, this.listInclude()); if (!order) throw new NotFoundException('Provider order not found'); return order; }
  private async getOwnedProviderOrder(providerId: string, id: string): Promise<ProviderOrderDetail> { const order = await this.providerOrdersRepository.findProviderOrderForAction(providerId, id, this.listInclude()); if (!order) throw new NotFoundException('Provider order not found'); return order; }
  private latestRefund(item: ProviderOrderView) { return item.refundRequests[0] ?? null; }
  private refundSummary(item: ProviderOrderView) { const refund = this.latestRefund(item); return refund ? { id: refund.id, status: refund.status, requestedAmount: Number(refund.requestedAmount), requestedAt: refund.requestedAt } : null; }
  private displayStatus(item: ProviderOrderView): string { const refund = this.latestRefund(item); if (refund?.status === RefundRequestStatus.REQUESTED) return 'REFUND_REQUESTED'; if (refund?.status === RefundRequestStatus.REFUND_PROCESSING) return 'REFUND_PROCESSING'; if (refund?.status === RefundRequestStatus.REFUNDED) return 'REFUNDED'; if (refund?.status === RefundRequestStatus.REJECTED) return 'REFUND_REJECTED'; return item.status; }
  private statusLabel(status: string): string { return status.split('_').map((part) => part.charAt(0) + part.slice(1).toLowerCase()).join(' '); }
  private cancellation(item: ProviderOrderDetail) { if (!this.cancelledStatuses().has(item.status)) return null; return { reason: 'Order cancelled', cancelledBy: item.status === OrderStatus.REJECTED ? 'Provider' : 'System', cancelledAt: item.updatedAt }; }
  private refundDetails(item: ProviderOrderDetail) { const refund = this.latestRefund(item); return refund ? { id: refund.id, status: refund.status, requestedAmount: Number(refund.requestedAmount), approvedAmount: refund.approvedAmount === null ? null : Number(refund.approvedAmount), transactionId: refund.transactionId, customerReason: refund.customerReason, providerDecisionReason: refund.rejectionReason, providerComment: refund.providerComment, refundedAt: refund.refundedAt } : null; }
  private toListItem(item: ProviderOrderView) { const status = this.displayStatus(item); return { id: item.id, orderId: item.id, orderNumber: item.orderNumber, customerName: item.recipientName, amount: Number(item.total), status, statusLabel: this.statusLabel(status), refund: this.refundSummary(item), customer: { name: item.recipientName, phone: item.recipientPhone }, itemPreview: item.items.slice(0, 2).map((orderItem) => ({ name: orderItem.gift.name, imageUrl: this.firstImage(orderItem.gift.imageUrls) })), itemCount: item.items.reduce((sum, orderItem) => sum + orderItem.quantity, 0), total: Number(item.total), currency: 'USD', createdAt: item.createdAt, receivedAgoText: this.timeAgo(item.createdAt) }; }
  private toDetails(item: ProviderOrderDetail) { const status = this.displayStatus(item); return { id: item.id, orderNumber: item.orderNumber, status, statusLabel: this.statusLabel(status), receivedAt: item.createdAt, receivedAgoText: this.timeAgo(item.createdAt), customer: { name: item.recipientName, phone: item.recipientPhone }, deliveryAddress: item.recipientAddress, items: item.items.map((orderItem) => ({ id: orderItem.id, giftId: orderItem.giftId, name: orderItem.gift.name, quantity: orderItem.quantity, unitPrice: Number(orderItem.unitPrice), total: Number(orderItem.unitPrice) * orderItem.quantity, imageUrl: this.firstImage(orderItem.gift.imageUrls) })), summary: { subtotal: Number(item.subtotal), platformFee: Number(item.platformFee), total: Number(item.total), currency: 'USD' }, cancellation: this.cancellation(item), refund: this.refundDetails(item), giftMessage: item.giftMessage }; }
  private assertTransition(current: OrderStatus, next: OrderStatus): void { const allowed: Record<string, OrderStatus[]> = { PENDING: [OrderStatus.ACCEPTED, OrderStatus.REJECTED, OrderStatus.CANCELLED], ACCEPTED: [OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.CANCELLED], PROCESSING: [OrderStatus.SHIPPED, OrderStatus.CANCELLED], SHIPPED: [OrderStatus.DELIVERED, OrderStatus.CANCELLED], DELIVERED: [OrderStatus.COMPLETED], COMPLETED: [], CANCELLED: [], REJECTED: [] }; if (!(allowed[current] ?? []).includes(next)) throw new BadRequestException(`Invalid status transition from ${current} to ${next}`); }
  private async createOrderEarningLedger(tx: Prisma.TransactionClient, order: ProviderOrderDetail): Promise<void> { await this.providerOrdersRepository.upsertOrderEarningLedger(tx, { providerId: order.providerId, orderId: order.id, amount: order.total, description: `Order #${order.orderNumber} payout` }); }
  private timeAgo(date: Date): string { const diff = Math.max(0, Date.now() - date.getTime()); const minutes = Math.floor(diff / 60_000); if (minutes < 60) return `${minutes}m ago`; const hours = Math.floor(minutes / 60); if (hours < 24) return `${hours}h ago`; return `${Math.floor(hours / 24)}d ago`; }
  private money(value: number): number { return Number(value.toFixed(2)); }
  private firstImage(value: Prisma.JsonValue): string | null { return Array.isArray(value) && typeof value[0] === 'string' ? value[0] : null; }
  private completedStatuses() { return new Set<OrderStatus>([OrderStatus.DELIVERED, OrderStatus.COMPLETED]); }
  private cancelledStatuses() { return new Set<OrderStatus>([OrderStatus.CANCELLED, OrderStatus.REJECTED]); }
  private closedStatuses() { return new Set<OrderStatus>([OrderStatus.CANCELLED, OrderStatus.REJECTED]); }
}
