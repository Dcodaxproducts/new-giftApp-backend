import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AuditLogWriterRepository } from '../../common/repositories/audit-log-writer.repository';
import { AuditLogWriterService } from '../../common/services/audit-log.service';
import { PromotionalOffersManagementController } from './promotional-offers-management.controller';
import { PromotionalOffersRepository } from './promotional-offers.repository';
import { PromotionalOffersService } from './promotional-offers.service';
import { ProviderOffersRepository } from './provider-offers.repository';
import { ProviderPromotionalOffersController } from './provider-promotional-offers.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [ProviderPromotionalOffersController, PromotionalOffersManagementController],
  providers: [PromotionalOffersService, PromotionalOffersRepository, ProviderOffersRepository, AuditLogWriterRepository, AuditLogWriterService],
})
export class PromotionalOffersModule {}
