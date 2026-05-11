import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { NotificationRecipientType, OrderStatus, PaymentStatus, Prisma, ProviderOrderRejectReason, ProviderOrderStatus, UserRole } from '@prisma/client';
import { AuthUserContext } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../database/prisma.service';
import { AcceptProviderOrderDto, ListProviderOrdersDto, ProviderOrderSortBy, ProviderOrderSortOrder, ProviderOrderStatusFilter, ProviderOrdersSummaryDto, RejectProviderOrderDto } from './dto/provider-orders.dto';

type ProviderOrderView = Prisma.ProviderOrderGetPayload<{ include: { order: true; items: true } }>;
type ProviderOrderDetail = ProviderOrderView;

@Injectable()
export class ProviderOrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(user: AuthUserContext, query: ListProviderOrdersDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const where = this.where(user.uid, query);
    const orderBy = this.orderBy(query.sortBy, query.sortOrder);
    const [items, total] = await this.prisma.$transaction([
      this.prisma.providerOrder.findMany({ where, include: this.listInclude(), orderBy, skip: (page - 1) * limit, take: limit }),
      this.prisma.providerOrder.count({ where }),
    ]);
    return { data: items.map((item) => this.toListItem(item)), meta: { page, limit, total, totalPages: Math.ceil(total / limit) }, message: 'Provider orders fetched successfully.' };
  }

  async summary(user: AuthUserContext, query: ProviderOrdersSummaryDto) {
    const now = new Date();
    const start = query.fromDate ? new Date(query.fromDate) : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const end = query.toDate ? new Date(query.toDate) : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
    const base: Prisma.ProviderOrderWhereInput = { providerId: user.uid };
    const todayWhere: Prisma.ProviderOrderWhereInput = { ...base, createdAt: { gte: start, lte: end } };
    const [today, pendingCount, processingCount, shippedCount, completedCount, cancelledCount] = await this.prisma.$transaction([
      this.prisma.providerOrder.findMany({ where: todayWhere }),
      this.prisma.providerOrder.count({ where: { ...base, status: ProviderOrderStatus.PENDING } }),
      this.prisma.providerOrder.count({ where: { ...base, status: { in: [ProviderOrderStatus.ACCEPTED, ProviderOrderStatus.PROCESSING, ProviderOrderStatus.PACKED] } } }),
      this.prisma.providerOrder.count({ where: { ...base, status: ProviderOrderStatus.SHIPPED } }),
      this.prisma.providerOrder.count({ where: { ...base, status: { in: [ProviderOrderStatus.DELIVERED, ProviderOrderStatus.COMPLETED] } } }),
      this.prisma.providerOrder.count({ where: { ...base, status: { in: [ProviderOrderStatus.CANCELLED, ProviderOrderStatus.REJECTED, ProviderOrderStatus.REFUNDED] } } }),
    ]);
    const todayRevenue = this.money(today.reduce((sum, item) => sum + Number(item.totalPayout ?? item.total), 0));
    return { data: { todayOrderCount: today.length, todayRevenue, pendingCount, processingCount, shippedCount, completedCount, cancelledCount, currency: today[0]?.currency ?? 'PKR' }, message: 'Provider order summary fetched successfully.' };
  }

  async details(user: AuthUserContext, id: string) {
    const order = await this.getOwnedProviderOrder(user.uid, id);
    const address = await this.prisma.customerAddress.findFirst({ where: { id: order.order.deliveryAddressId, userId: order.order.userId } });
    return { data: this.toDetails(order, address), message: 'Provider order fetched successfully.' };
  }

  async accept(user: AuthUserContext, id: string, dto: AcceptProviderOrderDto) {
    const order = await this.getOwnedProviderOrder(user.uid, id);
    if (order.status !== ProviderOrderStatus.PENDING) throw new BadRequestException('Only pending provider orders can be accepted');
    const updated = await this.prisma.$transaction(async (tx) => {
      const item = await tx.providerOrder.update({ where: { id: order.id }, data: { status: ProviderOrderStatus.ACCEPTED, acceptedAt: new Date() } });
      await tx.providerOrderTimeline.create({ data: { providerOrderId: order.id, actorId: user.uid, status: ProviderOrderStatus.ACCEPTED, note: dto.note?.trim() } });
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
      await tx.providerOrderTimeline.create({ data: { providerOrderId: order.id, actorId: user.uid, status: ProviderOrderStatus.REJECTED, note: dto.comment?.trim() ?? dto.reason } });
      if (providerCount === 1) await tx.order.update({ where: { id: order.orderId }, data: { status: OrderStatus.CANCELLED, paymentStatus: order.order.paymentStatus === PaymentStatus.SUCCEEDED ? PaymentStatus.REFUNDED : order.order.paymentStatus } });
      await tx.notification.create({ data: { recipientId: order.order.userId, recipientType: NotificationRecipientType.REGISTERED_USER, title: 'Order rejected', message: 'A provider rejected your gift order. Our team will review it.', type: 'CUSTOMER_ORDER_REJECTED', metadataJson: { orderId: order.orderId, providerOrderId: order.id, reason: dto.reason } } });
      const admins = await tx.user.findMany({ where: { role: UserRole.SUPER_ADMIN, isActive: true, deletedAt: null }, select: { id: true } });
      for (const admin of admins) await tx.notification.create({ data: { recipientId: admin.id, recipientType: NotificationRecipientType.ADMIN, title: 'Order requires review', message: 'A provider rejected an assigned order.', type: 'ADMIN_ORDER_REQUIRES_REVIEW', metadataJson: { orderId: order.orderId, providerOrderId: order.id, reason: dto.reason } } });
      return item;
    });
    return { data: { id: updated.id, orderNumber: updated.orderNumber ?? order.order.orderNumber, status: updated.status, rejectionReason: updated.rejectionReason }, message: 'Order rejected successfully.' };
  }

  rejectReasons() {
    return { data: [{ key: ProviderOrderRejectReason.OUT_OF_STOCK, label: 'Out of Stock' }, { key: ProviderOrderRejectReason.BUSINESS_CLOSED, label: 'Business Closed' }, { key: ProviderOrderRejectReason.CANNOT_DELIVER_TO_AREA, label: 'Cannot deliver to area' }, { key: ProviderOrderRejectReason.PRICING_ERROR, label: 'Pricing Error' }, { key: ProviderOrderRejectReason.OTHER, label: 'Other' }], message: 'Reject reasons fetched successfully.' };
  }

  private where(providerId: string, query: ListProviderOrdersDto): Prisma.ProviderOrderWhereInput {
    const where: Prisma.ProviderOrderWhereInput = { providerId };
    if (query.status && query.status !== ProviderOrderStatusFilter.ALL) where.status = query.status;
    else if (!query.status) where.status = ProviderOrderStatus.PENDING;
    if (query.fromDate || query.toDate) where.createdAt = { gte: query.fromDate ? new Date(query.fromDate) : undefined, lte: query.toDate ? new Date(query.toDate) : undefined };
    if (query.search) where.OR = [{ orderNumber: { contains: query.search, mode: 'insensitive' } }, { order: { orderNumber: { contains: query.search, mode: 'insensitive' } } }, { order: { recipientName: { contains: query.search, mode: 'insensitive' } } }, { items: { some: { nameSnapshot: { contains: query.search, mode: 'insensitive' } } } }];
    return where;
  }

  private orderBy(sortBy?: ProviderOrderSortBy, sortOrder?: ProviderOrderSortOrder): Prisma.ProviderOrderOrderByWithRelationInput { const direction = sortOrder === ProviderOrderSortOrder.ASC ? 'asc' : 'desc'; if (sortBy === ProviderOrderSortBy.AMOUNT) return { total: direction }; if (sortBy === ProviderOrderSortBy.STATUS) return { status: direction }; return { createdAt: direction }; }
  private listInclude() { return Prisma.validator<Prisma.ProviderOrderInclude>()({ order: true, items: true }); }
  private async getOwnedProviderOrder(providerId: string, id: string): Promise<ProviderOrderDetail> { const order = await this.prisma.providerOrder.findFirst({ where: { id, providerId }, include: this.listInclude() }); if (!order) throw new NotFoundException('Provider order not found'); return order; }
  private toListItem(item: ProviderOrderView) { return { id: item.id, orderId: item.orderId, orderNumber: item.orderNumber ?? item.order.orderNumber, status: item.status, paymentStatus: item.order.paymentStatus, customer: { name: item.order.recipientName, phone: item.order.recipientPhone }, itemPreview: item.items.slice(0, 2).map((orderItem) => ({ name: orderItem.nameSnapshot, imageUrl: orderItem.imageUrl })), itemCount: item.items.reduce((sum, orderItem) => sum + orderItem.quantity, 0), totalPayout: Number(item.totalPayout ?? item.total), currency: item.currency, createdAt: item.createdAt, receivedAgoText: this.timeAgo(item.createdAt) }; }
  private toDetails(item: ProviderOrderDetail, address: { line1: string; city: string; state: string | null; postalCode: string | null; deliveryInstructions: string | null } | null) { return { id: item.id, orderNumber: item.orderNumber ?? item.order.orderNumber, status: item.status, paymentStatus: item.order.paymentStatus, receivedAt: item.createdAt, receivedAgoText: this.timeAgo(item.createdAt), customer: { name: item.order.recipientName, phone: item.order.recipientPhone }, deliveryAddress: address ? { line1: address.line1, city: address.city, state: address.state, postalCode: address.postalCode, gateCode: address.deliveryInstructions } : null, items: item.items.map((orderItem) => ({ id: orderItem.orderItemId, giftId: orderItem.giftId, variantId: orderItem.variantId, name: orderItem.nameSnapshot, variantName: orderItem.variantNameSnapshot, quantity: orderItem.quantity, unitPrice: Number(orderItem.unitPrice), total: Number(orderItem.total), imageUrl: orderItem.imageUrl })), summary: { subtotal: Number(item.subtotal), tax: Number(item.tax), deliveryFee: Number(item.deliveryFee), platformFee: Number(item.platformFee), totalPayout: Number(item.totalPayout ?? item.total), currency: item.currency }, giftMessage: item.order.giftMessage, scheduledDeliveryAt: item.order.scheduledDeliveryAt }; }
  private timeAgo(date: Date): string { const diff = Math.max(0, Date.now() - date.getTime()); const minutes = Math.floor(diff / 60_000); if (minutes < 60) return `${minutes}m ago`; const hours = Math.floor(minutes / 60); if (hours < 24) return `${hours}h ago`; return `${Math.floor(hours / 24)}d ago`; }
  private money(value: number): number { return Number(value.toFixed(2)); }
}
