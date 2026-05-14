import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DisputeActorType, DisputeStatus, NotificationRecipientType, OrderStatus, Payment, PaymentMethod, PaymentProvider, PaymentStatus, Prisma, ProviderOrderStatus, RefundRequestStatus } from '@prisma/client';
import { AuthUserContext } from '../../common/decorators/current-user.decorator';
import { AuditLogWriterService } from '../../common/services/audit-log.service';
import { PrismaService } from '../../database/prisma.service';
import { RefundPolicySettingsService } from '../refund-policy-settings/refund-policy-settings.service';
import { AdminGatewayProvider, AdminNotificationChannel, AdminRefundType, AdminTransactionExportFormat, AdminTransactionRange, AdminTransactionSortBy, AdminTransactionSortOrder, AdminTransactionStatus, AdminTransactionStatsDto, AdminTransactionType, ExportAdminTransactionsDto, ListAdminTransactionsDto, NotifyTransactionUserDto, OpenTransactionDisputeDto, RefundAdminTransactionDto } from './dto/admin-transactions.dto';

type PaymentRecord = Prisma.PaymentGetPayload<{ include: ReturnType<AdminTransactionsService['paymentInclude']> }>;
type NormalizedAdminTransaction = { id: string; transactionId: string; paymentId: string; orderId: string | null; orderNumber: string | null; userId: string; user: { id: string; name: string; email: string; avatarUrl: string | null; location: string | null }; providerId: string | null; providerBusinessName: string | null; gatewayProvider: AdminGatewayProvider; type: AdminTransactionType; amount: number; currency: string; status: AdminTransactionStatus; paymentStatus: PaymentStatus; paymentMethod: PaymentMethod; gatewayReference: string | null; metadata: Record<string, unknown>; subtotal: number; discount: number; deliveryFee: number; tax: number; createdAt: Date; };
type FileResult = { content: string; filename: string; contentType: string };

@Injectable()
export class AdminTransactionsService {
  constructor(private readonly prisma: PrismaService, private readonly auditLog: AuditLogWriterService, private readonly refundPolicy: RefundPolicySettingsService) {}

  async stats(query: AdminTransactionStatsDto) {
    const items = await this.transactions(query);
    const previous = await this.transactions({ ...query, ...this.previousRange(query) });
    const successful = items.filter((item) => item.status === AdminTransactionStatus.SUCCESS || item.status === AdminTransactionStatus.REFUNDED || item.status === AdminTransactionStatus.PARTIALLY_REFUNDED);
    const previousSuccessful = previous.filter((item) => item.status === AdminTransactionStatus.SUCCESS || item.status === AdminTransactionStatus.REFUNDED || item.status === AdminTransactionStatus.PARTIALLY_REFUNDED);
    const totalVolume = this.money(successful.reduce((sum, item) => sum + item.amount, 0));
    const previousVolume = this.money(previousSuccessful.reduce((sum, item) => sum + item.amount, 0));
    const successRate = items.length ? this.money((successful.length / items.length) * 100) : 0;
    const previousSuccessRate = previous.length ? this.money((previousSuccessful.length / previous.length) * 100) : 0;
    const today = this.todayRange();
    const failedToday = (await this.transactions({ status: AdminTransactionStatus.FAILED, fromDate: today.fromDate.toISOString(), toDate: today.toDate.toISOString() })).length;
    const previousFailedToday = (await this.transactions({ status: AdminTransactionStatus.FAILED, fromDate: today.previousFromDate, toDate: today.previousToDate })).length;
    return { data: { totalVolume, totalVolumeDeltaPercent: this.delta(totalVolume, previousVolume), successRate, successRateDeltaPercent: this.money(successRate - previousSuccessRate), pendingReview: items.filter((item) => item.status === AdminTransactionStatus.PENDING).length, failedToday, failedTodayDeltaPercent: this.delta(failedToday, previousFailedToday), currency: successful[0]?.currency ?? items[0]?.currency ?? process.env.STRIPE_CURRENCY ?? 'PKR' }, message: 'Transaction stats fetched successfully.' };
  }

  async list(query: ListAdminTransactionsDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const items = this.sort(await this.transactions(query), query.sortBy ?? AdminTransactionSortBy.CREATED_AT, query.sortOrder ?? AdminTransactionSortOrder.DESC);
    return { data: items.slice((page - 1) * limit, page * limit).map((item) => this.toListItem(item)), meta: { page, limit, total: items.length, totalPages: Math.ceil(items.length / limit) }, message: 'Transactions fetched successfully.' };
  }

  async details(id: string) {
    const item = await this.getTransaction(id);
    const refundedAmount = await this.refundedAmount(item.paymentId);
    const remainingRefundableAmount = this.money(Math.max(0, item.amount - refundedAmount));
    const policy = await this.refundPolicy.getActivePolicy();
    const refundWindowEndsAt = new Date(item.createdAt);
    refundWindowEndsAt.setUTCDate(refundWindowEndsAt.getUTCDate() + policy.refundWindowDays);
    return { data: { id: item.id, transactionId: item.transactionId, status: item.status, type: item.type, currency: item.currency, paymentBreakdown: { subtotal: item.subtotal, processingFee: this.money(item.amount - item.subtotal), processingFeePercent: item.subtotal > 0 ? this.money(((item.amount - item.subtotal) / item.subtotal) * 100) : 0, totalAmount: item.amount }, gatewayInformation: { provider: item.gatewayProvider, gatewayReference: item.gatewayReference, paymentMethod: this.maskPaymentMethod(item), settlementStatus: this.settlementStatus(item), processorAuthCode: this.stringValue(item.metadata.processorAuthCode) ?? this.stringValue(item.metadata.authCode) ?? null }, customer: { id: item.user.id, name: item.user.name, email: item.user.email, location: item.user.location, kycStatus: this.stringValue(item.metadata.kycStatus) ?? 'Not verified' }, relatedRecords: { orderId: item.orderId, orderNumber: item.orderNumber, paymentId: item.paymentId, subscriptionId: this.stringValue(item.metadata.customerSubscriptionId), moneyGiftId: this.stringValue(item.metadata.moneyGiftId), walletLedgerId: this.stringValue(item.metadata.walletLedgerId) }, refund: { isRefundable: this.isPaymentRefundable(item) && remainingRefundableAmount > 0, refundedAmount, remainingRefundableAmount, refundWindowEndsAt }, createdAt: item.createdAt }, message: 'Transaction details fetched successfully.' };
  }

  async timeline(id: string) {
    const item = await this.getTransaction(id);
    const [refunds, disputes, audits] = await Promise.all([
      this.prisma.refundRequest.findMany({ where: { paymentId: item.paymentId }, orderBy: { createdAt: 'asc' } }),
      this.prisma.disputeCase.findMany({ where: { OR: [{ paymentId: item.paymentId }, { linkedPaymentId: item.paymentId }, { transactionId: item.transactionId }] }, orderBy: { createdAt: 'asc' } }),
      this.prisma.adminAuditLog.findMany({ where: { targetId: item.paymentId, action: { in: ['TRANSACTION_REFUNDED_BY_ADMIN', 'TRANSACTION_DISPUTE_OPENED', 'TRANSACTION_NOTIFICATION_SENT', 'TRANSACTION_RECEIPT_DOWNLOADED'] } }, orderBy: { createdAt: 'asc' } }),
    ]);
    const events = [{ status: 'INITIATED', title: 'Initiated', description: 'Checkout session started by user via mobile application.', source: 'User Session', timestamp: item.createdAt }, { status: this.statusTitle(item.status), title: this.statusTitle(item.status), description: this.timelineDescription(item), source: item.gatewayReference ? 'Gateway Response' : 'System Auto-Update', timestamp: item.createdAt }, ...refunds.map((refund) => ({ status: refund.status, title: 'Refund Updated', description: `Refund ${refund.transactionId ?? refund.id} ${refund.status.toLowerCase().replaceAll('_', ' ')}.`, source: 'Refund Workflow', timestamp: refund.createdAt })), ...disputes.map((dispute) => ({ status: dispute.status, title: 'Dispute Opened', description: `${dispute.caseId} opened for ${dispute.reason}.`, source: 'Admin Dispute Manager', timestamp: dispute.createdAt })), ...audits.map((audit) => ({ status: audit.action, title: audit.actionLabel ?? this.label(audit.action), description: `${this.label(audit.action)} completed.`, source: 'Audit Log', timestamp: audit.createdAt }))].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    return { data: events, message: 'Transaction timeline fetched successfully.' };
  }

  async refund(user: AuthUserContext, id: string, dto: RefundAdminTransactionDto) {
    const item = await this.getTransaction(id);
    if (!this.isPaymentRefundable(item)) throw new BadRequestException('Transaction is not settled and cannot be refunded');
    const refundedAmount = await this.refundedAmount(item.paymentId);
    const remainingRefundableAmount = this.money(Math.max(0, item.amount - refundedAmount));
    const refundAmount = dto.refundType === AdminRefundType.FULL ? remainingRefundableAmount : this.money(dto.refundAmount);
    if (refundAmount <= 0) throw new BadRequestException('Refund amount must be greater than 0');
    if (refundAmount > remainingRefundableAmount) throw new BadRequestException('Refund amount cannot exceed remaining refundable amount');
    const providerOrder = await this.prisma.providerOrder.findFirst({ where: { orderId: item.orderId ?? undefined }, include: { items: true }, orderBy: { createdAt: 'asc' } });
    if (!item.orderId || !providerOrder) throw new BadRequestException('Order/provider order is required to refund this transaction');
    const categoryIds = await this.categoryIdsForOrder(item.orderId);
    const policyResult = await this.refundPolicy.evaluateRefundEligibility({ deliveredAt: this.deliveredAt(providerOrder.fulfilledAt, item.createdAt), categoryIds, requestedAmount: refundAmount, remainingRefundableAmount, paymentRefundable: true });
    if (!policyResult.eligible && !policyResult.manualReviewRequired) throw new BadRequestException(policyResult.reasons[0] ?? 'Refund is not eligible');
    const refundId = this.refundId(item.paymentId);
    const newStatus = refundAmount >= remainingRefundableAmount ? AdminTransactionStatus.REFUNDED : AdminTransactionStatus.PARTIALLY_REFUNDED;
    await this.prisma.$transaction(async (tx) => {
      await tx.refundRequest.create({ data: { orderId: item.orderId as string, providerOrderId: providerOrder.id, userId: item.userId, providerId: providerOrder.providerId, paymentId: item.paymentId, requestedAmount: new Prisma.Decimal(refundAmount), approvedAmount: new Prisma.Decimal(refundAmount), currency: item.currency, customerReason: dto.reason, status: RefundRequestStatus.REFUNDED, providerComment: dto.comment?.trim(), transactionId: refundId, stripeRefundId: item.gatewayProvider === AdminGatewayProvider.STRIPE ? `stripe_refund_${item.paymentId}` : null, approvedAt: new Date(), refundedAt: new Date() } });
      await tx.payment.update({ where: { id: item.paymentId }, data: { status: newStatus === AdminTransactionStatus.REFUNDED ? PaymentStatus.REFUNDED : item.paymentStatus, metadataJson: this.mergeMetadata(item.metadata, { adminRefundStatus: newStatus, lastRefundId: refundId, lastRefundAmount: refundAmount }) } });
      if (newStatus === AdminTransactionStatus.REFUNDED) await tx.order.update({ where: { id: item.orderId as string }, data: { paymentStatus: PaymentStatus.REFUNDED, status: OrderStatus.COMPLETED } });
      await tx.providerOrderTimeline.create({ data: { providerOrderId: providerOrder.id, createdById: user.uid, status: newStatus === AdminTransactionStatus.REFUNDED ? ProviderOrderStatus.REFUNDED : providerOrder.status, title: 'Admin refund processed', description: dto.comment?.trim() ?? `Admin processed ${dto.refundType.toLowerCase()} refund.`, metadataJson: { paymentId: item.paymentId, refundId, refundAmount, reason: dto.reason } } });
      if (dto.notifyUser ?? true) await tx.notification.create({ data: { recipientId: item.userId, recipientType: NotificationRecipientType.REGISTERED_USER, title: 'Transaction refunded', message: `Your refund of ${refundAmount} ${item.currency} has been processed.`, type: 'TRANSACTION_REFUND_PROCESSED', metadataJson: { paymentId: item.paymentId, refundId, refundAmount } } });
    });
    await this.auditLog.write({ actorId: user.uid, targetId: item.paymentId, targetType: 'TRANSACTION', action: 'TRANSACTION_REFUNDED_BY_ADMIN', module: 'Transaction Monitoring', beforeJson: { refundedAmount, remainingRefundableAmount }, afterJson: { refundId, refundAmount, status: newStatus, policy: policyResult } });
    return { data: { transactionId: item.transactionId, refundId, refundAmount, currency: item.currency, status: newStatus }, message: 'Transaction refunded successfully.' };
  }

  async openDispute(user: AuthUserContext, id: string, dto: OpenTransactionDisputeDto) {
    const item = await this.getTransaction(id);
    if (!item.orderId) throw new BadRequestException('Order is required to open a dispute from this transaction');
    const duplicate = await this.prisma.disputeCase.findFirst({ where: { OR: [{ paymentId: item.paymentId }, { linkedPaymentId: item.paymentId }, { transactionId: item.transactionId }], status: { in: [DisputeStatus.OPEN, DisputeStatus.IN_REVIEW, DisputeStatus.ESCALATED] } } });
    if (duplicate) throw new BadRequestException('An open dispute already exists for this transaction');
    const providerOrder = await this.prisma.providerOrder.findFirst({ where: { orderId: item.orderId }, orderBy: { createdAt: 'asc' } });
    const dispute = await this.prisma.$transaction(async (tx) => {
      const created = await tx.disputeCase.create({ data: { caseId: this.caseId(), userId: item.userId, orderId: item.orderId as string, transactionId: item.transactionId, paymentId: item.paymentId, providerId: providerOrder?.providerId, linkedTransactionId: item.transactionId, linkedPaymentId: item.paymentId, linkedOrderId: item.orderId, amount: new Prisma.Decimal(item.amount), currency: item.currency, reason: dto.reason, claimDetails: dto.claimDetails.trim(), priority: dto.priority, status: DisputeStatus.OPEN, slaDeadlineAt: new Date(Date.now() + 72 * 3_600_000), assignedToId: dto.assignToId } });
      await tx.disputeTimeline.create({ data: { disputeId: created.id, type: 'TRANSACTION_DISPUTE_OPENED', title: 'Dispute opened from transaction', description: dto.claimDetails.trim(), actorId: user.uid, actorType: DisputeActorType.ADMIN, metadataJson: { paymentId: item.paymentId, transactionId: item.transactionId } } });
      if (dto.assignToId) await tx.notification.create({ data: { recipientId: dto.assignToId, recipientType: NotificationRecipientType.ADMIN, title: 'Transaction dispute assigned', message: `${created.caseId} was opened from transaction ${item.transactionId}.`, type: 'ADMIN_TRANSACTION_DISPUTE_ASSIGNED', metadataJson: { disputeId: created.id, caseId: created.caseId, paymentId: item.paymentId } } });
      return created;
    });
    await this.auditLog.write({ actorId: user.uid, targetId: item.paymentId, targetType: 'TRANSACTION', action: 'TRANSACTION_DISPUTE_OPENED', module: 'Transaction Monitoring', afterJson: { disputeId: dispute.id, caseId: dispute.caseId, transactionId: item.transactionId } });
    return { data: { disputeId: dispute.id, caseId: dispute.caseId, transactionId: item.transactionId, status: dispute.status }, message: 'Dispute opened successfully.' };
  }

  async receipt(user: AuthUserContext, id: string): Promise<FileResult> {
    const item = await this.getTransaction(id);
    const content = [process.env.APP_NAME ?? 'Gift App', `Transaction ID: ${item.transactionId}`, `Payment ID: ${item.paymentId}`, `Order ID: ${item.orderId ?? 'N/A'}`, `Order Number: ${item.orderNumber ?? 'N/A'}`, `Customer: ${item.user.name} <${item.user.email}>`, `Amount: ${item.amount.toFixed(2)} ${item.currency}`, `Subtotal: ${item.subtotal.toFixed(2)}`, `Processing Fee: ${(item.amount - item.subtotal).toFixed(2)}`, `Gateway: ${item.gatewayProvider}`, `Payment Method: ${this.maskPaymentMethod(item)}`, `Status: ${item.status}`, `Created At: ${item.createdAt.toISOString()}`].join('\n');
    await this.auditLog.write({ actorId: user.uid, targetId: item.paymentId, targetType: 'TRANSACTION', action: 'TRANSACTION_RECEIPT_DOWNLOADED', module: 'Transaction Monitoring', afterJson: { transactionId: item.transactionId } });
    return { content, filename: `${item.transactionId}.pdf`, contentType: 'application/pdf' };
  }

  async notifyUser(user: AuthUserContext, id: string, dto: NotifyTransactionUserDto) {
    const item = await this.getTransaction(id);
    if (dto.channel === AdminNotificationChannel.IN_APP || dto.channel === AdminNotificationChannel.BOTH) await this.prisma.notification.create({ data: { recipientId: item.userId, recipientType: NotificationRecipientType.REGISTERED_USER, title: dto.subject.trim(), message: dto.message.trim(), type: 'ADMIN_TRANSACTION_NOTIFICATION', metadataJson: { paymentId: item.paymentId, transactionId: item.transactionId, includeReceipt: dto.includeReceipt ?? false } } });
    await this.auditLog.write({ actorId: user.uid, targetId: item.paymentId, targetType: 'TRANSACTION', action: 'TRANSACTION_NOTIFICATION_SENT', module: 'Transaction Monitoring', afterJson: { channel: dto.channel, subject: dto.subject, includeReceipt: dto.includeReceipt ?? false } });
    return { data: { transactionId: item.transactionId, notificationSent: true, channel: dto.channel }, message: 'Notification sent successfully.' };
  }

  async export(user: AuthUserContext, query: ExportAdminTransactionsDto): Promise<FileResult> {
    const items = this.sort(await this.transactions(query), query.sortBy ?? AdminTransactionSortBy.CREATED_AT, query.sortOrder ?? AdminTransactionSortOrder.DESC);
    const rows = [['Transaction ID', 'User', 'Email', 'Gateway', 'Type', 'Amount', 'Currency', 'Status', 'Created At'], ...items.map((item) => [item.transactionId, item.user.name, item.user.email, item.gatewayProvider, item.type, item.amount.toString(), item.currency, item.status, item.createdAt.toISOString()])];
    const content = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n');
    await this.auditLog.write({ actorId: user.uid, targetId: null, targetType: 'TRANSACTION_EXPORT', action: 'TRANSACTION_EXPORT_GENERATED', module: 'Transaction Monitoring', afterJson: { filters: this.safeExportFilters(query), count: items.length } });
    const format = query.format ?? AdminTransactionExportFormat.CSV;
    return { content, filename: `admin-transactions.${format === AdminTransactionExportFormat.PDF ? 'pdf' : 'csv'}`, contentType: format === AdminTransactionExportFormat.PDF ? 'application/pdf' : 'text/csv' };
  }

  private async transactions(query: Partial<ListAdminTransactionsDto>): Promise<NormalizedAdminTransaction[]> {
    const where = this.paymentWhere(query);
    const payments = await this.prisma.payment.findMany({ where, include: this.paymentInclude(), orderBy: { createdAt: 'desc' }, take: 10000 });
    const items = payments.map((payment) => this.normalize(payment));
    return items.filter((item) => this.matches(item, query));
  }

  private paymentWhere(query: Partial<ListAdminTransactionsDto>): Prisma.PaymentWhereInput {
    const range = this.range(query);
    const where: Prisma.PaymentWhereInput = { createdAt: { gte: range.fromDate, lte: range.toDate } };
    if (query.userId) where.userId = query.userId;
    if (query.minAmount !== undefined || query.maxAmount !== undefined) where.amount = { gte: query.minAmount === undefined ? undefined : new Prisma.Decimal(query.minAmount), lte: query.maxAmount === undefined ? undefined : new Prisma.Decimal(query.maxAmount) };
    if (query.search) where.OR = [{ id: { contains: query.search, mode: 'insensitive' } }, { providerPaymentIntentId: { contains: query.search, mode: 'insensitive' } }, { order: { orderNumber: { contains: query.search, mode: 'insensitive' } } }, { user: { firstName: { contains: query.search, mode: 'insensitive' } } }, { user: { lastName: { contains: query.search, mode: 'insensitive' } } }, { user: { email: { contains: query.search, mode: 'insensitive' } } }, { order: { providerOrders: { some: { provider: { providerBusinessName: { contains: query.search, mode: 'insensitive' } } } } } }];
    if (query.providerId) where.order = { providerOrders: { some: { providerId: query.providerId } } };
    return where;
  }

  private paymentInclude() { return { user: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true, location: true } }, order: { include: { providerOrders: { include: { provider: { select: { id: true, providerBusinessName: true } } }, orderBy: { createdAt: 'asc' } }, items: { include: { gift: { select: { categoryId: true, name: true } } } } } }, moneyGift: true, customerSubscription: true, recurringPaymentOccurrences: { include: { recurringPayment: true } }, refundRequests: true } satisfies Prisma.PaymentInclude; }

  private normalize(payment: PaymentRecord): NormalizedAdminTransaction {
    const metadata = this.object(payment.metadataJson);
    const refundedAmount = payment.refundRequests.reduce((sum, refund) => sum + Number(refund.approvedAmount ?? refund.requestedAmount), 0);
    const status = this.status(payment.status, refundedAmount, Number(payment.amount), this.stringValue(metadata.adminRefundStatus));
    const providerOrder = payment.order?.providerOrders[0];
    const type = this.type(payment, metadata);
    return { id: payment.id, transactionId: this.transactionId(payment), paymentId: payment.id, orderId: payment.orderId, orderNumber: payment.order?.orderNumber ?? null, userId: payment.userId, user: { id: payment.user.id, name: this.name(payment.user), email: payment.user.email, avatarUrl: payment.user.avatarUrl, location: payment.user.location }, providerId: providerOrder?.providerId ?? null, providerBusinessName: providerOrder?.provider.providerBusinessName ?? null, gatewayProvider: this.gateway(payment), type, amount: this.money(payment.amount), currency: payment.currency, status, paymentStatus: payment.status, paymentMethod: payment.paymentMethod, gatewayReference: payment.providerPaymentIntentId, metadata, subtotal: payment.order ? this.money(payment.order.subtotal) : this.money(payment.amount), discount: payment.order ? this.money(payment.order.discountTotal) : 0, deliveryFee: payment.order ? this.money(payment.order.deliveryFee) : 0, tax: payment.order ? this.money(payment.order.tax) : 0, createdAt: payment.createdAt };
  }

  private async getTransaction(id: string): Promise<NormalizedAdminTransaction> {
    const payment = await this.prisma.payment.findFirst({ where: { OR: [{ id }, { providerPaymentIntentId: id }] }, include: this.paymentInclude() });
    if (!payment) throw new NotFoundException('Transaction not found');
    return this.normalize(payment);
  }

  private matches(item: NormalizedAdminTransaction, query: Partial<ListAdminTransactionsDto>): boolean {
    if (query.transactionType && query.transactionType !== AdminTransactionType.ALL && item.type !== query.transactionType) return false;
    if (query.status && query.status !== AdminTransactionStatus.ALL && item.status !== query.status) return false;
    if (query.gatewayProvider && query.gatewayProvider !== AdminGatewayProvider.ALL && item.gatewayProvider !== query.gatewayProvider) return false;
    if (query.providerId && item.providerId !== query.providerId) return false;
    if (!query.search) return true;
    const haystack = [item.transactionId, item.paymentId, item.orderNumber, item.user.name, item.user.email, item.gatewayReference, item.providerBusinessName].filter(Boolean).join(' ').toLowerCase();
    return haystack.includes(query.search.toLowerCase());
  }

  private sort(items: NormalizedAdminTransaction[], sortBy: AdminTransactionSortBy, sortOrder: AdminTransactionSortOrder): NormalizedAdminTransaction[] { const direction = sortOrder === AdminTransactionSortOrder.ASC ? 1 : -1; return [...items].sort((a, b) => { if (sortBy === AdminTransactionSortBy.AMOUNT) return (a.amount - b.amount) * direction; if (sortBy === AdminTransactionSortBy.STATUS) return a.status.localeCompare(b.status) * direction; return (a.createdAt.getTime() - b.createdAt.getTime()) * direction; }); }
  private toListItem(item: NormalizedAdminTransaction) { return { id: item.id, transactionId: item.transactionId, user: { id: item.user.id, name: item.user.name, avatarUrl: item.user.avatarUrl }, gatewayProvider: item.gatewayProvider, type: item.type, amount: item.amount, currency: item.currency, status: item.status, createdAt: item.createdAt }; }
  private range(query: Partial<AdminTransactionStatsDto>): { fromDate?: Date; toDate?: Date } { if (query.fromDate || query.toDate) return { fromDate: query.fromDate ? new Date(query.fromDate) : undefined, toDate: query.toDate ? new Date(query.toDate) : undefined }; const now = new Date(); const range = query.range ?? AdminTransactionRange.LAST_30_DAYS; if (range === AdminTransactionRange.TODAY) return this.todayRange(); const days = range === AdminTransactionRange.LAST_7_DAYS ? 7 : 30; return { fromDate: new Date(now.getTime() - days * 86_400_000), toDate: now }; }
  private previousRange(query: AdminTransactionStatsDto): { fromDate?: string; toDate?: string } { const current = this.range(query); if (!current.fromDate || !current.toDate) return {}; const length = current.toDate.getTime() - current.fromDate.getTime(); return { fromDate: new Date(current.fromDate.getTime() - length).toISOString(), toDate: current.fromDate.toISOString() }; }
  private todayRange(): { fromDate: Date; toDate: Date; previousFromDate: string; previousToDate: string } { const now = new Date(); const fromDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())); const toDate = new Date(fromDate.getTime() + 86_400_000 - 1); return { fromDate, toDate, previousFromDate: new Date(fromDate.getTime() - 86_400_000).toISOString(), previousToDate: new Date(fromDate.getTime() - 1).toISOString() }; }
  private status(status: PaymentStatus, refundedAmount: number, amount: number, metadataStatus: string | null): AdminTransactionStatus { if (metadataStatus === AdminTransactionStatus.PARTIALLY_REFUNDED) return AdminTransactionStatus.PARTIALLY_REFUNDED; if (status === PaymentStatus.REFUNDED || refundedAmount >= amount) return AdminTransactionStatus.REFUNDED; if (refundedAmount > 0) return AdminTransactionStatus.PARTIALLY_REFUNDED; if (status === PaymentStatus.SUCCEEDED) return AdminTransactionStatus.SUCCESS; if (status === PaymentStatus.FAILED || status === PaymentStatus.CANCELLED) return AdminTransactionStatus.FAILED; return AdminTransactionStatus.PENDING; }
  private type(payment: PaymentRecord, metadata: Record<string, unknown>): AdminTransactionType { if (payment.refundRequests.length) return AdminTransactionType.PAYMENT; if (this.stringValue(metadata.walletTopUpId)) return AdminTransactionType.WALLET_TOP_UP; if (payment.recurringPaymentOccurrences.length) return AdminTransactionType.RECURRING_PAYMENT; if (payment.customerSubscriptionId) return AdminTransactionType.SUBSCRIPTION_PAYMENT; if (payment.moneyGiftId) return AdminTransactionType.GIFT; if (payment.orderId) return AdminTransactionType.PAYMENT; return AdminTransactionType.PAYMENT; }
  private gateway(payment: Pick<Payment, 'provider' | 'paymentMethod'>): AdminGatewayProvider { if (payment.provider === PaymentProvider.STRIPE) return AdminGatewayProvider.STRIPE; if (payment.paymentMethod === PaymentMethod.BANK_TRANSFER) return AdminGatewayProvider.BANK_TRANSFER; if (payment.paymentMethod === PaymentMethod.E_WALLET) return AdminGatewayProvider.WALLET; if (payment.paymentMethod === PaymentMethod.COD) return AdminGatewayProvider.COD; return AdminGatewayProvider.BANK_TRANSFER; }
  private transactionId(payment: Payment): string { return payment.providerPaymentIntentId ?? `TXN-${payment.createdAt.getUTCFullYear()}-${payment.id.slice(-8).toUpperCase()}`; }
  private maskPaymentMethod(item: NormalizedAdminTransaction): string { const brand = this.stringValue(item.metadata.cardBrand) ?? (item.paymentMethod === PaymentMethod.STRIPE_CARD ? 'Visa' : item.paymentMethod.replaceAll('_', ' ')); const last4 = this.stringValue(item.metadata.cardLast4); return last4 ? `${brand} **** ${last4}` : brand; }
  private settlementStatus(item: NormalizedAdminTransaction): string { if (item.status === AdminTransactionStatus.SUCCESS || item.status === AdminTransactionStatus.REFUNDED || item.status === AdminTransactionStatus.PARTIALLY_REFUNDED) return 'CLEARED'; if (item.status === AdminTransactionStatus.FAILED) return 'FAILED'; return 'PENDING'; }
  private isPaymentRefundable(item: NormalizedAdminTransaction): boolean { return item.paymentStatus === PaymentStatus.SUCCEEDED && item.status !== AdminTransactionStatus.REFUNDED; }
  private async refundedAmount(paymentId: string): Promise<number> { const rows = await this.prisma.refundRequest.findMany({ where: { paymentId, status: { in: [RefundRequestStatus.APPROVED, RefundRequestStatus.REFUND_PROCESSING, RefundRequestStatus.REFUNDED] } } }); return this.money(rows.reduce((sum, row) => sum + Number(row.approvedAmount ?? row.requestedAmount), 0)); }
  private async categoryIdsForOrder(orderId: string): Promise<string[]> { const items = await this.prisma.orderItem.findMany({ where: { orderId }, include: { gift: { select: { categoryId: true } } } }); return [...new Set(items.map((item) => item.gift.categoryId))]; }
  private deliveredAt(fulfilledAt: Date | null, fallback: Date): Date { return fulfilledAt ?? fallback; }
  private safeExportFilters(query: ExportAdminTransactionsDto): Record<string, unknown> { const { search, fromDate, toDate, transactionType, status, gatewayProvider, userId, providerId, format } = query; return { search, fromDate, toDate, transactionType, status, gatewayProvider, userId, providerId, format }; }
  private timelineDescription(item: NormalizedAdminTransaction): string { if (item.status === AdminTransactionStatus.SUCCESS) return 'Funds successfully transferred to the merchant escrow account.'; if (item.status === AdminTransactionStatus.FAILED) return 'Gateway or system marked the transaction as failed.'; if (item.status === AdminTransactionStatus.PENDING) return 'Transaction is pending settlement or review.'; return 'Refund state updated for this transaction.'; }
  private statusTitle(status: AdminTransactionStatus): string { if (status === AdminTransactionStatus.SUCCESS) return 'COMPLETED'; return status; }
  private refundId(paymentId: string): string { return `RF-${paymentId.slice(-8).toUpperCase()}`; }
  private caseId(): string { return `DSP-${String(Date.now()).slice(-6)}`; }
  private label(action: string): string { return action.toLowerCase().split('_').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' '); }
  private delta(current: number, previous: number): number { if (previous === 0) return current === 0 ? 0 : 100; return this.money(((current - previous) / previous) * 100); }
  private money(value: Prisma.Decimal | number | null | undefined): number { return Number(Number(value ?? 0).toFixed(2)); }
  private name(user: { firstName: string; lastName: string }): string { return `${user.firstName} ${user.lastName}`.trim(); }
  private object(value: Prisma.JsonValue): Record<string, unknown> { return value && typeof value === 'object' && !Array.isArray(value) ? value : {}; }
  private stringValue(value: unknown): string | null { return typeof value === 'string' && value.length > 0 ? value : null; }
  private mergeMetadata(metadata: Record<string, unknown>, patch: Record<string, unknown>): Prisma.InputJsonValue { return { ...metadata, ...patch } as Prisma.InputJsonValue; }
}
