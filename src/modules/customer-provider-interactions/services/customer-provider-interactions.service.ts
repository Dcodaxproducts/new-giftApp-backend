import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { NotificationRecipientType, OrderStatus, Prisma, ProviderOrderStatus, ProviderReportReason, ProviderReportStatus, ReviewFlagReason, ReviewSeverity, ReviewStatus, UserStatus } from '@prisma/client';
import { randomInt } from 'crypto';
import { AuthUserContext } from '../../../common/decorators/current-user.decorator';
import { CreateProviderReportDto, CreateReviewDto, CustomerReviewStatusFilter, ListCustomerReviewsDto, ListProviderReportsDto, ProviderReportStatusFilter, UpdateReviewDto } from '../dto/customer-provider-interactions.dto';
import { CustomerProviderReportsRepository } from '../repositories/customer-provider-reports.repository';
import { CustomerProviderInteractionsRepository } from '../repositories/customer-provider-interactions.repository';
import { CUSTOMER_REVIEW_INCLUDE, CustomerReviewsRepository } from '../repositories/customer-reviews.repository';
import { ReportingCoreService } from '../../reporting-core/reporting-core.service';
import { getPagination } from '../../../common/pagination/pagination.util';
type ProviderView = { id: string; providerProfile: { businessName: string | null } | null; avatarUrl: string | null; firstName: string; lastName: string; status: UserStatus };
type OrderWithProvider = { id: string; orderNumber: string; status: OrderStatus; providerStatus: ProviderOrderStatus; providerId: string; userId: string; provider: ProviderView };

@Injectable()
export class CustomerProviderInteractionsService {
  constructor(
    private readonly customerProviderReportsRepository: CustomerProviderReportsRepository,
    private readonly customerProviderInteractionsRepository: CustomerProviderInteractionsRepository,
    private readonly customerReviewsRepository: CustomerReviewsRepository,
    private readonly reportingCore?: ReportingCoreService,
  ) {}

  async submitReview(user: AuthUserContext, orderId: string, dto: CreateReviewDto) {
    const order = await this.getOrderForReview(user.uid, orderId);
    if (order.providerId !== dto.providerId) throw new ForbiddenException('Provider is not part of this order');
    if (!this.isReviewable(order.status, order.providerStatus)) throw new BadRequestException('Only delivered or completed orders can be reviewed');
    const existing = await this.customerReviewsRepository.findExistingReviewForOrder(user.uid, order.id, [ReviewStatus.REMOVED]);
    if (existing) throw new BadRequestException('You have already reviewed this provider order');
    const moderation = this.moderateText(dto.comment, dto.rating);
    const review = await this.customerReviewsRepository.createReview({ reviewCode: await this.reviewCode(), orderId: order.id, providerId: dto.providerId, userId: user.uid, rating: dto.rating, comment: dto.comment, status: moderation.status, severity: moderation.severity, flagReason: moderation.flagReason, autoModerated: moderation.autoModerated, moderationConfidence: moderation.confidence, detectedCategoriesJson: moderation.categories });
    if (review.status === ReviewStatus.PUBLISHED) await this.customerReviewsRepository.createReviewNotification({ recipientId: dto.providerId, recipientType: NotificationRecipientType.PROVIDER, title: 'New provider review', message: `A customer submitted a ${dto.rating}-star review.`, type: 'PROVIDER_REVIEW', metadataJson: { reviewId: review.id, orderId: order.id } });
    return { data: this.reviewSummary(review), message: 'Review submitted successfully.' };
  }

  async reviews(user: AuthUserContext, query: ListCustomerReviewsDto) {
    const { page, limit, skip, take } = getPagination(query);
    const where: Prisma.ReviewWhereInput = { userId: user.uid, deletedAt: null, rating: query.rating, providerId: query.providerId, ...(query.status && query.status !== CustomerReviewStatusFilter.ALL ? { status: query.status } : {}) };
    const [items, total] = await this.customerReviewsRepository.findReviewsAndCountForUser({ where, skip, take });
    return { data: items.map((item) => this.reviewItem(item)), meta: { page, limit, total, totalPages: Math.ceil(total / limit) }, message: 'Reviews fetched successfully.' };
  }

  async reviewDetails(user: AuthUserContext, id: string) {
    const review = await this.customerReviewsRepository.findReviewForUser(user.uid, id);
    if (!review) throw new NotFoundException('Review not found');
    return { data: this.reviewItem(review), message: 'Review fetched successfully.' };
  }

  async updateReview(user: AuthUserContext, id: string, dto: UpdateReviewDto) {
    const current = await this.customerReviewsRepository.findReviewForUser(user.uid, id);
    if (!current) throw new NotFoundException('Review not found');
    if (current.status === ReviewStatus.REMOVED) throw new BadRequestException('Removed reviews cannot be updated');
    const rating = dto.rating ?? current.rating;
    const comment = dto.comment ?? current.comment;
    const moderation = this.moderateText(comment, rating);
    const updated = await this.customerReviewsRepository.updateReview(id, { rating, comment, status: moderation.status, severity: moderation.severity, flagReason: moderation.flagReason, autoModerated: moderation.autoModerated, moderationConfidence: moderation.confidence, detectedCategoriesJson: moderation.categories });
    return { data: this.reviewSummary(updated), message: 'Review updated successfully.' };
  }

  async deleteReview(user: AuthUserContext, id: string) {
    const review = await this.customerReviewsRepository.findReviewForUser(user.uid, id);
    if (!review) throw new NotFoundException('Review not found');
    await this.customerReviewsRepository.deleteReview(id);
    return { data: null, message: 'Review deleted successfully.' };
  }

  providerReportReasons() {
    return { data: [{ key: 'FRAUDULENT_ACTIVITY', label: 'Fraudulent Activity', description: 'Scam, fake business, or deceptive practices' }, { key: 'INAPPROPRIATE_CONTENT', label: 'Inappropriate Content', description: 'Offensive or inappropriate information' }, { key: 'FAKE_REVIEWS', label: 'Fake Reviews', description: 'Suspicious or fabricated reviews' }, { key: 'POOR_SERVICE_QUALITY', label: 'Poor Service Quality', description: 'Consistently bad service or products' }, { key: 'NOT_RESPONSIVE', label: 'Not Responsive', description: 'Does not respond to messages or inquiries' }, { key: 'OTHER', label: 'Other', description: 'Something else not listed above' }], message: 'Provider report reasons fetched successfully.' };
  }

  async reportProvider(user: AuthUserContext, providerId: string, dto: CreateProviderReportDto) {
    const provider = await this.customerProviderReportsRepository.findProviderById(providerId);
    if (!provider) throw new NotFoundException('Provider not found');
    await this.assertProviderRelationship(user.uid, providerId, dto.orderId);
    const evidenceUrls = dto.evidenceUrls ?? [];
    await this.reportingCore?.validateEvidence({ urls: evidenceUrls, folder: 'provider-report-evidence', findCompleted: (urls) => this.customerProviderReportsRepository.findCompletedUploadsByUrls(urls) });
    const duplicate = await this.customerProviderReportsRepository.findDuplicateActiveReport({ reporterUserId: user.uid, providerId, orderId: dto.orderId, reason: dto.reason });
    if (duplicate) throw new BadRequestException('An active report for this provider/order/reason already exists');
    const report = await this.customerProviderReportsRepository.createProviderReport({ reporterUserId: user.uid, providerId, orderId: dto.orderId, reason: dto.reason, details: dto.details, evidenceUrlsJson: evidenceUrls });
    await this.reportingCore?.lifecycleEvent({ domain: 'providerReports', reportId: report.id, action: 'PROVIDER_REPORT_SUBMITTED', metadata: { providerId, reporterUserId: user.uid } });
    await this.notifyReporter(user.uid, report.id, providerId);
    await this.notifyAdmins(report.id, providerId);
    return { data: { id: report.id, providerId: report.providerId, reason: report.reason, status: report.status, createdAt: report.createdAt }, message: 'Provider report submitted successfully.' };
  }

  async providerReports(user: AuthUserContext, query: ListProviderReportsDto) {
    const { page, limit, skip, take } = getPagination(query);
    const where: Prisma.ProviderReportWhereInput = { reporterUserId: user.uid, ...(query.status && query.status !== ProviderReportStatusFilter.ALL ? { status: query.status } : {}) };
    const [items, total] = await this.customerProviderReportsRepository.findProviderReportsAndCount({ where, include: this.reportInclude(), skip, take });
    return { data: items.map((item) => this.reportItem(item)), meta: { page, limit, total, totalPages: Math.ceil(total / limit) }, message: 'Provider reports fetched successfully.' };
  }

  async providerReportDetails(user: AuthUserContext, id: string) {
    const report = await this.customerProviderReportsRepository.findProviderReportForUser(user.uid, id, this.reportInclude());
    if (!report) throw new NotFoundException('Provider report not found');
    return { data: this.reportItem(report), message: 'Provider report fetched successfully.' };
  }

  private async getOrderForReview(customerId: string, orderId: string): Promise<OrderWithProvider> { const order = await this.customerReviewsRepository.findOrderForReviewByUser(customerId, orderId); if (!order) throw new NotFoundException('Order not found'); return order; }
  private isReviewable(orderStatus: OrderStatus, providerStatus: ProviderOrderStatus): boolean { return orderStatus === OrderStatus.DELIVERED || orderStatus === OrderStatus.COMPLETED || providerStatus === ProviderOrderStatus.DELIVERED || providerStatus === ProviderOrderStatus.COMPLETED; }
  private moderateText(comment: string, rating: number) { const text = comment.toLowerCase(); const categories = [/spam|scam|click/.test(text) ? 'SPAM' : null, /fake|fraud/.test(text) ? 'FAKE_REVIEW' : null, /abuse|hate|threat/.test(text) ? 'ABUSE' : null].filter((value): value is string => Boolean(value)); const confidence = Math.min(95, 55 + categories.length * 20 + (rating <= 2 ? 8 : 0)); const flagged = categories.length > 0; return { status: flagged ? ReviewStatus.FLAGGED : ReviewStatus.PUBLISHED, severity: categories.includes('ABUSE') ? ReviewSeverity.HIGH : flagged ? ReviewSeverity.MEDIUM : ReviewSeverity.LOW, flagReason: categories.includes('SPAM') ? ReviewFlagReason.SPAM : categories.includes('FAKE_REVIEW') ? ReviewFlagReason.FAKE_REVIEW : categories.includes('ABUSE') ? ReviewFlagReason.ABUSE : null, autoModerated: true, confidence, categories }; }
  private async reviewCode(): Promise<string> { for (let attempt = 0; attempt < 5; attempt += 1) { const code = `RV-${randomInt(10000, 99999)}`; const exists = await this.customerReviewsRepository.findReviewCode(code); if (!exists) return code; } return `RV-${Date.now()}`; }
  private reviewInclude() { return CUSTOMER_REVIEW_INCLUDE; }
  private reviewItem(review: { id: string; provider: { id: string; providerProfile: { businessName: string | null } | null; firstName: string; lastName: string }; order: { id: string; orderNumber: string }; rating: number; comment: string; status: ReviewStatus; response: { id: string; body: string; createdAt: Date } | null; createdAt: Date }) { return { id: review.id, provider: { id: review.provider.id, businessName: this.providerName(review.provider) }, order: review.order, rating: review.rating, comment: review.comment, status: review.status, providerResponse: review.response, createdAt: review.createdAt }; }
  private reviewSummary(review: { id: string; rating: number; comment: string; status: ReviewStatus; providerId: string; orderId: string; createdAt: Date }) { return { id: review.id, rating: review.rating, comment: review.comment, status: review.status, providerId: review.providerId, orderId: review.orderId, createdAt: review.createdAt }; }
  private async assertProviderRelationship(customerId: string, providerId: string, orderId?: string): Promise<void> { const hasRelationship = await this.customerProviderReportsRepository.hasProviderRelationship(customerId, providerId, orderId); if (hasRelationship) return; throw new ForbiddenException('You can report only providers you have interacted with'); }
  private async notifyReporter(userId: string, reportId: string, providerId: string): Promise<void> { if (this.reportingCore) await this.reportingCore.notify({ recipientId: userId, recipientType: 'REGISTERED_USER', title: 'Provider report submitted', message: 'Your provider report was submitted for review.', type: 'PROVIDER_REPORT', metadata: { reportId, providerId } }); else await this.customerProviderReportsRepository.createCustomerReportNotification({ userId, reportId, providerId }); }
  private async notifyAdmins(reportId: string, providerId: string): Promise<void> { const admins = await this.customerProviderReportsRepository.findActiveAdminRecipients(); if (!admins.length) return; if (this.reportingCore) await this.reportingCore.notifyMany(admins.map((admin) => ({ recipientId: admin.id, recipientType: 'ADMIN', title: 'Provider report submitted', message: 'A customer submitted a provider report for review.', type: 'PROVIDER_REPORT_ADMIN', metadata: { reportId, providerId } }))); else await this.customerProviderReportsRepository.createAdminReportNotifications(admins, { reportId, providerId }); }
  private reportInclude() { return { provider: { select: { id: true, providerProfile: { select: { businessName: true } }, firstName: true, lastName: true } }, order: { select: { id: true, orderNumber: true } } } satisfies Prisma.ProviderReportInclude; }
  private reportItem(report: { id: string; providerId: string; reason: ProviderReportReason; details: string; evidenceUrlsJson: Prisma.JsonValue; status: ProviderReportStatus; createdAt: Date; provider: { id: string; providerProfile: { businessName: string | null } | null; firstName: string; lastName: string }; order: { id: string; orderNumber: string } | null }) { return { id: report.id, provider: { id: report.provider.id, businessName: this.providerName(report.provider) }, order: report.order, reason: report.reason, details: report.details, evidenceUrls: this.stringArray(report.evidenceUrlsJson), status: report.status, createdAt: report.createdAt }; }
  private providerName(provider: { providerProfile: { businessName: string | null } | null; firstName: string; lastName: string }): string { return provider.providerProfile?.businessName ?? `${provider.firstName} ${provider.lastName}`.trim(); }
  private stringArray(value: Prisma.JsonValue): string[] { return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []; }
}
