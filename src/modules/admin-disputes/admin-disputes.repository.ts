import { Injectable } from '@nestjs/common';
import { DisputeStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { DispatchNotificationInput, NotificationDispatchService } from '../notifications/notification-dispatch.service';

export const DISPUTE_INCLUDE = Prisma.validator<Prisma.DisputeInclude>()({
  user: { select: { id: true, firstName: true, lastName: true, email: true } },
  provider: { select: { id: true, firstName: true, lastName: true, email: true, providerProfile: { select: { businessName: true } } } },
  order: { select: { id: true, orderNumber: true, status: true, createdAt: true } },
});

@Injectable()
export class AdminDisputesRepository {
  constructor(private readonly prisma: PrismaService, private readonly notificationDispatch: NotificationDispatchService) {}

  countStats(where: Prisma.DisputeWhereInput) {
    return this.prisma.$transaction([
      this.prisma.dispute.count({ where }),
      this.prisma.dispute.count({ where: { ...where, status: this.status('PENDING') } }),
      this.prisma.dispute.count({ where: { ...where, status: this.status('APPROVED') } }),
      this.prisma.dispute.count({ where: { ...where, status: this.status('REJECTED') } }),
    ]);
  }

  findDisputesAndCount(params: { where: Prisma.DisputeWhereInput; orderBy: Prisma.DisputeOrderByWithRelationInput; skip: number; take: number }) {
    return this.prisma.$transaction([
      this.prisma.dispute.findMany({ where: params.where, include: DISPUTE_INCLUDE, orderBy: params.orderBy, skip: params.skip, take: params.take }),
      this.prisma.dispute.count({ where: params.where }),
    ]);
  }

  findById(id: string) {
    return this.prisma.dispute.findUnique({ where: { id }, include: DISPUTE_INCLUDE });
  }

  create(data: Prisma.DisputeUncheckedCreateInput & Record<string, unknown>) {
    return this.prisma.dispute.create({ data: data as Prisma.DisputeUncheckedCreateInput, include: DISPUTE_INCLUDE });
  }

  updateStatus(id: string, data: Prisma.DisputeUpdateInput & Record<string, unknown>) {
    return this.prisma.dispute.update({ where: { id }, data: data as Prisma.DisputeUpdateInput, include: DISPUTE_INCLUDE });
  }

  findCustomerOrder(userId: string, orderId: string) {
    return this.prisma.order.findFirst({ where: { id: orderId, userId } });
  }

  findCustomerDisputesAndCount(params: { userId: string; orderBy: Prisma.DisputeOrderByWithRelationInput; skip: number; take: number }) {
    return this.prisma.$transaction([
      this.prisma.dispute.findMany({ where: { userId: params.userId }, include: DISPUTE_INCLUDE, orderBy: params.orderBy, skip: params.skip, take: params.take }),
      this.prisma.dispute.count({ where: { userId: params.userId } }),
    ]);
  }

  findCustomerDispute(userId: string, id: string) {
    return this.prisma.dispute.findFirst({ where: { id, userId }, include: DISPUTE_INCLUDE });
  }

  findProviderDisputesAndCount(params: { providerId: string; orderBy: Prisma.DisputeOrderByWithRelationInput; skip: number; take: number }) {
    return this.prisma.$transaction([
      this.prisma.dispute.findMany({ where: { providerId: params.providerId }, include: DISPUTE_INCLUDE, orderBy: params.orderBy, skip: params.skip, take: params.take }),
      this.prisma.dispute.count({ where: { providerId: params.providerId } }),
    ]);
  }

  findProviderDispute(providerId: string, id: string) {
    return this.prisma.dispute.findFirst({ where: { id, providerId }, include: DISPUTE_INCLUDE });
  }

  respondAsProvider(id: string, data: Prisma.DisputeUpdateInput & Record<string, unknown>) {
    return this.prisma.dispute.update({ where: { id }, data: data as Prisma.DisputeUpdateInput, include: DISPUTE_INCLUDE });
  }

  createNotification(data: DispatchNotificationInput) {
    return this.notificationDispatch.createAndEmit(data);
  }

  private status(value: string): DisputeStatus {
    return value as DisputeStatus;
  }
}
