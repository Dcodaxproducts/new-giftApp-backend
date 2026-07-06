import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AuditLogWriterRepository } from '../../common/repositories/audit-log-writer.repository';
import { AuditLogWriterService } from '../../common/services/audit-log.service';
import { GiftCategoriesController } from './controllers/gift-categories.controller';
import { GiftManagementRepository } from './gift-management.repository';
import { GiftManagementService } from './services/gift-management.service';
import { GiftsController } from './controllers/gifts.controller';
import { BroadcastNotificationsModule } from '../broadcast-notifications/broadcast-notifications.module';

@Module({
  imports: [BroadcastNotificationsModule, DatabaseModule],
  controllers: [GiftCategoriesController, GiftsController],
  providers: [GiftManagementService, GiftManagementRepository, AuditLogWriterRepository, AuditLogWriterService],
})
export class GiftManagementModule {}
