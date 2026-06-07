import { Injectable } from '@nestjs/common';
import { AuditLogWriterService } from '../../common/services/audit-log.service';
import { ReportAuditInput } from './reporting-core.types';

@Injectable()
export class ReportAuditService {
  constructor(private readonly auditLog: AuditLogWriterService) {}

  write(input: ReportAuditInput) {
    return this.auditLog.write({
      actorId: input.actorId,
      actorType: input.actorType ?? null,
      targetId: input.targetId,
      targetType: input.targetType,
      action: input.action,
      module: input.module,
      beforeJson: input.beforeJson ?? undefined,
      afterJson: input.afterJson ?? undefined,
    });
  }
}
