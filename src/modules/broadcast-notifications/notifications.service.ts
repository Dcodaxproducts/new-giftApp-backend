import { Injectable, NotFoundException } from '@nestjs/common';
import { AuthUserContext } from '../../common/decorators/current-user.decorator';
import { AuditLogWriterService } from '../../common/services/audit-log.service';
import { PrismaService } from '../../database/prisma.service';
import { DeviceTokenDto, ListNotificationsDto } from './dto/broadcast-notifications.dto';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogWriterService,
    private readonly gateway: NotificationsGateway,
  ) {}

  async list(user: AuthUserContext, query: ListNotificationsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const where = { recipientId: user.uid, isRead: query.isRead, type: query.type };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.notification.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      this.prisma.notification.count({ where }),
    ]);
    return { data: items.map((item) => ({ id: item.id, title: item.title, message: item.message, type: item.type, imageUrl: item.imageUrl, ctaUrl: item.ctaUrl, isRead: item.isRead, createdAt: item.createdAt })), meta: { page, limit, total, totalPages: Math.ceil(total / limit) }, message: 'Notifications fetched successfully' };
  }

  async markRead(user: AuthUserContext, id: string) {
    const notification = await this.prisma.notification.findFirst({ where: { id, recipientId: user.uid } });
    if (!notification) throw new NotFoundException('Notification not found');
    const updated = await this.prisma.notification.update({ where: { id }, data: { isRead: true, readAt: new Date() } });
    await this.auditLog.write({ actorId: user.uid, targetId: id, targetType: 'NOTIFICATION', action: 'NOTIFICATION_MARKED_READ', beforeJson: { isRead: notification.isRead }, afterJson: { isRead: updated.isRead } });
    this.gateway.emitToUser(user.uid, 'notification.read', { notificationId: id });
    return { data: { id, isRead: true, readAt: updated.readAt }, message: 'Notification marked as read' };
  }

  async markAllRead(user: AuthUserContext) {
    await this.prisma.notification.updateMany({ where: { recipientId: user.uid, isRead: false }, data: { isRead: true, readAt: new Date() } });
    await this.auditLog.write({ actorId: user.uid, targetId: user.uid, targetType: 'NOTIFICATION', action: 'NOTIFICATIONS_MARKED_READ', afterJson: { all: true } });
    this.gateway.emitToUser(user.uid, 'notification.read', { all: true });
    return { data: null, message: 'All notifications marked as read' };
  }

  async saveDeviceToken(user: AuthUserContext, dto: DeviceTokenDto) {
    const token = await this.prisma.notificationDeviceToken.upsert({
      where: { userId_deviceId: { userId: user.uid, deviceId: dto.deviceId } },
      create: { userId: user.uid, token: dto.token, platform: dto.platform, deviceId: dto.deviceId, isActive: true, lastUsedAt: new Date() },
      update: { token: dto.token, platform: dto.platform, isActive: true, lastUsedAt: new Date() },
    });
    return { data: { id: token.id, platform: token.platform, deviceId: token.deviceId, isActive: token.isActive }, message: 'Device token saved successfully' };
  }

  async deleteDeviceToken(user: AuthUserContext, id: string) {
    const token = await this.prisma.notificationDeviceToken.findFirst({ where: { id, userId: user.uid } });
    if (!token) throw new NotFoundException('Device token not found');
    await this.prisma.notificationDeviceToken.update({ where: { id }, data: { isActive: false } });
    return { data: null, message: 'Device token deleted successfully' };
  }
}
