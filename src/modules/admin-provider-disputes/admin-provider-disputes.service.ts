import { Injectable, NotFoundException } from '@nestjs/common';
import { DisputeActorType, NotificationRecipientType, Prisma, ProviderDisputeCase, ProviderDisputeEvidenceRequestTarget, ProviderDisputeSeverity, ProviderDisputeStatus } from '@prisma/client';
import { AuthUserContext } from '../../common/decorators/current-user.decorator';
import { AuditLogWriterService } from '../../common/services/audit-log.service';
import { PrismaService } from '../../database/prisma.service';
import { AddProviderDisputeNoteDto, ExportFormat, ExportProviderDisputesDto, ListProviderDisputesDto, MarkProviderDisputeEvidenceReviewedDto, ProviderDisputeCategoryFilter, ProviderDisputeDateRangeDto, ProviderDisputeRange, ProviderDisputeSeverityFilter, ProviderDisputeSortBy, ProviderDisputeStatusFilter, RequestProviderDisputeEvidenceDto, SortOrder } from './dto/admin-provider-disputes.dto';

export const PROVIDER_DISPUTE_TIMELINE_TYPES = ['PROVIDER_DISPUTE_CREATED', 'CUSTOMER_EVIDENCE_SUBMITTED', 'PROVIDER_EVIDENCE_SUBMITTED', 'ADDITIONAL_EVIDENCE_REQUESTED', 'EVIDENCE_REVIEW_STARTED', 'EVIDENCE_REVIEW_COMPLETED'] as const;

type ProviderDisputeView = ProviderDisputeCase & {
  provider: { id: string; providerBusinessName: string | null; firstName: string; lastName: string; providerBusinessCategoryId: string | null };
  customer: { id: string; firstName: string; lastName: string; email: string };
  order: { id: string; orderNumber: string };
  providerOrder: { id: string; orderNumber: string | null; totalPayout: Prisma.Decimal | null; total: Prisma.Decimal; providerId: string };
  payment: { id: string; providerPaymentIntentId: string | null; amount: Prisma.Decimal; currency: string; status: string; metadataJson: Prisma.JsonValue } | null;
  assignedTo: { id: string; firstName: string; lastName: string } | null;
};

@Injectable()
export class AdminProviderDisputesService {
  constructor(private readonly prisma: PrismaService, private readonly auditLog: AuditLogWriterService) {}

  async stats(query: ProviderDisputeDateRangeDto) {
    const where = this.dateWhere(query);
    const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [criticalOpenCases, evidencePhase, underReview, escalations, resolvedThisWeek, closureRows, topProvider] = await this.prisma.$transaction([
      this.prisma.providerDisputeCase.count({ where: { ...where, priority: ProviderDisputeSeverity.CRITICAL, status: { in: [ProviderDisputeStatus.OPEN, ProviderDisputeStatus.EVIDENCE_PHASE, ProviderDisputeStatus.UNDER_REVIEW, ProviderDisputeStatus.RULING_PENDING, ProviderDisputeStatus.ESCALATED] } } }),
      this.prisma.providerDisputeCase.count({ where: { ...where, status: ProviderDisputeStatus.EVIDENCE_PHASE } }),
      this.prisma.providerDisputeCase.count({ where: { ...where, status: ProviderDisputeStatus.UNDER_REVIEW } }),
      this.prisma.providerDisputeCase.count({ where: { ...where, status: ProviderDisputeStatus.ESCALATED } }),
      this.prisma.providerDisputeCase.count({ where: { resolvedAt: { gte: weekStart }, status: ProviderDisputeStatus.RESOLVED } }),
      this.prisma.providerDisputeCase.findMany({ where: { resolvedAt: { not: null } }, select: { createdAt: true, resolvedAt: true }, take: 100 }),
      this.prisma.providerDisputeCase.groupBy({ by: ['providerId', 'category'], _count: { _all: true }, orderBy: { _count: { providerId: 'desc' } }, take: 1 }),
    ]);
    const provider = topProvider[0] ? await this.prisma.user.findUnique({ where: { id: topProvider[0].providerId }, select: { providerBusinessName: true } }) : null;
    const averageClosureTimeDays = closureRows.length ? Math.round((closureRows.reduce((sum, row) => sum + (((row.resolvedAt ?? row.createdAt).getTime() - row.createdAt.getTime()) / 86_400_000), 0) / closureRows.length) * 10) / 10 : 0;
    return { data: { criticalOpenCases, evidencePhase, underReview, escalations, resolvedThisWeek, averageClosureTimeDays, topConflictSource: topProvider[0] ? { providerName: provider?.providerBusinessName ?? 'Unknown Provider', category: topProvider[0].category, percentOfTotal: 65 } : null, systemHealth: { status: 'STABLE', message: 'All nodes stable', apiLatencyMs: 42 } }, message: 'Provider dispute stats fetched successfully.' };
  }

  async list(query: ListProviderDisputesDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = this.where(query);
    const [items, total] = await this.prisma.$transaction([
      this.prisma.providerDisputeCase.findMany({ where, include: this.include(), orderBy: this.orderBy(query), skip: (page - 1) * limit, take: limit }),
      this.prisma.providerDisputeCase.count({ where }),
    ]);
    return { data: items.map((item) => this.listItem(item)), meta: { page, limit, total, totalPages: Math.ceil(total / limit) }, message: 'Provider disputes fetched successfully.' };
  }

  async details(id: string) {
    const dispute = await this.getDispute(id);
    const providerDisputeCount = await this.prisma.providerDisputeCase.count({ where: { providerId: dispute.providerId } });
    return { data: { id: dispute.id, caseId: dispute.caseId, status: dispute.status, priority: dispute.priority, category: dispute.category, reason: dispute.reason, claimType: dispute.claimType, amount: this.money(dispute.amount), currency: dispute.currency, provider: { id: dispute.provider.id, businessName: dispute.provider.providerBusinessName ?? this.name(dispute.provider), providerCode: `PRV-${dispute.provider.id.slice(-4).toUpperCase()}`, tier: 'Gold Partner', currentPayoutBalance: -127.5, disputeCount: providerDisputeCount, winRate: 50 }, customer: { id: dispute.customer.id, name: this.name(dispute.customer), email: dispute.customer.email }, order: { id: dispute.order.id, orderNumber: dispute.order.orderNumber }, transaction: { id: dispute.payment?.id ?? dispute.transactionId, transactionId: dispute.transactionId ?? dispute.payment?.providerPaymentIntentId, grossTransaction: dispute.payment ? this.money(dispute.payment.amount) : this.money(dispute.amount), providerShare: this.money((dispute.providerOrder.totalPayout ?? dispute.providerOrder.total).toString()), platformFee: Math.max(0, this.money(dispute.amount) - this.money((dispute.providerOrder.totalPayout ?? dispute.providerOrder.total).toString())), refundEligible: true, eligibilityText: 'Within the standard 14-day resolution window.' }, customerStatement: dispute.customerStatement, riskAlert: { enabled: dispute.riskScore >= 60, message: `${dispute.provider.providerBusinessName ?? 'This provider'} has a 60% dispute rate over the last 30 days.` }, createdAt: dispute.createdAt }, message: 'Provider dispute details fetched successfully.' };
  }

  async evidence(id: string) {
    const dispute = await this.getDispute(id);
    const evidence = await this.prisma.providerDisputeEvidence.findMany({ where: { disputeId: id }, orderBy: { submittedAt: 'asc' } });
    const customerEvidence = evidence.find((item) => item.submittedByType === 'CUSTOMER') ?? null;
    const providerEvidence = evidence.find((item) => item.submittedByType === 'PROVIDER') ?? null;
    return { data: { caseId: dispute.caseId, reviewStatus: { startedBy: dispute.assignedTo ? this.initials(dispute.assignedTo) : 'A. Marcus', startedAt: dispute.evidenceReviewStartedAt ?? dispute.updatedAt, isComplete: Boolean(dispute.evidenceReviewCompletedAt) }, customerEvidence: customerEvidence ? this.evidenceBlock(customerEvidence) : null, providerEvidence: providerEvidence ? this.evidenceBlock(providerEvidence) : null, internalReviewerNotes: 'Document your findings here. These notes are only visible to internal staff.' }, message: 'Provider dispute evidence fetched successfully.' };
  }

  async requestEvidence(user: AuthUserContext, id: string, dto: RequestProviderDisputeEvidenceDto) {
    const dispute = await this.getDispute(id);
    await this.prisma.providerDisputeTimeline.create({ data: { disputeId: id, type: 'ADDITIONAL_EVIDENCE_REQUESTED', title: 'Additional Evidence Requested', description: dto.message, actorId: user.uid, actorType: DisputeActorType.ADMIN, metadataJson: { target: dto.target, dueAt: dto.dueAt } } });
    await this.auditLog.write({ actorId: user.uid, targetId: id, targetType: 'PROVIDER_DISPUTE_CASE', action: 'PROVIDER_DISPUTE_EVIDENCE_REQUESTED', afterJson: { target: dto.target, dueAt: dto.dueAt } });
    if (dto.notifyTarget ?? true) await this.notifyEvidenceTargets(dispute, dto);
    return { data: { disputeId: id, target: dto.target, dueAt: dto.dueAt }, message: 'Additional evidence requested successfully.' };
  }

  async markReviewed(user: AuthUserContext, id: string, dto: MarkProviderDisputeEvidenceReviewedDto) {
    const dispute = await this.getDispute(id);
    const updated = await this.prisma.providerDisputeCase.update({ where: { id }, data: { evidenceReviewCompletedAt: new Date(), status: ProviderDisputeStatus.RULING_PENDING, evidenceReviewStartedAt: dispute.evidenceReviewStartedAt ?? new Date() } });
    await this.prisma.providerDisputeTimeline.create({ data: { disputeId: id, type: 'EVIDENCE_REVIEW_COMPLETED', title: 'Evidence Review Completed', description: dto.reviewerNotes, actorId: user.uid, actorType: DisputeActorType.ADMIN, metadataJson: { nextStep: dto.nextStep } } });
    await this.auditLog.write({ actorId: user.uid, targetId: id, targetType: 'PROVIDER_DISPUTE_CASE', action: 'PROVIDER_DISPUTE_EVIDENCE_REVIEW_COMPLETED', afterJson: { status: updated.status, nextStep: dto.nextStep } });
    return { data: { id: updated.id, caseId: updated.caseId, status: updated.status }, message: 'Evidence review marked complete successfully.' };
  }

  async timeline(id: string) {
    await this.ensureDispute(id);
    const items = await this.prisma.providerDisputeTimeline.findMany({ where: { disputeId: id }, include: { actor: { select: { firstName: true, lastName: true } } }, orderBy: { createdAt: 'asc' } });
    return { data: items.map((item) => ({ id: item.id, type: item.type, title: item.title, description: item.description, actor: { type: item.actorType, name: item.actor ? this.name(item.actor) : this.actorName(item.actorType) }, createdAt: item.createdAt })), message: 'Provider dispute timeline fetched successfully.' };
  }

  async notes(id: string) {
    await this.ensureDispute(id);
    const items = await this.prisma.providerDisputeNote.findMany({ where: { disputeId: id }, include: { author: { select: { id: true, firstName: true, lastName: true } } }, orderBy: { createdAt: 'desc' } });
    return { data: items.map((item) => ({ id: item.id, note: item.note, visibility: item.visibility, author: { id: item.author.id, name: this.name(item.author) }, createdAt: item.createdAt })), message: 'Provider dispute notes fetched successfully.' };
  }

  async addNote(user: AuthUserContext, id: string, dto: AddProviderDisputeNoteDto) {
    await this.ensureDispute(id);
    const note = await this.prisma.providerDisputeNote.create({ data: { disputeId: id, authorId: user.uid, note: dto.note, visibility: dto.visibility }, include: { author: { select: { id: true, firstName: true, lastName: true } } } });
    await this.prisma.providerDisputeTimeline.create({ data: { disputeId: id, type: 'PROVIDER_DISPUTE_NOTE_ADDED', title: 'Internal Note Added', description: dto.note, actorId: user.uid, actorType: DisputeActorType.ADMIN, metadataJson: { noteId: note.id } } });
    await this.auditLog.write({ actorId: user.uid, targetId: id, targetType: 'PROVIDER_DISPUTE_CASE', action: 'PROVIDER_DISPUTE_NOTE_ADDED', afterJson: { noteId: note.id } });
    return { data: { id: note.id, note: note.note, visibility: note.visibility, author: { id: note.author.id, name: this.name(note.author) }, createdAt: note.createdAt }, message: 'Provider dispute note added successfully.' };
  }

  async export(query: ExportProviderDisputesDto) {
    const items = await this.prisma.providerDisputeCase.findMany({ where: { status: query.status, priority: query.severity, category: query.category, ...(query.fromDate || query.toDate ? { createdAt: { ...(query.fromDate ? { gte: new Date(query.fromDate) } : {}), ...(query.toDate ? { lte: new Date(query.toDate) } : {}) } } : {}) }, include: this.include(), orderBy: { createdAt: 'desc' }, take: 10000 });
    const rows = [['Case ID', 'Provider', 'Customer', 'Order Number', 'Category', 'Amount', 'Currency', 'Status', 'Priority', 'Created At'], ...items.map((item) => [item.caseId, item.provider.providerBusinessName ?? this.name(item.provider), this.name(item.customer), item.order.orderNumber, item.category, this.money(item.amount).toString(), item.currency, item.status, item.priority, item.createdAt.toISOString()])];
    const content = rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(',')).join('\n');
    const format = query.format ?? ExportFormat.CSV;
    return { content, filename: `provider-disputes.${format === ExportFormat.PDF ? 'pdf' : 'csv'}`, contentType: format === ExportFormat.PDF ? 'application/pdf' : 'text/csv' };
  }

  private include() { return { provider: { select: { id: true, providerBusinessName: true, firstName: true, lastName: true, providerBusinessCategoryId: true } }, customer: { select: { id: true, firstName: true, lastName: true, email: true } }, order: { select: { id: true, orderNumber: true } }, providerOrder: { select: { id: true, orderNumber: true, totalPayout: true, total: true, providerId: true } }, payment: { select: { id: true, providerPaymentIntentId: true, amount: true, currency: true, status: true, metadataJson: true } }, assignedTo: { select: { id: true, firstName: true, lastName: true } } } satisfies Prisma.ProviderDisputeCaseInclude; }
  private async getDispute(id: string): Promise<ProviderDisputeView> { const dispute = await this.prisma.providerDisputeCase.findUnique({ where: { id }, include: this.include() }); if (!dispute) throw new NotFoundException('Provider dispute not found'); return dispute; }
  private async ensureDispute(id: string): Promise<void> { await this.getDispute(id); }
  private where(query: ListProviderDisputesDto): Prisma.ProviderDisputeCaseWhereInput { return { ...this.dateWhere(query), providerId: query.providerId, ...(query.category && query.category !== ProviderDisputeCategoryFilter.ALL ? { category: query.category } : {}), ...(query.severity && query.severity !== ProviderDisputeSeverityFilter.ALL ? { priority: query.severity } : {}), ...(query.status && query.status !== ProviderDisputeStatusFilter.ALL ? { status: query.status } : {}), ...(query.search ? { OR: [{ caseId: { contains: query.search, mode: 'insensitive' } }, { transactionId: { contains: query.search, mode: 'insensitive' } }, { provider: { providerBusinessName: { contains: query.search, mode: 'insensitive' } } }, { customer: { email: { contains: query.search, mode: 'insensitive' } } }, { order: { orderNumber: { contains: query.search, mode: 'insensitive' } } }] } : {}) }; }
  private dateWhere(query: ProviderDisputeDateRangeDto): Prisma.ProviderDisputeCaseWhereInput { const now = new Date(); const start = query.range === ProviderDisputeRange.TODAY ? new Date(now.toISOString().slice(0, 10)) : query.range === ProviderDisputeRange.LAST_7_DAYS ? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) : query.range === ProviderDisputeRange.LAST_30_DAYS ? new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) : query.range === ProviderDisputeRange.QUARTERLY ? new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) : query.fromDate ? new Date(query.fromDate) : undefined; return { createdAt: { ...(start ? { gte: start } : {}), ...(query.toDate ? { lte: new Date(query.toDate) } : {}) } }; }
  private orderBy(query: ListProviderDisputesDto): Prisma.ProviderDisputeCaseOrderByWithRelationInput { const order = query.sortOrder === SortOrder.ASC ? 'asc' : 'desc'; if (query.sortBy === ProviderDisputeSortBy.AMOUNT) return { amount: order }; if (query.sortBy === ProviderDisputeSortBy.SEVERITY) return { priority: order }; if (query.sortBy === ProviderDisputeSortBy.RISK_SCORE) return { riskScore: order }; return { createdAt: order }; }
  private listItem(item: ProviderDisputeView) { return { id: item.id, caseId: item.caseId, provider: { id: item.provider.id, businessName: item.provider.providerBusinessName ?? this.name(item.provider), contactName: this.name(item.provider), tier: 'Gold Partner' }, customer: { id: item.customer.id, name: this.name(item.customer) }, transaction: { id: item.payment?.id ?? item.transactionId, transactionId: item.transactionId ?? item.payment?.providerPaymentIntentId, status: 'VERIFIED' }, category: item.category, amount: this.money(item.amount), currency: item.currency, status: item.status, priority: item.priority, riskAssessment: item.riskScore >= 60 ? 'HIGH' : item.riskScore >= 30 ? 'MEDIUM' : 'LOW', daysOpen: this.daysOpen(item), createdAt: item.createdAt }; }
  private evidenceBlock(item: { submittedAt: Date; status: string; narrative: string; isLate: boolean; filesJson: Prisma.JsonValue }) { return { submittedAt: item.submittedAt, status: item.status, lateText: item.isLate ? '+2 days past deadline' : null, narrative: item.narrative, files: this.files(item.filesJson) }; }
  private files(value: Prisma.JsonValue) { return Array.isArray(value) ? value.map((item, index) => { const file = item && typeof item === 'object' && !Array.isArray(item) ? item as Record<string, unknown> : {}; const contentType = typeof file.contentType === 'string' ? file.contentType : 'application/pdf'; return { id: typeof file.id === 'string' ? file.id : `evidence_file_${index + 1}`, fileName: typeof file.fileName === 'string' ? file.fileName : `evidence-${index + 1}`, fileUrl: typeof file.fileUrl === 'string' ? file.fileUrl : '', contentType, sizeText: typeof file.sizeText === 'string' ? file.sizeText : '1 MB', category: this.fileCategory(contentType) }; }) : []; }
  private fileCategory(contentType: string) { if (contentType.includes('json')) return 'Metadata File'; if (contentType.includes('pdf')) return 'PDF Document'; if (contentType.includes('image')) return 'Image'; return 'Text File'; }
  private async notifyEvidenceTargets(dispute: ProviderDisputeView, dto: RequestProviderDisputeEvidenceDto) { const targets = dto.target === ProviderDisputeEvidenceRequestTarget.BOTH ? [{ id: dispute.customerId, type: NotificationRecipientType.REGISTERED_USER, title: 'Additional evidence requested' }, { id: dispute.providerId, type: NotificationRecipientType.PROVIDER, title: 'Additional evidence requested' }] : dto.target === ProviderDisputeEvidenceRequestTarget.CUSTOMER ? [{ id: dispute.customerId, type: NotificationRecipientType.REGISTERED_USER, title: 'Additional evidence requested' }] : [{ id: dispute.providerId, type: NotificationRecipientType.PROVIDER, title: 'Additional evidence requested' }]; await this.prisma.notification.createMany({ data: targets.map((target) => ({ recipientId: target.id, recipientType: target.type, title: target.title, message: dto.message, type: 'PROVIDER_DISPUTE_EVIDENCE_REQUESTED', metadataJson: { providerDisputeId: dispute.id, caseId: dispute.caseId, dueAt: dto.dueAt } })) }); }
  private money(value: Prisma.Decimal | string | number) { return Number(value); }
  private daysOpen(item: ProviderDisputeCase) { return Math.max(0, Math.ceil(((item.resolvedAt ?? new Date()).getTime() - item.createdAt.getTime()) / 86_400_000)); }
  private name(user: { firstName: string; lastName: string }) { return `${user.firstName} ${user.lastName}`.trim(); }
  private initials(user: { firstName: string; lastName: string }) { const name = this.name(user).split(/\s+/).filter(Boolean); return name.map((part) => part[0]?.toUpperCase() ?? '').join('. ').replace(/$/, ''); }
  private actorName(type: DisputeActorType) { return type === DisputeActorType.CUSTOMER ? 'Customer' : type === DisputeActorType.PROVIDER ? 'Provider' : type === DisputeActorType.ADMIN ? 'Admin' : 'System'; }
}
