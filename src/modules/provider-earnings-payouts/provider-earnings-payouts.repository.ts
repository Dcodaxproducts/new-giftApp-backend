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

  findExistingPayoutByIdempotencyKey(providerId: string, idempotencyKey: string) {
    return this.prisma.providerPayout.findFirst({ where: { providerId, idempotencyKey } });
  }

  createPayoutRequest(params: { payoutData: Prisma.ProviderPayoutUncheckedCreateInput; ledgerData: Prisma.ProviderEarningsLedgerUncheckedCreateInput; notificationData: Prisma.NotificationUncheckedCreateInput }) {
    return this.prisma.$transaction(async (tx) => {
      const created = await this.createPayout(tx, params.payoutData);
      await this.markLedgerEntriesPayoutPending(tx, { ...params.ledgerData, payoutId: created.id });
      await this.createPayoutNotification(tx, { ...params.notificationData, metadataJson: { payoutId: created.id } });
      return created;
    });
  }

  cancelPayoutRequest(params: { providerId: string; payoutId: string; cancelReason: string; payoutData: Prisma.ProviderPayoutUpdateArgs['data']; notificationData: Prisma.NotificationUncheckedCreateInput }) {
    return this.prisma.$transaction(async (tx) => {
      await this.releaseLedgerEntriesFromPayout(tx, params.providerId, params.payoutId, params.cancelReason);
      const item = await this.cancelPayout(tx, params.payoutId, params.payoutData);
      await this.createPayoutNotification(tx, params.notificationData);
      return item;
    });
  }

  private createPayout(tx: Prisma.TransactionClient, data: Prisma.ProviderPayoutUncheckedCreateInput) {
    return tx.providerPayout.create({ data });
  }

  private markLedgerEntriesPayoutPending(tx: Prisma.TransactionClient, data: Prisma.ProviderEarningsLedgerUncheckedCreateInput) {
    return tx.providerEarningsLedger.create({ data });
  }

  private cancelPayout(tx: Prisma.TransactionClient, id: string, data: Prisma.ProviderPayoutUpdateArgs['data']) {
    return tx.providerPayout.update({ where: { id }, data });
  }

  private releaseLedgerEntriesFromPayout(tx: Prisma.TransactionClient, providerId: string, payoutId: string, cancelReason: string) {
    return tx.providerEarningsLedger.updateMany({ where: { providerId, payoutId, status: ProviderEarningsLedgerStatus.PAYOUT_PENDING }, data: { status: ProviderEarningsLedgerStatus.AVAILABLE, metadataJson: { cancelReason } } });
  }

  private createPayoutNotification(tx: Prisma.TransactionClient, data: Prisma.NotificationUncheckedCreateInput) {
    return tx.notification.create({ data });
  }
}
