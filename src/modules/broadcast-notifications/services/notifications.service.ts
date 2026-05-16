import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Notification, NotificationPreference, Prisma } from '@prisma/client';
import { AuthUserContext } from '../../../common/decorators/current-user.decorator';
import { AuditLogWriterService } from '../../../common/services/audit-log.service';
import { DeviceTokensRepository } from '../repositories/device-tokens.repository';
import { NotificationPreferencesRepository } from '../repositories/notification-preferences.repository';
import { NotificationsRepository } from '../repositories/notifications.repository';
import { DeviceTokenDto, ListNotificationsDto, NotificationActionDto, NotificationActionRequestDto, NotificationFilterDto, NotificationTypeDto, SortOrder, UpdateNotificationPreferencesDto } from '../dto/broadcast-notifications.dto';
import { NotificationsGateway } from '../notifications.gateway';

type NotificationMetadata = { eventId?: string; contactId?: string; giftId?: string; orderId?: string; snoozedUntil?: string };
type NotificationAction = { key: NotificationActionDto; label: string; style: 'PRIMARY' | 'SECONDARY' };

@Injectable()
export class NotificationsService {
  constructor(
    private readonly notificationsRepository: NotificationsRepository,
    private readonly notificationPreferencesRepository: NotificationPreferencesRepository,
    private readonly deviceTokensRepository: DeviceTokensRepository,
    private readonly auditLog: AuditLogWriterService,
    private readonly gateway: NotificationsGateway,
  ) {}

  async list(user: AuthUserContext, query: ListNotificationsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const where = this.where(user.uid, query);
    const [items, total] = await this.notificationsRepository.findNotificationsAndCount({ where, orderBy: { createdAt: query.sortOrder === SortOrder.ASC ? 'asc' : 'desc' }, skip: (page - 1) * limit, take: limit });
    const mapped = items.map((item) => this.toItem(item));
    const meta = { page, limit, total, totalPages: Math.ceil(total / limit) };
    if (query.groupByDate) {
      const data = { summaryText: this.summaryText(query, total), groups: this.groupByDate(mapped) };
      return { data, meta, message: total === 0 && query.filter === NotificationFilterDto.UNREAD ? 'No unread notifications.' : 'Notifications fetched successfully' };
    }
    return { data: mapped, meta, message: 'Notifications fetched successfully' };
  }

  async summary(user: AuthUserContext) {
    const base = { recipientId: user.uid, deletedAt: null };
    const { total, unread, birthdays, deliveries, newContacts } = await this.notificationsRepository.countSummary(base);
    return { data: { total, unread, birthdays, deliveries, newContacts }, message: 'Notification summary fetched successfully' };
  }

  async markRead(user: AuthUserContext, id: string) {
    const notification = await this.getOwnedNotification(user.uid, id);
    const updated = await this.notificationsRepository.markRead(id);
    await this.auditLog.write({ actorId: user.uid, targetId: id, targetType: 'NOTIFICATION', action: 'NOTIFICATION_MARKED_READ', beforeJson: { isRead: notification.isRead }, afterJson: { isRead: updated.isRead } });
    this.gateway.emitToUser(user.uid, 'notification.read', { notificationId: id });
    return { data: { id, isRead: true, readAt: updated.readAt }, message: 'Notification marked as read' };
  }

  async markAllRead(user: AuthUserContext) {
    await this.notificationsRepository.markAllRead(user.uid);
    await this.auditLog.write({ actorId: user.uid, targetId: user.uid, targetType: 'NOTIFICATION', action: 'NOTIFICATIONS_MARKED_READ', afterJson: { all: true } });
    this.gateway.emitToUser(user.uid, 'notification.read', { all: true });
    return { data: null, message: 'All notifications marked as read' };
  }

  async action(user: AuthUserContext, id: string, dto: NotificationActionRequestDto) {
    const notification = await this.getOwnedNotification(user.uid, id);
    const metadata = this.metadata(notification.metadataJson);
    const deepLink = this.deepLink(dto.action, metadata);
    if (dto.action === NotificationActionDto.REMIND_ME_LATER) await this.snooze(notification, metadata);
    return { data: { action: dto.action, deepLink }, message: 'Notification action processed successfully.' };
  }

  async preferences(user: AuthUserContext) { return { data: this.toPreferences(await this.getOrCreatePreferences(user.uid)), message: 'Notification preferences fetched successfully' }; }

  async updatePreferences(user: AuthUserContext, dto: UpdateNotificationPreferencesDto) {
    await this.getOrCreatePreferences(user.uid);
    const updated = await this.notificationPreferencesRepository.updatePreferences(user.uid, { pushEnabled: dto.pushEnabled, emailEnabled: dto.emailEnabled, smsEnabled: dto.smsEnabled, dealUpdatesEnabled: dto.dealUpdatesEnabled, birthdayRemindersEnabled: dto.birthdayRemindersEnabled, deliveryUpdatesEnabled: dto.deliveryUpdatesEnabled, newContactAlertsEnabled: dto.newContactAlertsEnabled, providerOrderAlertsJson: dto.providerOrderAlerts, providerAccountActivityJson: dto.providerAccountActivity, providerMarketingUpdatesJson: dto.providerMarketingUpdates });
    return { data: this.toPreferences(updated), message: 'Notification preferences updated successfully' };
  }

  async saveDeviceToken(user: AuthUserContext, dto: DeviceTokenDto) {
    const token = await this.deviceTokensRepository.upsertDeviceToken(user.uid, dto);
    return { data: { id: token.id, platform: token.platform, deviceId: token.deviceId, isActive: token.isActive }, message: 'Device token saved successfully' };
  }

  async deleteDeviceToken(user: AuthUserContext, id: string) {
    const token = await this.deviceTokensRepository.findOwnedDeviceToken(user.uid, id);
    if (!token) throw new NotFoundException('Device token not found');
    await this.deviceTokensRepository.disableDeviceToken(id);
    return { data: null, message: 'Device token deleted successfully' };
  }

  private where(userId: string, query: ListNotificationsDto): Prisma.NotificationWhereInput { return { recipientId: userId, deletedAt: null, isRead: query.filter === NotificationFilterDto.UNREAD ? false : query.isRead, type: this.filterType(query.filter) ?? query.type }; }
  private filterType(filter?: NotificationFilterDto): NotificationTypeDto | undefined { if (filter === NotificationFilterDto.BIRTHDAYS) return NotificationTypeDto.BIRTHDAY_REMINDER; if (filter === NotificationFilterDto.DELIVERIES) return NotificationTypeDto.GIFT_DELIVERED; if (filter === NotificationFilterDto.NEW_CONTACTS) return NotificationTypeDto.NEW_CONTACT_AVAILABLE; return undefined; }
  private async getOwnedNotification(userId: string, id: string): Promise<Notification> { const notification = await this.notificationsRepository.findOwnedNotification(userId, id); if (!notification) throw new NotFoundException('Notification not found'); return notification; }
  private async getOrCreatePreferences(userId: string): Promise<NotificationPreference> { return (await this.notificationPreferencesRepository.findPreferences(userId)) ?? this.notificationPreferencesRepository.createPreferences(userId); }
  private toPreferences(preferences: NotificationPreference) { return { pushEnabled: preferences.pushEnabled, emailEnabled: preferences.emailEnabled, smsEnabled: preferences.smsEnabled, dealUpdatesEnabled: preferences.dealUpdatesEnabled, birthdayRemindersEnabled: preferences.birthdayRemindersEnabled, deliveryUpdatesEnabled: preferences.deliveryUpdatesEnabled, newContactAlertsEnabled: preferences.newContactAlertsEnabled, providerOrderAlerts: this.providerJson(preferences.providerOrderAlertsJson, { newOrders: true, orderCancellations: true, orderDelays: false }), providerAccountActivity: this.providerJson(preferences.providerAccountActivityJson, { securityAlerts: true, loginFromNewDevice: true }), providerMarketingUpdates: this.providerJson(preferences.providerMarketingUpdatesJson, { weeklyPerformanceSummary: true, newFeatureAnnouncements: false, promotionalOffers: false }) }; }
  private providerJson(value: Prisma.JsonValue, fallback: Record<string, boolean>): Record<string, boolean> { return value && typeof value === 'object' && !Array.isArray(value) ? { ...fallback, ...(value as Record<string, boolean>) } : fallback; }
  private metadata(value: Prisma.JsonValue | null | undefined): NotificationMetadata { if (!value || typeof value !== 'object' || Array.isArray(value)) return {}; const source = value as Record<string, unknown>; return { eventId: typeof source.eventId === 'string' ? source.eventId : undefined, contactId: typeof source.contactId === 'string' ? source.contactId : undefined, giftId: typeof source.giftId === 'string' ? source.giftId : undefined, orderId: typeof source.orderId === 'string' ? source.orderId : undefined, snoozedUntil: typeof source.snoozedUntil === 'string' ? source.snoozedUntil : undefined }; }
  private actions(item: Notification): NotificationAction[] { if (Array.isArray(item.actionsJson)) return item.actionsJson.filter((action): action is NotificationAction => typeof action === 'object' && action !== null && 'key' in action && 'label' in action && 'style' in action); if (item.type === 'BIRTHDAY_REMINDER') return [{ key: NotificationActionDto.SEND_GIFT, label: 'Send Gift', style: 'PRIMARY' }, { key: NotificationActionDto.REMIND_ME_LATER, label: 'Remind Me Later', style: 'SECONDARY' }]; if (item.type === 'GIFT_DELIVERED') return [{ key: NotificationActionDto.VIEW_ORDER, label: 'View Order', style: 'PRIMARY' }]; if (item.type === 'NEW_CONTACT_AVAILABLE') return [{ key: NotificationActionDto.VIEW_CONTACT, label: 'View Contact', style: 'PRIMARY' }]; return []; }
  private deepLink(action: NotificationActionDto, metadata: NotificationMetadata): string { if (action === NotificationActionDto.SEND_GIFT) return `/customer/gifts?eventId=${metadata.eventId ?? ''}&contactId=${metadata.contactId ?? ''}`; if (action === NotificationActionDto.REMIND_ME_LATER) return `/customer/events/${metadata.eventId ?? ''}`; if (action === NotificationActionDto.VIEW_ORDER) return `/customer/orders/${metadata.orderId ?? ''}`; if (action === NotificationActionDto.VIEW_CONTACT) return `/customer/contacts/${metadata.contactId ?? ''}`; throw new BadRequestException('Unsupported notification action'); }
  private async snooze(notification: Notification, metadata: NotificationMetadata): Promise<void> { const snoozedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); await this.notificationsRepository.updateMetadata(notification.id, { ...metadata, snoozedUntil }); }
  private toItem(item: Notification) { const metadata = this.metadata(item.metadataJson); return { id: item.id, type: item.type, title: item.title, message: item.message, imageUrl: item.imageUrl, iconKey: item.iconKey, isRead: item.isRead, createdAt: item.createdAt, timeAgo: this.timeAgo(item.createdAt), metadata, actions: this.actions(item) }; }
  private timeAgo(date: Date): string { const diff = Math.max(0, Date.now() - date.getTime()); const hours = Math.floor(diff / 3_600_000); if (hours > 0) return `${hours}h ago`; const minutes = Math.floor(diff / 60_000); return minutes > 0 ? `${minutes}m ago` : 'Just now'; }
  private groupByDate(items: ReturnType<NotificationsService['toItem']>[]) { const groups = new Map<string, typeof items>(); for (const item of items) { const label = this.dateLabel(item.createdAt); groups.set(label, [...(groups.get(label) ?? []), item]); } return [...groups.entries()].map(([label, groupItems]) => ({ label, items: groupItems })); }
  private dateLabel(date: Date): string { const today = new Date(); const yday = new Date(today.getTime() - 24 * 60 * 60 * 1000); const key = date.toISOString().slice(0, 10); if (key === today.toISOString().slice(0, 10)) return 'Today'; if (key === yday.toISOString().slice(0, 10)) return 'Yesterday'; return key; }
  private summaryText(query: ListNotificationsDto, total: number): string { if (total === 0 && query.filter === NotificationFilterDto.UNREAD) return 'No unread notifications'; if (query.filter === NotificationFilterDto.BIRTHDAYS) return `Showing ${total} birthdays notification${total === 1 ? '' : 's'}`; return `Showing ${total} notification${total === 1 ? '' : 's'}`; }
}
