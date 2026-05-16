import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ChatMessageType, ChatSenderType, NotificationRecipientType, OrderStatus, Prisma, ProviderOrderStatus, ProviderReportReason, ProviderReportStatus, ReviewFlagReason, ReviewModerationAction, ReviewModerationActorType, ReviewSeverity, ReviewStatus } from '@prisma/client';
import { randomInt } from 'crypto';
import { AuthUserContext } from '../../../common/decorators/current-user.decorator';
import { ChatDetailsDto, CreateProviderReportDto, CreateReviewDto, CustomerReviewStatusFilter, GetOrderChatDto, ListCustomerChatsDto, ListCustomerReviewsDto, ListProviderReportsDto, ProviderReportStatusFilter, SendChatMessageDto, UpdateReviewDto } from '../dto/customer-provider-interactions.dto';
import { CustomerChatsRepository } from '../repositories/customer-chats.repository';
import { CustomerProviderReportsRepository } from '../repositories/customer-provider-reports.repository';
import { CustomerProviderInteractionsRepository } from '../repositories/customer-provider-interactions.repository';
import { CUSTOMER_REVIEW_INCLUDE, CustomerReviewsRepository } from '../repositories/customer-reviews.repository';

type ProviderView = { id: string; providerBusinessName: string | null; avatarUrl: string | null; firstName: string; lastName: string; isActive: boolean };
type OrderWithProviderOrders = { id: string; orderNumber: string; status: OrderStatus; userId: string; providerOrders: { id: string; providerId: string; status: ProviderOrderStatus; provider: ProviderView }[] };

type ChatThreadView = {
  id: string;
  order: { id: string; orderNumber: string };
  providerOrderId: string;
  provider: ProviderView;
  lastMessage: { body: string | null; createdAt: Date } | null;
  messages?: { id: string; body: string | null; messageType: ChatMessageType; attachmentUrlsJson: Prisma.JsonValue; createdAt: Date; isReadByCustomer: boolean; isReadByProvider: boolean; senderType: ChatSenderType }[];
};

@Injectable()
export class CustomerProviderInteractionsService {
  constructor(
    private readonly customerChatsRepository: CustomerChatsRepository,
    private readonly customerProviderReportsRepository: CustomerProviderReportsRepository,
    private readonly customerProviderInteractionsRepository: CustomerProviderInteractionsRepository,
    private readonly customerReviewsRepository: CustomerReviewsRepository,
  ) {}

  async getOrderChat(user: AuthUserContext, orderId: string, query: GetOrderChatDto) {
    const order = await this.getOwnedOrder(user.uid, orderId);
    const providerOrder = this.firstProviderOrder(order);
    const thread = await this.customerChatsRepository.findThreadByProviderOrder(providerOrder.id, this.threadInclude());
    if (thread) return { data: await this.chatSummary(thread), message: 'Order chat fetched successfully.' };
    if (!query.createIfMissing) return { data: null, message: 'Order chat fetched successfully.' };
    return this.createOrderChat(user, orderId);
  }

  async createOrderChat(user: AuthUserContext, orderId: string) {
    const order = await this.getOwnedOrder(user.uid, orderId);
    const providerOrder = this.firstProviderOrder(order);
    const thread = await this.customerChatsRepository.upsertOrderThread({ orderId: order.id, providerOrderId: providerOrder.id, providerId: providerOrder.providerId, customerId: user.uid, include: this.threadInclude() });
    return { data: await this.chatSummary(thread), message: 'Order chat fetched successfully.' };
  }

  async chats(user: AuthUserContext, query: ListCustomerChatsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.ChatThreadWhereInput = { customerId: user.uid, ...(query.search ? { OR: [{ order: { orderNumber: { contains: query.search, mode: 'insensitive' } } }, { provider: { providerBusinessName: { contains: query.search, mode: 'insensitive' } } }] } : {}) };
    const [items, total] = await this.customerChatsRepository.findThreadsAndCount({ where, include: this.threadInclude(), skip: (page - 1) * limit, take: limit });
    const data = await Promise.all(items.map((item) => this.chatListItem(item)));
    const filtered = query.unreadOnly ? data.filter((item) => item.unreadCount > 0) : data;
    return { data: filtered, meta: { page, limit, total: query.unreadOnly ? filtered.length : total, totalPages: Math.ceil((query.unreadOnly ? filtered.length : total) / limit) }, message: 'Chats fetched successfully.' };
  }

  quickReplies() {
    return { data: [{ key: 'TRACKING_INFO', label: 'Tracking info?', message: 'Can you please share the tracking information?' }, { key: 'ESTIMATED_ARRIVAL', label: 'Estimated arrival?', message: 'When is my order expected to arrive?' }, { key: 'CONFIRM_DELIVERY', label: 'Confirm delivery', message: 'Can you confirm if the order has been delivered?' }], message: 'Quick replies fetched successfully.' };
  }

  async chatDetails(user: AuthUserContext, threadId: string, query: ChatDetailsDto) {
    const thread = await this.getOwnedThread(user.uid, threadId);
    const page = query.page ?? 1;
    const limit = query.limit ?? 30;
    const messages = await this.customerChatsRepository.findThreadMessages({ threadId, before: query.before, skip: (page - 1) * limit, take: limit });
    return { data: { thread: { id: thread.id, orderNumber: thread.order.orderNumber, provider: this.provider(thread.provider) }, messages: messages.reverse().map((message) => this.messageItem(message)) }, message: 'Chat fetched successfully.' };
  }

  async sendMessage(user: AuthUserContext, threadId: string, dto: SendChatMessageDto) {
    const thread = await this.getOwnedThread(user.uid, threadId);
    this.assertMessagePayload(dto);
    const message = await this.customerChatsRepository.createCustomerMessage({ threadId, customerId: user.uid, providerId: thread.provider.id, orderId: thread.order.id, providerOrderId: thread.providerOrderId, messageType: dto.messageType, body: dto.body, attachmentUrls: dto.attachmentUrls ?? [] });
    return { data: this.messageItem(message), message: 'Message sent successfully.' };
  }

  async markRead(user: AuthUserContext, threadId: string) {
    await this.getOwnedThread(user.uid, threadId);
    await this.customerChatsRepository.markThreadReadByCustomer(threadId);
    return { data: { threadId, isRead: true }, message: 'Chat marked as read.' };
  }

  async submitReview(user: AuthUserContext, orderId: string, dto: CreateReviewDto) {
    const order = await this.getOrderForReview(user.uid, orderId);
    const providerOrder = order.providerOrders.find((item) => item.providerId === dto.providerId);
    if (!providerOrder) throw new ForbiddenException('Provider is not part of this order');
    if (!this.isReviewable(order.status, providerOrder.status)) throw new BadRequestException('Only delivered or completed orders can be reviewed');
    const existing = await this.customerReviewsRepository.findExistingReviewForProviderOrder(user.uid, providerOrder.id, [ReviewStatus.REMOVED]);
    if (existing) throw new BadRequestException('You have already reviewed this provider order');
    const moderation = this.moderateText(dto.comment, dto.rating);
    const review = await this.customerReviewsRepository.createReview({ reviewCode: await this.reviewCode(), orderId: order.id, providerOrderId: providerOrder.id, providerId: dto.providerId, userId: user.uid, rating: dto.rating, comment: dto.comment, status: moderation.status, severity: moderation.severity, flagReason: moderation.flagReason, autoModerated: moderation.autoModerated, moderationConfidence: moderation.confidence, detectedCategoriesJson: moderation.categories });
    if (moderation.autoModerated) await this.customerReviewsRepository.createReviewModerationLog({ reviewId: review.id, actorType: ReviewModerationActorType.SYSTEM, action: moderation.status === ReviewStatus.PUBLISHED ? ReviewModerationAction.AUTO_APPROVED : ReviewModerationAction.AUTO_FLAGGED, outcome: review.status, reason: moderation.flagReason, autoModerated: true, confidence: moderation.confidence, afterJson: { status: review.status, categories: moderation.categories } });
    if (review.status === ReviewStatus.PUBLISHED) await this.customerReviewsRepository.createReviewNotification({ recipientId: dto.providerId, recipientType: NotificationRecipientType.PROVIDER, title: 'New provider review', message: `A customer submitted a ${dto.rating}-star review.`, type: 'PROVIDER_REVIEW', metadataJson: { reviewId: review.id, orderId: order.id, providerOrderId: providerOrder.id } });
    return { data: this.reviewSummary(review), message: 'Review submitted successfully.' };
  }

  async reviews(user: AuthUserContext, query: ListCustomerReviewsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.ReviewWhereInput = { userId: user.uid, deletedAt: null, rating: query.rating, providerId: query.providerId, ...(query.status && query.status !== CustomerReviewStatusFilter.ALL ? { status: query.status } : {}) };
    const [items, total] = await this.customerReviewsRepository.findReviewsAndCountForUser({ where, skip: (page - 1) * limit, take: limit });
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
    await this.customerReviewsRepository.softDeleteReview(id);
    return { data: null, message: 'Review deleted successfully.' };
  }

  providerReportReasons() {
    return { data: [{ key: 'FRAUDULENT_ACTIVITY', label: 'Fraudulent Activity', description: 'Scam, fake business, or deceptive practices' }, { key: 'INAPPROPRIATE_CONTENT', label: 'Inappropriate Content', description: 'Offensive or inappropriate information' }, { key: 'FAKE_REVIEWS', label: 'Fake Reviews', description: 'Suspicious or fabricated reviews' }, { key: 'POOR_SERVICE_QUALITY', label: 'Poor Service Quality', description: 'Consistently bad service or products' }, { key: 'NOT_RESPONSIVE', label: 'Not Responsive', description: 'Does not respond to messages or inquiries' }, { key: 'OTHER', label: 'Other', description: 'Something else not listed above' }], message: 'Provider report reasons fetched successfully.' };
  }

  async reportProvider(user: AuthUserContext, providerId: string, dto: CreateProviderReportDto) {
    const provider = await this.customerProviderReportsRepository.findProviderById(providerId);
    if (!provider) throw new NotFoundException('Provider not found');
    await this.assertProviderRelationship(user.uid, providerId, dto.orderId);
    const duplicate = await this.customerProviderReportsRepository.findDuplicateActiveReport({ reporterUserId: user.uid, providerId, orderId: dto.orderId, reason: dto.reason });
    if (duplicate) throw new BadRequestException('An active report for this provider/order/reason already exists');
    const report = await this.customerProviderReportsRepository.createProviderReport({ reporterUserId: user.uid, providerId, orderId: dto.orderId, reason: dto.reason, details: dto.details, evidenceUrlsJson: dto.evidenceUrls ?? [] });
    await this.customerProviderReportsRepository.createCustomerReportNotification({ userId: user.uid, reportId: report.id, providerId });
    await this.notifyAdmins(report.id, providerId);
    return { data: { id: report.id, providerId: report.providerId, reason: report.reason, status: report.status, createdAt: report.createdAt }, message: 'Provider report submitted successfully.' };
  }

  async providerReports(user: AuthUserContext, query: ListProviderReportsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.ProviderReportWhereInput = { reporterUserId: user.uid, ...(query.status && query.status !== ProviderReportStatusFilter.ALL ? { status: query.status } : {}) };
    const [items, total] = await this.customerProviderReportsRepository.findProviderReportsAndCount({ where, include: this.reportInclude(), skip: (page - 1) * limit, take: limit });
    return { data: items.map((item) => this.reportItem(item)), meta: { page, limit, total, totalPages: Math.ceil(total / limit) }, message: 'Provider reports fetched successfully.' };
  }

  async providerReportDetails(user: AuthUserContext, id: string) {
    const report = await this.customerProviderReportsRepository.findProviderReportForUser(user.uid, id, this.reportInclude());
    if (!report) throw new NotFoundException('Provider report not found');
    return { data: this.reportItem(report), message: 'Provider report fetched successfully.' };
  }

  private async getOwnedOrder(customerId: string, orderId: string): Promise<OrderWithProviderOrders> {
    const order = await this.customerProviderInteractionsRepository.findOwnedOrder(customerId, orderId);
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }
  private async getOrderForReview(customerId: string, orderId: string): Promise<OrderWithProviderOrders> { const order = await this.customerReviewsRepository.findOrderForReviewByUser(customerId, orderId); if (!order) throw new NotFoundException('Order not found'); return order; }
  private firstProviderOrder(order: OrderWithProviderOrders) { const providerOrder = order.providerOrders[0]; if (!providerOrder) throw new BadRequestException('Provider order not found for this order'); return providerOrder; }
  private async getOwnedThread(customerId: string, threadId: string) { const thread = await this.customerChatsRepository.findOwnedThread(customerId, threadId, this.threadInclude()); if (!thread) throw new NotFoundException('Chat thread not found'); return thread; }
  private threadInclude() { return { order: { select: { id: true, orderNumber: true } }, provider: { select: { id: true, providerBusinessName: true, avatarUrl: true, firstName: true, lastName: true, isActive: true } }, lastMessage: { select: { body: true, createdAt: true } } } satisfies Prisma.ChatThreadInclude; }
  private async chatSummary(thread: ChatThreadView) { return { threadId: thread.id, orderId: thread.order.id, providerOrderId: thread.providerOrderId, orderNumber: thread.order.orderNumber, provider: this.provider(thread.provider), lastMessage: thread.lastMessage, unreadCount: await this.unreadCount(thread.id) }; }
  private async chatListItem(thread: ChatThreadView) { return { id: thread.id, orderNumber: thread.order.orderNumber, provider: this.provider(thread.provider), lastMessage: thread.lastMessage, unreadCount: await this.unreadCount(thread.id) }; }
  private async unreadCount(threadId: string): Promise<number> { return this.customerChatsRepository.countUnreadForCustomer(threadId); }
  private provider(provider: ProviderView) { return { id: provider.id, businessName: provider.providerBusinessName ?? `${provider.firstName} ${provider.lastName}`.trim(), avatarUrl: provider.avatarUrl, isOnline: provider.isActive }; }
  private messageItem(message: { id: string; senderType: ChatSenderType; body: string | null; messageType: ChatMessageType; attachmentUrlsJson: Prisma.JsonValue; createdAt: Date; isReadByCustomer: boolean; isReadByProvider: boolean }) { return { id: message.id, senderType: message.senderType, body: message.body, messageType: message.messageType, attachmentUrls: this.stringArray(message.attachmentUrlsJson), createdAt: message.createdAt, isRead: message.senderType === ChatSenderType.CUSTOMER ? message.isReadByProvider : message.isReadByCustomer }; }
  private assertMessagePayload(dto: SendChatMessageDto): void { const attachments = dto.attachmentUrls ?? []; if (dto.messageType === ChatMessageType.TEXT && !dto.body?.trim()) throw new BadRequestException('body is required for TEXT messages'); if (dto.messageType !== ChatMessageType.TEXT && attachments.length === 0) throw new BadRequestException('attachmentUrls are required for attachment messages'); }
  private isReviewable(orderStatus: OrderStatus, providerStatus: ProviderOrderStatus): boolean { return orderStatus === OrderStatus.DELIVERED || orderStatus === OrderStatus.COMPLETED || providerStatus === ProviderOrderStatus.DELIVERED || providerStatus === ProviderOrderStatus.COMPLETED; }
  private moderateText(comment: string, rating: number) { const text = comment.toLowerCase(); const categories = [/spam|scam|click/.test(text) ? 'SPAM' : null, /fake|fraud/.test(text) ? 'FAKE_REVIEW' : null, /abuse|hate|threat/.test(text) ? 'ABUSE' : null].filter((value): value is string => Boolean(value)); const confidence = Math.min(95, 55 + categories.length * 20 + (rating <= 2 ? 8 : 0)); const flagged = categories.length > 0; return { status: flagged ? ReviewStatus.FLAGGED : ReviewStatus.PUBLISHED, severity: categories.includes('ABUSE') ? ReviewSeverity.HIGH : flagged ? ReviewSeverity.MEDIUM : ReviewSeverity.LOW, flagReason: categories.includes('SPAM') ? ReviewFlagReason.SPAM : categories.includes('FAKE_REVIEW') ? ReviewFlagReason.FAKE_REVIEW : categories.includes('ABUSE') ? ReviewFlagReason.ABUSE : null, autoModerated: true, confidence, categories }; }
  private async reviewCode(): Promise<string> { for (let attempt = 0; attempt < 5; attempt += 1) { const code = `RV-${randomInt(10000, 99999)}`; const exists = await this.customerReviewsRepository.findReviewCode(code); if (!exists) return code; } return `RV-${Date.now()}`; }
  private reviewInclude() { return CUSTOMER_REVIEW_INCLUDE; }
  private reviewItem(review: { id: string; provider: { id: string; providerBusinessName: string | null; firstName: string; lastName: string }; order: { id: string; orderNumber: string }; rating: number; comment: string; status: ReviewStatus; response: { id: string; body: string; createdAt: Date } | null; createdAt: Date }) { return { id: review.id, provider: { id: review.provider.id, businessName: review.provider.providerBusinessName ?? `${review.provider.firstName} ${review.provider.lastName}`.trim() }, order: review.order, rating: review.rating, comment: review.comment, status: review.status, providerResponse: review.response, createdAt: review.createdAt }; }
  private reviewSummary(review: { id: string; rating: number; comment: string; status: ReviewStatus; providerId: string; orderId: string; createdAt: Date }) { return { id: review.id, rating: review.rating, comment: review.comment, status: review.status, providerId: review.providerId, orderId: review.orderId, createdAt: review.createdAt }; }
  private async assertProviderRelationship(customerId: string, providerId: string, orderId?: string): Promise<void> { const hasRelationship = await this.customerProviderReportsRepository.hasProviderRelationship(customerId, providerId, orderId); if (hasRelationship) return; throw new ForbiddenException('You can report only providers you have interacted with'); }
  private async notifyAdmins(reportId: string, providerId: string): Promise<void> { const admins = await this.customerProviderReportsRepository.findActiveAdminRecipients(); if (!admins.length) return; await this.customerProviderReportsRepository.createAdminReportNotifications(admins, { reportId, providerId }); }
  private reportInclude() { return { provider: { select: { id: true, providerBusinessName: true, firstName: true, lastName: true } }, order: { select: { id: true, orderNumber: true } } } satisfies Prisma.ProviderReportInclude; }
  private reportItem(report: { id: string; providerId: string; reason: ProviderReportReason; details: string; evidenceUrlsJson: Prisma.JsonValue; status: ProviderReportStatus; createdAt: Date; provider: { id: string; providerBusinessName: string | null; firstName: string; lastName: string }; order: { id: string; orderNumber: string } | null }) { return { id: report.id, provider: { id: report.provider.id, businessName: report.provider.providerBusinessName ?? `${report.provider.firstName} ${report.provider.lastName}`.trim() }, order: report.order, reason: report.reason, details: report.details, evidenceUrls: this.stringArray(report.evidenceUrlsJson), status: report.status, createdAt: report.createdAt }; }
  private stringArray(value: Prisma.JsonValue): string[] { return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []; }
}
