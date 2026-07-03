import { Injectable, Logger } from '@nestjs/common';
import { Notification, NotificationRecipientType, Prisma } from '@prisma/client';
import { MailerService } from '../mailer/mailer.service';
import { NotificationsGateway } from './notifications.gateway';
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
    private readonly mailer: MailerService,
  ) {}

  async dispatch(input: DispatchNotificationInput): Promise<Notification> {
    const channels: NotificationChannel[] = input.channels?.length ? Array.from(new Set(['IN_APP', ...input.channels])) : ['IN_APP', 'SOCKET'];
    const metadata = this.sanitizeMetadata((input.metadataJson ?? input.metadata ?? {}) as Prisma.JsonValue) as Prisma.InputJsonValue;
    const preferences = await this.notificationPreferencesRepository.findPreferences(input.recipientId);
    const effectiveChannels = channels.filter((channel) => {
      if (channel === 'PUSH') return preferences?.pushEnabled !== false;
      if (channel === 'EMAIL') return preferences?.emailEnabled !== false;
      return true;
    });
    let notification: Notification | null = null;
    try {
      if (effectiveChannels.includes('IN_APP')) {
        notification = await this.notificationsRepository.createNotification({ recipientId: input.recipientId, recipientType: input.recipientType as NotificationRecipientType, title: input.title, message: input.message, type: input.type, metadataJson: metadata });
      }
    } catch (error) {
      this.logger.warn(`In-app notification failed: ${this.errorMessage(error)}`);
      throw error;
    }
    if (!notification) throw new Error('In-app notification was not persisted');
    await this.deliverSideChannels(notification, { ...input, metadataJson: metadata }, effectiveChannels, preferences);
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

  emitToUser(userId: string, notification: Notification): void { this.gateway.emitToUser(userId, 'notification.received', this.toPayload(notification)); }
  emitRead(userId: string, payload: unknown): void { this.gateway.emitToUser(userId, 'notification.read', payload); }
  toPayload(notification: Notification): NotificationPayload { return { id: notification.id, title: notification.title, message: notification.message, type: notification.type, isRead: notification.isRead, metadata: this.sanitizeMetadata(notification.metadataJson), createdAt: notification.createdAt }; }

  private async deliverSideChannels(notification: Notification | null, input: DispatchNotificationInput, channels: NotificationChannel[], preferences?: Awaited<ReturnType<NotificationPreferencesRepository['findPreferences']>>): Promise<void> {
    if (channels.includes('SOCKET') && notification && preferences?.inAppEnabled !== false) this.emitToUser(input.recipientId, notification);
    if (channels.includes('EMAIL') && preferences?.emailEnabled !== false) {
      try {
        const recipient = await this.notificationsRepository.findRecipientEmail(input.recipientId);
        if (recipient?.email) await this.mailer.sendProviderMessageEmail(recipient.email, input.title, input.message);
      } catch (error) {
        this.logger.warn(`Notification email failed: ${this.errorMessage(error)}`);
      }
    }
  }

  private async shouldEmit(userId: string): Promise<boolean> { const preferences = await this.notificationPreferencesRepository.findPreferences(userId); return preferences?.inAppEnabled !== false; }
  private sanitizeMetadata(value: Prisma.JsonValue): Prisma.JsonValue { if (!value || typeof value !== 'object') return value ?? {}; if (Array.isArray(value)) return value.map((item) => this.sanitizeMetadata(item)); const sanitized: Record<string, Prisma.JsonValue> = {}; for (const [key, raw] of Object.entries(value)) { if (this.isSensitiveKey(key)) continue; sanitized[key] = this.sanitizeMetadata(raw as Prisma.JsonValue); } return sanitized; }
  private isSensitiveKey(key: string): boolean { return /(secret|token|password|clientSecret|authorization|stripe.*secret|bank|iban|accountNumber|cardNumber|cvc|cvv|raw)/i.test(key); }
  private errorMessage(error: unknown): string { return error instanceof Error ? error.message : 'Notification delivery failed'; }
}
