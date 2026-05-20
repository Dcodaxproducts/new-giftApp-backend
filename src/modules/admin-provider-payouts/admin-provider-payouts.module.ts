import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AuditLogWriterRepository } from '../../common/repositories/audit-log-writer.repository';
import { AuditLogWriterService } from '../../common/services/audit-log.service';
import { AdminProviderPayoutsController } from './controllers/admin-provider-payouts.controller';
import { AdminProviderPayoutsRepository } from './repositories/admin-provider-payouts.repository';
import { AdminProviderPayoutsService } from './services/admin-provider-payouts.service';
import { BroadcastNotificationsModule } from '../broadcast-notifications/broadcast-notifications.module';

@Module({
  imports: [BroadcastNotificationsModule, DatabaseModule],
  controllers: [AdminProviderPayoutsController],
  providers: [AdminProviderPayoutsService, AdminProviderPayoutsRepository, AuditLogWriterRepository, AuditLogWriterService],
})
export class AdminProviderPayoutsModule {}