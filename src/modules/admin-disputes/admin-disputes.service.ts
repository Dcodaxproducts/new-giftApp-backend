import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DisputeActorType, DisputeCase, DisputeRefundType, DisputeStatus, Payment, PaymentStatus, Prisma, RefundRequestStatus } from '@prisma/client';
import { AuthUserContext } from '../../common/decorators/current-user.decorator';
import { AuditLogWriterService } from '../../common/services/audit-log.service';
import { PrismaService } from '../../database/prisma.service';
import { AddDisputeNoteDto, DisputeDateRangeDto, DisputePriorityFilter, DisputeRange, DisputeSortBy, DisputeStatusFilter, ExportDisputesDto, ExportFormat, LinkTransactionDto, ListDisputesDto, RefundPreviewDto, SortOrder, TransactionSearchDto } from './dto/admin-disputes.dto';

type PaymentWithOrder = Payment & {
  user: { id: string; firstName: string; lastName: string; email: string };
  order: { id: string; orderNumber: string; createdAt: Date; total: Prisma.Decimal; currency: string } | null;
};

type DisputeWithDetails = DisputeCase & {
  user: { id: string; firstName: string; lastName: string; email: string };
  order: { id: string; orderNumber: string; status: string; paymentStatus: PaymentStatus; createdAt: Date; updatedAt: Date; total: Prisma.Decimal; currency: string; providerOrders: { id: string; status: string; orderNumber: string | null; createdAt: Date; updatedAt: Date; timeline: { status: string; title: string; createdAt: Date }[] }[] };
  payment: { id: string; status: PaymentStatus; amount: Prisma.Decimal; currency: string; providerPaymentIntentId: string | null; paymentMethod: string; metadataJson: Prisma.JsonValue } | null;
};

@Injectable()
export class AdminDisputesService {
  constructor(private readonly prisma: PrismaService, private readonly auditLog: AuditLogWriterService) {}

  async stats(query: DisputeDateRangeDto) {
    const where = this.dateWhere(query);
    const now = new Date();
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const previousWhere: Prisma.DisputeCaseWhereInput = { createdAt: { gte: new Date((where.createdAt as Prisma.DateTimeFilter | undefined)?.gte instanceof Date ? ((where.createdAt as Prisma.DateTimeFilter).gte as Date).getTime() - 7 * 24 * 60 * 60 * 1000 : now.getTime() - 14 * 24 * 60 * 60 * 1000), lt: (where.createdAt as Prisma.DateTimeFilter | undefined)?.gte as Date | undefined } };
    const [openCases, previousOpenCases, awaitingAction, escalated, resolvedThisWeek, previousResolved] = await this.prisma.$transaction([
      this.prisma.disputeCase.count({ where: { ...where, status: { in: [DisputeStatus.OPEN, DisputeStatus.IN_REVIEW, DisputeStatus.ESCALATED] } } }),
      this.prisma.disputeCase.count({ where: { ...previousWhere, status: { in: [DisputeStatus.OPEN, DisputeStatus.IN_REVIEW, DisputeStatus.ESCALATED] } } }),
      this.prisma.disputeCase.count({ where: { ...where, status: { in: [DisputeStatus.OPEN, DisputeStatus.IN_REVIEW] }, assignedToId: null } }),
      this.prisma.disputeCase.count({ where: { ...where, status: DisputeStatus.ESCALATED } }),
      this.prisma.disputeCase.count({ where: { status: { in: [DisputeStatus.RESOLVED, DisputeStatus.REJECTED, DisputeStatus.APPROVED] }, resolvedAt: { gte: weekStart } } }),
      this.prisma.disputeCase.count({ where: { status: { in: [DisputeStatus.RESOLVED, DisputeStatus.REJECTED, DisputeStatus.APPROVED] }, resolvedAt: { gte: new Date(weekStart.getTime() - 7 * 24 * 60 * 60 * 1000), lt: weekStart } } }),
    ]);
    return { data: { openCases, openCasesDelta: openCases - previousOpenCases, awaitingAction, escalated, resolvedThisWeek, resolvedDeltaPercent: this.deltaPercent(resolvedThisWeek, previousResolved), currency: 'PKR' }, message: 'Dispute stats fetched successfully.' };
  }

  async list(query: ListDisputesDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = this.disputeWhere(query);
    const [items, total] = await this.prisma.$transaction([
      this.prisma.disputeCase.findMany({ where, include: this.disputeInclude(), orderBy: this.orderBy(query), skip: (page - 1) * limit, take: limit }),
      this.prisma.disputeCase.count({ where }),
    ]);
    return { data: items.map((item) => this.listItem(item)), meta: { page, limit, total, totalPages: Math.ceil(total / limit) }, message: 'Disputes fetched successfully.' };
  }

  async details(id: string) {
    const dispute = await this.findDispute(id);
    return { data: { id: dispute.id, caseId: dispute.caseId, status: dispute.status, priority: dispute.priority, reason: dispute.reason, amount: this.money(dispute.amount), currency: dispute.currency, sla: this.sla(dispute), customer: { id: dispute.user.id, name: this.name(dispute.user), email: dispute.user.email }, transaction: this.transaction(dispute), refund: this.refund(dispute), claimDetails: dispute.claimDetails, createdAt: dispute.createdAt, lastUpdatedAt: dispute.updatedAt }, message: 'Dispute details fetched successfully.' };
  }


  async linkage(id: string) {
    const dispute = await this.findDispute(id);
    const paymentId = dispute.linkedPaymentId ?? dispute.paymentId;
    const linkedPayment = paymentId ? await this.findPayment(paymentId) : null;
    if (!linkedPayment) {
      return { data: { dispute: { id: dispute.id, caseId: dispute.caseId, customer: { id: dispute.user.id, name: this.name(dispute.user) }, disputeAmount: this.money(dispute.amount), currency: dispute.currency, claimDetails: dispute.claimDetails, status: dispute.status }, linkedTransaction: null, refundSelection: null }, message: 'Dispute linkage fetched successfully.' };
    }
    const preview = await this.refundPreview(id, { transactionId: linkedPayment.id, refundType: dispute.refundType ?? DisputeRefundType.FULL, refundAmount: dispute.refundAmount ? this.money(dispute.refundAmount) : undefined });
    return { data: { dispute: { id: dispute.id, caseId: dispute.caseId, customer: { id: dispute.user.id, name: this.name(dispute.user) }, disputeAmount: this.money(dispute.amount), currency: dispute.currency, claimDetails: dispute.claimDetails, status: dispute.status }, linkedTransaction: this.transactionSearchItem(linkedPayment, preview.data.eligible, preview.data.eligibilityText), refundSelection: { type: dispute.refundType ?? preview.data.refundType, amount: dispute.refundAmount ? this.money(dispute.refundAmount) : preview.data.requestedRefundAmount, recommended: (dispute.refundType ?? preview.data.refundType) === DisputeRefundType.FULL } }, message: 'Dispute linkage fetched successfully.' };
  }

  async transactionSearch(id: string, query: TransactionSearchDto) {
    const dispute = await this.findDispute(id);
    const where: Prisma.PaymentWhereInput = { userId: dispute.userId, ...(query.recentOnly ? { createdAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } } : {}), ...(query.query ? { OR: [{ id: { contains: query.query, mode: 'insensitive' } }, { providerPaymentIntentId: { contains: query.query, mode: 'insensitive' } }, { order: { orderNumber: { contains: query.query, mode: 'insensitive' } } }, { user: { email: { contains: query.query, mode: 'insensitive' } } }] } : {}) };
    const payments = await this.prisma.payment.findMany({ where, include: this.paymentInclude(), orderBy: { createdAt: 'desc' }, take: query.limit ?? 10 });
    const items = await Promise.all(payments.map(async (payment) => { const eligibility = await this.refundEligibility(payment); return this.transactionSearchItem(payment, eligibility.eligible, eligibility.eligibilityText); }));
    return { data: items, message: 'Dispute transactions fetched successfully.' };
  }

  async refundPreview(id: string, dto: RefundPreviewDto) {
    const dispute = await this.findDispute(id);
    const payment = await this.findPayment(dto.transactionId);
    this.assertSameCustomer(dispute, payment);
    const eligibility = await this.refundEligibility(payment);
    const requestedRefundAmount = this.requestedRefundAmount(dto, eligibility.maxRefundAmount);
    const warnings = [...eligibility.warnings];
    if (dto.refundType !== DisputeRefundType.NONE && requestedRefundAmount > eligibility.maxRefundAmount) throw new BadRequestException('Requested refund exceeds max refundable amount.');
    const eligible = dto.refundType === DisputeRefundType.NONE || eligibility.eligible;
    return { data: { transactionId: payment.providerPaymentIntentId ?? payment.id, refundType: dto.refundType, requestedRefundAmount, maxRefundAmount: eligibility.maxRefundAmount, currency: payment.currency, eligible, eligibilityText: eligibility.eligibilityText, warnings }, message: 'Refund preview generated successfully.' };
  }

  async linkTransaction(user: AuthUserContext, id: string, dto: LinkTransactionDto) {
    if (!dto.confirmCorrectTransaction) throw new BadRequestException('confirmCorrectTransaction must be true');
    const preview = await this.refundPreview(id, dto);
    if (!preview.data.eligible) throw new BadRequestException(preview.data.eligibilityText);
    const dispute = await this.findDispute(id);
    const payment = await this.findPayment(dto.transactionId);
    const updated = await this.prisma.disputeCase.update({ where: { id }, data: { linkedTransactionId: payment.providerPaymentIntentId ?? payment.id, linkedPaymentId: payment.id, linkedOrderId: payment.orderId ?? dispute.orderId, transactionId: payment.providerPaymentIntentId ?? payment.id, paymentId: payment.id, refundType: dto.refundType, refundAmount: preview.data.requestedRefundAmount, linkedById: user.uid, linkedAt: new Date(), status: dispute.status === DisputeStatus.OPEN ? DisputeStatus.IN_REVIEW : dispute.status } });
    await this.prisma.disputeTimeline.create({ data: { disputeId: id, type: 'TRANSACTION_LINKED', title: 'Transaction Linked', description: `Primary transaction ${payment.providerPaymentIntentId ?? payment.id} linked to dispute.`, actorId: user.uid, actorType: DisputeActorType.ADMIN, metadataJson: { paymentId: payment.id, orderId: payment.orderId, refundType: dto.refundType, refundAmount: preview.data.requestedRefundAmount } } });
    await this.prisma.disputeTimeline.create({ data: { disputeId: id, type: 'REFUND_SELECTION_UPDATED', title: 'Refund Selection Updated', description: `Refund selection set to ${dto.refundType}.`, actorId: user.uid, actorType: DisputeActorType.ADMIN, metadataJson: { refundType: dto.refundType, refundAmount: preview.data.requestedRefundAmount } } });
    await this.auditLog.write({ actorId: user.uid, targetId: id, targetType: 'DISPUTE_CASE', action: 'DISPUTE_TRANSACTION_LINKED', beforeJson: { linkedPaymentId: dispute.linkedPaymentId, refundType: dispute.refundType, refundAmount: dispute.refundAmount }, afterJson: { linkedPaymentId: payment.id, refundType: dto.refundType, refundAmount: preview.data.requestedRefundAmount } });
    return { data: { disputeId: updated.id, caseId: updated.caseId, transactionId: updated.linkedTransactionId, refundType: updated.refundType, refundAmount: updated.refundAmount ? this.money(updated.refundAmount) : 0, status: updated.status, nextStep: 'DECISION' }, message: 'Transaction linked to dispute successfully.' };
  }

  async evidence(id: string) {
    await this.ensureDispute(id);
    const items = await this.prisma.disputeEvidence.findMany({ where: { disputeId: id }, orderBy: { createdAt: 'asc' } });
    return { data: items.map((item) => ({ id: item.id, fileName: item.fileName, fileUrl: item.fileUrl, contentType: item.contentType, uploadedBy: item.uploadedByType, createdAt: item.createdAt })), message: 'Dispute evidence fetched successfully.' };
  }

  async internalData(id: string) {
    const dispute = await this.findDispute(id);
    const paymentMetadata = this.object(dispute.payment?.metadataJson);
    return { data: { paymentStatus: dispute.payment?.status ?? dispute.order.paymentStatus, refundEligible: this.refund(dispute).eligible, processorAuthCode: this.stringValue(paymentMetadata.processorAuthCode) ?? this.stringValue(paymentMetadata.authCode) ?? null, transactionHistory: this.transactionHistory(dispute) }, message: 'Internal dispute data fetched successfully.' };
  }

  async timeline(id: string) {
    await this.ensureDispute(id);
    const items = await this.prisma.disputeTimeline.findMany({ where: { disputeId: id }, include: { actor: { select: { firstName: true, lastName: true } } }, orderBy: { createdAt: 'asc' } });
    return { data: items.map((item) => ({ id: item.id, type: item.type, title: item.title, description: item.description, actor: { type: item.actorType, name: item.actor ? this.name(item.actor) : this.actorName(item.actorType) }, createdAt: item.createdAt })), message: 'Dispute timeline fetched successfully.' };
  }

  async addNote(user: AuthUserContext, id: string, dto: AddDisputeNoteDto) {
    await this.ensureDispute(id);
    const note = await this.prisma.disputeNote.create({ data: { disputeId: id, authorId: user.uid, note: dto.note, visibility: dto.visibility }, include: { author: { select: { id: true, firstName: true, lastName: true } } } });
    await this.prisma.disputeTimeline.create({ data: { disputeId: id, type: 'INTERNAL_NOTE_ADDED', title: 'Internal Note Added', description: 'An admin added an internal note to the dispute.', actorId: user.uid, actorType: DisputeActorType.ADMIN, metadataJson: { noteId: note.id } } });
    await this.auditLog.write({ actorId: user.uid, targetId: id, targetType: 'DISPUTE_CASE', action: 'DISPUTE_NOTE_ADDED', afterJson: { noteId: note.id, visibility: note.visibility } });
    return { data: this.noteItem(note), message: 'Dispute note added successfully.' };
  }

  async notes(id: string) {
    await this.ensureDispute(id);
    const notes = await this.prisma.disputeNote.findMany({ where: { disputeId: id }, include: { author: { select: { id: true, firstName: true, lastName: true } } }, orderBy: { createdAt: 'desc' } });
    return { data: notes.map((note) => this.noteItem(note)), message: 'Dispute notes fetched successfully.' };
  }

  async export(query: ExportDisputesDto) {
    const items = await this.prisma.disputeCase.findMany({ where: { status: query.status, priority: query.priority, ...(query.fromDate || query.toDate ? { createdAt: { ...(query.fromDate ? { gte: new Date(query.fromDate) } : {}), ...(query.toDate ? { lte: new Date(query.toDate) } : {}) } } : {}) }, include: this.disputeInclude(), orderBy: { createdAt: 'desc' }, take: 10000 });
    const rows = [['Case ID', 'Customer Name', 'Order Number', 'Transaction ID', 'Amount', 'Currency', 'Priority', 'Status', 'Reason', 'Created At'], ...items.map((item) => [item.caseId, this.name(item.user), item.order.orderNumber, item.transactionId ?? '', this.money(item.amount).toString(), item.currency, item.priority, item.status, item.reason, item.createdAt.toISOString()])];
    const content = rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(',')).join('\n');
    const format = query.format ?? ExportFormat.CSV;
    return { content, filename: `disputes.${format === ExportFormat.PDF ? 'pdf' : 'csv'}`, contentType: format === ExportFormat.PDF ? 'application/pdf' : 'text/csv' };
  }


  private async findPayment(transactionId: string): Promise<PaymentWithOrder> {
    const payment = await this.prisma.payment.findFirst({ where: { OR: [{ id: transactionId }, { providerPaymentIntentId: transactionId }] }, include: this.paymentInclude() });
    if (!payment) throw new NotFoundException('Transaction not found');
    return payment;
  }

  private paymentInclude() { return { user: { select: { id: true, firstName: true, lastName: true, email: true } }, order: { select: { id: true, orderNumber: true, createdAt: true, total: true, currency: true } } } satisfies Prisma.PaymentInclude; }
  private assertSameCustomer(dispute: DisputeCase, payment: PaymentWithOrder): void { if (dispute.userId !== payment.userId) throw new BadRequestException('Transaction does not belong to the dispute customer'); }
  private async refundEligibility(payment: PaymentWithOrder) { const paid = payment.status === PaymentStatus.SUCCEEDED; const ageDays = Math.floor((Date.now() - payment.createdAt.getTime()) / 86_400_000); const previous = await this.prisma.refundRequest.aggregate({ where: { paymentId: payment.id, status: { in: [RefundRequestStatus.APPROVED, RefundRequestStatus.REFUND_PROCESSING, RefundRequestStatus.REFUNDED] } }, _sum: { approvedAmount: true, requestedAmount: true } }); const refunded = this.money(previous._sum.approvedAmount ?? previous._sum.requestedAmount ?? 0); const maxRefundAmount = Math.max(0, this.money(payment.amount) - refunded); const warnings: string[] = []; if (!paid) warnings.push('Payment is not settled.'); if (ageDays > 30) warnings.push('Refund window expired.'); if (maxRefundAmount <= 0) warnings.push('No refundable amount remains.'); const eligible = paid && ageDays <= 30 && maxRefundAmount > 0; return { eligible, maxRefundAmount, eligibilityText: eligible ? 'Eligible within 30-day window' : warnings[0] ?? 'Refund is not currently eligible', warnings }; }
  private requestedRefundAmount(dto: RefundPreviewDto, maxRefundAmount: number): number { if (dto.refundType === DisputeRefundType.NONE) return 0; if (dto.refundType === DisputeRefundType.FULL) return maxRefundAmount; const amount = dto.refundAmount ?? 0; if (amount <= 0) throw new BadRequestException('Partial refund amount must be greater than 0'); return amount; }
  private transactionSearchItem(payment: PaymentWithOrder, refundEligible: boolean, eligibilityText: string) { return { id: payment.id, transactionId: payment.providerPaymentIntentId ?? payment.id, orderId: payment.orderId, orderNumber: payment.order?.orderNumber ?? null, customerName: this.name(payment.user), paymentMethod: this.paymentMethod(payment), amount: this.money(payment.amount), currency: payment.currency, status: this.paymentStatus(payment.status), orderDate: payment.order?.createdAt ?? payment.createdAt, refundEligible, eligibilityText }; }
  private paymentMethod(payment: Pick<Payment, 'paymentMethod' | 'metadataJson'>): string { const metadata = this.object(payment.metadataJson); const brand = this.stringValue(metadata.cardBrand) ?? (payment.paymentMethod === 'STRIPE_CARD' ? 'CARD' : payment.paymentMethod); const last4 = this.stringValue(metadata.cardLast4); return last4 ? `${brand.toUpperCase()} **** ${last4}` : brand.replaceAll('_', ' '); }
  private paymentStatus(status: PaymentStatus): string { return status === PaymentStatus.SUCCEEDED ? 'SETTLED' : status; }

  private async findDispute(id: string): Promise<DisputeWithDetails> {
    const dispute = await this.prisma.disputeCase.findUnique({ where: { id }, include: this.disputeInclude() });
    if (!dispute) throw new NotFoundException('Dispute not found');
    return dispute;
  }

  private async ensureDispute(id: string): Promise<void> { await this.findDispute(id); }
  private disputeInclude() { return { user: { select: { id: true, firstName: true, lastName: true, email: true } }, order: { select: { id: true, orderNumber: true, status: true, paymentStatus: true, createdAt: true, updatedAt: true, total: true, currency: true, providerOrders: { select: { id: true, status: true, orderNumber: true, createdAt: true, updatedAt: true, timeline: { select: { status: true, title: true, createdAt: true }, orderBy: { createdAt: 'asc' } } } } } }, payment: { select: { id: true, status: true, amount: true, currency: true, providerPaymentIntentId: true, paymentMethod: true, metadataJson: true } } } satisfies Prisma.DisputeCaseInclude; }
  private disputeWhere(query: ListDisputesDto): Prisma.DisputeCaseWhereInput { return { ...this.dateWhere(query), ...(query.status && query.status !== DisputeStatusFilter.ALL ? { status: query.status } : {}), ...(query.priority && query.priority !== DisputePriorityFilter.ALL ? { priority: query.priority } : {}), ...(query.search ? { OR: [{ caseId: { contains: query.search, mode: 'insensitive' } }, { transactionId: { contains: query.search, mode: 'insensitive' } }, { order: { orderNumber: { contains: query.search, mode: 'insensitive' } } }, { user: { email: { contains: query.search, mode: 'insensitive' } } }, { user: { firstName: { contains: query.search, mode: 'insensitive' } } }, { user: { lastName: { contains: query.search, mode: 'insensitive' } } }] } : {}) }; }
  private dateWhere(query: DisputeDateRangeDto): Prisma.DisputeCaseWhereInput { const now = new Date(); const range = query.range ?? DisputeRange.LAST_30_DAYS; const start = range === DisputeRange.TODAY ? new Date(now.toISOString().slice(0, 10)) : range === DisputeRange.LAST_7_DAYS ? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) : range === DisputeRange.LAST_30_DAYS ? new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) : query.fromDate ? new Date(query.fromDate) : undefined; return { createdAt: { ...(start ? { gte: start } : {}), ...(query.toDate ? { lte: new Date(query.toDate) } : {}) } }; }
  private orderBy(query: ListDisputesDto): Prisma.DisputeCaseOrderByWithRelationInput { const order = query.sortOrder === SortOrder.ASC ? 'asc' : 'desc'; if (query.sortBy === DisputeSortBy.AMOUNT) return { amount: order }; if (query.sortBy === DisputeSortBy.PRIORITY) return { priority: order }; if (query.sortBy === DisputeSortBy.DAYS_OPEN) return { createdAt: order === 'asc' ? 'desc' : 'asc' }; return { createdAt: order }; }
  private listItem(item: DisputeWithDetails) { return { id: item.id, caseId: item.caseId, customer: { id: item.user.id, name: this.name(item.user), email: item.user.email }, transactionId: item.transactionId, orderId: item.orderId, orderNumber: item.order.orderNumber, amount: this.money(item.amount), currency: item.currency, priority: item.priority, status: item.status, daysOpen: this.daysOpen(item), reason: item.reason, createdAt: item.createdAt }; }
  private transaction(item: DisputeWithDetails) { const metadata = this.object(item.payment?.metadataJson); return { id: item.payment?.id ?? item.transactionId, transactionId: item.transactionId ?? item.payment?.providerPaymentIntentId ?? item.payment?.id ?? null, paymentStatus: item.payment?.status ?? item.order.paymentStatus, processorAuthCode: this.stringValue(metadata.processorAuthCode) ?? this.stringValue(metadata.authCode) ?? null, amount: this.money(item.payment?.amount ?? item.amount), currency: item.payment?.currency ?? item.currency }; }
  private refund(item: DisputeWithDetails) { const resolvedStatuses: DisputeStatus[] = [DisputeStatus.RESOLVED, DisputeStatus.REJECTED, DisputeStatus.APPROVED]; const resolved = resolvedStatuses.includes(item.status); const paid = item.order.paymentStatus === PaymentStatus.SUCCEEDED; return { eligible: paid && !resolved, eligibleReason: paid && !resolved ? 'Within refund window' : 'Refund is not currently eligible', maxRefundAmount: this.money(item.amount) }; }
  private transactionHistory(item: DisputeWithDetails) { const orderEvents = [{ status: 'ORDER_PLACED', label: 'Order placed', timestamp: item.order.createdAt }, { status: item.order.status, label: this.humanize(item.order.status), timestamp: item.order.updatedAt }]; const providerEvents = item.order.providerOrders.flatMap((order) => order.timeline.map((event) => ({ status: event.status, label: event.title, timestamp: event.createdAt }))); return [...orderEvents, ...providerEvents].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()); }
  private sla(item: DisputeCase) { const ms = item.slaDeadlineAt.getTime() - Date.now(); const hours = Math.floor(Math.max(0, ms) / 3_600_000); const minutes = Math.floor((Math.max(0, ms) % 3_600_000) / 60_000); return { deadlineAt: item.slaDeadlineAt, remainingText: ms > 0 ? `${hours}h ${minutes}m remaining` : 'SLA overdue', isApproachingDeadline: ms > 0 && ms <= 24 * 3_600_000 }; }
  private noteItem(note: { id: string; note: string; visibility: string; createdAt: Date; author: { id: string; firstName: string; lastName: string } }) { return { id: note.id, note: note.note, visibility: note.visibility, author: { id: note.author.id, name: this.name(note.author) }, createdAt: note.createdAt }; }
  private actorName(type: DisputeActorType): string { return type === DisputeActorType.CUSTOMER ? 'Customer' : type === DisputeActorType.ADMIN ? 'Admin' : type === DisputeActorType.PROVIDER ? 'Provider' : 'System'; }
  private object(value?: Prisma.JsonValue): Record<string, unknown> { return value && typeof value === 'object' && !Array.isArray(value) ? value : {}; }
  private stringValue(value: unknown): string | null { return typeof value === 'string' ? value : null; }
  private name(user: { firstName: string; lastName: string }): string { return `${user.firstName} ${user.lastName}`.trim(); }
  private money(value: Prisma.Decimal | number): number { return Number(value); }
  private daysOpen(item: DisputeCase): number { return Math.max(0, Math.ceil(((item.resolvedAt ?? new Date()).getTime() - item.createdAt.getTime()) / 86_400_000)); }
  private humanize(value: string): string { return value.toLowerCase().replaceAll('_', ' ').replace(/^./, (char) => char.toUpperCase()); }
  private deltaPercent(current: number, previous: number): number { return previous ? Math.round(((current - previous) / previous) * 100) : current ? 100 : 0; }
}
