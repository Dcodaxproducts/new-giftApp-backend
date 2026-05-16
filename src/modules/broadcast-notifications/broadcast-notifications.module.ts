import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuditLogWriterRepository } from '../../common/repositories/audit-log-writer.repository';
import { AuditLogWriterService } from '../../common/services/audit-log.service';
import { PrismaService } from '../../database/prisma.service';
import { MailerService } from '../mailer/mailer.service';
import { BroadcastDeliveryRepository } from './repositories/broadcast-delivery.repository';
import { BroadcastDeliveryService } from './services/broadcast-delivery.service';
import { BroadcastNotificationsRepository } from './repositories/broadcast-notifications.repository';
import { BroadcastRecipientsRepository } from './repositories/broadcast-recipients.repository';
import { BroadcastQueueRepository } from './repositories/broadcast-queue.repository';
import { BroadcastQueueService } from './services/broadcast-queue.service';
import { BroadcastsController } from './controllers/broadcasts.controller';
import { BroadcastsService } from './services/broadcasts.service';
import { DeviceTokensRepository } from './repositories/device-tokens.repository';
import { NotificationPreferencesRepository } from './repositories/notification-preferences.repository';
import { EmailNotificationAdapter, InAppNotificationAdapter, NotificationAdapterRegistry, PushNotificationAdapter } from './notification-adapters';
import { NotificationsController } from './controllers/notifications.controller';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsRepository } from './repositories/notifications.repository';
import { NotificationsService } from './services/notifications.service';

@Module({
  imports: [ConfigModule, JwtModule.register({})],
  controllers: [BroadcastsController, NotificationsController],
  providers: [
    PrismaService,
    AuditLogWriterRepository,
    AuditLogWriterService,
    BroadcastsService,
    BroadcastNotificationsRepository,
    BroadcastRecipientsRepository,
    BroadcastDeliveryRepository,
    BroadcastQueueRepository,
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
