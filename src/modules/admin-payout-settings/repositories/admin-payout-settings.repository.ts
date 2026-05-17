import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';

export const ADMIN_PAYOUT_SETTINGS_INCLUDE = Prisma.validator<Prisma.AdminPayoutSettingsInclude>()({
  updatedBy: { select: { id: true, firstName: true, lastName: true } },
});

@Injectable()
export class AdminPayoutSettingsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findFirstSettings() {
    return this.prisma.adminPayoutSettings.findFirst({ orderBy: { createdAt: 'asc' }, include: ADMIN_PAYOUT_SETTINGS_INCLUDE });
  }

  createDefaultSettings(currency: string) {
    return this.prisma.adminPayoutSettings.create({ data: { currency }, include: ADMIN_PAYOUT_SETTINGS_INCLUDE });
  }

  updateSettings(id: string, data: Prisma.AdminPayoutSettingsUncheckedUpdateInput) {
    return this.prisma.adminPayoutSettings.update({ where: { id }, data, include: ADMIN_PAYOUT_SETTINGS_INCLUDE });
  }

  findAuditLogsWithCount(params: { where: Prisma.AdminAuditLogWhereInput; skip: number; take: number }) {
    return this.prisma.$transaction([
      this.prisma.adminAuditLog.findMany({ where: params.where, include: { actor: { select: { id: true, firstName: true, lastName: true } } }, orderBy: { createdAt: 'desc' }, skip: params.skip, take: params.take }),
      this.prisma.adminAuditLog.count({ where: params.where }),
    ]);
  }
}
