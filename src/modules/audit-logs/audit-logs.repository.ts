import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AuditLogsRepository {
  constructor(private readonly prisma: PrismaService) {}

  getStats(where: Prisma.AdminAuditLogWhereInput, criticalSince: Date) {
    return this.prisma.$transaction([
      this.prisma.adminAuditLog.count({ where }),
      this.prisma.adminAuditLog.count({ where: { AND: [where, { status: 'SUCCESS' }] } }),
      this.prisma.adminAuditLog.count({ where: { AND: [where, { status: 'FAILED' }] } }),
      this.prisma.adminAuditLog.count({ where: { AND: [where, { createdAt: { gte: criticalSince } }, { OR: [{ status: 'FAILED' }, { severity: { in: ['HIGH', 'CRITICAL'] } }] }] } }),
    ]);
  }

  findManyWithCount(params: { where: Prisma.AdminAuditLogWhereInput; orderBy: Prisma.AdminAuditLogOrderByWithRelationInput; skip: number; take: number }) {
    return this.prisma.$transaction([
      this.prisma.adminAuditLog.findMany(params),
      this.prisma.adminAuditLog.count({ where: params.where }),
    ]);
  }

  findByIdWithActor(id: string) {
    return this.prisma.adminAuditLog.findUnique({ where: { id } });
  }

  findManyForExport(params: { where: Prisma.AdminAuditLogWhereInput; orderBy: Prisma.AdminAuditLogOrderByWithRelationInput }) {
    return this.prisma.adminAuditLog.findMany({ where: params.where, include: { actor: { select: { email: true, firstName: true, lastName: true } } }, orderBy: params.orderBy, take: 10000 });
  }
}
