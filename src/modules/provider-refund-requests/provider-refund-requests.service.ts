import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PaymentMethod, PaymentStatus, Prisma, RefundRejectReason, RefundRequestStatus } from '@prisma/client';
import { AuthUserContext } from '../../common/decorators/current-user.decorator';
import { PROVIDER_REFUND_REQUEST_INCLUDE, ProviderRefundRequestsRepository } from './provider-refund-requests.repository';
import { ListProviderRefundRequestsDto, ProviderRefundRequestAction, ProviderRefundRequestActionDto, ProviderRefundRequestSortBy, ProviderRefundRequestSortOrder, ProviderRefundRequestStatusFilter } from './dto/provider-refund-requests.dto';
import { getPagination } from '../../common/pagination/pagination.util';

type RefundRequestView = Prisma.RefundRequestGetPayload<{ include: typeof PROVIDER_REFUND_REQUEST_INCLUDE }>;

@Injectable()
export class ProviderRefundRequestsService {
  constructor(private readonly repository: ProviderRefundRequestsRepository) {}

  async list(user: AuthUserContext, query: ListProviderRefundRequestsDto) {
    const { page, limit, skip, take } = getPagination(query);
    const where = this.where(user.uid, query);
    const [items, total] = await this.repository.findManyForProviderList({ where, orderBy: this.orderBy(query.sortBy, query.sortOrder), skip, take });
    return { data: items.map((item) => this.toListItem(item)), meta: { page, limit, total, totalPages: Math.ceil(total / limit) }, message: 'Provider refund requests fetched successfully.' };
  }

  async summary(user: AuthUserContext) {
    const items = await this.repository.findManyByProviderId(user.uid);
    const count = (status: RefundRequestStatus) => items.filter((item) => item.status === status).length;
    const sum = (status: RefundRequestStatus, field: 'requestedAmount' | 'approvedAmount') => this.money(items.filter((item) => item.status === status).reduce((total, item) => total + Number(item[field] ?? 0), 0));
    return { data: { requested: count(RefundRequestStatus.REQUESTED), approved: count(RefundRequestStatus.APPROVED), rejected: count(RefundRequestStatus.REJECTED), refunded: count(RefundRequestStatus.REFUNDED), failed: count(RefundRequestStatus.FAILED), currency: items[0]?.currency ?? 'PKR', requestedAmountTotal: sum(RefundRequestStatus.REQUESTED, 'requestedAmount'), refundedAmountTotal: sum(RefundRequestStatus.REFUNDED, 'approvedAmount') }, message: 'Provider refund request summary fetched successfully.' };
  }

  async details(user: AuthUserContext, id: string) { const refund = await this.getOwnedRefundRequest(user.uid, id); return { data: this.toDetails(refund), message: 'Refund request fetched successfully.' }; }

  async action(user: AuthUserContext, id: string, dto: ProviderRefundRequestActionDto) {
    const refund = await this.getOwnedRefundRequest(user.uid, id);
    this.assertRequested(refund);
    if (dto.action === ProviderRefundRequestAction.APPROVE) return this.approveAction(user, refund, dto);
    return this.rejectAction(user, refund, dto);
  }

  rejectReasons() { return { data: [{ key: RefundRejectReason.ITEM_DELIVERED_AS_DESCRIBED, label: 'Item was delivered as described' }, { key: RefundRejectReason.NO_DAMAGE_EVIDENCE, label: 'No evidence of damage provided' }, { key: RefundRejectReason.REFUND_WINDOW_EXPIRED, label: 'Refund window has expired' }, { key: RefundRejectReason.NOT_COVERED_BY_POLICY, label: 'Issue not covered under refund policy' }, { key: RefundRejectReason.OTHER, label: 'Other' }], message: 'Refund rejection reasons fetched successfully.' }; }
  private async approveAction(user: AuthUserContext, refund: RefundRequestView, dto: ProviderRefundRequestActionDto) {
    if (dto.refundAmount === undefined) throw new BadRequestException('Refund amount is required when approving a refund request');
    const refundableAmount = await this.refundableAmount(refund);
    if (dto.refundAmount > Number(refund.requestedAmount)) throw new BadRequestException('Refund amount cannot exceed requested amount');
    if (dto.refundAmount > refundableAmount) throw new BadRequestException('Refund amount cannot exceed refundable amount');
    const status = this.shouldProcessAsync(refund) ? RefundRequestStatus.REFUND_PROCESSING : RefundRequestStatus.REFUNDED;
    const transactionId = status === RefundRequestStatus.REFUNDED ? this.refundTransactionId(refund.id) : null;
    const updated = await this.repository.approveWithSideEffects({ refundId: refund.id, orderId: refund.orderId, paymentId: refund.paymentId, userId: refund.userId, status, refundAmount: dto.refundAmount, providerComment: dto.comment?.trim(), transactionId, stripeRefundId: this.stripeRefundPlaceholder(refund), notifyCustomer: dto.notifyCustomer ?? true });
    return { data: { id: updated.id, status: updated.status, refundAmount: Number(updated.approvedAmount), transactionId: updated.transactionId }, message: status === RefundRequestStatus.REFUNDED ? 'Refund approved and processed successfully.' : 'Refund approved and queued for processing.' };
  }

  private async rejectAction(user: AuthUserContext, refund: RefundRequestView, dto: ProviderRefundRequestActionDto) {
    if (!dto.reason) throw new BadRequestException('Reason is required when rejecting a refund request');
    const updated = await this.repository.rejectWithSideEffects({ refundId: refund.id, orderId: refund.orderId, userId: refund.userId, reason: dto.reason, providerComment: dto.comment?.trim(), description: dto.comment?.trim() ?? this.rejectReasonLabel(dto.reason), notifyCustomer: dto.notifyCustomer ?? true });
    return { data: { id: updated.id, status: updated.status, rejectionReason: updated.rejectionReason }, message: 'Refund request rejected successfully.' };
  }
  private where(providerId: string, query: ListProviderRefundRequestsDto): Prisma.RefundRequestWhereInput { const where: Prisma.RefundRequestWhereInput = { providerId }; if (query.status && query.status !== ProviderRefundRequestStatusFilter.ALL) where.status = query.status; if (query.fromDate || query.toDate) where.createdAt = { gte: query.fromDate ? new Date(query.fromDate) : undefined, lte: query.toDate ? new Date(query.toDate) : undefined }; if (query.search) where.OR = [{ order: { orderNumber: { contains: query.search, mode: 'insensitive' } } }, { user: { firstName: { contains: query.search, mode: 'insensitive' } } }, { user: { lastName: { contains: query.search, mode: 'insensitive' } } }, { user: { email: { contains: query.search, mode: 'insensitive' } } }]; return where; }
  private orderBy(sortBy?: ProviderRefundRequestSortBy, sortOrder?: ProviderRefundRequestSortOrder): Prisma.RefundRequestOrderByWithRelationInput { const direction = sortOrder === ProviderRefundRequestSortOrder.ASC ? 'asc' : 'desc'; if (sortBy === ProviderRefundRequestSortBy.AMOUNT) return { requestedAmount: direction }; if (sortBy === ProviderRefundRequestSortBy.STATUS) return { status: direction }; return { createdAt: direction }; }
  private async getOwnedRefundRequest(providerId: string, id: string): Promise<RefundRequestView> { const refund = await this.repository.findOwnedByProvider(providerId, id); if (!refund) throw new NotFoundException('Refund request not found'); return refund; }
  private assertRequested(refund: RefundRequestView): void { if (refund.status !== RefundRequestStatus.REQUESTED) throw new BadRequestException('Only requested refund requests can be actioned'); }
  private async refundableAmount(refund: RefundRequestView): Promise<number> { const processed = await this.repository.findProcessedForOrder(refund.orderId, refund.id); return this.money(Number(refund.order.total) - processed.reduce((sum, item) => sum + Number(item.approvedAmount ?? item.requestedAmount), 0)); }
  private shouldProcessAsync(refund: RefundRequestView): boolean { return refund.payment?.paymentMethod === PaymentMethod.STRIPE_CARD && refund.payment.status === PaymentStatus.PROCESSING; }
  private stripeRefundPlaceholder(refund: RefundRequestView): string | null { if (refund.payment?.paymentMethod !== PaymentMethod.STRIPE_CARD || !refund.payment.providerPaymentIntentId) return null; return `stripe_refund_pending_${refund.id}`; }
  private refundTransactionId(id: string): string { return `RF-${id.slice(-8).toUpperCase()}`; }
  private money(value: number): number { return Number(value.toFixed(2)); }
  private name(user: { firstName: string; lastName: string }): string { return `${user.firstName} ${user.lastName}`.trim(); }
  private firstImage(value: Prisma.JsonValue): string | null { return Array.isArray(value) && typeof value[0] === 'string' ? value[0] : null; }
  private evidence(value: Prisma.JsonValue): { type: string; url: string }[] { if (!Array.isArray(value)) return []; return value.flatMap((item) => { if (!item || typeof item !== 'object' || Array.isArray(item) || !('url' in item)) return []; const record = item as Record<string, unknown>; return [{ type: typeof record.type === 'string' ? record.type : 'IMAGE', url: String(record.url) }]; }); }
  private toListItem(item: RefundRequestView) { return { id: item.id, orderId: item.orderId, orderNumber: item.order.orderNumber, customer: { name: this.name(item.user), email: item.user.email, avatarUrl: item.user.avatarUrl }, requestedAmount: Number(item.requestedAmount), currency: item.currency, status: item.status, customerReason: item.customerReason, createdAt: item.createdAt }; }
  private toDetails(item: RefundRequestView) { return { id: item.id, orderId: item.orderId, orderNumber: item.order.orderNumber, status: item.status, customerReason: item.customerReason, requestedAmount: Number(item.requestedAmount), currency: item.currency, requestedAt: item.requestedAt, evidence: this.evidence(item.evidenceUrlsJson), customer: { id: item.userId, name: this.name(item.user), email: item.user.email }, orderInfo: { orderNumber: item.order.orderNumber, orderDate: item.order.createdAt, deliveryStatus: item.order.providerStatus, subtotal: Number(item.order.subtotal), tax: Number(item.order.tax), totalPaid: Number(item.order.total) }, items: item.order.items.map((orderItem) => ({ id: orderItem.id, name: orderItem.gift.name, variantName: orderItem.variant?.name ?? null, quantity: orderItem.quantity, total: Number(orderItem.total), imageUrl: this.firstImage(orderItem.gift.imageUrls) })) }; }
  private rejectReasonLabel(reason: RefundRejectReason): string { return this.rejectReasons().data.find((item) => item.key === reason)?.label ?? 'Refund request rejected'; }
}
