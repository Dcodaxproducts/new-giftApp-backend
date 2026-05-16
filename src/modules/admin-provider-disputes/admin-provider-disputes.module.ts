import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuditLogWriterRepository } from '../../common/repositories/audit-log-writer.repository';
import { AuditLogWriterService } from '../../common/services/audit-log.service';
import { PrismaService } from '../../database/prisma.service';
import { AdminProviderDisputesController } from './controllers/admin-provider-disputes.controller';
import { AdminProviderDisputesRepository } from './repositories/admin-provider-disputes.repository';
import { AdminProviderDisputesService } from './services/admin-provider-disputes.service';
import { ProviderDisputeEvidenceRepository } from './repositories/provider-dispute-evidence.repository';
import { ProviderDisputeFinancialRepository } from './repositories/provider-dispute-financial.repository';
import { ProviderDisputeLogsRepository } from './repositories/provider-dispute-logs.repository';
import { ProviderDisputeResolutionRepository } from './repositories/provider-dispute-resolution.repository';
import { ProviderDisputeRulingsRepository } from './repositories/provider-dispute-rulings.repository';

@Module({
  imports: [JwtModule.register({})],
  controllers: [AdminProviderDisputesController],
  providers: [
    AdminProviderDisputesService,
    AdminProviderDisputesRepository,
    ProviderDisputeEvidenceRepository,
    ProviderDisputeRulingsRepository,
    ProviderDisputeFinancialRepository,
    ProviderDisputeResolutionRepository,
    ProviderDisputeLogsRepository,
    PrismaService,
    AuditLogWriterRepository,
    AuditLogWriterService,
  ],
  exports: [AdminProviderDisputesService],
})
export class AdminProviderDisputesModule {}
