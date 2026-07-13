import { Injectable } from '@nestjs/common';
import { Prisma, WalletLedgerDirection, WalletLedgerStatus, WalletLedgerType, WalletOwnerType, ProviderPayoutStatus } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { DispatchNotificationInput, NotificationDispatchService } from '../../notifications/notification-dispatch.service';

export const WALLET_LEDGER_ORDER_INCLUDE = Prisma.validator<Prisma.WalletLedgerInclude>()({
  order: { select: { orderNumber: true } },
});

type WalletWithdrawalRow = Prisma.WalletWithdrawalGetPayload<{}>;
export type WalletWithdrawalWithMethod = WalletWithdrawalRow & { payoutMethod: Prisma.ProviderPayoutMethodGetPayload<{}> | null };

@Injectable()
export class ProviderEarningsPayoutsRepository {
  constructor(private readonly prisma: PrismaService, private readonly notificationDispatch: NotificationDispatchService) {}

  findProviderUserById(id: string) {
    return this.prisma.user.findFirst({ where: { id, role: 'PROVIDER' }, include: { providerProfile: true } });
  }

  findProviderWallet(providerId: string) {
    return this.prisma.wallet.findUnique({ where: { ownerType_ownerId: { ownerType: WalletOwnerType.PROVIDER, ownerId: providerId } } });
  }

  async getOrCreateProviderWallet(providerId: string, currency = 'USD') {
    return this.prisma.wallet.upsert({ where: { ownerType_ownerId: { ownerType: WalletOwnerType.PROVIDER, ownerId: providerId } }, update: {}, create: { ownerType: WalletOwnerType.PROVIDER, ownerId: providerId, currency } });
  }

  findLedgerEntriesForProvider(params: { providerId: string; createdAt?: Prisma.DateTimeFilter }) {
    return this.prisma.walletLedger.findMany({ where: { wallet: { ownerType: WalletOwnerType.PROVIDER, ownerId: params.providerId }, ...(params.createdAt ? { createdAt: params.createdAt } : {}) } });
  }

  findLedgerEntriesForProviderWhere(where: Prisma.WalletLedgerWhereInput, params?: { skip?: number; take?: number; includeOrder?: boolean }) {
    return this.prisma.walletLedger.findMany({
      where,
      ...(params?.includeOrder ? { include: WALLET_LEDGER_ORDER_INCLUDE } : {}),
      orderBy: { createdAt: 'desc' },
      skip: params?.skip,
      take: params?.take,
    });
  }

  countLedgerEntriesForProvider(where: Prisma.WalletLedgerWhereInput) {
    return this.prisma.walletLedger.count({ where });
  }

  findLedgerEntriesAndCountForProvider(where: Prisma.WalletLedgerWhereInput, params: { skip: number; take: number }) {
    return this.prisma.$transaction([
      this.prisma.walletLedger.findMany({ where, include: WALLET_LEDGER_ORDER_INCLUDE, orderBy: { createdAt: 'desc' }, skip: params.skip, take: params.take }),
      this.prisma.walletLedger.count({ where }),
    ]);
  }

  findActivePayoutForMethod(providerId: string, payoutMethodId: string) {
    return this.prisma.walletWithdrawal.findFirst({ where: { wallet: { ownerType: WalletOwnerType.PROVIDER, ownerId: providerId }, bankAccountId: payoutMethodId, status: { in: [ProviderPayoutStatus.PENDING, ProviderPayoutStatus.PROCESSING, ProviderPayoutStatus.ON_HOLD] } } });
  }

  findEarningsChartRows(params: { providerId: string; direction: WalletLedgerDirection; status: WalletLedgerStatus | { in: WalletLedgerStatus[] }; createdAt: Prisma.DateTimeFilter }) {
    return this.prisma.walletLedger.findMany({ where: { wallet: { ownerType: WalletOwnerType.PROVIDER, ownerId: params.providerId }, direction: params.direction, status: params.status, createdAt: params.createdAt } });
  }

  findPendingPayoutsForProvider(providerId: string) {
    return this.prisma.walletWithdrawal.findMany({ where: { wallet: { ownerType: WalletOwnerType.PROVIDER, ownerId: providerId }, status: { in: [ProviderPayoutStatus.PENDING, ProviderPayoutStatus.PROCESSING] } } });
  }

  async findPayoutsForProvider(providerId: string, where?: Prisma.WalletWithdrawalWhereInput, params?: { orderBy?: Prisma.WalletWithdrawalOrderByWithRelationInput; skip?: number; take?: number }): Promise<WalletWithdrawalWithMethod[]> {
    const items = await this.prisma.walletWithdrawal.findMany({ where: { wallet: { ownerType: WalletOwnerType.PROVIDER, ownerId: providerId }, ...where }, orderBy: params?.orderBy, skip: params?.skip, take: params?.take });
    return this.attachPayoutMethods(items);
  }

  countPayoutsForProvider(providerId: string, where?: Prisma.WalletWithdrawalWhereInput) {
    return this.prisma.walletWithdrawal.count({ where: { wallet: { ownerType: WalletOwnerType.PROVIDER, ownerId: providerId }, ...where } });
  }

  async findPayoutsAndCountForProvider(providerId: string, where: Prisma.WalletWithdrawalWhereInput, params: { orderBy: Prisma.WalletWithdrawalOrderByWithRelationInput; skip: number; take: number }): Promise<[WalletWithdrawalWithMethod[], number]> {
    const finalWhere: Prisma.WalletWithdrawalWhereInput = { wallet: { ownerType: WalletOwnerType.PROVIDER, ownerId: providerId }, ...where };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.walletWithdrawal.findMany({ where: finalWhere, orderBy: params.orderBy, skip: params.skip, take: params.take }),
      this.prisma.walletWithdrawal.count({ where: finalWhere }),
    ]);
    return [await this.attachPayoutMethods(items), total];
  }

  async findPayoutByIdForProvider(providerId: string, id: string): Promise<WalletWithdrawalWithMethod | null> {
    const item = await this.prisma.walletWithdrawal.findFirst({ where: { id, wallet: { ownerType: WalletOwnerType.PROVIDER, ownerId: providerId } } });
    if (!item) return null;
    const [withMethod] = await this.attachPayoutMethods([item]);
    return withMethod;
  }

  findDefaultPayoutMethodForProvider(providerId: string) {
    return this.prisma.providerPayoutMethod.findFirst({ where: { providerId, isDefault: true, deletedAt: null } });
  }

  findPayoutMethodForProvider(providerId: string, id: string) {
    return this.prisma.providerPayoutMethod.findFirst({ where: { id, providerId, deletedAt: null } });
  }

  findOrderForEarning(orderId: string) {
    return this.prisma.order.findUnique({ where: { id: orderId } });
  }

  async createOrderEarningLedgerEntry(params: { providerId: string; orderId: string; amount: Prisma.Decimal; currency: string; description: string }) {
    const wallet = await this.getOrCreateProviderWallet(params.providerId, params.currency);
    const existing = await this.prisma.walletLedger.findFirst({ where: { walletId: wallet.id, orderId: params.orderId, type: WalletLedgerType.ORDER_EARNING } });
    if (existing) return existing;
    const [ledger] = await this.prisma.$transaction([
      this.prisma.walletLedger.create({ data: { walletId: wallet.id, orderId: params.orderId, type: WalletLedgerType.ORDER_EARNING, direction: WalletLedgerDirection.CREDIT, amount: params.amount, currency: params.currency, status: WalletLedgerStatus.SUCCESS, transactionId: this.transactionId(), description: params.description } }),
      this.prisma.wallet.update({ where: { id: wallet.id }, data: { balance: { increment: params.amount } } }),
    ]);
    return ledger;
  }

  returnFailedPayoutBalance(params: { walletId: string; payoutId: string; amount: Prisma.Decimal; reason: string }) {
    return this.prisma.$transaction([
      this.prisma.walletWithdrawal.update({ where: { id: params.payoutId }, data: { status: ProviderPayoutStatus.FAILED, failureReason: params.reason } }),
      this.prisma.walletLedger.updateMany({ where: { withdrawalId: params.payoutId, status: WalletLedgerStatus.PENDING }, data: { status: WalletLedgerStatus.FAILED, description: `Withdrawal failed: ${params.reason}` } }),
      this.prisma.wallet.update({ where: { id: params.walletId }, data: { balance: { increment: params.amount } } }),
    ]);
  }

  findExistingPayoutByIdempotencyKey(providerId: string, idempotencyKey: string) {
    return this.prisma.walletWithdrawal.findFirst({ where: { wallet: { ownerType: WalletOwnerType.PROVIDER, ownerId: providerId }, idempotencyKey } });
  }

  createPayoutRequest(params: { walletId: string; withdrawalData: Omit<Prisma.WalletWithdrawalUncheckedCreateInput, 'walletId'>; amount: Prisma.Decimal; currency: string; notificationData: DispatchNotificationInput }) {
    return this.prisma.$transaction(async (tx) => {
      const created = await tx.walletWithdrawal.create({ data: { walletId: params.walletId, ...params.withdrawalData } });
      await tx.walletLedger.create({ data: { walletId: params.walletId, type: WalletLedgerType.WITHDRAWAL, direction: WalletLedgerDirection.DEBIT, amount: params.amount, currency: params.currency, status: WalletLedgerStatus.PENDING, withdrawalId: created.id, transactionId: this.transactionId(), description: 'Provider payout requested.' } });
      await tx.wallet.update({ where: { id: params.walletId }, data: { balance: { decrement: params.amount } } });
      await this.notificationDispatch.createAndEmit({ ...params.notificationData, metadataJson: { payoutId: created.id } });
      return created;
    });
  }

  cancelPayoutRequest(params: { walletId: string; payoutId: string; amount: Prisma.Decimal; cancelReason: string; notificationData: DispatchNotificationInput }) {
    return this.prisma.$transaction(async (tx) => {
      const item = await tx.walletWithdrawal.update({ where: { id: params.payoutId }, data: { status: ProviderPayoutStatus.CANCELLED, failureReason: params.cancelReason } });
      await tx.walletLedger.updateMany({ where: { withdrawalId: params.payoutId, status: WalletLedgerStatus.PENDING }, data: { status: WalletLedgerStatus.CANCELLED, description: `Withdrawal cancelled: ${params.cancelReason}` } });
      await tx.wallet.update({ where: { id: params.walletId }, data: { balance: { increment: params.amount } } });
      await this.notificationDispatch.createAndEmit(params.notificationData);
      return item;
    });
  }

  private async attachPayoutMethods(items: WalletWithdrawalRow[]): Promise<WalletWithdrawalWithMethod[]> {
    if (!items.length) return [];
    const methodIds = [...new Set(items.map((item) => item.bankAccountId))];
    const methods = await this.prisma.providerPayoutMethod.findMany({ where: { id: { in: methodIds } } });
    const methodMap = new Map(methods.map((method) => [method.id, method]));
    return items.map((item) => ({ ...item, payoutMethod: methodMap.get(item.bankAccountId) ?? null }));
  }

  private transactionId(): string { return `TXN-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`; }
}
