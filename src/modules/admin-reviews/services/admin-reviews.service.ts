import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { NotificationRecipientType, Prisma, Review, ReviewFlagReason, ReviewModerationAction, ReviewModerationActorType, ReviewPolicy, ReviewSeverity, ReviewSource, ReviewStatus, UserRole } from '@prisma/client';
import { AuthUserContext } from '../../../common/decorators/current-user.decorator';
import { AuditLogWriterService } from '../../../common/services/audit-log.service';
import { AdminReviewPoliciesRepository } from '../repositories/admin-review-policies.repository';
import { ADMIN_REVIEW_INCLUDE, AdminReviewsRepository } from '../repositories/admin-reviews.repository';
import { AllReviewSeverity, AllReviewSource, AllReviewStatus, ExportReviewsDto, FlaggedSummaryDto, FlaggedWindow, ListReviewsDto, ModerateReviewDto, ModerationLogsDto, ModerationQueueDto, ReviewExportFormat, ReviewSortBy, ReviewStatsDto, ReviewStatsRange, SortOrder, TestReviewPolicyDto, UpdateReviewPoliciesDto } from '../dto/admin-reviews.dto';

type ReviewWithRelations = Review & {
  customer: { id: string; firstName: string; lastName: string; email: string; avatarUrl: string | null };
  provider: { id: string; providerBusinessName: string | null; firstName: string; lastName: string };
  order: { id: string; orderNumber: string; createdAt: Date; payment: { id: string; providerPaymentIntentId: string | null; createdAt: Date } | null };
  response: { id: string; body: string; createdAt: Date } | null;
};

type ReviewPolicyView = {
  autoApprovalRules: { enabled: boolean; minRating: number; minConfidence: number };
  spamDetection: { enabled: boolean; autoHideConfidenceThreshold: number };
  abuseThresholds: { enabled: boolean; warningThreshold: number; autoRemoveThreshold: number; status: 'ACTIVE' | 'WARNING' };
  visibilityRules: { enabled: boolean; hideUntilModerated: boolean };
  autoModeration: { enabled: boolean; confidenceWarningThreshold: number; currentConfidence: number };
};

@Injectable()
export class AdminReviewsService {
  constructor(private readonly reviewsRepository: AdminReviewsRepository, private readonly policiesRepository: AdminReviewPoliciesRepository, private readonly auditLog: AuditLogWriterService) {}

  async dashboard() {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const policy = await this.getOrCreatePolicy();
    const [agg, totalReviews, newReviewsThisWeek, flaggedQueueCount, criticalFlaggedCount, autoModeratedCount, recentLogs, flaggedBySeverity] = await this.reviewsRepository.getDashboardRows({ weekAgo, dayAgo });
    const policyView = this.policyView(policy);
    const currentConfidence = policyView.autoModeration.currentConfidence;
    return { data: { health: { averageRating: this.round(agg._avg.rating ?? 0), averageRatingDelta: 0, totalReviews, newReviewsThisWeek, flaggedQueueCount, criticalFlaggedCount, autoModeratedCount, autoModerationAccuracy: currentConfidence }, systemWarning: { enabled: currentConfidence < policyView.autoModeration.confidenceWarningThreshold, title: 'System Warning', message: currentConfidence < policyView.autoModeration.confidenceWarningThreshold ? `Auto-moderation confidence dropped to ${currentConfidence}%. Review recommended.` : 'Auto-moderation is operating within configured thresholds.', severity: currentConfidence < policyView.autoModeration.confidenceWarningThreshold ? 'WARNING' : 'INFO' }, sla: { overallResponseTimeHours: await this.averageResponseHours(), slaTargetHours: 4, addressedWithinSlaPercent: await this.slaPercent(4) }, recentModerationActivity: recentLogs.map((log) => ({ id: log.id, action: log.action, reviewId: log.review.reviewCode, timestamp: log.createdAt, outcome: log.outcome, reason: log.comment ?? log.reason ?? null })), activePolicies: this.activePolicies(policyView), flaggedSummary: { critical: this.countSeverity(flaggedBySeverity, ReviewSeverity.CRITICAL), high: this.countSeverity(flaggedBySeverity, ReviewSeverity.HIGH), medium: this.countSeverity(flaggedBySeverity, ReviewSeverity.MEDIUM), low: this.countSeverity(flaggedBySeverity, ReviewSeverity.LOW), window: FlaggedWindow.LAST_24H } }, message: 'Review dashboard fetched successfully.' };
  }

  async stats(query: ReviewStatsDto) {
    const where = this.dateWhere(query);
    const [agg, totalReviews, flaggedReviews, removedReviews, hiddenReviews, publishedReviews, autoModeratedCount, manualModeratedCount, ratingRows] = await this.reviewsRepository.getReviewStatsRows({ where, logWhere: this.logDateWhere(query) });
    return { data: { averageRating: this.round(agg._avg.rating ?? 0), totalReviews, flaggedReviews, removedReviews, hiddenReviews, publishedReviews, autoModeratedCount, manualModeratedCount, ratingDistribution: this.ratingDistribution(ratingRows, totalReviews) }, message: 'Review stats fetched successfully.' };
  }

  async list(query: ListReviewsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = this.reviewWhere(query);
    const [items, total] = await this.reviewsRepository.findReviewsAndCount({ where, orderBy: this.reviewOrder(query.sortBy, query.sortOrder), skip: (page - 1) * limit, take: limit });
    return { data: items.map((item) => this.reviewListItem(item)), meta: { page, limit, total, totalPages: Math.ceil(total / limit) }, message: 'Reviews fetched successfully.' };
  }

  async details(id: string) {
    const review = await this.reviewsRepository.findReviewById(id);
    if (!review) throw new NotFoundException('Review not found');
    const logs = await this.reviewsRepository.findReviewDetailsLogs(id);
    return { data: { id: review.id, reviewCode: review.reviewCode, reviewer: { id: review.customer.id, name: this.name(review.customer), avatarUrl: review.customer.avatarUrl }, source: review.source, externalProfileUrl: review.externalProfileUrl, rating: review.rating, fullReviewText: review.comment, transactionId: this.transactionId(review), reviewDate: review.createdAt, status: this.displayStatus(review.status), flags: { reportCount: review.reportCount, reasons: this.flagReasons(review) }, moderationHistory: logs.map((log) => ({ action: this.displayStatus(log.outcome), actorType: log.actorType, actorName: log.actor ? this.name(log.actor) : this.actorName(log.actorType), createdAt: log.createdAt })) }, message: 'Review details fetched successfully.' };
  }

  async flaggedSummary(query: FlaggedSummaryDto) {
    const window = query.window ?? FlaggedWindow.LAST_24H;
    const rows = await this.reviewsRepository.findFlaggedSummaryRows(this.windowStart(window));
    const critical = this.countSeverity(rows, ReviewSeverity.CRITICAL);
    return { data: { window, critical: { count: critical, status: critical > 0 ? 'OVERDUE' : 'CLEAR' }, high: { count: this.countSeverity(rows, ReviewSeverity.HIGH), status: 'DUE_IN_2H' }, medium: { count: this.countSeverity(rows, ReviewSeverity.MEDIUM), status: 'DUE_IN_6H' }, low: { count: this.countSeverity(rows, ReviewSeverity.LOW), status: 'DUE_IN_18H' }, recommendation: { enabled: critical >= 10, message: critical >= 10 ? 'System detected an anomaly in Critical queue influx.' : 'Flagged review volume is within normal range.' } }, message: 'Flagged review summary fetched successfully.' };
  }

  async moderationQueue(query: ModerationQueueDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.ReviewWhereInput = { deletedAt: null, status: query.status ?? { in: [ReviewStatus.FLAGGED, ReviewStatus.PENDING] }, ...(query.severity && query.severity !== AllReviewSeverity.ALL ? { severity: query.severity } : {}), ...(query.reason ? { flagReason: query.reason } : {}) };
    const [items, total] = await this.reviewsRepository.findReviewsAndCount({ where, orderBy: this.reviewOrder(query.sortBy, query.sortOrder), skip: (page - 1) * limit, take: limit });
    return { data: items.map((item) => ({ id: item.id, reviewCode: item.reviewCode, rating: item.rating, comment: item.comment, severity: item.severity, flagReason: item.flagReason, status: item.status, createdAt: item.createdAt, slaDueAt: this.slaDueAt(item), customer: { name: this.name(item.customer) }, provider: { businessName: this.providerName(item.provider) } })), meta: { page, limit, total, totalPages: Math.ceil(total / limit) }, message: 'Review moderation queue fetched successfully.' };
  }

  async moderate(user: AuthUserContext, id: string, dto: ModerateReviewDto) {
    this.assertActionPermission(user, dto.action);
    const review = await this.reviewsRepository.findReviewRawById(id);
    if (!review) throw new NotFoundException('Review not found');
    const data = this.actionUpdate(dto);
    const updated = await this.reviewsRepository.updateReview(id, data);
    await this.reviewsRepository.createReviewModerationLog({ reviewId: id, actorId: user.uid, actorType: user.role === UserRole.SUPER_ADMIN ? ReviewModerationActorType.SUPER_ADMIN : ReviewModerationActorType.ADMIN, action: dto.action, outcome: updated.status, reason: this.actionReason(dto), comment: dto.comment, autoModerated: false, beforeJson: this.reviewSnapshot(review), afterJson: this.reviewSnapshot(updated) });
    await this.auditLog.write({ actorId: user.uid, targetId: id, targetType: 'REVIEW', action: `REVIEW_${dto.action}`, beforeJson: this.reviewSnapshot(review), afterJson: this.reviewSnapshot(updated) });
    await this.createModerationNotifications(updated, dto);
    return { data: { id, status: updated.status, lastModerationAction: dto.action }, message: 'Review moderated successfully.' };
  }

  async moderationLogs(query: ModerationLogsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.ReviewModerationLogWhereInput = { reviewId: query.reviewId, action: query.action, actorId: query.actorId, ...(query.fromDate || query.toDate ? { createdAt: { ...(query.fromDate ? { gte: new Date(query.fromDate) } : {}), ...(query.toDate ? { lte: new Date(query.toDate) } : {}) } } : {}) };
    const [items, total] = await this.reviewsRepository.findModerationLogsAndCount({ where, skip: (page - 1) * limit, take: limit });
    return { data: items.map((item) => ({ id: item.id, reviewId: item.reviewId, reviewCode: item.review.reviewCode, action: item.action, outcome: item.outcome, reason: item.reason, actor: item.actor ? { id: item.actor.id, name: this.name(item.actor) } : { id: 'system', name: 'System Auto Moderator' }, autoModerated: item.autoModerated, confidence: item.confidence, createdAt: item.createdAt })), meta: { page, limit, total, totalPages: Math.ceil(total / limit) }, message: 'Review moderation logs fetched successfully.' };
  }

  async policies() { return { data: this.policyView(await this.getOrCreatePolicy()), message: 'Review policies fetched successfully.' }; }

  async updatePolicies(user: AuthUserContext, dto: UpdateReviewPoliciesDto) {
    const current = await this.getOrCreatePolicy();
    const before = this.policyView(current);
    const updated = await this.policiesRepository.updatePolicy(current.id, { autoApprovalRulesJson: { enabled: dto.autoApprovalRules.enabled, minRating: dto.autoApprovalRules.minRating, minConfidence: dto.autoApprovalRules.minConfidence }, spamDetectionJson: { enabled: dto.spamDetection.enabled, autoHideConfidenceThreshold: dto.spamDetection.autoHideConfidenceThreshold }, abuseThresholdsJson: { enabled: dto.abuseThresholds.enabled, warningThreshold: dto.abuseThresholds.warningThreshold, autoRemoveThreshold: dto.abuseThresholds.autoRemoveThreshold }, visibilityRulesJson: { enabled: dto.visibilityRules.enabled, hideUntilModerated: dto.visibilityRules.hideUntilModerated }, autoModerationJson: { enabled: dto.autoModeration.enabled, confidenceWarningThreshold: dto.autoModeration.confidenceWarningThreshold, currentConfidence: before.autoModeration.currentConfidence }, updatedById: user.uid });
    const after = this.policyView(updated);
    await this.auditLog.write({ actorId: user.uid, targetId: updated.id, targetType: 'REVIEW_POLICY', action: 'REVIEW_POLICY_UPDATED', beforeJson: before, afterJson: after });
    return { data: after, message: 'Review policies updated successfully.' };
  }

  testPolicy(dto: TestReviewPolicyDto) {
    const text = dto.sampleReviewText.toLowerCase();
    const isSpam = /spam|scam|fake|bot|click|promo/.test(text);
    const isAbuse = /abuse|hate|violent|threat|offensive/.test(text);
    const detectedCategories = [isSpam ? 'SPAM' : null, isAbuse ? 'ABUSE' : null, text.includes('fake') ? 'FAKE_REVIEW' : null].filter((value): value is string => Boolean(value));
    const confidence = Math.min(95, 50 + detectedCategories.length * 22 + (dto.rating <= 2 ? 10 : 0));
    const recommendedAction = detectedCategories.includes('FAKE_REVIEW') ? 'REMOVE' : detectedCategories.length ? 'HIDE' : 'APPROVE';
    return { data: { detectedCategories, confidence, recommendedAction, policyMatched: detectedCategories.includes('SPAM') ? 'spamDetection' : detectedCategories.includes('ABUSE') ? 'abuseThresholds' : 'autoApprovalRules' }, message: 'Review policy test completed successfully.' };
  }

  async export(query: ExportReviewsDto) {
    const where = this.reviewWhere(query);
    const items = await this.reviewsRepository.findReviewsForExport({ where, orderBy: this.reviewOrder(query.sortBy, query.sortOrder) });
    const rows = [['Review Code', 'Reviewer', 'Rating', 'Source', 'Status', 'Report Count', 'Flag Reasons', 'Provider', 'Order Number', 'Transaction ID', 'Has Provider Response', 'Created At'], ...items.map((item) => [item.reviewCode, this.name(item.customer), String(item.rating), item.source, this.displayStatus(item.status), String(item.reportCount), this.flagReasons(item).join('|'), this.providerName(item.provider), item.order.orderNumber, this.transactionId(item), item.response ? 'YES' : 'NO', item.createdAt.toISOString()])];
    const csv = rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(',')).join('\n');
    const format = query.format ?? ReviewExportFormat.CSV;
    return { content: csv, filename: `review-analytics.${format === ReviewExportFormat.PDF ? 'pdf' : 'csv'}`, contentType: format === ReviewExportFormat.PDF ? 'application/pdf' : 'text/csv' };
  }

  private assertActionPermission(user: AuthUserContext, action: ReviewModerationAction): void {
    if (user.role === UserRole.SUPER_ADMIN) return;
    const required = action === ReviewModerationAction.APPROVE || action === ReviewModerationAction.RESTORE ? 'reviews.approve' : action === ReviewModerationAction.REMOVE || action === ReviewModerationAction.MARK_FAKE ? 'reviews.remove' : action === ReviewModerationAction.HIDE || action === ReviewModerationAction.MARK_SPAM ? 'reviews.hide' : action === ReviewModerationAction.PENALIZE ? 'reviews.penalize' : 'reviews.moderate';
    if (this.grantedPermissions(user).has(required)) return;
    throw new ForbiddenException(`Missing permission ${required} for ${action}`);
  }
  private grantedPermissions(user: AuthUserContext): Set<string> {
    const granted = new Set<string>();
    const permissions = user.permissions;
    if (!permissions || typeof permissions !== 'object' || Array.isArray(permissions)) return granted;
    for (const [module, values] of Object.entries(permissions)) if (Array.isArray(values)) for (const value of values) if (typeof value === 'string') granted.add(`${module}.${value}`);
    return granted;
  }

  private reviewWhere(query: Partial<ListReviewsDto & ExportReviewsDto>): Prisma.ReviewWhereInput {
    const rating = this.ratingFilter(query.rating);
    const status = this.statusFilter(query.status);
    const source = query.source && query.source !== AllReviewSource.ALL ? query.source as ReviewSource : undefined;
    return { deletedAt: null, rating, source, providerId: query.providerId, userId: query.userId, orderId: query.orderId, ...(status ? { status } : {}), ...(query.severity && query.severity !== AllReviewSeverity.ALL ? { severity: query.severity } : {}), ...(query.reportedOnly ? { reportCount: { gt: 0 } } : {}), ...(query.hasProviderResponse !== undefined ? { response: query.hasProviderResponse ? { isNot: null } : { is: null } } : {}), ...(query.fromDate || query.toDate ? { createdAt: { ...(query.fromDate ? { gte: new Date(query.fromDate) } : {}), ...(query.toDate ? { lte: new Date(query.toDate) } : {}) } } : {}), ...(query.search ? { OR: [{ reviewCode: { contains: query.search, mode: 'insensitive' } }, { comment: { contains: query.search, mode: 'insensitive' } }, { customer: { firstName: { contains: query.search, mode: 'insensitive' } } }, { customer: { lastName: { contains: query.search, mode: 'insensitive' } } }, { provider: { providerBusinessName: { contains: query.search, mode: 'insensitive' } } }, { order: { orderNumber: { contains: query.search, mode: 'insensitive' } } }, { order: { payment: { providerPaymentIntentId: { contains: query.search, mode: 'insensitive' } } } }] } : {}) };
  }

  private dateWhere(query: ReviewStatsDto): Prisma.ReviewWhereInput {
    const now = new Date();
    const range = query.range ?? ReviewStatsRange.LAST_30_DAYS;
    const start = range === ReviewStatsRange.TODAY ? new Date(now.toISOString().slice(0, 10)) : range === ReviewStatsRange.LAST_7_DAYS ? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) : range === ReviewStatsRange.LAST_30_DAYS ? new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) : query.fromDate ? new Date(query.fromDate) : undefined;
    return { deletedAt: null, createdAt: { ...(start ? { gte: start } : {}), ...(query.toDate ? { lte: new Date(query.toDate) } : {}) } };
  }
  private logDateWhere(query: ReviewStatsDto): Prisma.ReviewModerationLogWhereInput { const createdAt = this.dateWhere(query).createdAt as Prisma.DateTimeFilter | undefined; return createdAt ? { createdAt } : {}; }
  private reviewInclude() { return ADMIN_REVIEW_INCLUDE; }
  private reviewOrder(sortBy?: ReviewSortBy, sortOrder?: SortOrder): Prisma.ReviewOrderByWithRelationInput { const order = sortOrder === SortOrder.ASC ? 'asc' : 'desc'; if (sortBy === ReviewSortBy.RATING) return { rating: order }; if (sortBy === ReviewSortBy.REPORT_COUNT) return { reportCount: order }; if (sortBy === ReviewSortBy.SEVERITY) return { severity: order }; return { createdAt: order }; }
  private reviewListItem(review: ReviewWithRelations) { return { id: review.id, reviewCode: review.reviewCode, reviewer: { id: review.customer.id, name: this.name(review.customer), avatarInitials: this.initials(review.customer) }, source: review.source, rating: review.rating, contentPreview: this.preview(review.comment), fullContent: review.comment, flags: { reportCount: review.reportCount, label: `${review.reportCount} reports` }, status: this.displayStatus(review.status), transactionId: this.transactionId(review), reviewDate: review.createdAt, severity: review.severity, flagReason: review.flagReason, customer: { id: review.customer.id, name: this.name(review.customer), avatarUrl: review.customer.avatarUrl }, provider: { id: review.provider.id, businessName: this.providerName(review.provider) }, order: { id: review.order.id, orderNumber: review.order.orderNumber }, providerResponse: review.response ? { id: review.response.id, body: review.response.body, createdAt: review.response.createdAt } : null, createdAt: review.createdAt }; }
  private actionUpdate(dto: ModerateReviewDto): Prisma.ReviewUpdateInput { const map: Record<ReviewModerationAction, ReviewStatus> = { APPROVE: ReviewStatus.PUBLISHED, HIDE: ReviewStatus.HIDDEN, REMOVE: ReviewStatus.REMOVED, PENALIZE: ReviewStatus.PENALIZED, RESTORE: ReviewStatus.PUBLISHED, MARK_SPAM: ReviewStatus.HIDDEN, MARK_FAKE: ReviewStatus.REMOVED, AUTO_HIDDEN: ReviewStatus.HIDDEN, AUTO_APPROVED: ReviewStatus.PUBLISHED, AUTO_FLAGGED: ReviewStatus.FLAGGED }; if (!this.manualActions().has(dto.action)) throw new BadRequestException('Unsupported manual moderation action'); const reason = this.actionReason(dto); return { status: map[dto.action], flagReason: reason, flagReasonsJson: reason ? [reason] : [] }; }
  private actionReason(dto: ModerateReviewDto): ReviewFlagReason { if (dto.action === ReviewModerationAction.MARK_SPAM) return ReviewFlagReason.SPAM; if (dto.action === ReviewModerationAction.MARK_FAKE) return ReviewFlagReason.FAKE_REVIEW; return dto.reason; }
  private manualActions(): Set<ReviewModerationAction> { return new Set([ReviewModerationAction.APPROVE, ReviewModerationAction.HIDE, ReviewModerationAction.REMOVE, ReviewModerationAction.PENALIZE, ReviewModerationAction.RESTORE, ReviewModerationAction.MARK_SPAM, ReviewModerationAction.MARK_FAKE]); }
  private async getOrCreatePolicy(): Promise<ReviewPolicy> { const existing = await this.policiesRepository.findFirstPolicy(); return existing ?? this.policiesRepository.createDefaultPolicy(); }
  private policyView(policy: ReviewPolicy): ReviewPolicyView { const autoApprovalRules = this.object(policy.autoApprovalRulesJson); const spamDetection = this.object(policy.spamDetectionJson); const abuseThresholds = this.object(policy.abuseThresholdsJson); const visibilityRules = this.object(policy.visibilityRulesJson); const autoModeration = this.object(policy.autoModerationJson); return { autoApprovalRules: { enabled: this.bool(autoApprovalRules.enabled, true), minRating: this.num(autoApprovalRules.minRating, 4), minConfidence: this.num(autoApprovalRules.minConfidence, 90) }, spamDetection: { enabled: this.bool(spamDetection.enabled, true), autoHideConfidenceThreshold: this.num(spamDetection.autoHideConfidenceThreshold, 85) }, abuseThresholds: { enabled: this.bool(abuseThresholds.enabled, true), warningThreshold: this.num(abuseThresholds.warningThreshold, 3), autoRemoveThreshold: this.num(abuseThresholds.autoRemoveThreshold, 5), status: abuseThresholds.status === 'ACTIVE' ? 'ACTIVE' : 'WARNING' }, visibilityRules: { enabled: this.bool(visibilityRules.enabled, true), hideUntilModerated: this.bool(visibilityRules.hideUntilModerated, true) }, autoModeration: { enabled: this.bool(autoModeration.enabled, true), confidenceWarningThreshold: this.num(autoModeration.confidenceWarningThreshold, 85), currentConfidence: this.num(autoModeration.currentConfidence, 82) } }; }
  private activePolicies(policy: ReviewPolicyView) { return [{ key: 'autoApprovalRules', label: 'Auto-approval rules', status: policy.autoApprovalRules.enabled ? 'ACTIVE' : 'INACTIVE' }, { key: 'spamDetection', label: 'Spam detection', status: policy.spamDetection.enabled ? 'ACTIVE' : 'INACTIVE' }, { key: 'abuseThresholds', label: 'Abuse thresholds', status: policy.abuseThresholds.status }, { key: 'visibilityRules', label: 'Visibility rules', status: policy.visibilityRules.enabled ? 'ACTIVE' : 'INACTIVE' }]; }
  private async averageResponseHours(): Promise<number> { const logs = await this.reviewsRepository.findResponseTimingLogs(); if (!logs.length) return 0; return this.round(logs.reduce((sum, log) => sum + Math.max(0, log.createdAt.getTime() - log.review.createdAt.getTime()) / 3_600_000, 0) / logs.length); }
  private async slaPercent(hours: number): Promise<number> { const logs = await this.reviewsRepository.findResponseTimingLogs(); if (!logs.length) return 100; return Math.round((logs.filter((log) => log.createdAt.getTime() - log.review.createdAt.getTime() <= hours * 3_600_000).length / logs.length) * 100); }
  private async createModerationNotifications(review: Review, dto: ModerateReviewDto): Promise<void> { const notifications: Prisma.NotificationCreateManyInput[] = []; if (dto.notifyProvider) notifications.push({ recipientId: review.providerId, recipientType: NotificationRecipientType.PROVIDER, title: 'Review moderation update', message: `A review was ${review.status.toLowerCase()} by admin moderation.`, type: 'REVIEW_MODERATION', metadataJson: { reviewId: review.id, action: dto.action } }); if (dto.notifyUser ?? dto.notifyCustomer) notifications.push({ recipientId: review.userId, recipientType: NotificationRecipientType.REGISTERED_USER, title: 'Review moderation update', message: `Your review was ${review.status.toLowerCase()} by platform moderation.`, type: 'REVIEW_MODERATION', metadataJson: { reviewId: review.id, action: dto.action } }); if (notifications.length) await this.reviewsRepository.createModerationNotifications(notifications); }
  private ratingDistribution(rows: { rating: number; _count?: true | { _all?: number } }[], total: number) { const distribution = { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 }; for (const row of rows) distribution[String(row.rating) as keyof typeof distribution] = total ? Math.round((this.groupCount(row._count) / total) * 100) : 0; return distribution; }
  private countSeverity(rows: { severity: ReviewSeverity; _count?: true | { _all?: number } }[], severity: ReviewSeverity): number { return this.groupCount(rows.find((row) => row.severity === severity)?._count); }
  private groupCount(count?: true | { _all?: number }): number { return count && typeof count === 'object' ? count._all ?? 0 : 0; }
  private windowStart(window: FlaggedWindow): Date { const hours = window === FlaggedWindow.LAST_24H ? 24 : window === FlaggedWindow.LAST_7_DAYS ? 168 : 720; return new Date(Date.now() - hours * 3_600_000); }
  private slaDueAt(review: Review): Date { const hours = review.severity === ReviewSeverity.CRITICAL ? 4 : review.severity === ReviewSeverity.HIGH ? 8 : review.severity === ReviewSeverity.MEDIUM ? 12 : 24; return new Date(review.createdAt.getTime() + hours * 3_600_000); }
  private ratingFilter(rating?: string | number): number | undefined { if (rating === undefined || rating === 'ALL') return undefined; const value = Number(rating); return Number.isInteger(value) && value >= 1 && value <= 5 ? value : undefined; }
  private statusFilter(status?: AllReviewStatus | ReviewStatus): ReviewStatus | undefined { if (!status || status === AllReviewStatus.ALL) return undefined; if (status === AllReviewStatus.APPROVED) return ReviewStatus.PUBLISHED; if (status === AllReviewStatus.PUBLISHED) return ReviewStatus.PUBLISHED; if (status === AllReviewStatus.PENDING) return ReviewStatus.PENDING; if (status === AllReviewStatus.FLAGGED) return ReviewStatus.FLAGGED; if (status === AllReviewStatus.HIDDEN) return ReviewStatus.HIDDEN; if (status === AllReviewStatus.REMOVED) return ReviewStatus.REMOVED; if (status === AllReviewStatus.PENALIZED) return ReviewStatus.PENALIZED; return status; }
  private displayStatus(status: ReviewStatus): string { return status === ReviewStatus.PUBLISHED ? 'APPROVED' : status; }
  private transactionId(review: ReviewWithRelations): string { return review.order.payment?.providerPaymentIntentId ?? `TXN-${review.order.payment?.createdAt.getUTCFullYear() ?? review.createdAt.getUTCFullYear()}-${(review.order.payment?.id ?? review.order.id).slice(-8).toUpperCase()}`; }
  private flagReasons(review: Pick<Review, 'flagReasonsJson' | 'flagReason'>): string[] { const values = this.stringArray(review.flagReasonsJson); return values.length ? values : review.flagReason ? [review.flagReason] : []; }
  private preview(comment: string): string { return comment.length > 72 ? `${comment.slice(0, 69)}...` : comment; }
  private initials(user: { firstName: string; lastName: string }): string { return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase(); }
  private actorName(actorType: ReviewModerationActorType): string { if (actorType === ReviewModerationActorType.SYSTEM) return 'System'; return actorType === ReviewModerationActorType.SUPER_ADMIN ? 'Super Admin' : 'Admin'; }
  private reviewSnapshot(review: Review) { return { id: review.id, status: review.status, source: review.source, reportCount: review.reportCount, severity: review.severity, flagReason: review.flagReason, flagReasons: this.flagReasons(review), moderationConfidence: review.moderationConfidence }; }
  private stringArray(value: Prisma.JsonValue): string[] { return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []; }
  private object(value: Prisma.JsonValue): Record<string, unknown> { return value && typeof value === 'object' && !Array.isArray(value) ? value : {}; }
  private bool(value: unknown, fallback: boolean): boolean { return typeof value === 'boolean' ? value : fallback; }
  private num(value: unknown, fallback: number): number { return typeof value === 'number' ? value : fallback; }
  private round(value: number): number { return Math.round(value * 100) / 100; }
  private name(user: { firstName: string; lastName: string }): string { return `${user.firstName} ${user.lastName}`.trim(); }
  private providerName(provider: { providerBusinessName: string | null; firstName: string; lastName: string }): string { return provider.providerBusinessName ?? this.name(provider); }
}
