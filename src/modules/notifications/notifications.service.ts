import { Injectable, NotFoundException } from '@nestjs/common';
import { Notification, Prisma } from '@prisma/client';
import { AuthUserContext } from '../../common/decorators/current-user.decorator';
import { AuditLogWriterService } from '../../common/services/audit-log.service';
import { NotificationsRepository } from './repositories/notifications.repository';
import { ListNotificationsDto, NotificationFilterDto, RegisterDeviceTokenDto, SortOrder, UnregisterDeviceTokenDto } from './dto/notifications.dto';
import { NotificationDispatchService } from './notification-dispatch.service';
import { PushService } from './push.service';
import { getPagination } from '../../common/pagination/pagination.util';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly notificationsRepository: NotificationsRepository,
    private readonly auditLog: AuditLogWriterService,
    private readonly notificationDispatch: NotificationDispatchService,
    private readonly push: PushService,
  ) {}

  async registerDeviceToken(user: AuthUserContext, dto: RegisterDeviceTokenDto) {
    const device = await this.push.registerDevice(user.uid, { token: dto.token, platform: dto.platform, deviceId: dto.deviceId });
    return { data: { id: device.id, platform: device.platform }, message: 'Device registered for push notifications' };
  }

  async unregisterDeviceToken(user: AuthUserContext, dto: UnregisterDeviceTokenDto) {
    await this.push.unregisterDevice(user.uid, dto.token);
    return { data: null, message: 'Device unregistered from push notifications' };
  }

  async list(user: AuthUserContext, query: ListNotificationsDto) {
    const { page, limit, skip, take } = getPagination(query);
    const where = this.where(user.uid, query);
    const [items, total] = await this.notificationsRepository.findNotificationsAndCount({ where, orderBy: { createdAt: query.sortOrder === SortOrder.ASC ? 'asc' : 'desc' }, skip, take });
    const mapped = items.map((item) => this.toItem(item));
    const meta = { page, limit, total, totalPages: Math.ceil(total / limit) };
    if (query.groupByDate) {
      const data = { summaryText: this.summaryText(query, total), groups: this.groupByDate(mapped) };
      return { data, meta, message: total === 0 && query.filter === NotificationFilterDto.UNREAD ? 'No unread notifications.' : 'Notifications fetched successfully' };
    }
    return { data: mapped, meta, message: 'Notifications fetched successfully' };
  }

  async summary(user: AuthUserContext) {
    const { total, unread } = await this.notificationsRepository.countSummary({ recipientId: user.uid });
    return { data: { total, unread }, message: 'Notification summary fetched successfully' };
  }

  async markRead(user: AuthUserContext, id: string) {
    const notification = await this.getOwnedNotification(user.uid, id);
    const updated = await this.notificationsRepository.markRead(id);
    await this.auditLog.write({ actorId: user.uid, targetId: id, targetType: 'NOTIFICATION', action: 'NOTIFICATION_MARKED_READ', beforeJson: { isRead: notification.isRead }, afterJson: { isRead: updated.isRead } });
    this.notificationDispatch.emitRead(user.uid, { notificationId: id });
    return { data: { id, isRead: true, readAt: updated.readAt }, message: 'Notification marked as read' };
  }

  async markAllRead(user: AuthUserContext) {
    await this.notificationsRepository.markAllRead(user.uid);
    await this.auditLog.write({ actorId: user.uid, targetId: user.uid, targetType: 'NOTIFICATION', action: 'NOTIFICATIONS_MARKED_READ', afterJson: { all: true } });
    this.notificationDispatch.emitRead(user.uid, { all: true });
    return { data: null, message: 'All notifications marked as read' };
  }

  private where(userId: string, query: ListNotificationsDto): Prisma.NotificationWhereInput { return { recipientId: userId, isRead: query.filter === NotificationFilterDto.UNREAD ? false : query.isRead }; }
  private async getOwnedNotification(userId: string, id: string): Promise<Notification> { const notification = await this.notificationsRepository.findOwnedNotification(userId, id); if (!notification) throw new NotFoundException('Notification not found'); return notification; }
  private toItem(item: Notification) { return { id: item.id, title: item.title, message: item.message, isRead: item.isRead, createdAt: item.createdAt, timeAgo: this.timeAgo(item.createdAt) }; }
  private timeAgo(date: Date): string { const diff = Math.max(0, Date.now() - date.getTime()); const hours = Math.floor(diff / 3_600_000); if (hours > 0) return `${hours}h ago`; const minutes = Math.floor(diff / 60_000); return minutes > 0 ? `${minutes}m ago` : 'Just now'; }
  private groupByDate(items: ReturnType<NotificationsService['toItem']>[]) { const groups = new Map<string, typeof items>(); for (const item of items) { const label = this.dateLabel(item.createdAt); groups.set(label, [...(groups.get(label) ?? []), item]); } return [...groups.entries()].map(([label, groupItems]) => ({ label, items: groupItems })); }
  private dateLabel(date: Date): string { const today = new Date(); const yday = new Date(today.getTime() - 24 * 60 * 60 * 1000); const key = date.toISOString().slice(0, 10); if (key === today.toISOString().slice(0, 10)) return 'Today'; if (key === yday.toISOString().slice(0, 10)) return 'Yesterday'; return key; }
  private summaryText(query: ListNotificationsDto, total: number): string { if (total === 0 && query.filter === NotificationFilterDto.UNREAD) return 'No unread notifications'; return `Showing ${total} notification${total === 1 ? '' : 's'}`; }
}
