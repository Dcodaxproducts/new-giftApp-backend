import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuditLogWriterService } from '../../common/services/audit-log.service';
import { PrismaService } from '../../database/prisma.service';
import { AdminDisputeDecisionsRepository } from './admin-dispute-decisions.repository';
import { AdminDisputeEvidenceRepository } from './admin-dispute-evidence.repository';
import { AdminDisputeLinkageRepository } from './admin-dispute-linkage.repository';
import { AdminDisputeTrackingRepository } from './admin-dispute-tracking.repository';
import { AdminDisputesController } from './admin-disputes.controller';
import { AdminDisputesRepository } from './admin-disputes.repository';
import { AdminDisputesService } from './admin-disputes.service';

@Module({ imports: [JwtModule.register({})], controllers: [AdminDisputesController], providers: [AdminDisputesService, AdminDisputesRepository, AdminDisputeEvidenceRepository, AdminDisputeLinkageRepository, AdminDisputeDecisionsRepository, AdminDisputeTrackingRepository, PrismaService, AuditLogWriterService], exports: [AdminDisputesService] })
export class AdminDisputesModule {}
