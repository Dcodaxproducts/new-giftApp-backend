import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ProviderReviewsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findReviewSummaryForProvider(where: Prisma.ReviewWhereInput) {
    return this.prisma.$transaction([
      this.prisma.review.aggregate({ where, _avg: { rating: true } }),
      this.prisma.review.count({ where }),
      this.prisma.review.groupBy({ by: ['rating'], where, orderBy: { rating: 'asc' }, _count: { _all: true } }),
    ]);
  }

  findReviewsForProvider<T extends Prisma.ReviewFindManyArgs>(args: T): Promise<Prisma.ReviewGetPayload<T>[]> {
    return this.prisma.review.findMany(args) as Promise<Prisma.ReviewGetPayload<T>[]>;
  }

  countReviewsForProvider(where: Prisma.ReviewWhereInput) {
    return this.prisma.review.count({ where });
  }

  findReviewForProvider<T extends Prisma.ReviewFindFirstArgs>(args: T): Promise<Prisma.ReviewGetPayload<T> | null> {
    return this.prisma.review.findFirst(args) as Promise<Prisma.ReviewGetPayload<T> | null>;
  }
}
