import { Injectable } from '@nestjs/common';
import { Prisma, ProviderPayoutStatus } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';

export const ADMIN_PROVIDER_PAYOUT_INCLUDE = Prisma.validator<Prisma.ProviderPayoutInclude>()({
  provider: { select: { id: true, providerBusinessName: true, firstName: true, lastName: true, avatarUrl: true } },
  payoutMethod: { select: { id: true, bankName: true, maskedAccount: true, last4: true, verificationStatus: true } },
});

@Injectable()
export class AdminProviderPayoutsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findPayouts<T extends Prisma.ProviderPayoutFindManyArgs>(args: T): Promise<Prisma.ProviderPayoutGetPayload<T>[]> {
    return this.prisma.providerPayout.findMany(args) as Promise<Prisma.ProviderPayoutGetPayload<T>[]>;
  }

  findPayoutById(id: string) {
    return this.prisma.providerPayout.findUnique({ where: { id }, include: ADMIN_PROVIDER_PAYOUT_INCLUDE });
  }

  findPreviousCompletedPayout(providerId: string, before: Date, excludeId: string) {
    return this.prisma.providerPayout.findFirst({ where: { providerId, status: ProviderPayoutStatus.COMPLETED, completedAt: { lt: before }, id: { not: excludeId } }, orderBy: { completedAt: 'desc' } });
  }

  findLedgerEntries(where: Prisma.ProviderEarningsLedgerWhereInput) {
    return this.prisma.providerEarningsLedger.findMany({ where, include: { provider: { select: { id: true, providerBusinessName: true, firstName: true, lastName: true } } }, take: 10000 });
  }

  findCommissionTiers() {
    return this.prisma.commissionTier.findMany({ where: { deletedAt: null, isActive: true }, orderBy: { orderVolumeThreshold: 'asc' } });
  }
}
