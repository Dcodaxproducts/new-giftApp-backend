import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AuditLogWriterRepository } from '../../common/repositories/audit-log-writer.repository';
import { AuditLogWriterService } from '../../common/services/audit-log.service';
import { BroadcastNotificationsModule } from '../broadcast-notifications/broadcast-notifications.module';
import { PromotionalOffersManagementController } from './controllers/promotional-offers-management.controller';
import { PromotionalOffersRepository } from './repositories/promotional-offers.repository';
import { PromotionalOffersService } from './services/promotional-offers.service';
import { ProviderOffersRepository } from './repositories/provider-offers.repository';
import { ProviderPromotionalOffersController } from './controllers/provider-promotional-offers.controller';

@Module({
  imports: [BroadcastNotificationsModule, DatabaseModule],
  controllers: [ProviderPromotionalOffersController, PromotionalOffersManagementController],
  providers: [PromotionalOffersService, PromotionalOffersRepository, ProviderOffersRepository, AuditLogWriterRepository, AuditLogWriterService],
})
export class PromotionalOffersModule {}
