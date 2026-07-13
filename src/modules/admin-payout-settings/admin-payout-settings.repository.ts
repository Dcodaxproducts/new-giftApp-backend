import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AdminPayoutSettingsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAuditLogsWithCount(params: { where: Prisma.AdminAuditLogWhereInput; skip: number; take: number }) {
    return this.prisma.$transaction([
      this.prisma.adminAuditLog.findMany({ where: params.where, include: { actor: { select: { id: true, firstName: true, lastName: true } } }, orderBy: { createdAt: 'desc' }, skip: params.skip, take: params.take }),
      this.prisma.adminAuditLog.count({ where: params.where }),
    ]);
  }
}
