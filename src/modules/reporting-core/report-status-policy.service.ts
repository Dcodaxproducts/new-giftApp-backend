import { Injectable } from '@nestjs/common';
import { ReportStatus, ReportingDomain } from './reporting-core.types';

@Injectable()
export class ReportStatusPolicyService {
  statusForAction(domain: ReportingDomain, action: string): ReportStatus {
    if (/dismiss|reject/i.test(action)) return ReportStatus.DISMISSED;
    if (/escalat/i.test(action)) return ReportStatus.ESCALATED;
    if (/resolve|reviewed/i.test(action)) return ReportStatus.RESOLVED;
    if (/warn|suspend|hide|remove|block|action/i.test(action)) return ReportStatus.ACTION_TAKEN;
    if (/assign|note|under_review/i.test(action)) return ReportStatus.UNDER_REVIEW;
    return domain === 'messageModeration' ? ReportStatus.PENDING_REVIEW : ReportStatus.UNDER_REVIEW;
  }

  isTerminal(status: ReportStatus): boolean {
    return [ReportStatus.ACTION_TAKEN, ReportStatus.DISMISSED, ReportStatus.RESOLVED].includes(status);
  }
}
