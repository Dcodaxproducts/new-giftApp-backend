import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AuditLogWriterRepository } from '../../common/repositories/audit-log-writer.repository';
import { AuditLogWriterService } from '../../common/services/audit-log.service';
import { AdminDisputeDecisionsRepository } from './repositories/admin-dispute-decisions.repository';
import { AdminDisputeEvidenceRepository } from './repositories/admin-dispute-evidence.repository';
import { AdminDisputeLinkageRepository } from './repositories/admin-dispute-linkage.repository';
import { AdminDisputeTrackingRepository } from './repositories/admin-dispute-tracking.repository';
import { AdminDisputesController } from './controllers/admin-disputes.controller';
import { AdminDisputesRepository } from './repositories/admin-disputes.repository';
import { AdminDisputesService } from './services/admin-disputes.service';
import { BroadcastNotificationsModule } from '../broadcast-notifications/broadcast-notifications.module';
import { RefundPolicySettingsModule } from '../refund-policy-settings/refund-policy-settings.module';

@Module({ imports: [BroadcastNotificationsModule, DatabaseModule, RefundPolicySettingsModule], controllers: [AdminDisputesController], providers: [AdminDisputesService, AdminDisputesRepository, AdminDisputeEvidenceRepository, AdminDisputeLinkageRepository, AdminDisputeDecisionsRepository, AdminDisputeTrackingRepository, AuditLogWriterRepository, AuditLogWriterService], exports: [AdminDisputesService] })
export class AdminDisputesModule {}
