import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

export interface AuditInput {
  actorId: string | null;
  targetId: string | null;
  targetType: string | null;
  action: string;
  beforeJson?: unknown;
  afterJson?: unknown;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditLogWriterService {
  constructor(private readonly prisma: PrismaService) {}

  async write(input: AuditInput): Promise<void> {
    await this.prisma.adminAuditLog.create({
      data: {
        actorId: input.actorId,
        targetId: input.targetId,
        targetType: input.targetType,
        action: input.action,
        beforeJson: input.beforeJson === undefined ? undefined : (input.beforeJson as Prisma.InputJsonValue),
        afterJson: input.afterJson === undefined ? undefined : (input.afterJson as Prisma.InputJsonValue),
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      },
    });
  }
}
