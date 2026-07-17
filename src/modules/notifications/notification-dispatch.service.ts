import { Injectable, Logger } from '@nestjs/common';
import { Notification, NotificationRecipientType, Prisma } from '@prisma/client';
import { MailerService } from '../mailer/mailer.service';
import { NotificationsGateway } from './notifications.gateway';
import { PushService } from './push.service';
import { NotificationsRepository } from './repositories/notifications.repository';

type NotificationChannel = 'IN_APP' | 'SOCKET' | 'PUSH' | 'EMAIL';
type NotificationPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
const DEFAULT_CHANNELS: NotificationChannel[] = ['IN_APP', 'SOCKET', 'PUSH'];
export type DispatchNotificationInput = {
  recipientId: string;
  recipientType: 'SUPER_ADMIN' | 'ADMIN' | 'PROVIDER' | 'REGISTERED_USER' | NotificationRecipientType;
  title: string;
  message: string;
  type?: string;
  metadata?: Record<string, unknown>;
  metadataJson?: Prisma.InputJsonValue;
  channels?: NotificationChannel[];
  priority?: NotificationPriority;
  idempotencyKey?: string;
};
type NotificationPayload = { id: string; title: string; message: string; isRead: boolean; createdAt: Date };

@Injectable()
export class NotificationDispatchService {
  private readonly logger = new Logger(NotificationDispatchService.name);

  constructor(
    private readonly notificationsRepository: NotificationsRepository,
    private readonly gateway: NotificationsGateway,
    private readonly mailer: MailerService,
    private readonly push: PushService,
  ) {}

  async dispatch(input: DispatchNotificationInput): Promise<Notification> {
    const channels: NotificationChannel[] = input.channels?.length ? Array.from(new Set(['IN_APP', ...input.channels])) : DEFAULT_CHANNELS;
    let notification: Notification | null = null;
    try {
      if (channels.includes('IN_APP')) {
        notification = await this.notificationsRepository.createNotification({ recipientId: input.recipientId, recipientType: input.recipientType as NotificationRecipientType, title: input.title, message: input.message });
      }
    } catch (error) {
      this.logger.warn(`In-app notification failed: ${this.errorMessage(error)}`);
      throw error;
    }
    if (!notification) throw new Error('In-app notification was not persisted');
    await this.deliverSideChannels(notification, input, channels);
    return notification;
  }

  async createAndEmit(input: DispatchNotificationInput): Promise<Notification> {
    return this.dispatch({
      recipientId: input.recipientId,
      recipientType: input.recipientType,
      title: input.title,
      message: input.message,
      type: input.type,
      metadata: input.metadata,
      metadataJson: input.metadataJson,
      channels: 'channels' in input ? input.channels : DEFAULT_CHANNELS,
      priority: 'priority' in input ? input.priority : undefined,
      idempotencyKey: 'idempotencyKey' in input ? input.idempotencyKey : undefined,
    });
  }

  async emitExisting(notification: Notification): Promise<void> {
    this.emitToUser(notification.recipientId, notification);
  }

  emitToUser(userId: string, notification: Notification): void { this.gateway.emitToUser(userId, 'notification.received', this.toPayload(notification)); }
  emitRead(userId: string, payload: unknown): void { this.gateway.emitToUser(userId, 'notification.read', payload); }
  toPayload(notification: Notification): NotificationPayload { return { id: notification.id, title: notification.title, message: notification.message, isRead: notification.isRead, createdAt: notification.createdAt }; }

  private async deliverSideChannels(notification: Notification | null, input: DispatchNotificationInput, channels: NotificationChannel[]): Promise<void> {
    if (channels.includes('SOCKET') && notification) this.emitToUser(input.recipientId, notification);
    if (channels.includes('EMAIL')) {
      try {
        const recipient = await this.notificationsRepository.findRecipientEmail(input.recipientId);
        if (recipient?.email) await this.mailer.sendProviderMessageEmail(recipient.email, input.title, input.message);
      } catch (error) {
        this.logger.warn(`Notification email failed: ${this.errorMessage(error)}`);
      }
    }
    if (channels.includes('PUSH')) {
      await this.push.sendToUser(input.recipientId, { title: input.title, body: input.message, data: this.pushData(notification, input) });
    }
  }

  private pushData(notification: Notification | null, input: DispatchNotificationInput): Record<string, unknown> {
    const metadata = input.metadata ?? (this.isObjectRecord(input.metadataJson) ? input.metadataJson : {});
    return { notificationId: notification?.id, type: input.type, ...metadata };
  }

  private isObjectRecord(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null && !Array.isArray(value); }
  private errorMessage(error: unknown): string { return error instanceof Error ? error.message : 'Notification delivery failed'; }
}
