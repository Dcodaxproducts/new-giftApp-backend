import { Injectable } from '@nestjs/common';
import { NotificationRecipientType, Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class NotificationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findManyNotifications(params: Prisma.NotificationFindManyArgs) {
    return this.prisma.notification.findMany(params);
  }

  countNotifications(where: Prisma.NotificationWhereInput) {
    return this.prisma.notification.count({ where });
  }

  findNotificationsAndCount(params: Prisma.NotificationFindManyArgs & { where: Prisma.NotificationWhereInput }) {
    return this.prisma.$transaction([
      this.findManyNotifications(params),
      this.countNotifications(params.where),
    ]);
  }

  async countSummary(base: Prisma.NotificationWhereInput) {
    const [total, unread] = await this.prisma.$transaction([
      this.prisma.notification.count({ where: base }),
      this.prisma.notification.count({ where: { ...base, isRead: false } }),
    ]);
    return { total, unread };
  }

  findById(id: string) {
    return this.prisma.notification.findUnique({ where: { id } });
  }

  findOwnedNotification(userId: string, id: string) {
    return this.prisma.notification.findFirst({ where: { id, recipientId: userId } });
  }

  markRead(id: string) {
    return this.prisma.notification.update({ where: { id }, data: { isRead: true, readAt: new Date() } });
  }

  markAllRead(userId: string) {
    return this.prisma.notification.updateMany({ where: { recipientId: userId, isRead: false }, data: { isRead: true, readAt: new Date() } });
  }

  createNotification(data: Prisma.NotificationUncheckedCreateInput) {
    return this.prisma.notification.create({ data });
  }

  findRecipientEmail(recipientId: string) {
    return this.prisma.user.findUnique({ where: { id: recipientId }, select: { email: true } });
  }

  createInAppBroadcastNotification(input: {
    recipientId: string;
    recipientType: NotificationRecipientType;
    broadcastId: string;
    title: string;
    message: string;
  }) {
    return this.prisma.notification.create({
      data: {
        recipientId: input.recipientId,
        recipientType: input.recipientType,
        broadcastId: input.broadcastId,
        title: input.title,
        message: input.message,
      },
    });
  }
}
