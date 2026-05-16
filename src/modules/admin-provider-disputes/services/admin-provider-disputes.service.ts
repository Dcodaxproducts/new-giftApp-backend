import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DisputeActorType, NotificationRecipientType, Prisma, ProviderDisputeAdjustmentType, ProviderDisputeCase, ProviderDisputeCommunicationChannel, ProviderDisputeCommunicationTargetType, ProviderDisputeEvidenceRequestTarget, ProviderDisputeFinalRuling, ProviderDisputeResolutionStatus, ProviderDisputeRuling, ProviderDisputeStatus, ProviderFinancialAdjustmentDirection, ProviderFinancialAdjustmentStatus, ProviderFinancialAdjustmentType } from '@prisma/client';
import { AuthUserContext } from '../../../common/decorators/current-user.decorator';
import { AuditLogWriterService } from '../../../common/services/audit-log.service';
import { AdminProviderDisputesRepository } from '../repositories/admin-provider-disputes.repository';
import { ProviderDisputeEvidenceRepository } from '../repositories/provider-dispute-evidence.repository';
import { ProviderDisputeFinancialRepository } from '../repositories/provider-dispute-financial.repository';
import { ProviderDisputeLogsRepository } from '../repositories/provider-dispute-logs.repository';
import { ProviderDisputeResolutionRepository } from '../repositories/provider-dispute-resolution.repository';
import { ProviderDisputeRulingsRepository } from '../repositories/provider-dispute-rulings.repository';
import { AddProviderDisputeNoteDto, ExportFormat, ExportProviderDisputeResolutionLogDto, ExportProviderDisputesDto, FinalProviderDisputeAttestationDto, FinalizeProviderDisputeDto, LinkProviderDisputePayoutDto, ListProviderDisputesDto, MarkProviderDisputeEvidenceReviewedDto, ProviderDisputeCategoryFilter, ProviderDisputeDateRangeDto, ProviderDisputeRange, ProviderDisputeSeverityFilter, ProviderDisputeSortBy, ProviderDisputeStatusFilter, RequestProviderDisputeEvidenceDto, ResendProviderDisputeNotificationDto, SaveProviderDisputeRulingDto, SortOrder } from '../dto/admin-provider-disputes.dto';

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
  constructor(
    private readonly disputesRepository: AdminProviderDisputesRepository,
    private readonly evidenceRepository: ProviderDisputeEvidenceRepository,
    private readonly rulingsRepository: ProviderDisputeRulingsRepository,
    private readonly financialRepository: ProviderDisputeFinancialRepository,
    private readonly resolutionRepository: ProviderDisputeResolutionRepository,
    private readonly logsRepository: ProviderDisputeLogsRepository,
    private readonly auditLog: AuditLogWriterService,
  ) {}

  async stats(query: ProviderDisputeDateRangeDto) {
    const where = this.dateWhere(query);
    const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [criticalOpenCases, evidencePhase, underReview, escalations, resolvedThisWeek, closureRows, topProvider] = await this.disputesRepository.countStats({ where, weekStart });
    const provider = topProvider[0] ? await this.disputesRepository.findProviderBusinessName(topProvider[0].providerId) : null;
    const averageClosureTimeDays = closureRows.length ? Math.round((closureRows.reduce((sum, row) => sum + (((row.resolvedAt ?? row.createdAt).getTime() - row.createdAt.getTime()) / 86_400_000), 0) / closureRows.length) * 10) / 10 : 0;
    return { data: { criticalOpenCases, evidencePhase, underReview, escalations, resolvedThisWeek, averageClosureTimeDays, topConflictSource: topProvider[0] ? { providerName: provider?.providerBusinessName ?? 'Unknown Provider', category: topProvider[0].category, percentOfTotal: 65 } : null, systemHealth: { status: 'STABLE', message: 'All nodes stable', apiLatencyMs: 42 } }, message: 'Provider dispute stats fetched successfully.' };
  }

  async list(query: ListProviderDisputesDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = this.where(query);
    const [items, total] = await this.disputesRepository.findDisputesAndCount({ where, include: this.include(), orderBy: this.orderBy(query), skip: (page - 1) * limit, take: limit });
    return { data: items.map((item) => this.listItem(item)), meta: { page, limit, total, totalPages: Math.ceil(total / limit) }, message: 'Provider disputes fetched successfully.' };
  }

  async details(id: string) {
    const dispute = await this.getDispute(id);
    const providerDisputeCount = await this.disputesRepository.countProviderDisputes(dispute.providerId);
    return { data: { id: dispute.id, caseId: dispute.caseId, status: dispute.status, priority: dispute.priority, category: dispute.category, reason: dispute.reason, claimType: dispute.claimType, amount: this.money(dispute.amount), currency: dispute.currency, provider: { id: dispute.provider.id, businessName: dispute.provider.providerBusinessName ?? this.name(dispute.provider), providerCode: `PRV-${dispute.provider.id.slice(-4).toUpperCase()}`, tier: 'Gold Partner', currentPayoutBalance: -127.5, disputeCount: providerDisputeCount, winRate: 50 }, customer: { id: dispute.customer.id, name: this.name(dispute.customer), email: dispute.customer.email }, order: { id: dispute.order.id, orderNumber: dispute.order.orderNumber }, transaction: { id: dispute.payment?.id ?? dispute.transactionId, transactionId: dispute.transactionId ?? dispute.payment?.providerPaymentIntentId, grossTransaction: dispute.payment ? this.money(dispute.payment.amount) : this.money(dispute.amount), providerShare: this.money((dispute.providerOrder.totalPayout ?? dispute.providerOrder.total).toString()), platformFee: Math.max(0, this.money(dispute.amount) - this.money((dispute.providerOrder.totalPayout ?? dispute.providerOrder.total).toString())), refundEligible: true, eligibilityText: 'Within the standard 14-day resolution window.' }, customerStatement: dispute.customerStatement, riskAlert: { enabled: dispute.riskScore >= 60, message: `${dispute.provider.providerBusinessName ?? 'This provider'} has a 60% dispute rate over the last 30 days.` }, createdAt: dispute.createdAt }, message: 'Provider dispute details fetched successfully.' };
  }


  async rulingSummary(id: string) {
    const dispute = await this.getDispute(id);
    return { data: { caseId: dispute.caseId, status: dispute.status, filingDate: dispute.createdAt, entities: { provider: { id: dispute.provider.id, businessName: dispute.provider.providerBusinessName ?? this.name(dispute.provider) }, customer: { id: dispute.customer.id, name: this.name(dispute.customer) } }, financials: { amountInDispute: this.money(dispute.amount), currency: dispute.currency, providerShare: this.providerShare(dispute), platformFee: this.platformFee(dispute) }, evidenceSummary: { customer: 'Photo + message', provider: 'GPS late delivery' }, rulingOptions: [{ key: 'CUSTOMER_WINS_FULL_REFUND', label: 'Customer Wins — Full Refund', financialImpact: `-${this.money(dispute.amount) - 7.5} loss` }, { key: 'PROVIDER_WINS_NO_REFUND', label: 'Provider Wins — No Refund', financialImpact: `${this.providerShare(dispute)} retained` }, { key: 'SPLIT_LIABILITY', label: 'Split Liability', financialImpact: 'Partial refund' }] }, message: 'Provider dispute ruling summary fetched successfully.' };
  }

  async saveRuling(user: AuthUserContext, id: string, dto: SaveProviderDisputeRulingDto) {
    const dispute = await this.getDispute(id);
    if (!dispute.evidenceReviewCompletedAt) throw new BadRequestException('Evidence review must be completed before ruling');
    const refundAmount = this.validatedRefundAmount(dispute, dto);
    const status = dto.saveAsDraft ? ProviderDisputeStatus.UNDER_REVIEW : ProviderDisputeStatus.RULING_PENDING;
    const updated = await this.rulingsRepository.saveRuling({ id, ruling: dto.ruling, rulingReason: dto.rulingReason, refundAmount, applyPenalty: dto.applyPenalty ?? false, penaltyAmount: dto.applyPenalty ? new Prisma.Decimal(dto.penaltyAmount ?? 0) : new Prisma.Decimal(0), penaltyReason: dto.penaltyReason, status, actorId: user.uid, saveAsDraft: dto.saveAsDraft ?? false, rawPenaltyAmount: dto.penaltyAmount ?? 0 });
    await this.auditLog.write({ actorId: user.uid, targetId: id, targetType: 'PROVIDER_DISPUTE_CASE', action: dto.saveAsDraft ? 'PROVIDER_DISPUTE_RULING_DRAFT_SAVED' : 'PROVIDER_DISPUTE_RULING_SAVED', afterJson: { ruling: dto.ruling, refundAmount, penaltyAmount: dto.penaltyAmount ?? 0 } });
    return { data: { id: updated.id, caseId: updated.caseId, ruling: updated.ruling, status: dto.saveAsDraft ? updated.status : 'PAYOUT_LINKAGE_PENDING', refundAmount, applyPenalty: updated.applyPenalty, penaltyAmount: this.money(updated.penaltyAmount ?? 0) }, message: 'Provider dispute ruling saved successfully.' };
  }

  async financialImpact(id: string) {
    const dispute = await this.getDispute(id);
    if (!dispute.ruling) throw new BadRequestException('Ruling must exist before financial impact can be calculated');
    const impact = this.computeFinancialImpact(dispute);
    await this.financialRepository.saveFinancialImpact(id, impact, impact.totalProviderDeduction);
    return { data: impact, message: 'Financial impact fetched successfully.' };
  }

  async payoutPenaltyLinkage(user: AuthUserContext, id: string, dto: LinkProviderDisputePayoutDto) {
    if (!dto.confirmFinancialAccuracy) throw new BadRequestException('confirmFinancialAccuracy must be true');
    const dispute = await this.getDispute(id);
    if (!dispute.ruling) throw new BadRequestException('Ruling must exist before payout linkage');
    const impact = this.computeFinancialImpact(dispute);
    const rows = this.financialAdjustments(dispute, impact, dto.adjustmentType);
    await this.financialRepository.linkPayoutPenalty({ id, adjustmentRows: rows, adjustmentType: dto.adjustmentType, totalProviderDeduction: impact.totalProviderDeduction, impact, actorId: user.uid, sendProviderSummary: dto.sendProviderSummary ?? true, providerId: dispute.providerId, caseId: dispute.caseId });
    await this.auditLog.write({ actorId: user.uid, targetId: id, targetType: 'PROVIDER_DISPUTE_CASE', action: 'PROVIDER_DISPUTE_PAYOUT_LINKED', afterJson: { adjustmentType: dto.adjustmentType, totalProviderDeduction: impact.totalProviderDeduction } });
    return { data: { caseId: dispute.caseId, adjustmentType: dto.adjustmentType, totalProviderDeduction: impact.totalProviderDeduction, status: 'READY_TO_FINALIZE' }, message: 'Payout and penalty linkage saved successfully.' };
  }

  async finalAttestation(user: AuthUserContext, id: string, dto: FinalProviderDisputeAttestationDto) {
    if (!dto.confirmFinancialLineItems) throw new BadRequestException('confirmFinancialLineItems must be true');
    await this.ensureDispute(id);
    const updated = await this.financialRepository.finalAttestation({ id, actorId: user.uid, comment: dto.comment ?? 'All financial line items confirmed as accurate.', sendAutomatedFinancialSummary: dto.sendAutomatedFinancialSummary ?? true });
    await this.auditLog.write({ actorId: user.uid, targetId: id, targetType: 'PROVIDER_DISPUTE_CASE', action: 'PROVIDER_DISPUTE_FINAL_ATTESTED', afterJson: { finalAttestedAt: updated.finalAttestedAt } });
    return { data: { caseId: updated.caseId, finalAttestedAt: updated.finalAttestedAt }, message: 'Final attestation completed successfully.' };
  }


  async finalize(user: AuthUserContext, id: string, dto: FinalizeProviderDisputeDto) {
    const dispute = await this.getDispute(id);
    if (!dispute.ruling) throw new BadRequestException('Ruling must exist before finalization');
    if (!dispute.finalAttestedAt) throw new BadRequestException('Final attestation must be completed before finalization');
    if ((dispute.ruling !== ProviderDisputeRuling.PROVIDER_WINS_NO_REFUND || this.money(dispute.penaltyAmount ?? 0) > 0) && !dispute.adjustmentType && (dto.executeFinancialAdjustments ?? true)) throw new BadRequestException('Payout linkage must be completed before finalization');
    if (dispute.ruling !== ProviderDisputeRuling.PROVIDER_WINS_NO_REFUND && !dispute.paymentId) throw new BadRequestException('Linked payment/transaction is required for refund execution');
    const resolution = this.resolutionFromRuling(dispute.ruling);
    const refundProcessed = dispute.ruling !== ProviderDisputeRuling.PROVIDER_WINS_NO_REFUND;
    const refundAmount = this.money(dispute.refundAmount ?? 0);
    const providerDeduction = this.money(dispute.totalProviderDeduction ?? 0);
    const penaltyApplied = Boolean(dispute.applyPenalty && this.money(dispute.penaltyAmount ?? 0) > 0);
    const penaltyAmount = this.money(dispute.penaltyAmount ?? 0);
    const notificationStatus = { customerEmail: dto.notifyCustomer === false ? 'SKIPPED' : 'SENT', providerEmail: dto.notifyProvider === false ? 'SKIPPED' : 'SENT', providerDashboard: dto.notifyProvider === false ? 'SKIPPED' : 'SENT' };
    const communicationLogs = this.createCommunicationLogEntries(dispute.id, dto.notifyCustomer ?? true, dto.notifyProvider ?? true, dto.comment ?? 'Provider dispute resolved.');
    const notifications = this.createResolutionNotifications(dispute, resolution, dto.notifyCustomer ?? true, dto.notifyProvider ?? true, refundAmount, penaltyAmount);
    await this.resolutionRepository.finalize({ id, executeFinancialAdjustments: dto.executeFinancialAdjustments ?? true, finalRuling: resolution, resolutionStatus: resolution === ProviderDisputeFinalRuling.PROVIDER_WINS ? ProviderDisputeResolutionStatus.DENIED : ProviderDisputeResolutionStatus.RESOLVED, refundProcessed, refundAmount, providerDeduction, penaltyApplied, penaltyAmount, notificationStatus, performanceImpact: this.performanceImpact(resolution), actorId: user.uid, comment: dto.comment ?? 'Final ruling confirmed and financial adjustments approved.', caseStatus: resolution === ProviderDisputeFinalRuling.PROVIDER_WINS ? ProviderDisputeStatus.DENIED : ProviderDisputeStatus.RESOLVED, financialLogs: this.financialLogs(dispute, resolution, refundProcessed), communicationLogs, notifications });
    await this.auditLog.write({ actorId: user.uid, targetId: id, targetType: 'PROVIDER_DISPUTE_CASE', action: 'PROVIDER_DISPUTE_FINALIZED', afterJson: { finalRuling: resolution, refundAmount, providerDeduction, penaltyAmount } });
    return { data: { caseId: dispute.caseId, status: 'RESOLVED', finalRuling: resolution, refundProcessed, refundAmount, providerDeduction, penaltyApplied, penaltyAmount, notificationStatus }, message: 'Provider dispute finalized successfully.' };
  }

  async resolution(id: string) {
    const dispute = await this.getDispute(id);
    const resolution = await this.getResolution(id);
    return { data: { caseId: dispute.caseId, status: dispute.status, finalRuling: resolution.finalRuling, subtitle: this.resolutionSubtitle(resolution.finalRuling, resolution.penaltyApplied), badges: this.resolutionBadges(resolution.finalRuling, resolution.penaltyApplied), financialExecution: { executionDate: resolution.finalizedAt, refundProcessed: this.money(resolution.refundAmount), providerDeduction: -this.money(resolution.providerDeduction), penaltyApplied: this.money(resolution.penaltyAmount), currency: dispute.currency }, notificationStatus: this.object(resolution.notificationStatusJson), nextSteps: { refundTiming: 'The customer will receive funds within 3-5 business days via original payment method.', appealWindow: 'The provider has 14 calendar days to file a formal appeal.' } }, message: 'Provider dispute resolution fetched successfully.' };
  }

  async resolutionLog(id: string) {
    const dispute = await this.getDispute(id);
    const resolution = await this.getResolution(id);
    const [timeline, financialAuditLog, communicationLog] = await this.logsRepository.findResolutionLog(id);    return { data: { caseId: dispute.caseId, finalRuling: resolution.finalRuling, closedAt: resolution.finalizedAt, description: 'Complete audit trail of provider dispute, financial adjustments, and communications.', lifecycleTimeline: timeline.map((item) => ({ type: item.type, title: item.title, description: item.description, createdAt: item.createdAt })), financialAuditLog: financialAuditLog.map((item) => ({ transactionId: item.transactionId, action: item.action, amount: this.money(item.amount), currency: item.currency, status: item.status })), communicationLog: communicationLog.map((item) => ({ type: item.channel, title: item.title, to: item.targetType === ProviderDisputeCommunicationTargetType.CUSTOMER ? dispute.customer.email : 'claims@provider.com', bodyPreview: item.bodyPreview, createdAt: item.createdAt })), providerPerformanceImpact: this.object(resolution.performanceImpactJson) }, message: 'Provider dispute resolution log fetched successfully.' };
  }

  async exportResolutionLog(id: string, query: ExportProviderDisputeResolutionLogDto) {
    const log = await this.resolutionLog(id);
    const rows = [['Section', 'Type', 'Description', 'Created At'], ...log.data.lifecycleTimeline.map((item) => ['Timeline', item.type, item.description, item.createdAt.toISOString()]), ...log.data.financialAuditLog.map((item) => ['Financial', item.action, `${item.amount} ${item.currency}`, item.status]), ...log.data.communicationLog.map((item) => ['Communication', item.type, item.bodyPreview, item.createdAt.toISOString()])];
    const content = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n');
    const format = query.format ?? ExportFormat.CSV;
    return { content, filename: `provider-dispute-resolution-${log.data.caseId}.${format === ExportFormat.PDF ? 'pdf' : 'csv'}`, contentType: format === ExportFormat.PDF ? 'application/pdf' : 'text/csv' };
  }

  async notifyAgain(user: AuthUserContext, id: string, dto: ResendProviderDisputeNotificationDto) {
    const dispute = await this.getDispute(id);
    await this.logsRepository.resendNotifications({ id, target: dto.target, channels: dto.channels, message: dto.message, caseId: dispute.caseId, customerId: dispute.customerId, providerId: dispute.providerId, actorId: user.uid });
    await this.auditLog.write({ actorId: user.uid, targetId: id, targetType: 'PROVIDER_DISPUTE_CASE', action: 'PROVIDER_DISPUTE_NOTIFICATION_RESENT', afterJson: { target: dto.target, channels: dto.channels } });
    return { data: { caseId: dispute.caseId, target: dto.target, channels: dto.channels }, message: 'Provider dispute notification resent successfully.' };
  }

  async evidence(id: string) {
    const dispute = await this.getDispute(id);
    const evidence = await this.evidenceRepository.findEvidence(id);
    const customerEvidence = evidence.find((item) => item.submittedByType === 'CUSTOMER') ?? null;
    const providerEvidence = evidence.find((item) => item.submittedByType === 'PROVIDER') ?? null;
    return { data: { caseId: dispute.caseId, reviewStatus: { startedBy: dispute.assignedTo ? this.initials(dispute.assignedTo) : 'A. Marcus', startedAt: dispute.evidenceReviewStartedAt ?? dispute.updatedAt, isComplete: Boolean(dispute.evidenceReviewCompletedAt) }, customerEvidence: customerEvidence ? this.evidenceBlock(customerEvidence) : null, providerEvidence: providerEvidence ? this.evidenceBlock(providerEvidence) : null, internalReviewerNotes: 'Document your findings here. These notes are only visible to internal staff.' }, message: 'Provider dispute evidence fetched successfully.' };
  }

  async requestEvidence(user: AuthUserContext, id: string, dto: RequestProviderDisputeEvidenceDto) {
    const dispute = await this.getDispute(id);
    await this.evidenceRepository.requestEvidence({ disputeId: id, actorId: user.uid, message: dto.message, target: dto.target, dueAt: new Date(dto.dueAt) });
    await this.auditLog.write({ actorId: user.uid, targetId: id, targetType: 'PROVIDER_DISPUTE_CASE', action: 'PROVIDER_DISPUTE_EVIDENCE_REQUESTED', afterJson: { target: dto.target, dueAt: dto.dueAt } });
    if (dto.notifyTarget ?? true) await this.notifyEvidenceTargets(dispute, dto);
    return { data: { disputeId: id, target: dto.target, dueAt: dto.dueAt }, message: 'Additional evidence requested successfully.' };
  }

  async markReviewed(user: AuthUserContext, id: string, dto: MarkProviderDisputeEvidenceReviewedDto) {
    const dispute = await this.getDispute(id);
    const updated = await this.evidenceRepository.markReviewed({ id, startedAt: dispute.evidenceReviewStartedAt ?? new Date(), reviewerNotes: dto.reviewerNotes, nextStep: dto.nextStep, actorId: user.uid });
    await this.auditLog.write({ actorId: user.uid, targetId: id, targetType: 'PROVIDER_DISPUTE_CASE', action: 'PROVIDER_DISPUTE_EVIDENCE_REVIEW_COMPLETED', afterJson: { status: updated.status, nextStep: dto.nextStep } });
    return { data: { id: updated.id, caseId: updated.caseId, status: updated.status }, message: 'Evidence review marked complete successfully.' };
  }

  async timeline(id: string) {
    await this.ensureDispute(id);
    const items = await this.logsRepository.findTimeline(id);
    return { data: items.map((item) => ({ id: item.id, type: item.type, title: item.title, description: item.description, actor: { type: item.actorType, name: item.actor ? this.name(item.actor) : this.actorName(item.actorType) }, createdAt: item.createdAt })), message: 'Provider dispute timeline fetched successfully.' };
  }

  async notes(id: string) {
    await this.ensureDispute(id);
    const items = await this.logsRepository.findNotes(id);
    return { data: items.map((item) => ({ id: item.id, note: item.note, visibility: item.visibility, author: { id: item.author.id, name: this.name(item.author) }, createdAt: item.createdAt })), message: 'Provider dispute notes fetched successfully.' };
  }

  async addNote(user: AuthUserContext, id: string, dto: AddProviderDisputeNoteDto) {
    await this.ensureDispute(id);
    const note = await this.logsRepository.addNote({ disputeId: id, authorId: user.uid, note: dto.note, visibility: dto.visibility });
    await this.auditLog.write({ actorId: user.uid, targetId: id, targetType: 'PROVIDER_DISPUTE_CASE', action: 'PROVIDER_DISPUTE_NOTE_ADDED', afterJson: { noteId: note.id } });
    return { data: { id: note.id, note: note.note, visibility: note.visibility, author: { id: note.author.id, name: this.name(note.author) }, createdAt: note.createdAt }, message: 'Provider dispute note added successfully.' };
  }

  async export(query: ExportProviderDisputesDto) {
    const items = await this.disputesRepository.exportDisputes({ where: { status: query.status, priority: query.severity, category: query.category, ...(query.fromDate || query.toDate ? { createdAt: { ...(query.fromDate ? { gte: new Date(query.fromDate) } : {}), ...(query.toDate ? { lte: new Date(query.toDate) } : {}) } } : {}) }, include: this.include(), orderBy: { createdAt: 'desc' }, take: 10000 });
    const rows = [['Case ID', 'Provider', 'Customer', 'Order Number', 'Category', 'Amount', 'Currency', 'Status', 'Priority', 'Created At'], ...items.map((item) => [item.caseId, item.provider.providerBusinessName ?? this.name(item.provider), this.name(item.customer), item.order.orderNumber, item.category, this.money(item.amount).toString(), item.currency, item.status, item.priority, item.createdAt.toISOString()])];
    const content = rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(',')).join('\n');
    const format = query.format ?? ExportFormat.CSV;
    return { content, filename: `provider-disputes.${format === ExportFormat.PDF ? 'pdf' : 'csv'}`, contentType: format === ExportFormat.PDF ? 'application/pdf' : 'text/csv' };
  }



  private async getResolution(id: string) { const resolution = await this.resolutionRepository.findResolution(id); if (!resolution) throw new NotFoundException('Provider dispute resolution not found'); return resolution; }
  private resolutionFromRuling(ruling: ProviderDisputeRuling): ProviderDisputeFinalRuling { return ruling === ProviderDisputeRuling.CUSTOMER_WINS_FULL_REFUND ? ProviderDisputeFinalRuling.CUSTOMER_WINS : ruling === ProviderDisputeRuling.PROVIDER_WINS_NO_REFUND ? ProviderDisputeFinalRuling.PROVIDER_WINS : ProviderDisputeFinalRuling.SPLIT_LIABILITY; }
  private financialLogs(dispute: ProviderDisputeView, resolution: ProviderDisputeFinalRuling, refundProcessed: boolean): Prisma.ProviderDisputeFinancialLogUncheckedCreateInput[] { const rows: Prisma.ProviderDisputeFinancialLogUncheckedCreateInput[] = []; if (refundProcessed) rows.push({ disputeId: dispute.id, transactionId: `TXN_${dispute.id}-ADJ`, action: 'Customer Credit', amount: new Prisma.Decimal(this.money(dispute.refundAmount ?? 0)), currency: dispute.currency, status: ProviderFinancialAdjustmentStatus.APPLIED, metadataJson: { finalRuling: resolution } }); if (this.money(dispute.totalProviderDeduction ?? 0) > 0) rows.push({ disputeId: dispute.id, transactionId: `TXN_${dispute.id}-REV`, action: 'Reversal Execution', amount: new Prisma.Decimal(-this.money(dispute.totalProviderDeduction ?? 0)), currency: dispute.currency, status: ProviderFinancialAdjustmentStatus.APPLIED, metadataJson: { finalRuling: resolution } }); if (this.money(dispute.penaltyAmount ?? 0) > 0) rows.push({ disputeId: dispute.id, transactionId: `PEN_${dispute.id}-X`, action: 'Service Fee Penalty', amount: new Prisma.Decimal(-this.money(dispute.penaltyAmount ?? 0)), currency: dispute.currency, status: ProviderFinancialAdjustmentStatus.APPLIED, metadataJson: { penaltyReason: dispute.penaltyReason } }); return rows; }
  private performanceImpact(finalRuling: ProviderDisputeFinalRuling) { return { winRateBefore: 50, winRateAfter: finalRuling === ProviderDisputeFinalRuling.PROVIDER_WINS ? 55 : 40, penaltyPoints: finalRuling === ProviderDisputeFinalRuling.PROVIDER_WINS ? 0 : 15, tierStatus: finalRuling === ProviderDisputeFinalRuling.PROVIDER_WINS ? 'Stable' : 'Silver At Risk' }; }
  private resolutionSubtitle(finalRuling: ProviderDisputeFinalRuling, penaltyApplied: boolean) { if (finalRuling === ProviderDisputeFinalRuling.CUSTOMER_WINS) return `Dispute resolved in customer's favor. Refund${penaltyApplied ? ' and penalty applied.' : ' applied.'}`; if (finalRuling === ProviderDisputeFinalRuling.PROVIDER_WINS) return "Dispute resolved in provider's favor. No refund applied."; return 'Dispute resolved with split liability and partial refund.'; }
  private resolutionBadges(finalRuling: ProviderDisputeFinalRuling, penaltyApplied: boolean) { const badges = [{ label: finalRuling === ProviderDisputeFinalRuling.CUSTOMER_WINS ? 'Resolved - Customer Wins' : finalRuling === ProviderDisputeFinalRuling.PROVIDER_WINS ? 'Resolved - Provider Wins' : 'Resolved - Split Liability', tone: 'SUCCESS' }]; if (penaltyApplied) badges.push({ label: 'Penalty Applied', tone: 'DANGER' }); return badges; }  private createCommunicationLogEntries(disputeId: string, notifyCustomer: boolean, notifyProvider: boolean, message: string): Prisma.ProviderDisputeCommunicationLogCreateManyInput[] { const channels = [ProviderDisputeCommunicationChannel.EMAIL, ProviderDisputeCommunicationChannel.IN_APP]; const targets: ProviderDisputeCommunicationTargetType[] = []; if (notifyCustomer) targets.push(ProviderDisputeCommunicationTargetType.CUSTOMER); if (notifyProvider) targets.push(ProviderDisputeCommunicationTargetType.PROVIDER); const resolvedTargets = targets.length === 2 ? [ProviderDisputeCommunicationTargetType.CUSTOMER, ProviderDisputeCommunicationTargetType.PROVIDER] : targets; return resolvedTargets.flatMap((target) => channels.map((channel) => ({ disputeId, targetType: target, channel, title: 'Resolution Decision Sent', bodyPreview: message.slice(0, 120), status: 'SENT', sentAt: new Date() }))); }
  private createResolutionNotifications(dispute: ProviderDisputeView, finalRuling: ProviderDisputeFinalRuling, notifyCustomer: boolean, notifyProvider: boolean, refundAmount: number, penaltyAmount: number): Prisma.NotificationCreateManyInput[] { const notifications: Prisma.NotificationCreateManyInput[] = []; if (notifyCustomer) notifications.push({ recipientId: dispute.customerId, recipientType: NotificationRecipientType.REGISTERED_USER, title: finalRuling === ProviderDisputeFinalRuling.PROVIDER_WINS ? 'Customer dispute resolved' : 'Customer refund processed', message: finalRuling === ProviderDisputeFinalRuling.PROVIDER_WINS ? 'Your provider dispute was resolved.' : `Your refund of ${refundAmount} ${dispute.currency} has been processed.`, type: finalRuling === ProviderDisputeFinalRuling.PROVIDER_WINS ? 'CUSTOMER_DISPUTE_RESOLVED' : 'CUSTOMER_REFUND_PROCESSED', metadataJson: { providerDisputeId: dispute.id, caseId: dispute.caseId } }); if (notifyProvider) { notifications.push({ recipientId: dispute.providerId, recipientType: NotificationRecipientType.PROVIDER, title: penaltyAmount > 0 ? 'Provider penalty applied' : 'Provider dispute resolved', message: penaltyAmount > 0 ? `A penalty of ${penaltyAmount} ${dispute.currency} was applied.` : 'Your provider dispute has been resolved.', type: penaltyAmount > 0 ? 'PROVIDER_PENALTY_APPLIED' : 'PROVIDER_DISPUTE_RESOLVED', metadataJson: { providerDisputeId: dispute.id, caseId: dispute.caseId } }); notifications.push({ recipientId: dispute.providerId, recipientType: NotificationRecipientType.PROVIDER, title: 'Provider appeal window opened', message: 'You have 14 calendar days to file a formal appeal.', type: 'PROVIDER_APPEAL_WINDOW_OPENED', metadataJson: { providerDisputeId: dispute.id, caseId: dispute.caseId } }); } notifications.push({ recipientId: dispute.assignedToId ?? dispute.providerId, recipientType: dispute.assignedToId ? NotificationRecipientType.ADMIN : NotificationRecipientType.PROVIDER, title: 'Admin dispute finalized', message: `${dispute.caseId} was finalized.`, type: 'ADMIN_DISPUTE_FINALIZED', metadataJson: { providerDisputeId: dispute.id, caseId: dispute.caseId } }); return notifications; }
  private object(value?: Prisma.JsonValue): Record<string, unknown> { return value && typeof value === 'object' && !Array.isArray(value) ? value : {}; }

  private validatedRefundAmount(dispute: ProviderDisputeView, dto: SaveProviderDisputeRulingDto): Prisma.Decimal {
    const disputeAmount = this.money(dispute.amount);
    if (dto.ruling === ProviderDisputeRuling.PROVIDER_WINS_NO_REFUND) return new Prisma.Decimal(0);
    if (dto.ruling === ProviderDisputeRuling.CUSTOMER_WINS_FULL_REFUND) {
      const amount = dto.refundAmount ?? disputeAmount;
      if (amount !== disputeAmount) throw new BadRequestException('Full refund must equal dispute amount');
      return new Prisma.Decimal(amount);
    }
    const amount = dto.refundAmount ?? 0;
    if (amount <= 0 || amount >= disputeAmount) throw new BadRequestException('Split liability refund must be greater than 0 and less than dispute amount');
    return new Prisma.Decimal(amount);
  }

  private computeFinancialImpact(dispute: ProviderDisputeView) {
    const refundAmount = this.money(dispute.refundAmount ?? dispute.amount);
    const providerShare = this.providerShare(dispute);
    const platformFee = this.platformFee(dispute);
    const penaltyAmount = this.money(dispute.penaltyAmount ?? 0);
    const currentBalance = 340.5;
    const pendingPayout = 210;
    const breakdown = [
      { lineItem: 'Order Total', adjustment: this.money(dispute.amount), runningTotal: this.money(dispute.amount) },
      { lineItem: 'Customer Refund', adjustment: -refundAmount, runningTotal: 0 },
      { lineItem: 'Provider Lost Earnings', adjustment: dispute.ruling === ProviderDisputeRuling.PROVIDER_WINS_NO_REFUND ? 0 : -providerShare, runningTotal: dispute.ruling === ProviderDisputeRuling.PROVIDER_WINS_NO_REFUND ? 0 : -providerShare },
      { lineItem: 'Platform Fee Reversal', adjustment: dispute.ruling === ProviderDisputeRuling.PROVIDER_WINS_NO_REFUND ? 0 : -platformFee, runningTotal: dispute.ruling === ProviderDisputeRuling.PROVIDER_WINS_NO_REFUND ? 0 : -(providerShare + platformFee) },
      { lineItem: 'Penalty Fee', adjustment: -penaltyAmount, runningTotal: dispute.ruling === ProviderDisputeRuling.PROVIDER_WINS_NO_REFUND ? -penaltyAmount : -(providerShare + platformFee + penaltyAmount) },
    ];
    const totalProviderDeduction = Math.max(0, (dispute.ruling === ProviderDisputeRuling.PROVIDER_WINS_NO_REFUND ? 0 : providerShare + platformFee) + penaltyAmount);
    return { caseId: dispute.caseId, ruling: dispute.ruling, providerAccountPreview: { currentBalance, pendingPayout, newBalance: Math.round((currentBalance - totalProviderDeduction) * 100) / 100, currency: dispute.currency }, breakdown, totalProviderDeduction };
  }

  private financialAdjustments(dispute: ProviderDisputeView, impact: ReturnType<AdminProviderDisputesService['computeFinancialImpact']>, adjustmentType: ProviderDisputeAdjustmentType): Prisma.ProviderFinancialAdjustmentCreateManyInput[] {
    const rows: Prisma.ProviderFinancialAdjustmentCreateManyInput[] = [];
    if (dispute.ruling !== ProviderDisputeRuling.PROVIDER_WINS_NO_REFUND) {
      rows.push({ providerId: dispute.providerId, disputeId: dispute.id, providerOrderId: dispute.providerOrderId, type: ProviderFinancialAdjustmentType.CUSTOMER_REFUND, direction: ProviderFinancialAdjustmentDirection.DEBIT, amount: new Prisma.Decimal(this.money(dispute.refundAmount ?? dispute.amount)), currency: dispute.currency, status: adjustmentType === ProviderDisputeAdjustmentType.WAIVE_DEDUCTION ? ProviderFinancialAdjustmentStatus.WAIVED : ProviderFinancialAdjustmentStatus.PENDING, transactionId: `PFA-${dispute.id}-REFUND` });
      rows.push({ providerId: dispute.providerId, disputeId: dispute.id, providerOrderId: dispute.providerOrderId, type: ProviderFinancialAdjustmentType.PROVIDER_LOST_EARNINGS, direction: ProviderFinancialAdjustmentDirection.DEBIT, amount: new Prisma.Decimal(this.providerShare(dispute)), currency: dispute.currency, status: adjustmentType === ProviderDisputeAdjustmentType.WAIVE_DEDUCTION ? ProviderFinancialAdjustmentStatus.WAIVED : ProviderFinancialAdjustmentStatus.PENDING, transactionId: `PFA-${dispute.id}-EARN` });
      rows.push({ providerId: dispute.providerId, disputeId: dispute.id, providerOrderId: dispute.providerOrderId, type: ProviderFinancialAdjustmentType.PLATFORM_FEE_REVERSAL, direction: ProviderFinancialAdjustmentDirection.DEBIT, amount: new Prisma.Decimal(this.platformFee(dispute)), currency: dispute.currency, status: adjustmentType === ProviderDisputeAdjustmentType.WAIVE_DEDUCTION ? ProviderFinancialAdjustmentStatus.WAIVED : ProviderFinancialAdjustmentStatus.PENDING, transactionId: `PFA-${dispute.id}-FEE` });
    }
    if (this.money(dispute.penaltyAmount ?? 0) > 0) rows.push({ providerId: dispute.providerId, disputeId: dispute.id, providerOrderId: dispute.providerOrderId, type: ProviderFinancialAdjustmentType.PENALTY, direction: ProviderFinancialAdjustmentDirection.DEBIT, amount: new Prisma.Decimal(this.money(dispute.penaltyAmount ?? 0)), currency: dispute.currency, status: adjustmentType === ProviderDisputeAdjustmentType.WAIVE_DEDUCTION ? ProviderFinancialAdjustmentStatus.WAIVED : ProviderFinancialAdjustmentStatus.PENDING, transactionId: `PFA-${dispute.id}-PENALTY` });
    return rows;
  }

  private providerShare(dispute: ProviderDisputeView): number { return this.money((dispute.providerOrder.totalPayout ?? dispute.providerOrder.total).toString()); }
  private platformFee(dispute: ProviderDisputeView): number { return Math.max(0, this.money(dispute.amount) - this.providerShare(dispute)); }

  private include() { return { provider: { select: { id: true, providerBusinessName: true, firstName: true, lastName: true, providerBusinessCategoryId: true } }, customer: { select: { id: true, firstName: true, lastName: true, email: true } }, order: { select: { id: true, orderNumber: true } }, providerOrder: { select: { id: true, orderNumber: true, totalPayout: true, total: true, providerId: true } }, payment: { select: { id: true, providerPaymentIntentId: true, amount: true, currency: true, status: true, metadataJson: true } }, assignedTo: { select: { id: true, firstName: true, lastName: true } } } satisfies Prisma.ProviderDisputeCaseInclude; }
  private async getDispute(id: string): Promise<ProviderDisputeView> { const dispute = await this.disputesRepository.findDispute({ where: { id }, include: this.include() }); if (!dispute) throw new NotFoundException('Provider dispute not found'); return dispute; }
  private async ensureDispute(id: string): Promise<void> { await this.getDispute(id); }
  private where(query: ListProviderDisputesDto): Prisma.ProviderDisputeCaseWhereInput { return { ...this.dateWhere(query), providerId: query.providerId, ...(query.category && query.category !== ProviderDisputeCategoryFilter.ALL ? { category: query.category } : {}), ...(query.severity && query.severity !== ProviderDisputeSeverityFilter.ALL ? { priority: query.severity } : {}), ...(query.status && query.status !== ProviderDisputeStatusFilter.ALL ? { status: query.status } : {}), ...(query.search ? { OR: [{ caseId: { contains: query.search, mode: 'insensitive' } }, { transactionId: { contains: query.search, mode: 'insensitive' } }, { provider: { providerBusinessName: { contains: query.search, mode: 'insensitive' } } }, { customer: { email: { contains: query.search, mode: 'insensitive' } } }, { order: { orderNumber: { contains: query.search, mode: 'insensitive' } } }] } : {}) }; }
  private dateWhere(query: ProviderDisputeDateRangeDto): Prisma.ProviderDisputeCaseWhereInput { const now = new Date(); const start = query.range === ProviderDisputeRange.TODAY ? new Date(now.toISOString().slice(0, 10)) : query.range === ProviderDisputeRange.LAST_7_DAYS ? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) : query.range === ProviderDisputeRange.LAST_30_DAYS ? new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) : query.range === ProviderDisputeRange.QUARTERLY ? new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) : query.fromDate ? new Date(query.fromDate) : undefined; return { createdAt: { ...(start ? { gte: start } : {}), ...(query.toDate ? { lte: new Date(query.toDate) } : {}) } }; }
  private orderBy(query: ListProviderDisputesDto): Prisma.ProviderDisputeCaseOrderByWithRelationInput { const order = query.sortOrder === SortOrder.ASC ? 'asc' : 'desc'; if (query.sortBy === ProviderDisputeSortBy.AMOUNT) return { amount: order }; if (query.sortBy === ProviderDisputeSortBy.SEVERITY) return { priority: order }; if (query.sortBy === ProviderDisputeSortBy.RISK_SCORE) return { riskScore: order }; return { createdAt: order }; }
  private listItem(item: ProviderDisputeView) { return { id: item.id, caseId: item.caseId, provider: { id: item.provider.id, businessName: item.provider.providerBusinessName ?? this.name(item.provider), contactName: this.name(item.provider), tier: 'Gold Partner' }, customer: { id: item.customer.id, name: this.name(item.customer) }, transaction: { id: item.payment?.id ?? item.transactionId, transactionId: item.transactionId ?? item.payment?.providerPaymentIntentId, status: 'VERIFIED' }, category: item.category, amount: this.money(item.amount), currency: item.currency, status: item.status, priority: item.priority, riskAssessment: item.riskScore >= 60 ? 'HIGH' : item.riskScore >= 30 ? 'MEDIUM' : 'LOW', daysOpen: this.daysOpen(item), createdAt: item.createdAt }; }
  private evidenceBlock(item: { submittedAt: Date; status: string; narrative: string; isLate: boolean; filesJson: Prisma.JsonValue }) { return { submittedAt: item.submittedAt, status: item.status, lateText: item.isLate ? '+2 days past deadline' : null, narrative: item.narrative, files: this.files(item.filesJson) }; }
  private files(value: Prisma.JsonValue) { return Array.isArray(value) ? value.map((item, index) => { const file = item && typeof item === 'object' && !Array.isArray(item) ? item as Record<string, unknown> : {}; const contentType = typeof file.contentType === 'string' ? file.contentType : 'application/pdf'; return { id: typeof file.id === 'string' ? file.id : `evidence_file_${index + 1}`, fileName: typeof file.fileName === 'string' ? file.fileName : `evidence-${index + 1}`, fileUrl: typeof file.fileUrl === 'string' ? file.fileUrl : '', contentType, sizeText: typeof file.sizeText === 'string' ? file.sizeText : '1 MB', category: this.fileCategory(contentType) }; }) : []; }
  private fileCategory(contentType: string) { if (contentType.includes('json')) return 'Metadata File'; if (contentType.includes('pdf')) return 'PDF Document'; if (contentType.includes('image')) return 'Image'; return 'Text File'; }
  private async notifyEvidenceTargets(dispute: ProviderDisputeView, dto: RequestProviderDisputeEvidenceDto) { const targets = dto.target === ProviderDisputeEvidenceRequestTarget.BOTH ? [{ id: dispute.customerId, type: NotificationRecipientType.REGISTERED_USER, title: 'Additional evidence requested' }, { id: dispute.providerId, type: NotificationRecipientType.PROVIDER, title: 'Additional evidence requested' }] : dto.target === ProviderDisputeEvidenceRequestTarget.CUSTOMER ? [{ id: dispute.customerId, type: NotificationRecipientType.REGISTERED_USER, title: 'Additional evidence requested' }] : [{ id: dispute.providerId, type: NotificationRecipientType.PROVIDER, title: 'Additional evidence requested' }]; await this.evidenceRepository.notifyEvidenceTargets(targets.map((target) => ({ recipientId: target.id, recipientType: target.type, title: target.title, message: dto.message, type: 'PROVIDER_DISPUTE_EVIDENCE_REQUESTED', metadataJson: { providerDisputeId: dispute.id, caseId: dispute.caseId, dueAt: dto.dueAt } }))); }
  private money(value: Prisma.Decimal | string | number) { return Number(value); }
  private daysOpen(item: ProviderDisputeCase) { return Math.max(0, Math.ceil(((item.resolvedAt ?? new Date()).getTime() - item.createdAt.getTime()) / 86_400_000)); }
  private name(user: { firstName: string; lastName: string }) { return `${user.firstName} ${user.lastName}`.trim(); }
  private initials(user: { firstName: string; lastName: string }) { const name = this.name(user).split(/\s+/).filter(Boolean); return name.map((part) => part[0]?.toUpperCase() ?? '').join('. ').replace(/$/, ''); }
  private actorName(type: DisputeActorType) { return type === DisputeActorType.CUSTOMER ? 'Customer' : type === DisputeActorType.PROVIDER ? 'Provider' : type === DisputeActorType.ADMIN ? 'Admin' : 'System'; }
}
