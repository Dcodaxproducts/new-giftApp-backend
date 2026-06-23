import { Injectable, Logger } from '@nestjs/common';
import { Notification, NotificationDeliveryLog, NotificationDeliveryStatus, NotificationRecipientType, Prisma } from '@prisma/client';
import { MailerService } from '../mailer/mailer.service';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationDeliveryLogRepository } from './repositories/notification-delivery-log.repository';
import { NotificationPreferencesRepository } from './repositories/notification-preferences.repository';
import { NotificationsRepository } from './repositories/notifications.repository';

type NotificationChannel = 'IN_APP' | 'SOCKET' | 'PUSH' | 'EMAIL';
type NotificationPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
export type DispatchNotificationInput = {
  recipientId: string;
  recipientType: 'SUPER_ADMIN' | 'ADMIN' | 'PROVIDER' | 'REGISTERED_USER' | NotificationRecipientType;
  title: string;
  message: string;
  type: string;
  metadata?: Record<string, unknown>;
  metadataJson?: Prisma.InputJsonValue;
  channels?: NotificationChannel[];
  priority?: NotificationPriority;
  idempotencyKey?: string;
};
type NotificationPayload = { id: string; title: string; message: string; type: string; isRead: boolean; metadata: Prisma.JsonValue; createdAt: Date };

@Injectable()
export class NotificationDispatchService {
  private readonly logger = new Logger(NotificationDispatchService.name);

  constructor(
    private readonly notificationsRepository: NotificationsRepository,
    private readonly notificationPreferencesRepository: NotificationPreferencesRepository,
    private readonly gateway: NotificationsGateway,
    private readonly deliveryLogs: NotificationDeliveryLogRepository,
    private readonly mailer: MailerService,
  ) {}

  async dispatch(input: DispatchNotificationInput): Promise<Notification> {
    if (input.idempotencyKey) {
      const existing = await this.deliveryLogs.findByIdempotencyKey(input.idempotencyKey);
      if (existing?.notificationId) {
        const existingNotification = await this.notificationsRepository.findById(existing.notificationId);
        if (existingNotification) return existingNotification;
      }
    }
    const channels: NotificationChannel[] = input.channels?.length ? Array.from(new Set(['IN_APP', ...input.channels])) : ['IN_APP', 'SOCKET'];
    const metadata = this.sanitizeMetadata((input.metadataJson ?? input.metadata ?? {}) as Prisma.JsonValue) as Prisma.InputJsonValue;
    const preferences = await this.notificationPreferencesRepository.findPreferences(input.recipientId);
    const effectiveChannels = channels.filter((channel) => {
      if (channel === 'PUSH') return preferences?.pushEnabled !== false;
      if (channel === 'EMAIL') return preferences?.emailEnabled !== false;
      return true;
    });
    let notification: Notification | null = null;
    let inAppStatus: NotificationDeliveryStatus = channels.includes('IN_APP') ? NotificationDeliveryStatus.QUEUED : NotificationDeliveryStatus.SKIPPED;
    const log = await this.deliveryLogs.create({
      notificationId: null,
      recipientId: input.recipientId,
      recipientType: input.recipientType as NotificationRecipientType,
      notificationType: input.type,
      channelsJson: effectiveChannels,
      idempotencyKey: input.idempotencyKey,
      inAppStatus,
      socketStatus: effectiveChannels.includes('SOCKET') ? NotificationDeliveryStatus.QUEUED : NotificationDeliveryStatus.SKIPPED,
      pushStatus: channels.includes('PUSH') ? (effectiveChannels.includes('PUSH') ? NotificationDeliveryStatus.QUEUED : NotificationDeliveryStatus.SKIPPED) : NotificationDeliveryStatus.SKIPPED,
      emailStatus: channels.includes('EMAIL') ? (effectiveChannels.includes('EMAIL') ? NotificationDeliveryStatus.QUEUED : NotificationDeliveryStatus.SKIPPED) : NotificationDeliveryStatus.SKIPPED,
    });
    try {
      if (effectiveChannels.includes('IN_APP')) {
        notification = await this.notificationsRepository.createNotification({ recipientId: input.recipientId, recipientType: input.recipientType as NotificationRecipientType, title: input.title, message: input.message, type: input.type, metadataJson: metadata });
        inAppStatus = NotificationDeliveryStatus.DELIVERED;
        await this.deliveryLogs.update(log.id, { notificationId: notification.id, inAppStatus });
      }
    } catch (error) {
      await this.deliveryLogs.update(log.id, { inAppStatus: NotificationDeliveryStatus.FAILED, lastError: this.errorMessage(error) });
      this.logger.warn(`In-app notification failed: ${this.errorMessage(error)}`);
      throw error;
    }
    if (!notification) throw new Error('In-app notification was not persisted');
    await this.deliverSideChannels(log.id, notification, { ...input, metadataJson: metadata }, effectiveChannels, preferences);
    return notification;
  }

  async createAndEmit(input: Prisma.NotificationUncheckedCreateInput | DispatchNotificationInput): Promise<Notification> {
    return this.dispatch({
      recipientId: input.recipientId,
      recipientType: input.recipientType,
      title: input.title,
      message: input.message,
      type: input.type ?? 'SYSTEM',
      metadataJson: 'metadataJson' in input ? (input.metadataJson as Prisma.InputJsonValue | undefined) : undefined,
      channels: 'channels' in input ? input.channels : ['IN_APP', 'SOCKET'],
      priority: 'priority' in input ? input.priority : undefined,
      idempotencyKey: 'idempotencyKey' in input ? input.idempotencyKey : undefined,
    });
  }

  async emitExisting(notification: Notification): Promise<void> {
    if (!(await this.shouldEmit(notification.recipientId))) return;
    this.emitToUser(notification.recipientId, notification);
  }

  async retryDelivery(log: NotificationDeliveryLog): Promise<NotificationDeliveryLog> {
    const channels = this.asChannels(log.channelsJson).filter((channel) => channel !== 'IN_APP');
    const notification = log.notificationId ? await this.notificationsRepository.findById(log.notificationId) : null;
    await this.deliverSideChannels(log.id, notification, { recipientId: log.recipientId, recipientType: log.recipientType, title: notification?.title ?? log.notificationType, message: notification?.message ?? log.notificationType, type: log.notificationType, channels }, channels);
    const updated = await this.deliveryLogs.findById(log.id);
    return updated ?? log;
  }

  emitToUser(userId: string, notification: Notification): void { this.gateway.emitToUser(userId, 'notification.received', this.toPayload(notification)); }
  emitRead(userId: string, payload: unknown): void { this.gateway.emitToUser(userId, 'notification.read', payload); }
  toPayload(notification: Notification): NotificationPayload { return { id: notification.id, title: notification.title, message: notification.message, type: notification.type, isRead: notification.isRead, metadata: this.sanitizeMetadata(notification.metadataJson), createdAt: notification.createdAt }; }

  private async deliverSideChannels(logId: string, notification: Notification | null, input: DispatchNotificationInput, channels: NotificationChannel[], preferences?: Awaited<ReturnType<NotificationPreferencesRepository['findPreferences']>>): Promise<void> {
    if (channels.includes('SOCKET')) await this.safeChannel(logId, 'socketStatus', () => { if (!notification || preferences?.inAppEnabled === false) return NotificationDeliveryStatus.SKIPPED; this.emitToUser(input.recipientId, notification); return NotificationDeliveryStatus.DELIVERED; });
    if (channels.includes('PUSH')) await this.safeChannel(logId, 'pushStatus', () => preferences?.pushEnabled === false ? NotificationDeliveryStatus.SKIPPED : NotificationDeliveryStatus.DELIVERED);
    if (channels.includes('EMAIL')) await this.safeChannel(logId, 'emailStatus', async () => {
      if (preferences?.emailEnabled === false) return NotificationDeliveryStatus.SKIPPED;
      const recipient = await this.deliveryLogs.findRecipientEmail(input.recipientId);
      if (!recipient?.email) return NotificationDeliveryStatus.SKIPPED;
      await this.mailer.sendProviderMessageEmail(recipient.email, input.title, input.message);
      return NotificationDeliveryStatus.DELIVERED;
    });
  }

  private async safeChannel(logId: string, field: 'socketStatus' | 'pushStatus' | 'emailStatus', fn: () => NotificationDeliveryStatus | Promise<NotificationDeliveryStatus>): Promise<void> {
    try { await this.deliveryLogs.update(logId, { [field]: await fn(), lastError: null }); }
    catch (error) { await this.deliveryLogs.update(logId, { [field]: NotificationDeliveryStatus.FAILED, lastError: this.errorMessage(error) }); this.logger.warn(`Notification ${field} failed: ${this.errorMessage(error)}`); }
  }

  private async shouldEmit(userId: string): Promise<boolean> { const preferences = await this.notificationPreferencesRepository.findPreferences(userId); return preferences?.inAppEnabled !== false; }
  private sanitizeMetadata(value: Prisma.JsonValue): Prisma.JsonValue { if (!value || typeof value !== 'object') return value ?? {}; if (Array.isArray(value)) return value.map((item) => this.sanitizeMetadata(item)); const sanitized: Record<string, Prisma.JsonValue> = {}; for (const [key, raw] of Object.entries(value)) { if (this.isSensitiveKey(key)) continue; sanitized[key] = this.sanitizeMetadata(raw as Prisma.JsonValue); } return sanitized; }
  private isSensitiveKey(key: string): boolean { return /(secret|token|password|clientSecret|authorization|stripe.*secret|bank|iban|accountNumber|cardNumber|cvc|cvv|raw)/i.test(key); }
  private asChannels(value: Prisma.JsonValue): NotificationChannel[] { return Array.isArray(value) ? value.filter((channel): channel is NotificationChannel => typeof channel === 'string' && ['IN_APP', 'SOCKET', 'PUSH', 'EMAIL'].includes(channel)) : []; }
  private errorMessage(error: unknown): string { return error instanceof Error ? error.message : 'Notification delivery failed'; }
}
