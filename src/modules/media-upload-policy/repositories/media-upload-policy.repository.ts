import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';

const UPDATED_BY_INCLUDE = { updatedBy: { select: { id: true, firstName: true, lastName: true } } } as const;

@Injectable()
export class MediaUploadPolicyRepository {
  constructor(private readonly prisma: PrismaService) {}

  findFirstPolicy() {
    return this.prisma.mediaUploadPolicy.findFirst({ orderBy: { createdAt: 'asc' }, include: UPDATED_BY_INCLUDE });
  }

  createDefaultPolicy(data: Prisma.MediaUploadPolicyUncheckedCreateInput) {
    return this.prisma.mediaUploadPolicy.create({ data, include: UPDATED_BY_INCLUDE });
  }

  updatePolicy(id: string, data: Prisma.MediaUploadPolicyUncheckedUpdateInput) {
    return this.prisma.mediaUploadPolicy.update({ where: { id }, data, include: UPDATED_BY_INCLUDE });
  }

  findAuditLogsWithCount(params: { where: Prisma.AdminAuditLogWhereInput; skip: number; take: number }) {
    return this.prisma.$transaction([
      this.prisma.adminAuditLog.findMany({ where: params.where, include: { actor: { select: { id: true, firstName: true, lastName: true } } }, orderBy: { createdAt: 'desc' }, skip: params.skip, take: params.take }),
      this.prisma.adminAuditLog.count({ where: params.where }),
    ]);
  }
}
