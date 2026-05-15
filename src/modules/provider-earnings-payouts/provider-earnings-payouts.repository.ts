import { Injectable } from '@nestjs/common';
import { Prisma, ProviderEarningsLedgerStatus, ProviderPayoutStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

export const PROVIDER_EARNINGS_LEDGER_INCLUDE = Prisma.validator<Prisma.ProviderEarningsLedgerInclude>()({
  providerOrder: { select: { orderNumber: true } },
});

export const PROVIDER_PAYOUT_INCLUDE = Prisma.validator<Prisma.ProviderPayoutInclude>()({
  payoutMethod: true,
});

@Injectable()
export class ProviderEarningsPayoutsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findLedgerEntriesForProvider(where: Prisma.ProviderEarningsLedgerWhereInput, params?: { skip?: number; take?: number; includeOrder?: boolean }) {
    return this.prisma.providerEarningsLedger.findMany({
      where,
      ...(params?.includeOrder ? { include: PROVIDER_EARNINGS_LEDGER_INCLUDE } : {}),
      orderBy: { createdAt: 'desc' },
      skip: params?.skip,
      take: params?.take,
    });
  }

  countLedgerEntriesForProvider(where: Prisma.ProviderEarningsLedgerWhereInput) {
    return this.prisma.providerEarningsLedger.count({ where });
  }

  findLedgerEntriesAndCountForProvider(where: Prisma.ProviderEarningsLedgerWhereInput, params: { skip: number; take: number }) {
    return this.prisma.$transaction([
      this.prisma.providerEarningsLedger.findMany({ where, include: PROVIDER_EARNINGS_LEDGER_INCLUDE, orderBy: { createdAt: 'desc' }, skip: params.skip, take: params.take }),
      this.prisma.providerEarningsLedger.count({ where }),
    ]);
  }

  findLedgerForAvailableBalance(providerId: string) {
    return this.prisma.providerEarningsLedger.findMany({ where: { providerId, status: { in: [ProviderEarningsLedgerStatus.AVAILABLE, ProviderEarningsLedgerStatus.PAYOUT_PENDING] } } });
  }

  findEarningsChartRows(where: Prisma.ProviderEarningsLedgerWhereInput) {
    return this.prisma.providerEarningsLedger.findMany({ where });
  }

  findPendingPayoutsForProvider(providerId: string) {
    return this.prisma.providerPayout.findMany({ where: { providerId, status: { in: [ProviderPayoutStatus.PENDING, ProviderPayoutStatus.PROCESSING] } } });
  }

  findPayoutsForProvider(where: Prisma.ProviderPayoutWhereInput, params?: { orderBy?: Prisma.ProviderPayoutOrderByWithRelationInput; skip?: number; take?: number; includeMethod?: boolean }) {
    return this.prisma.providerPayout.findMany({
      where,
      ...(params?.includeMethod ? { include: PROVIDER_PAYOUT_INCLUDE } : {}),
      orderBy: params?.orderBy,
      skip: params?.skip,
      take: params?.take,
    });
  }

  countPayoutsForProvider(where: Prisma.ProviderPayoutWhereInput) {
    return this.prisma.providerPayout.count({ where });
  }

  findPayoutsAndCountForProvider(where: Prisma.ProviderPayoutWhereInput, params: { orderBy: Prisma.ProviderPayoutOrderByWithRelationInput; skip: number; take: number }) {
    return this.prisma.$transaction([
      this.prisma.providerPayout.findMany({ where, include: PROVIDER_PAYOUT_INCLUDE, orderBy: params.orderBy, skip: params.skip, take: params.take }),
      this.prisma.providerPayout.count({ where }),
    ]);
  }

  findPayoutByIdForProvider(providerId: string, id: string) {
    return this.prisma.providerPayout.findFirst({ where: { id, providerId }, include: PROVIDER_PAYOUT_INCLUDE });
  }

  findDefaultPayoutMethodForProvider(providerId: string) {
    return this.prisma.providerPayoutMethod.findFirst({ where: { providerId, isDefault: true, deletedAt: null } });
  }

  findPayoutMethodForProvider(providerId: string, id: string) {
    return this.prisma.providerPayoutMethod.findFirst({ where: { id, providerId, deletedAt: null } });
  }
}
