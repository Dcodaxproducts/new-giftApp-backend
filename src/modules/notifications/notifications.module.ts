import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from '../../database/database.module';
import { AuditLogWriterRepository } from '../../common/repositories/audit-log-writer.repository';
import { AuditLogWriterService } from '../../common/services/audit-log.service';
import { MailerModule } from '../mailer/mailer.module';
import { NotificationsRepository } from './repositories/notifications.repository';
import { PushRepository } from './repositories/push.repository';
import { NotificationDispatchService } from './notification-dispatch.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsService } from './notifications.service';
import { PushService } from './push.service';

@Global()
@Module({
  imports: [ConfigModule, JwtModule.register({}), DatabaseModule, MailerModule],
  controllers: [NotificationsController],
  providers: [
    AuditLogWriterRepository,
    AuditLogWriterService,
    NotificationsService,
    NotificationsRepository,
    NotificationsGateway,
    NotificationDispatchService,
    PushRepository,
    PushService,
  ],
  exports: [NotificationDispatchService, NotificationsGateway, PushService],
})
export class NotificationsModule {}
