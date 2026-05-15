import { Injectable } from '@nestjs/common';
import { Prisma, ReviewStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

export const CUSTOMER_REVIEW_INCLUDE = Prisma.validator<Prisma.ReviewInclude>()({
  provider: { select: { id: true, providerBusinessName: true, firstName: true, lastName: true } },
  order: { select: { id: true, orderNumber: true } },
  response: { where: { deletedAt: null }, select: { id: true, body: true, createdAt: true } },
});

const ORDER_FOR_REVIEW_SELECT = Prisma.validator<Prisma.OrderSelect>()({
  id: true,
  orderNumber: true,
  status: true,
  userId: true,
  providerOrders: {
    select: { id: true, providerId: true, status: true, provider: { select: { id: true, providerBusinessName: true, avatarUrl: true, firstName: true, lastName: true, isActive: true } } },
    orderBy: { createdAt: 'asc' },
  },
});

type CreateReviewData = Prisma.Args<PrismaService['review'], 'create'>['data'];
type UpdateReviewData = Prisma.Args<PrismaService['review'], 'update'>['data'];
type CreateReviewModerationLogData = Prisma.Args<PrismaService['reviewModerationLog'], 'create'>['data'];
type CreateReviewNotificationData = Prisma.Args<PrismaService['notification'], 'create'>['data'];

@Injectable()
export class CustomerReviewsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findOrderForReviewByUser(customerId: string, orderId: string) {
    return this.prisma.order.findFirst({ where: { id: orderId, userId: customerId }, select: ORDER_FOR_REVIEW_SELECT });
  }

  findExistingReviewForProviderOrder(userId: string, providerOrderId: string, removedStatuses: ReviewStatus[]) {
    return this.prisma.review.findFirst({ where: { userId, providerOrderId, deletedAt: null, status: { notIn: removedStatuses } } });
  }

  findReviewCode(reviewCode: string) {
    return this.prisma.review.findUnique({ where: { reviewCode } });
  }

  createReview(data: CreateReviewData) {
    return this.prisma.review.create({ data });
  }

  findReviewsForUser(params: { where: Prisma.ReviewWhereInput; skip: number; take: number }) {
    return this.prisma.review.findMany({ where: params.where, include: CUSTOMER_REVIEW_INCLUDE, orderBy: { createdAt: 'desc' }, skip: params.skip, take: params.take });
  }

  countReviewsForUser(where: Prisma.ReviewWhereInput) {
    return this.prisma.review.count({ where });
  }

  findReviewsAndCountForUser(params: { where: Prisma.ReviewWhereInput; skip: number; take: number }) {
    return this.prisma.$transaction([
      this.findReviewsForUser(params),
      this.countReviewsForUser(params.where),
    ]);
  }

  findReviewForUser(userId: string, id: string) {
    return this.prisma.review.findFirst({ where: { id, userId, deletedAt: null }, include: CUSTOMER_REVIEW_INCLUDE });
  }

  updateReview(id: string, data: UpdateReviewData) {
    return this.prisma.review.update({ where: { id }, data });
  }

  softDeleteReview(id: string) {
    return this.prisma.review.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  createReviewNotification(data: CreateReviewNotificationData) {
    return this.prisma.notification.create({ data });
  }

  createReviewModerationLog(data: CreateReviewModerationLogData) {
    return this.prisma.reviewModerationLog.create({ data });
  }

  findProviderForOrder(customerId: string, providerId: string, orderId?: string) {
    return this.prisma.order.findFirst({ where: { userId: customerId, ...(orderId ? { id: orderId } : {}), providerOrders: { some: { providerId } } } });
  }
}
