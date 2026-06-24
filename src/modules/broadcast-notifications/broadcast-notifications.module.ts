import { Global, Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuditLogWriterRepository } from '../../common/repositories/audit-log-writer.repository';
import { AuditLogWriterService } from '../../common/services/audit-log.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { BroadcastNotificationsController } from './broadcast-notifications.controller';
import { BroadcastNotificationsService } from './broadcast-notifications.service';
import { BroadcastNotificationsRepository } from './broadcast-notifications.repository';

@Global()
@Module({
  imports: [ConfigModule, JwtModule.register({}), DatabaseModule, NotificationsModule],
  controllers: [BroadcastNotificationsController],
  providers: [AuditLogWriterRepository,
    AuditLogWriterService,
    BroadcastNotificationsService,
    BroadcastNotificationsRepository,
  ],
  exports: [NotificationsModule],
})
export class BroadcastNotificationsModule {}
