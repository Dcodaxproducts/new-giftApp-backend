import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuditLogWriterService } from '../../common/services/audit-log.service';
import { PrismaService } from '../../database/prisma.service';
import { MailerService } from '../mailer/mailer.service';
import { BroadcastDeliveryService } from './broadcast-delivery.service';
import { BroadcastNotificationsRepository } from './broadcast-notifications.repository';
import { BroadcastRecipientsRepository } from './broadcast-recipients.repository';
import { BroadcastQueueService } from './broadcast-queue.service';
import { BroadcastsController } from './broadcasts.controller';
import { BroadcastsService } from './broadcasts.service';
import { DeviceTokensRepository } from './device-tokens.repository';
import { NotificationPreferencesRepository } from './notification-preferences.repository';
import { EmailNotificationAdapter, InAppNotificationAdapter, NotificationAdapterRegistry, PushNotificationAdapter } from './notification-adapters';
import { NotificationsController } from './notifications.controller';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsRepository } from './notifications.repository';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [ConfigModule, JwtModule.register({})],
  controllers: [BroadcastsController, NotificationsController],
  providers: [
    PrismaService,
    AuditLogWriterService,
    BroadcastsService,
    BroadcastNotificationsRepository,
    BroadcastRecipientsRepository,
    NotificationsService,
    NotificationsRepository,
    NotificationPreferencesRepository,
    DeviceTokensRepository,
    BroadcastQueueService,
    BroadcastDeliveryService,
    NotificationsGateway,
    MailerService,
    EmailNotificationAdapter,
    PushNotificationAdapter,
    InAppNotificationAdapter,
    NotificationAdapterRegistry,
  ],
})
export class BroadcastNotificationsModule {}
