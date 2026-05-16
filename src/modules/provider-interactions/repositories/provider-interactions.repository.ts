import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class ProviderInteractionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findProviderOrderForChat<T extends Prisma.ProviderOrderFindFirstArgs>(args: T): Promise<Prisma.ProviderOrderGetPayload<T> | null> {
    return this.prisma.providerOrder.findFirst(args) as Promise<Prisma.ProviderOrderGetPayload<T> | null>;
  }

  findReviewSummary(where: Prisma.ReviewWhereInput) {
    return this.prisma.$transaction([
      this.prisma.review.aggregate({ where, _avg: { rating: true } }),
      this.prisma.review.count({ where }),
      this.prisma.review.groupBy({ by: ['rating'], where, orderBy: { rating: 'asc' }, _count: { _all: true } }),
    ]);
  }

  findReviewsAndCount<T extends Prisma.ReviewFindManyArgs & { where: Prisma.ReviewWhereInput }>(args: T): Promise<[Prisma.ReviewGetPayload<T>[], number]> {
    return this.prisma.$transaction([
      this.prisma.review.findMany(args),
      this.prisma.review.count({ where: args.where }),
    ]) as Promise<[Prisma.ReviewGetPayload<T>[], number]>;
  }

  findReviewForProvider<T extends Prisma.ReviewFindFirstArgs>(args: T): Promise<Prisma.ReviewGetPayload<T> | null> {
    return this.prisma.review.findFirst(args) as Promise<Prisma.ReviewGetPayload<T> | null>;
  }

  findReviewResponse(args: Prisma.ReviewResponseFindFirstArgs) {
    return this.prisma.reviewResponse.findFirst(args);
  }

  createReviewResponse(data: Prisma.ReviewResponseUncheckedCreateInput) {
    return this.prisma.reviewResponse.create({ data });
  }

  updateReviewResponseByReviewId(reviewId: string, data: Prisma.ReviewResponseUncheckedUpdateInput) {
    return this.prisma.reviewResponse.update({ where: { reviewId }, data });
  }

  updateReviewResponseById(id: string, data: Prisma.ReviewResponseUpdateInput) {
    return this.prisma.reviewResponse.update({ where: { id }, data });
  }

  deleteReviewResponse(id: string) {
    return this.prisma.reviewResponse.delete({ where: { id } });
  }

  createRegisteredUserNotification(data: Prisma.NotificationCreateInput) {
    return this.prisma.notification.create({ data });
  }
}
