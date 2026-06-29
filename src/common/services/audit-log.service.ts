import { Injectable } from '@nestjs/common';
import { AuditLogSeverity, AuditLogStatus, Prisma } from '@prisma/client';
import { AuditLogWriterRepository } from '../repositories/audit-log-writer.repository';

export interface AuditInput {
  actorId: string | null;
  targetId: string | null;
  targetType: string | null;
  action: string;
  actorType?: string | null;
  actorSnapshot?: unknown;
  actionLabel?: string;
  module?: string;
  status?: AuditLogStatus;
  severity?: AuditLogSeverity;
  beforeJson?: unknown;
  afterJson?: unknown;
  ipAddress?: string;
}

@Injectable()
export class AuditLogWriterService {
  constructor(private readonly repository: AuditLogWriterRepository) {}

  async write(input: AuditInput): Promise<void> {
    await this.repository.createAdminAuditLog({
      actorId: input.actorId,
      actorType: input.actorType ?? undefined,
      actorSnapshot: input.actorSnapshot === undefined ? undefined : (input.actorSnapshot as Prisma.InputJsonValue),
      targetId: input.targetId,
      targetType: input.targetType,
      action: input.action,
      actionLabel: input.actionLabel,
      module: input.module,
      status: input.status,
      severity: input.severity,
      beforeJson: input.beforeJson === undefined ? undefined : (input.beforeJson as Prisma.InputJsonValue),
      afterJson: input.afterJson === undefined ? undefined : (input.afterJson as Prisma.InputJsonValue),
      ipAddress: input.ipAddress,
    });
  }
}
