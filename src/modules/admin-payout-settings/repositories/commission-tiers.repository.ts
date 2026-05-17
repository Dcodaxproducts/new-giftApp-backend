import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';

export const COMMISSION_TIER_INCLUDE = Prisma.validator<Prisma.CommissionTierInclude>()({
  updatedBy: { select: { id: true, firstName: true, lastName: true } },
});

@Injectable()
export class CommissionTiersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findActiveTiers() {
    return this.prisma.commissionTier.findMany({ where: { deletedAt: null }, include: COMMISSION_TIER_INCLUDE, orderBy: [{ sortOrder: 'asc' }, { orderVolumeThreshold: 'asc' }] });
  }

  findTierById(id: string) {
    return this.prisma.commissionTier.findFirst({ where: { id, deletedAt: null }, include: COMMISSION_TIER_INCLUDE });
  }

  findTierByThreshold(threshold: Prisma.Decimal, excludeId?: string) {
    return this.prisma.commissionTier.findFirst({ where: { orderVolumeThreshold: threshold, deletedAt: null, ...(excludeId ? { id: { not: excludeId } } : {}) } });
  }

  createTier(data: Prisma.CommissionTierUncheckedCreateInput) {
    return this.prisma.commissionTier.create({ data, include: COMMISSION_TIER_INCLUDE });
  }

  updateTier(id: string, data: Prisma.CommissionTierUncheckedUpdateInput) {
    return this.prisma.commissionTier.update({ where: { id }, data, include: COMMISSION_TIER_INCLUDE });
  }

  deleteTier(id: string, updatedById: string) {
    return this.prisma.commissionTier.update({ where: { id }, data: { isActive: false, deletedAt: new Date(), updatedById }, include: COMMISSION_TIER_INCLUDE });
  }
}
