import { Injectable } from '@nestjs/common';
import { Prisma, ReferralStatus, RewardLedgerSource, RewardLedgerType } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

const UPDATED_BY_INCLUDE = { updatedBy: { select: { id: true, firstName: true, lastName: true } } } as const;

@Injectable()
export class ReferralSettingsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findFirstSettings() {
    return this.prisma.referralSettings.findFirst({ orderBy: { createdAt: 'asc' }, include: UPDATED_BY_INCLUDE });
  }

  createDefaultSettings() {
    return this.prisma.referralSettings.create({ data: {}, include: UPDATED_BY_INCLUDE });
  }

  updateSettings(id: string, data: Prisma.ReferralSettingsUncheckedUpdateInput) {
    return this.prisma.referralSettings.update({ where: { id }, data, include: UPDATED_BY_INCLUDE });
  }

  getStats() {
    return Promise.all([
      this.prisma.referral.count(),
      this.prisma.referral.count({ where: { status: { in: [ReferralStatus.QUALIFIED, ReferralStatus.REWARDED] } } }),
      this.prisma.referral.count({ where: { status: { in: [ReferralStatus.PENDING, ReferralStatus.JOINED] } } }),
      this.prisma.rewardLedger.findMany({ where: { type: RewardLedgerType.EARNED, source: RewardLedgerSource.REFERRAL } }),
    ]);
  }

  findAuditLogsWithCount(params: { where: Prisma.AdminAuditLogWhereInput; skip: number; take: number }) {
    return this.prisma.$transaction([
      this.prisma.adminAuditLog.findMany({ where: params.where, include: { actor: { select: { id: true, firstName: true, lastName: true } } }, orderBy: { createdAt: 'desc' }, skip: params.skip, take: params.take }),
      this.prisma.adminAuditLog.count({ where: params.where }),
    ]);
  }
}
