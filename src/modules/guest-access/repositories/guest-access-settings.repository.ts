import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ADMIN_AUDIT_ACTOR_SELECT, buildAdminAuditLogData } from '../../../common/audit/admin-audit-log.util';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class GuestAccessSettingsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findFirst() { return this.prisma.guestAccessSettings.findFirst({ orderBy: { createdAt: 'asc' } }); }
  createDefault() { return this.prisma.guestAccessSettings.create({ data: {} }); }
  update(id: string, data: Prisma.GuestAccessSettingsUncheckedUpdateInput) { return this.prisma.guestAccessSettings.update({ where: { id }, data }); }
  async createAuditLog(data: Prisma.AdminAuditLogUncheckedCreateInput) {
    const actor = data.actorId ? await this.prisma.user.findUnique({ where: { id: data.actorId }, select: ADMIN_AUDIT_ACTOR_SELECT }) : null;
    return this.prisma.adminAuditLog.create({ data: buildAdminAuditLogData(data, actor) });
  }
  findAuditLogs() { return this.prisma.adminAuditLog.findMany({ where: { module: 'guestAccessSettings' }, orderBy: { createdAt: 'desc' }, take: 100 }); }
}
