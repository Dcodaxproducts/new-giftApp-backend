import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AuditLogsRepository {
  constructor(private readonly prisma: PrismaService) {}

  getStats(where: Prisma.AdminAuditLogWhereInput, criticalSince: Date) {
    return this.prisma.$transaction([
      this.prisma.adminAuditLog.count({ where }),
      this.prisma.adminAuditLog.count({ where: { ...where, status: 'SUCCESS' } }),
      this.prisma.adminAuditLog.count({ where: { ...where, status: 'FAILED' } }),
      this.prisma.adminAuditLog.count({ where: { createdAt: { gte: criticalSince }, OR: [{ status: 'FAILED' }, { severity: { in: ['HIGH', 'CRITICAL'] } }, { action: { in: ['FAILED_LOGIN_ATTEMPT', 'SUSPICIOUS_LOGIN', 'LOGIN_FROM_NEW_DEVICE'] } }] } }),
      this.prisma.adminAuditLog.findMany({ where, select: { createdAt: true }, take: 10000 }),
    ]);
  }

  findDistinctActions() {
    return this.prisma.adminAuditLog.findMany({ distinct: ['action'], select: { action: true }, orderBy: { action: 'asc' }, take: 500 });
  }

  findUsers(params: { where: Prisma.UserWhereInput; take: number }) {
    return this.prisma.user.findMany({ where: params.where, select: { id: true, email: true, role: true, firstName: true, lastName: true, adminTitle: true }, take: params.take, orderBy: { createdAt: 'desc' } });
  }

  findManyWithCount(params: { where: Prisma.AdminAuditLogWhereInput; include: Prisma.AdminAuditLogInclude; orderBy: Prisma.AdminAuditLogOrderByWithRelationInput; skip: number; take: number }) {
    return this.prisma.$transaction([
      this.prisma.adminAuditLog.findMany(params),
      this.prisma.adminAuditLog.count({ where: params.where }),
    ]);
  }

  findByIdWithActor(id: string) {
    return this.prisma.adminAuditLog.findUnique({ where: { id }, include: { actor: { select: { id: true, email: true, firstName: true, lastName: true, role: true } } } });
  }

  findManyForExport(params: { where: Prisma.AdminAuditLogWhereInput; orderBy: Prisma.AdminAuditLogOrderByWithRelationInput }) {
    return this.prisma.adminAuditLog.findMany({ where: params.where, include: { actor: { select: { email: true, firstName: true, lastName: true } } }, orderBy: params.orderBy, take: 10000 });
  }
}
