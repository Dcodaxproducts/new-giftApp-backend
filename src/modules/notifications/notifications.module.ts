import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from '../../database/database.module';
import { AuditLogWriterRepository } from '../../common/repositories/audit-log-writer.repository';
import { AuditLogWriterService } from '../../common/services/audit-log.service';
import { MailerModule } from '../mailer/mailer.module';
import { DeviceTokensRepository } from './repositories/device-tokens.repository';
import { NotificationDeliveryLogRepository } from './repositories/notification-delivery-log.repository';
import { NotificationPreferencesRepository } from './repositories/notification-preferences.repository';
import { NotificationsRepository } from './repositories/notifications.repository';
import { NotificationDeliveryMonitoringController } from './notification-delivery-monitoring.controller';
import { NotificationDeliveryMonitoringService } from './notification-delivery-monitoring.service';
import { NotificationDispatchService } from './notification-dispatch.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsService } from './notifications.service';

@Global()
@Module({
  imports: [ConfigModule, JwtModule.register({}), DatabaseModule, MailerModule],
  controllers: [NotificationsController, NotificationDeliveryMonitoringController],
  providers: [
    AuditLogWriterRepository,
    AuditLogWriterService,
    NotificationsService,
    NotificationDeliveryMonitoringService,
    NotificationsRepository,
    NotificationDeliveryLogRepository,
    NotificationPreferencesRepository,
    DeviceTokensRepository,
    NotificationsGateway,
    NotificationDispatchService,
  ],
  exports: [NotificationDispatchService, NotificationsGateway],
})
export class NotificationsModule {}
