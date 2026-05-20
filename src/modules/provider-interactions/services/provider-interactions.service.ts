import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { NotificationRecipientType, Prisma, ReviewStatus } from '@prisma/client';
import { AuthUserContext } from '../../../common/decorators/current-user.decorator';
import { ProviderReviewResponsesRepository } from '../repositories/provider-review-responses.repository';
import { ProviderReviewsRepository } from '../repositories/provider-reviews.repository';
import { ListProviderReviewsDto, ProviderReviewSortBy, SortOrder, ReviewResponseDto } from '../dto/provider-interactions.dto';

type CustomerView = { id: string; firstName: string; lastName: string; avatarUrl: string | null; isActive?: boolean };
type ReviewWithRelations = { id: string; orderId: string; rating: number; comment: string; createdAt: Date; likesCount: number; userId: string; response: { id: string; body: string; createdAt: Date; deletedAt: Date | null } | null; customer: { id: string; firstName: string; lastName: string; avatarUrl: string | null }; order: { id: string; orderNumber: string; createdAt: Date } };

@Injectable()
export class ProviderInteractionsService {
  constructor(
    private readonly reviewsRepository: ProviderReviewsRepository,
    private readonly reviewResponsesRepository: ProviderReviewResponsesRepository,
  ) {}

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
    await this.reviewResponsesRepository.createCustomerNotification({ recipientId: review.userId, recipientType: NotificationRecipientType.REGISTERED_USER, title: 'Provider responded to your review', message: dto.body, type: 'REVIEW_RESPONSE', metadataJson: { reviewId, responseId: response.id } });
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
    await this.reviewResponsesRepository.deleteReviewResponse(response.id);
    return { data: null, message: 'Review response deleted successfully.' };
  }

  private customer(customer: CustomerView) { return { id: customer.id, name: [customer.firstName, customer.lastName].filter(Boolean).join(' '), avatarUrl: customer.avatarUrl, isOnline: customer.isActive }; }
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
