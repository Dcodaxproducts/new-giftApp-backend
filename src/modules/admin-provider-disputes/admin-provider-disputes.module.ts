import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AuditLogWriterRepository } from '../../common/repositories/audit-log-writer.repository';
import { AuditLogWriterService } from '../../common/services/audit-log.service';
import { AdminProviderDisputesController } from './admin-provider-disputes.controller';
import { AdminProviderDisputesRepository } from './admin-provider-disputes.repository';
import { AdminProviderDisputesService } from './admin-provider-disputes.service';
import { ProviderDisputeEvidenceRepository } from './provider-dispute-evidence.repository';
import { ProviderDisputeFinancialRepository } from './provider-dispute-financial.repository';
import { ProviderDisputeLogsRepository } from './provider-dispute-logs.repository';
import { ProviderDisputeResolutionRepository } from './provider-dispute-resolution.repository';
import { ProviderDisputeRulingsRepository } from './provider-dispute-rulings.repository';
import { BroadcastNotificationsModule } from '../broadcast-notifications/broadcast-notifications.module';

@Module({
  imports: [BroadcastNotificationsModule, DatabaseModule],
  controllers: [AdminProviderDisputesController],
  providers: [
    AdminProviderDisputesService,
    AdminProviderDisputesRepository,
    ProviderDisputeEvidenceRepository,
    ProviderDisputeRulingsRepository,
    ProviderDisputeFinancialRepository,
    ProviderDisputeResolutionRepository,
    ProviderDisputeLogsRepository,
    AuditLogWriterRepository,
    AuditLogWriterService,
  ],
  exports: [AdminProviderDisputesService],
})
export class AdminProviderDisputesModule {}
