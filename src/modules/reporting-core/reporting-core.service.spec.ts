import { BadRequestException } from '@nestjs/common';
import { ReportEvidencePolicyService } from './report-evidence-policy.service';
import { ReportingCoreService } from './reporting-core.service';
import { ReportingCoreRepository } from './reporting-core.repository';
import { ReportAuditService } from './report-audit.service';
import { ReportNotificationService } from './report-notification.service';
import { ReportStatusPolicyService } from './report-status-policy.service';
import { ReportStatus } from './reporting-core.types';

describe('ReportingCoreService', () => {
  function createService() {
    const audit = { write: jest.fn().mockResolvedValue(undefined) };
    const dispatch = { createAndEmit: jest.fn().mockResolvedValue({ id: 'notification_1' }) };
    const service = new ReportingCoreService(
      new ReportEvidencePolicyService(),
      new ReportStatusPolicyService(),
      new ReportNotificationService(dispatch as never),
      new ReportAuditService(audit as never),
      new ReportingCoreRepository(),
    );
    return { service, audit, dispatch };
  }

  it('validates evidence through a shared policy', async () => {
    const { service } = createService();
    await expect(service.validateEvidence({ urls: ['https://cdn/evidence/a.png'], folder: 'user-report-evidence', findCompleted: jest.fn().mockResolvedValue([{ fileUrl: 'https://cdn/evidence/a.png' }]) })).resolves.toBeUndefined();
    await expect(service.validateEvidence({ urls: ['https://cdn/evidence/missing.png'], folder: 'user-report-evidence', findCompleted: jest.fn().mockResolvedValue([]) })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('centralizes status policy, audit, notifications, and lifecycle events', async () => {
    const { service, audit, dispatch } = createService();
    expect(service.statusForAction('userSafety', 'ESCALATE')).toBe(ReportStatus.ESCALATED);
    expect(service.statusForAction('socialModeration', 'HIDE')).toBe(ReportStatus.ACTION_TAKEN);
    await service.audit({ actorId: 'admin_1', targetId: 'report_1', targetType: 'REPORT', action: 'REPORT_ACTION', module: 'reportingCore', afterJson: { status: 'ACTION_TAKEN' } });
    expect(audit.write).toHaveBeenCalledWith(expect.objectContaining({ action: 'REPORT_ACTION' }));
    await service.notify({ recipientId: 'admin_1', recipientType: 'ADMIN', title: 'Report', message: 'Report updated', type: 'REPORT_UPDATED', metadata: { reportId: 'report_1' } });
    expect(dispatch.createAndEmit).toHaveBeenCalledWith(expect.objectContaining({ recipientId: 'admin_1', type: 'REPORT_UPDATED' }));
    await expect(service.lifecycleEvent({ domain: 'messageModeration', reportId: 'case_1', action: 'MESSAGE_ESCALATED' })).resolves.toEqual(expect.objectContaining({ recorded: true }));
  });
});
