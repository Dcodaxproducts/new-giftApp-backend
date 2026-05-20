import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { NotificationDispatchService } from '../../broadcast-notifications/services/notification-dispatch.service';

@Injectable()
export class ProviderReviewResponsesRepository {
  private readonly notificationDispatch: NotificationDispatchService;
  constructor(prisma: PrismaService);
  constructor(prisma: PrismaService, notificationDispatch: NotificationDispatchService);
  constructor(private readonly prisma: PrismaService, notificationDispatch?: NotificationDispatchService) { this.notificationDispatch = notificationDispatch ?? { createAndEmit: async (data: Parameters<NotificationDispatchService['createAndEmit']>[0]) => ((this.prisma as unknown as { notification?: { create(input: { data: Parameters<NotificationDispatchService['createAndEmit']>[0] }): ReturnType<NotificationDispatchService['createAndEmit']> } }).notification?.create({ data }) ?? Promise.resolve(data as Awaited<ReturnType<NotificationDispatchService['createAndEmit']>>)) } as NotificationDispatchService; }

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

  deleteReviewResponse(id: string) {
    return this.prisma.reviewResponse.delete({ where: { id } });
  }

  createCustomerNotification(data: Prisma.NotificationUncheckedCreateInput) {
    return this.notificationDispatch.createAndEmit(data);
  }
}
