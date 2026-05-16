import { Injectable } from '@nestjs/common';
import { NotificationRecipientType, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

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
    const [total, unread, birthdays, deliveries, newContacts] = await this.prisma.$transaction([
      this.prisma.notification.count({ where: base }),
      this.prisma.notification.count({ where: { ...base, isRead: false } }),
      this.prisma.notification.count({ where: { ...base, type: 'BIRTHDAY_REMINDER' } }),
      this.prisma.notification.count({ where: { ...base, type: 'GIFT_DELIVERED' } }),
      this.prisma.notification.count({ where: { ...base, type: 'NEW_CONTACT_AVAILABLE' } }),
    ]);
    return { total, unread, birthdays, deliveries, newContacts };
  }

  findOwnedNotification(userId: string, id: string) {
    return this.prisma.notification.findFirst({ where: { id, recipientId: userId, deletedAt: null } });
  }

  markRead(id: string) {
    return this.prisma.notification.update({ where: { id }, data: { isRead: true, readAt: new Date() } });
  }

  markAllRead(userId: string) {
    return this.prisma.notification.updateMany({ where: { recipientId: userId, isRead: false, deletedAt: null }, data: { isRead: true, readAt: new Date() } });
  }

  updateMetadata(id: string, metadataJson: Prisma.InputJsonValue) {
    return this.prisma.notification.update({ where: { id }, data: { metadataJson } });
  }

  createInAppBroadcastNotification(input: {
    recipientId: string;
    recipientType: NotificationRecipientType;
    broadcastId: string;
    title: string;
    message: string;
    imageUrl: string | null;
    ctaUrl: string | null;
  }) {
    return this.prisma.notification.create({
      data: {
        recipientId: input.recipientId,
        recipientType: input.recipientType,
        broadcastId: input.broadcastId,
        title: input.title,
        message: input.message,
        imageUrl: input.imageUrl,
        ctaUrl: input.ctaUrl,
        type: 'BROADCAST',
      },
    });
  }
}
