import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ADMIN_AUDIT_ACTOR_SELECT, buildAdminAuditLogData } from '../audit/admin-audit-log.util';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AuditLogWriterRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createAdminAuditLog(data: Prisma.AdminAuditLogUncheckedCreateInput) {
    const actor = data.actorId
      ? await this.prisma.user.findUnique({ where: { id: data.actorId }, select: ADMIN_AUDIT_ACTOR_SELECT })
      : null;

    return this.prisma.adminAuditLog.create({ data: buildAdminAuditLogData(data, actor) });
  }
}
