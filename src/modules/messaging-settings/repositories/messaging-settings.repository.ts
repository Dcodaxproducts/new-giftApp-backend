import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ADMIN_AUDIT_ACTOR_SELECT, buildAdminAuditLogData } from '../../../common/audit/admin-audit-log.util';
import { PrismaService } from '../../../database/prisma.service';

const UPDATED_BY_INCLUDE = { updatedBy: { select: { id: true, firstName: true, lastName: true } } } satisfies Prisma.MessagingSettingsInclude;

@Injectable()
export class MessagingSettingsRepository {
  constructor(private readonly prisma: PrismaService) {}
  findFirstSettings() { return this.prisma.messagingSettings.findFirst({ orderBy: { createdAt: 'asc' }, include: UPDATED_BY_INCLUDE }); }
  createDefaultSettings(data: Prisma.MessagingSettingsUncheckedCreateInput) { return this.prisma.messagingSettings.create({ data, include: UPDATED_BY_INCLUDE }); }
  updateSettings(id: string, data: Prisma.MessagingSettingsUncheckedUpdateInput) { return this.prisma.messagingSettings.update({ where: { id }, data, include: UPDATED_BY_INCLUDE }); }
  async createAuditLog(data: Prisma.AdminAuditLogUncheckedCreateInput) { const actor = data.actorId ? await this.prisma.user.findUnique({ where: { id: data.actorId }, select: ADMIN_AUDIT_ACTOR_SELECT }) : null; return this.prisma.adminAuditLog.create({ data: buildAdminAuditLogData(data, actor) }); }
  findAuditLogsWithCount(params: { where: Prisma.AdminAuditLogWhereInput; skip: number; take: number }) { return this.prisma.$transaction([this.prisma.adminAuditLog.findMany({ where: params.where, skip: params.skip, take: params.take, orderBy: { createdAt: 'desc' }, include: { actor: { select: { id: true, firstName: true, lastName: true } } } }), this.prisma.adminAuditLog.count({ where: params.where })]); }
}
