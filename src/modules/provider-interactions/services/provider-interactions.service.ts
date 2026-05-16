import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ChatMessageType, ChatSenderType, NotificationRecipientType, Prisma, ProviderOrder, ReviewStatus } from '@prisma/client';
import { AuthUserContext } from '../../../common/decorators/current-user.decorator';
import { ProviderBuyerChatRepository } from '../repositories/provider-buyer-chat.repository';
import { ProviderInteractionsRepository } from '../repositories/provider-interactions.repository';
import { ProviderReviewResponsesRepository } from '../repositories/provider-review-responses.repository';
import { ProviderReviewsRepository } from '../repositories/provider-reviews.repository';
import { GetProviderOrderChatDto, ListProviderChatsDto, ListProviderReviewsDto, ProviderChatDetailsDto, ProviderReviewSortBy, SendProviderChatMessageDto, SortOrder, ReviewResponseDto } from '../dto/provider-interactions.dto';

type CustomerView = { id: string; firstName: string; lastName: string; avatarUrl: string | null; isActive?: boolean };
type ThreadView = { id: string; orderId: string; providerOrderId: string; customerId: string; order: { id: string; orderNumber: string; userId: string }; customer: CustomerView; lastMessage: { body: string | null; createdAt: Date } | null };
type ReviewWithRelations = { id: string; orderId: string; rating: number; comment: string; createdAt: Date; likesCount: number; userId: string; response: { id: string; body: string; createdAt: Date; deletedAt: Date | null } | null; customer: { id: string; firstName: string; lastName: string; avatarUrl: string | null }; order: { id: string; orderNumber: string; createdAt: Date } };

@Injectable()
export class ProviderInteractionsService {
  constructor(
    private readonly buyerChatRepository: ProviderBuyerChatRepository,
    private readonly interactionsRepository: ProviderInteractionsRepository,
    private readonly reviewsRepository: ProviderReviewsRepository,
    private readonly reviewResponsesRepository: ProviderReviewResponsesRepository,
  ) {}

  async getOrderChat(user: AuthUserContext, providerOrderId: string, query: GetProviderOrderChatDto) {
    const providerOrder = await this.getOwnedProviderOrder(user.uid, providerOrderId);
    const thread = await this.buyerChatRepository.findThreadByProviderOrderId({ where: { providerOrderId }, include: this.threadInclude() });
    if (thread) return { data: await this.chatSummary(thread), message: 'Order chat fetched successfully.' };
    if (!query.createIfMissing) return { data: null, message: 'Order chat fetched successfully.' };
    return this.createOrderChat(user, providerOrder.id);
  }

  async createOrderChat(user: AuthUserContext, providerOrderId: string) {
    const providerOrder = await this.getOwnedProviderOrder(user.uid, providerOrderId);
    const thread = await this.buyerChatRepository.findOrCreateThreadForProviderOrder({ providerOrderId: providerOrder.id, orderId: providerOrder.orderId, providerId: user.uid, customerId: providerOrder.order.userId, include: this.threadInclude() });
    return { data: await this.chatSummary(thread), message: 'Order chat fetched successfully.' };
  }

  async chats(user: AuthUserContext, query: ListProviderChatsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.ChatThreadWhereInput = { providerId: user.uid, ...(query.search ? { OR: [{ order: { orderNumber: { contains: query.search, mode: 'insensitive' } } }, { customer: { firstName: { contains: query.search, mode: 'insensitive' } } }, { customer: { lastName: { contains: query.search, mode: 'insensitive' } } }] } : {}) };
    const [items, total] = await Promise.all([this.buyerChatRepository.findChatsForProvider({ where, include: this.threadInclude(), orderBy: { updatedAt: 'desc' }, skip: (page - 1) * limit, take: limit }), this.buyerChatRepository.countChatsForProvider(where)]);
    const data = await Promise.all(items.map((item) => this.chatListItem(item)));
    const filtered = query.unreadOnly ? data.filter((item) => item.unreadCount > 0) : data;
    return { data: filtered, meta: { page, limit, total: query.unreadOnly ? filtered.length : total, totalPages: Math.ceil((query.unreadOnly ? filtered.length : total) / limit) }, message: 'Chats fetched successfully.' };
  }

  quickReplies() { return { data: [{ key: 'TRACKING_INFO', label: 'Tracking info?', message: 'Your tracking information will be shared shortly.' }, { key: 'ESTIMATED_ARRIVAL', label: 'Estimated arrival?', message: 'Your order is expected to arrive soon. We will keep you updated.' }, { key: 'CONFIRM_DELIVERY', label: 'Confirm delivery', message: 'Please confirm once your order has been delivered.' }], message: 'Quick replies fetched successfully.' }; }

  async chatDetails(user: AuthUserContext, threadId: string, query: ProviderChatDetailsDto) {
    const thread = await this.getOwnedThread(user.uid, threadId);
    const page = query.page ?? 1;
    const limit = query.limit ?? 30;
    const messages = await this.buyerChatRepository.findMessagesForThread({ where: { threadId, ...(query.before ? { createdAt: { lt: new Date(query.before) } } : {}) }, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit });
    return { data: { thread: { id: thread.id, orderNumber: thread.order.orderNumber, customer: this.customer(thread.customer) }, messages: messages.reverse().map((message) => this.messageItem(message)) }, message: 'Chat fetched successfully.' };
  }

  async sendMessage(user: AuthUserContext, threadId: string, dto: SendProviderChatMessageDto) {
    const thread = await this.getOwnedThread(user.uid, threadId);
    this.assertMessagePayload(dto);
    const message = await this.buyerChatRepository.createChatMessage({ data: { threadId, senderId: user.uid, senderType: ChatSenderType.PROVIDER, messageType: dto.messageType, body: dto.body, attachmentUrlsJson: dto.attachmentUrls ?? [], isReadByCustomer: false, isReadByProvider: true } } as unknown as Prisma.ChatMessageUncheckedCreateInput);
    await this.buyerChatRepository.updateThreadLastMessage(threadId, message.id);
    await this.buyerChatRepository.createCustomerNotification({ data: { recipientId: thread.customerId, recipientType: NotificationRecipientType.REGISTERED_USER, title: 'New provider message', message: dto.body ?? 'Provider sent an attachment.', type: 'CHAT_MESSAGE', metadataJson: { threadId, orderId: thread.orderId, providerOrderId: thread.providerOrderId } } } as unknown as Prisma.NotificationCreateInput);
    return { data: this.messageItem(message), message: 'Message sent successfully.' };
  }

  async markRead(user: AuthUserContext, threadId: string) {
    await this.getOwnedThread(user.uid, threadId);
    await this.buyerChatRepository.markThreadReadForProvider(threadId);
    return { data: { threadId, isRead: true }, message: 'Chat marked as read.' };
  }

  async reviewSummary(user: AuthUserContext) {
    const where = this.publicReviewWhere(user.uid);
    const [agg, count, rows] = await this.reviewsRepository.findReviewSummaryForProvider(where);
    return { data: { averageRating: this.round(agg._avg.rating ?? 0), reviewCount: count, distribution: this.ratingDistribution(rows, count) }, message: 'Review summary fetched successfully.' };
  }

  async reviews(user: AuthUserContext, query: ListProviderReviewsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.ReviewWhereInput = { ...this.publicReviewWhere(user.uid), rating: query.rating, ...(query.hasResponse !== undefined ? { response: query.hasResponse ? { is: { deletedAt: null } } : { is: null } } : {}), ...(query.search ? { OR: [{ comment: { contains: query.search, mode: 'insensitive' } }, { order: { orderNumber: { contains: query.search, mode: 'insensitive' } } }] } : {}) };
    const [items, total] = await Promise.all([this.reviewsRepository.findReviewsForProvider({ where, include: this.reviewInclude(), orderBy: this.reviewOrder(query.sortBy, query.sortOrder), skip: (page - 1) * limit, take: limit }), this.reviewsRepository.countReviewsForProvider(where)]);
    return { data: items.map((item) => this.reviewItem(item)), meta: { page, limit, total, totalPages: Math.ceil(total / limit) }, message: 'Reviews fetched successfully.' };
  }

  filterOptions() { return { data: { ratings: [5, 4, 3, 2, 1], responseFilters: [{ key: 'ALL', label: 'All' }, { key: 'WITH_RESPONSE', label: 'Responded' }, { key: 'WITHOUT_RESPONSE', label: 'Needs Reply' }] }, message: 'Review filter options fetched successfully.' }; }

  async reviewDetails(user: AuthUserContext, id: string) {
    const review = await this.getOwnedReview(user.uid, id);
    return { data: { id: review.id, rating: review.rating, comment: review.comment, customer: this.customer(review.customer), order: review.order, response: review.response && !review.response.deletedAt ? { id: review.response.id, body: review.response.body, createdAt: review.response.createdAt } : null }, message: 'Review fetched successfully.' };
  }

  async createResponse(user: AuthUserContext, reviewId: string, dto: ReviewResponseDto) {
    const review = await this.getOwnedReview(user.uid, reviewId);
    if (review.response && !review.response.deletedAt) throw new BadRequestException('Active response already exists for this review');
    const response = review.response ? await this.reviewResponsesRepository.updateReviewResponseByReviewId(reviewId, { body: dto.body, providerId: user.uid, deletedAt: null }) : await this.reviewResponsesRepository.createReviewResponse({ reviewId, providerId: user.uid, body: dto.body });
    await this.reviewResponsesRepository.createCustomerNotification({ data: { recipientId: review.userId, recipientType: NotificationRecipientType.REGISTERED_USER, title: 'Provider responded to your review', message: dto.body, type: 'REVIEW_RESPONSE', metadataJson: { reviewId, responseId: response.id } } } as unknown as Prisma.NotificationCreateInput);
    return { data: { id: response.id, body: response.body, createdAt: response.createdAt }, message: 'Review response posted successfully.' };
  }

  async updateResponse(user: AuthUserContext, reviewId: string, dto: ReviewResponseDto) {
    await this.getOwnedReview(user.uid, reviewId);
    const response = await this.reviewResponsesRepository.findReviewResponseForProvider({ where: { reviewId, providerId: user.uid, deletedAt: null } });
    if (!response) throw new NotFoundException('Review response not found');
    const updated = await this.reviewResponsesRepository.updateReviewResponse(response.id, { body: dto.body });
    return { data: { id: updated.id, body: updated.body, createdAt: updated.createdAt }, message: 'Review response updated successfully.' };
  }

  async deleteResponse(user: AuthUserContext, reviewId: string) {
    await this.getOwnedReview(user.uid, reviewId);
    const response = await this.reviewResponsesRepository.findReviewResponseForProvider({ where: { reviewId, providerId: user.uid, deletedAt: null } });
    if (!response) throw new NotFoundException('Review response not found');
    await this.reviewResponsesRepository.softDeleteReviewResponse(response.id);
    return { data: null, message: 'Review response deleted successfully.' };
  }

  private async getOwnedProviderOrder(providerId: string, id: string): Promise<ProviderOrder & { order: { id: string; orderNumber: string; userId: string } }> { const order = await this.interactionsRepository.findProviderOrderForChat({ where: { id, providerId }, include: { order: { select: { id: true, orderNumber: true, userId: true } } } }); if (!order) throw new NotFoundException('Provider order not found'); return order; }
  private async getOwnedThread(providerId: string, threadId: string) { const thread = await this.buyerChatRepository.findThreadForProvider({ where: { id: threadId, providerId }, include: this.threadInclude() }); if (!thread) throw new NotFoundException('Chat thread not found'); return thread; }
  private threadInclude() { return { order: { select: { id: true, orderNumber: true, userId: true } }, customer: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, isActive: true } }, lastMessage: { select: { body: true, createdAt: true } } } satisfies Prisma.ChatThreadInclude; }
  private async chatSummary(thread: ThreadView) { return { threadId: thread.id, providerOrderId: thread.providerOrderId, orderNumber: thread.order.orderNumber, customer: this.customer(thread.customer), lastMessage: thread.lastMessage, unreadCount: await this.unreadCount(thread.id) }; }
  private async chatListItem(thread: ThreadView) { return { id: thread.id, orderNumber: thread.order.orderNumber, customer: this.customer(thread.customer), lastMessage: thread.lastMessage, unreadCount: await this.unreadCount(thread.id) }; }
  private async unreadCount(threadId: string): Promise<number> { return this.buyerChatRepository.countUnreadForProvider(threadId); }
  private customer(customer: CustomerView) { return { id: customer.id, name: `${customer.firstName} ${customer.lastName}`.trim(), avatarUrl: customer.avatarUrl, isOnline: customer.isActive }; }
  private messageItem(message: { id: string; senderType: ChatSenderType; body: string | null; messageType: ChatMessageType; attachmentUrlsJson: Prisma.JsonValue; createdAt: Date; isReadByCustomer: boolean; isReadByProvider: boolean }) { return { id: message.id, senderType: message.senderType, body: message.body, attachmentUrls: this.stringArray(message.attachmentUrlsJson), messageType: message.messageType, createdAt: message.createdAt, isRead: message.senderType === ChatSenderType.PROVIDER ? message.isReadByCustomer : message.isReadByProvider }; }
  private assertMessagePayload(dto: SendProviderChatMessageDto): void { const attachments = dto.attachmentUrls ?? []; if (dto.messageType === ChatMessageType.TEXT && !dto.body?.trim()) throw new BadRequestException('body is required for TEXT messages'); if (dto.messageType !== ChatMessageType.TEXT && attachments.length === 0) throw new BadRequestException('attachmentUrls are required for attachment messages'); }
  private publicReviewWhere(providerId: string): Prisma.ReviewWhereInput { return { providerId, deletedAt: null, status: { notIn: [ReviewStatus.HIDDEN, ReviewStatus.REMOVED] } }; }
  private reviewInclude() { return { customer: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } }, order: { select: { id: true, orderNumber: true, createdAt: true } }, response: { select: { id: true, body: true, createdAt: true, deletedAt: true } } } satisfies Prisma.ReviewInclude; }
  private async getOwnedReview(providerId: string, id: string): Promise<ReviewWithRelations> { const review = await this.reviewsRepository.findReviewForProvider({ where: { id, ...this.publicReviewWhere(providerId) }, include: this.reviewInclude() }); if (!review) throw new NotFoundException('Review not found'); return review; }
  private reviewOrder(sortBy?: ProviderReviewSortBy, sortOrder?: SortOrder): Prisma.ReviewOrderByWithRelationInput { const order = sortOrder === SortOrder.ASC ? 'asc' : 'desc'; return sortBy === ProviderReviewSortBy.RATING ? { rating: order } : { createdAt: order }; }
  private reviewItem(review: ReviewWithRelations) { return { id: review.id, orderId: review.order.id, orderNumber: review.order.orderNumber, customer: this.customer(review.customer), rating: review.rating, comment: review.comment, createdAt: review.createdAt, isNew: Date.now() - review.createdAt.getTime() < 7 * 24 * 60 * 60 * 1000, likesCount: review.likesCount, response: review.response && !review.response.deletedAt ? { id: review.response.id, body: review.response.body, createdAt: review.response.createdAt } : null }; }
  private ratingDistribution(rows: { rating: number; _count?: true | { _all?: number } }[], total: number) { const distribution = { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 }; for (const row of rows) distribution[String(row.rating) as keyof typeof distribution] = total ? Math.round((this.groupCount(row._count) / total) * 100) : 0; return distribution; }
  private groupCount(count?: true | { _all?: number }): number { return count && typeof count === 'object' ? count._all ?? 0 : 0; }
  private stringArray(value: Prisma.JsonValue): string[] { return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []; }
  private round(value: number): number { return Math.round(value * 100) / 100; }
}
