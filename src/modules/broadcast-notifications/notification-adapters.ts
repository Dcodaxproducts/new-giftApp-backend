import { Injectable, Logger } from '@nestjs/common';
import { Broadcast, BroadcastChannel, NotificationRecipientType, User, UserRole } from '@prisma/client';
import { MailerService } from '../mailer/mailer.service';
import { NotificationsRepository } from './repositories/notifications.repository';

export interface DeliveryAdapterInput {
  broadcast: Broadcast;
  recipient: User;
  deliveryId: string;
}

@Injectable()
export class EmailNotificationAdapter {
  private readonly logger = new Logger(EmailNotificationAdapter.name);
  constructor(private readonly mailerService: MailerService) {}

  async send(input: DeliveryAdapterInput): Promise<string> {
    await this.mailerService.sendBroadcastEmail({
      to: input.recipient.email,
      title: input.broadcast.title,
      message: input.broadcast.message,
      imageUrl: input.broadcast.imageUrl,
      ctaLabel: input.broadcast.ctaLabel,
      ctaUrl: input.broadcast.ctaUrl,
    });
    this.logger.log(`Email delivery ${input.deliveryId} completed for ${input.recipient.email}`);
    return `email-${input.deliveryId}`;
  }
}

@Injectable()
export class PushNotificationAdapter {
  private readonly logger = new Logger(PushNotificationAdapter.name);
  send(input: DeliveryAdapterInput): Promise<string> {
    this.logger.log(`Mock push delivery ${input.deliveryId} to ${input.recipient.id}`);
    return Promise.resolve(`mock-push-${input.deliveryId}`);
  }
}

@Injectable()
export class InAppNotificationAdapter {
  constructor(private readonly notificationsRepository: NotificationsRepository) {}

  async send(input: DeliveryAdapterInput): Promise<string> {
    await this.notificationsRepository.createInAppBroadcastNotification({
      recipientId: input.recipient.id,
      recipientType: this.recipientType(input.recipient.role),
      broadcastId: input.broadcast.id,
      title: input.broadcast.title,
      message: input.broadcast.message,
      imageUrl: input.broadcast.imageUrl,
      ctaUrl: input.broadcast.ctaUrl,
    });
    return `in-app-${input.deliveryId}`;
  }

  private recipientType(role: UserRole): NotificationRecipientType {
    if (role === UserRole.PROVIDER) return NotificationRecipientType.PROVIDER;
    if (role === UserRole.REGISTERED_USER) return NotificationRecipientType.REGISTERED_USER;
    return NotificationRecipientType.ADMIN;
  }
}

@Injectable()
export class NotificationAdapterRegistry {
  constructor(
    private readonly email: EmailNotificationAdapter,
    private readonly push: PushNotificationAdapter,
    private readonly inApp: InAppNotificationAdapter,
  ) {}

  adapter(channel: BroadcastChannel) {
    if (channel === BroadcastChannel.EMAIL) return this.email;
    if (channel === BroadcastChannel.PUSH) return this.push;
    return this.inApp;
  }
}
