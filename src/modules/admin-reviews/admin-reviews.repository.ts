import { Injectable } from '@nestjs/common';
import { Prisma, ReviewStatus, ReviewSeverity } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

export const ADMIN_REVIEW_INCLUDE = Prisma.validator<Prisma.ReviewInclude>()({
  customer: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } },
  provider: { select: { id: true, providerBusinessName: true, firstName: true, lastName: true } },
  order: { select: { id: true, orderNumber: true, createdAt: true, payment: { select: { id: true, providerPaymentIntentId: true, createdAt: true } } } },
  response: { where: { deletedAt: null }, select: { id: true, body: true, createdAt: true } },
});

type ReviewUpdateData = Prisma.Args<PrismaService['review'], 'update'>['data'];
type ReviewModerationLogCreateData = Prisma.Args<PrismaService['reviewModerationLog'], 'create'>['data'];
type NotificationCreateManyData = Prisma.Args<PrismaService['notification'], 'createMany'>['data'];

@Injectable()
export class AdminReviewsRepository {
  constructor(private readonly prisma: PrismaService) {}

  getDashboardRows(params: { weekAgo: Date; dayAgo: Date }) {
    return this.prisma.$transaction([
      this.prisma.review.aggregate({ where: { deletedAt: null }, _avg: { rating: true } }),
      this.prisma.review.count({ where: { deletedAt: null } }),
      this.prisma.review.count({ where: { deletedAt: null, createdAt: { gte: params.weekAgo } } }),
      this.prisma.review.count({ where: { deletedAt: null, status: ReviewStatus.FLAGGED } }),
      this.prisma.review.count({ where: { deletedAt: null, status: ReviewStatus.FLAGGED, severity: ReviewSeverity.CRITICAL } }),
      this.prisma.review.count({ where: { deletedAt: null, autoModerated: true } }),
      this.prisma.reviewModerationLog.findMany({ orderBy: { createdAt: 'desc' }, take: 5, include: { review: { select: { reviewCode: true } } } }),
      this.prisma.review.groupBy({ by: ['severity'], where: { deletedAt: null, status: ReviewStatus.FLAGGED, createdAt: { gte: params.dayAgo } }, orderBy: { severity: 'asc' }, _count: { _all: true } }),
    ]);
  }

  getReviewStatsRows(params: { where: Prisma.ReviewWhereInput; logWhere: Prisma.ReviewModerationLogWhereInput }) {
    return this.prisma.$transaction([
      this.prisma.review.aggregate({ where: params.where, _avg: { rating: true } }),
      this.prisma.review.count({ where: params.where }),
      this.prisma.review.count({ where: { ...params.where, status: ReviewStatus.FLAGGED } }),
      this.prisma.review.count({ where: { ...params.where, status: ReviewStatus.REMOVED } }),
      this.prisma.review.count({ where: { ...params.where, status: ReviewStatus.HIDDEN } }),
      this.prisma.review.count({ where: { ...params.where, status: ReviewStatus.PUBLISHED } }),
      this.prisma.reviewModerationLog.count({ where: { autoModerated: true, ...params.logWhere } }),
      this.prisma.reviewModerationLog.count({ where: { autoModerated: false, ...params.logWhere } }),
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
  createReviewModerationLog(data: ReviewModerationLogCreateData) { return this.prisma.reviewModerationLog.create({ data }); }

  findReviewDetailsLogs(reviewId: string) { return this.prisma.reviewModerationLog.findMany({ where: { reviewId }, include: { actor: { select: { firstName: true, lastName: true } } }, orderBy: { createdAt: 'desc' }, take: 50 }); }
  findFlaggedSummaryRows(windowStart: Date) { return this.prisma.review.groupBy({ by: ['severity'], where: { deletedAt: null, status: ReviewStatus.FLAGGED, createdAt: { gte: windowStart } }, orderBy: { severity: 'asc' }, _count: { _all: true } }); }

  findModerationLogsAndCount(params: { where: Prisma.ReviewModerationLogWhereInput; skip: number; take: number }) {
    return this.prisma.$transaction([
      this.prisma.reviewModerationLog.findMany({ where: params.where, include: { review: { select: { reviewCode: true } }, actor: { select: { id: true, firstName: true, lastName: true } } }, orderBy: { createdAt: 'desc' }, skip: params.skip, take: params.take }),
      this.prisma.reviewModerationLog.count({ where: params.where }),
    ]);
  }

  findReviewsForExport(params: { where: Prisma.ReviewWhereInput; orderBy: Prisma.ReviewOrderByWithRelationInput }) {
    return this.prisma.review.findMany({ where: params.where, include: ADMIN_REVIEW_INCLUDE, orderBy: params.orderBy, take: 10000 });
  }

  findResponseTimingLogs() { return this.prisma.reviewModerationLog.findMany({ select: { createdAt: true, review: { select: { createdAt: true } } }, take: 200 }); }
  createModerationNotifications(data: NotificationCreateManyData) { return this.prisma.notification.createMany({ data }); }
}
