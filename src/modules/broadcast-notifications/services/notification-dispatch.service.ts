import { Injectable } from '@nestjs/common';
import { Notification, Prisma } from '@prisma/client';
import { NotificationsGateway } from '../notifications.gateway';
import { NotificationPreferencesRepository } from '../repositories/notification-preferences.repository';
import { NotificationsRepository } from '../repositories/notifications.repository';

type NotificationInput = Prisma.NotificationUncheckedCreateInput;
type NotificationPayload = {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  metadata: Prisma.JsonValue;
  createdAt: Date;
};

@Injectable()
export class NotificationDispatchService {
  constructor(
    private readonly notificationsRepository: NotificationsRepository,
    private readonly notificationPreferencesRepository: NotificationPreferencesRepository,
    private readonly gateway: NotificationsGateway,
  ) {}

  async createAndEmit(input: NotificationInput): Promise<Notification> {
    const notification = await this.notificationsRepository.createNotification(input);
    await this.emitExisting(notification);
    return notification;
  }

  async emitExisting(notification: Notification): Promise<void> {
    if (!(await this.shouldEmit(notification.recipientId))) return;
    this.emitToUser(notification.recipientId, notification);
  }

  emitToUser(userId: string, notification: Notification): void {
    this.gateway.emitToUser(userId, 'notification.received', this.toPayload(notification));
  }

  emitRead(userId: string, payload: unknown): void {
    this.gateway.emitToUser(userId, 'notification.read', payload);
  }

  toPayload(notification: Notification): NotificationPayload {
    return {
      id: notification.id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      isRead: notification.isRead,
      metadata: this.sanitizeMetadata(notification.metadataJson),
      createdAt: notification.createdAt,
    };
  }

  private async shouldEmit(userId: string): Promise<boolean> {
    const preferences = await this.notificationPreferencesRepository.findPreferences(userId);
    return preferences?.inAppEnabled !== false;
  }

  private sanitizeMetadata(value: Prisma.JsonValue): Prisma.JsonValue {
    if (!value || typeof value !== 'object') return value ?? {};
    if (Array.isArray(value)) return value.map((item) => this.sanitizeMetadata(item));
    const sanitized: Record<string, Prisma.JsonValue> = {};
    for (const [key, raw] of Object.entries(value)) {
      if (this.isSensitiveKey(key)) continue;
      sanitized[key] = this.sanitizeMetadata(raw as Prisma.JsonValue);
    }
    return sanitized;
  }

  private isSensitiveKey(key: string): boolean {
    return /(secret|token|password|clientSecret|authorization|stripe.*secret|bank|iban|accountNumber|cardNumber|cvc|cvv|raw)/i.test(key);
  }
}
