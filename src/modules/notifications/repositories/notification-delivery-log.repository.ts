import { Injectable } from '@nestjs/common';
import { NotificationDeliveryStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class NotificationDeliveryLogRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.notificationDeliveryLog.findUnique({ where: { id } });
  }

  findByIdempotencyKey(idempotencyKey: string) {
    return this.prisma.notificationDeliveryLog.findFirst({ where: { idempotencyKey } });
  }

  create(data: Prisma.NotificationDeliveryLogUncheckedCreateInput) {
    return this.prisma.notificationDeliveryLog.create({ data });
  }

  update(id: string, data: Prisma.NotificationDeliveryLogUncheckedUpdateInput) {
    return this.prisma.notificationDeliveryLog.update({ where: { id }, data });
  }

  findLogsAndCount(params: { where: Prisma.NotificationDeliveryLogWhereInput; skip: number; take: number; orderBy?: Prisma.NotificationDeliveryLogOrderByWithRelationInput }) {
    return this.prisma.$transaction([
      this.prisma.notificationDeliveryLog.findMany({ where: params.where, skip: params.skip, take: params.take, orderBy: params.orderBy ?? { createdAt: 'desc' } }),
      this.prisma.notificationDeliveryLog.count({ where: params.where }),
    ]);
  }

  async stats() {
    const [total, queued, delivered, failed, skipped, retried] = await this.prisma.$transaction([
      this.prisma.notificationDeliveryLog.count(),
      this.prisma.notificationDeliveryLog.count({ where: { OR: [{ inAppStatus: NotificationDeliveryStatus.QUEUED }, { socketStatus: NotificationDeliveryStatus.QUEUED }, { pushStatus: NotificationDeliveryStatus.QUEUED }, { emailStatus: NotificationDeliveryStatus.QUEUED }] } }),
      this.prisma.notificationDeliveryLog.count({ where: { OR: [{ inAppStatus: NotificationDeliveryStatus.DELIVERED }, { socketStatus: NotificationDeliveryStatus.DELIVERED }, { pushStatus: NotificationDeliveryStatus.DELIVERED }, { emailStatus: NotificationDeliveryStatus.DELIVERED }] } }),
      this.prisma.notificationDeliveryLog.count({ where: { OR: [{ inAppStatus: NotificationDeliveryStatus.FAILED }, { socketStatus: NotificationDeliveryStatus.FAILED }, { pushStatus: NotificationDeliveryStatus.FAILED }, { emailStatus: NotificationDeliveryStatus.FAILED }] } }),
      this.prisma.notificationDeliveryLog.count({ where: { OR: [{ inAppStatus: NotificationDeliveryStatus.SKIPPED }, { socketStatus: NotificationDeliveryStatus.SKIPPED }, { pushStatus: NotificationDeliveryStatus.SKIPPED }, { emailStatus: NotificationDeliveryStatus.SKIPPED }] } }),
      this.prisma.notificationDeliveryLog.count({ where: { OR: [{ inAppStatus: NotificationDeliveryStatus.RETRIED }, { socketStatus: NotificationDeliveryStatus.RETRIED }, { pushStatus: NotificationDeliveryStatus.RETRIED }, { emailStatus: NotificationDeliveryStatus.RETRIED }] } }),
    ]);
    return { total, queued, delivered, failed, skipped, retried };
  }

  findRecipientEmail(recipientId: string) {
    return this.prisma.user.findUnique({ where: { id: recipientId }, select: { email: true } });
  }
}
