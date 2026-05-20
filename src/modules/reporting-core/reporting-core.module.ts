import { Global, Module } from '@nestjs/common';
import { AuditLogWriterRepository } from '../../common/repositories/audit-log-writer.repository';
import { AuditLogWriterService } from '../../common/services/audit-log.service';
import { BroadcastNotificationsModule } from '../broadcast-notifications/broadcast-notifications.module';
import { ReportAuditService } from './report-audit.service';
import { ReportEvidencePolicyService } from './report-evidence-policy.service';
import { ReportNotificationService } from './report-notification.service';
import { ReportStatusPolicyService } from './report-status-policy.service';
import { ReportingCoreRepository } from './reporting-core.repository';
import { ReportingCoreService } from './reporting-core.service';

@Global()
@Module({
  imports: [BroadcastNotificationsModule],
  providers: [AuditLogWriterRepository, AuditLogWriterService, ReportAuditService, ReportEvidencePolicyService, ReportNotificationService, ReportStatusPolicyService, ReportingCoreRepository, ReportingCoreService],
  exports: [ReportingCoreService, ReportAuditService, ReportEvidencePolicyService, ReportNotificationService, ReportStatusPolicyService],
})
export class ReportingCoreModule {}
