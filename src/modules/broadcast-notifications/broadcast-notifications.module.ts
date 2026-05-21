import { Global, Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuditLogWriterRepository } from '../../common/repositories/audit-log-writer.repository';
import { AuditLogWriterService } from '../../common/services/audit-log.service';
import { MailerModule } from '../mailer/mailer.module';
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
import { NotificationDeliveryMonitoringController } from './controllers/notification-delivery-monitoring.controller';
import { NotificationsController } from './controllers/notifications.controller';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationDeliveryLogRepository } from './repositories/notification-delivery-log.repository';
import { NotificationsRepository } from './repositories/notifications.repository';
import { NotificationDeliveryMonitoringService } from './services/notification-delivery-monitoring.service';
import { NotificationDispatchService } from './services/notification-dispatch.service';
import { NotificationsService } from './services/notifications.service';

@Global()
@Module({
  imports: [ConfigModule, JwtModule.register({}), DatabaseModule, MailerModule],
  controllers: [BroadcastsController, NotificationsController, NotificationDeliveryMonitoringController],
  providers: [AuditLogWriterRepository,
    AuditLogWriterService,
    BroadcastsService,
    BroadcastNotificationsRepository,
    BroadcastRecipientsRepository,
    BroadcastDeliveryRepository,
    BroadcastQueueRepository,
    NotificationsService,
    NotificationDeliveryMonitoringService,
    NotificationsRepository,
    NotificationDeliveryLogRepository,
    NotificationPreferencesRepository,
    DeviceTokensRepository,
    BroadcastQueueService,
    BroadcastDeliveryService,
    NotificationsGateway,
    NotificationDispatchService,
    EmailNotificationAdapter,
    PushNotificationAdapter,
    InAppNotificationAdapter,
    NotificationAdapterRegistry,
  ],
  exports: [NotificationDispatchService, NotificationsGateway],
})
export class BroadcastNotificationsModule {}
