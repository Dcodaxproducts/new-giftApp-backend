import { Injectable } from '@nestjs/common';
import { Prisma, ReviewStatus, ReviewSeverity } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { DispatchNotificationInput, NotificationDispatchService } from '../notifications/notification-dispatch.service';

export const ADMIN_REVIEW_INCLUDE = Prisma.validator<Prisma.ReviewInclude>()({
  customer: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } },
  provider: { select: { id: true, providerProfile: { select: { businessName: true } }, firstName: true, lastName: true } },
  order: { select: { id: true, orderNumber: true, createdAt: true, payment: { select: { id: true, providerPaymentIntentId: true, createdAt: true } } } },
  response: { where: { deletedAt: null }, select: { id: true, body: true, createdAt: true } },
});

type ReviewUpdateData = Prisma.Args<PrismaService['review'], 'update'>['data'];
type NotificationCreateManyData = DispatchNotificationInput[];

@Injectable()
export class AdminReviewsRepository {
  constructor(private readonly prisma: PrismaService, private readonly notificationDispatch: NotificationDispatchService) {}

  getDashboardRows(params: { weekAgo: Date; dayAgo: Date }) {
    return this.prisma.$transaction([
      this.prisma.review.aggregate({ where: { deletedAt: null }, _avg: { rating: true } }),
      this.prisma.review.count({ where: { deletedAt: null } }),
      this.prisma.review.count({ where: { deletedAt: null, createdAt: { gte: params.weekAgo } } }),
      this.prisma.review.count({ where: { deletedAt: null, status: ReviewStatus.FLAGGED } }),
      this.prisma.review.count({ where: { deletedAt: null, status: ReviewStatus.FLAGGED, severity: ReviewSeverity.CRITICAL } }),
      this.prisma.review.count({ where: { deletedAt: null, autoModerated: true } }),
      this.prisma.review.groupBy({ by: ['severity'], where: { deletedAt: null, status: ReviewStatus.FLAGGED, createdAt: { gte: params.dayAgo } }, orderBy: { severity: 'asc' }, _count: { _all: true } }),
    ]);
  }

  getReviewStatsRows(params: { where: Prisma.ReviewWhereInput }) {
    return Promise.all([
      this.prisma.review.aggregate({ where: params.where, _avg: { rating: true } }),
      this.prisma.review.count({ where: params.where }),
      this.prisma.review.count({ where: { ...params.where, status: ReviewStatus.FLAGGED } }),
      this.prisma.review.count({ where: { ...params.where, status: ReviewStatus.REMOVED } }),
      this.prisma.review.count({ where: { ...params.where, status: ReviewStatus.HIDDEN } }),
      this.prisma.review.count({ where: { ...params.where, status: ReviewStatus.PUBLISHED } }),
      Promise.resolve(0),
      Promise.resolve(0),
      this.prisma.review.groupBy({ by: ['rating'], where: params.where, orderBy: { rating: 'asc' }, _count: { _all: true } }),
    ]);
  }

  findReviewsAndCount(params: { where: Prisma.ReviewWhereInput; orderBy: Prisma.ReviewOrderByWithRelationInput; skip: number; take: number }) {
    return this.prisma.$transaction([
      this.prisma.review.findMany({ where: params.where, include: ADMIN_REVIEW_INCLUDE, orderBy: params.orderBy, skip: params.skip, take: params.take }),
      this.prisma.review.count({ where: params.where }),
    ]);
  }

  findReviewById(id: string) { return this.prisma.review.findFirst({ where: { id, deletedAt: null }, include: ADMIN_REVIEW_INCLUDE }); }
  findReviewRawById(id: string) { return this.prisma.review.findFirst({ where: { id, deletedAt: null } }); }
  updateReview(id: string, data: ReviewUpdateData) { return this.prisma.review.update({ where: { id }, data }); }

  findFlaggedSummaryRows(windowStart: Date) { return this.prisma.review.groupBy({ by: ['severity'], where: { deletedAt: null, status: ReviewStatus.FLAGGED, createdAt: { gte: windowStart } }, orderBy: { severity: 'asc' }, _count: { _all: true } }); }

  findReviewsForExport(params: { where: Prisma.ReviewWhereInput; orderBy: Prisma.ReviewOrderByWithRelationInput }) {
    return this.prisma.review.findMany({ where: params.where, include: ADMIN_REVIEW_INCLUDE, orderBy: params.orderBy, take: 10000 });
  }

  createModerationNotifications(data: NotificationCreateManyData) { return Promise.all(data.map((notification) => this.notificationDispatch.createAndEmit(notification))); }
}
