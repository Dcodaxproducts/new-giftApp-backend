import { Injectable } from '@nestjs/common';
import { ReportAuditService } from './report-audit.service';
import { ReportEvidencePolicyService } from './report-evidence-policy.service';
import { ReportNotificationService } from './report-notification.service';
import { ReportStatusPolicyService } from './report-status-policy.service';
import { ReportAuditInput, ReportNotificationInput, ReportingDomain } from './reporting-core.types';
import { ReportingCoreRepository } from './reporting-core.repository';

@Injectable()
export class ReportingCoreService {
  constructor(
    private readonly evidencePolicy: ReportEvidencePolicyService,
    private readonly statusPolicy: ReportStatusPolicyService,
    private readonly notifications: ReportNotificationService,
    private readonly audits: ReportAuditService,
    private readonly repository: ReportingCoreRepository,
  ) {}

  validateEvidence(input: { urls: string[]; folder: string; findCompleted: (urls: string[]) => Promise<Array<{ fileUrl: string }>> }) {
    return this.evidencePolicy.assertCompletedUploads(input);
  }

  statusForAction(domain: ReportingDomain, action: string) {
    return this.statusPolicy.statusForAction(domain, action);
  }

  notify(input: ReportNotificationInput) {
    return this.notifications.notify(input);
  }

  notifyMany(inputs: ReportNotificationInput[]) {
    return this.notifications.notifyMany(inputs);
  }

  audit(input: ReportAuditInput) {
    return this.audits.write(input);
  }

  lifecycleEvent(input: { domain: ReportingDomain; reportId: string; action: string; metadata?: Record<string, unknown> }) {
    return this.repository.createLifecycleEvent(input);
  }
}
