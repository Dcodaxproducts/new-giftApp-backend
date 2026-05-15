import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ProviderReviewResponsesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findReviewResponseForProvider(args: Prisma.ReviewResponseFindFirstArgs) {
    return this.prisma.reviewResponse.findFirst(args);
  }

  createReviewResponse(data: Prisma.ReviewResponseUncheckedCreateInput) {
    return this.prisma.reviewResponse.create({ data });
  }

  updateReviewResponseByReviewId(reviewId: string, data: Prisma.ReviewResponseUncheckedUpdateInput) {
    return this.prisma.reviewResponse.update({ where: { reviewId }, data });
  }

  updateReviewResponse(id: string, data: Prisma.ReviewResponseUpdateInput) {
    return this.prisma.reviewResponse.update({ where: { id }, data });
  }

  softDeleteReviewResponse(id: string) {
    return this.prisma.reviewResponse.delete({ where: { id } });
  }

  createCustomerNotification(data: Prisma.NotificationCreateInput) {
    return this.prisma.notification.create({ data });
  }
}
