import { Injectable } from '@nestjs/common';
import { NotificationRecipientType, Prisma, WalletLedgerDirection, WalletLedgerStatus, WalletLedgerType, WalletOwnerType, ProviderPayoutStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { NotificationDispatchService } from '../notifications/notification-dispatch.service';

type WithdrawalRow = Prisma.WalletWithdrawalGetPayload<{}>;
type ProviderSummary = { id: string; providerProfile: { businessName: string | null } | null; firstName: string; lastName: string; avatarUrl: string | null };
type PayoutMethodSummary = { id: string; bankName: string; maskedAccount: string; last4: string; verificationStatus: Prisma.ProviderPayoutMethodGetPayload<{}>['verificationStatus'] };

// Hydrated payout record that mirrors the legacy ProviderPayout-with-relations shape so the
// admin service can keep operating on `provider`, `payoutMethod`, and `providerId`.
export type AdminPayoutRecord = WithdrawalRow & { providerId: string; provider: ProviderSummary; payoutMethod: PayoutMethodSummary };

@Injectable()
export class AdminProviderPayoutsRepository {
  constructor(private readonly prisma: PrismaService, private readonly notificationDispatch: NotificationDispatchService) {}

  async findPayouts(args: { where?: Prisma.WalletWithdrawalWhereInput; orderBy?: Prisma.WalletWithdrawalOrderByWithRelationInput; take?: number; skip?: number }): Promise<AdminPayoutRecord[]> {
    const items = await this.prisma.walletWithdrawal.findMany({ where: { wallet: { ownerType: WalletOwnerType.PROVIDER }, ...args.where }, orderBy: args.orderBy, take: args.take, skip: args.skip, include: { wallet: { select: { ownerId: true } } } });
    return this.hydrate(items);
  }

  async findPayoutById(id: string): Promise<AdminPayoutRecord | null> {
    const item = await this.prisma.walletWithdrawal.findUnique({ where: { id }, include: { wallet: { select: { ownerId: true } } } });
    if (!item) return null;
    const [hydrated] = await this.hydrate([item]);
    return hydrated;
  }

  findPayoutLedgerEntries(payoutId: string) {
    return this.prisma.walletLedger.findMany({ where: { withdrawalId: payoutId }, include: { order: { select: { orderNumber: true } } }, orderBy: { createdAt: 'desc' }, take: 10 });
  }

  async findPreviousCompletedPayout(providerId: string, before: Date, excludeId: string) {
    const item = await this.prisma.walletWithdrawal.findFirst({ where: { wallet: { ownerType: WalletOwnerType.PROVIDER, ownerId: providerId }, status: ProviderPayoutStatus.COMPLETED, completedAt: { lt: before }, id: { not: excludeId } }, orderBy: { completedAt: 'desc' } });
    return item;
  }

  // Order-earning ledger entries across providers (used for tier-based earning distribution).
  async findLedgerEntries(where: Prisma.WalletLedgerWhereInput): Promise<(Prisma.WalletLedgerGetPayload<{}> & { providerId: string; provider: { id: string; providerProfile: { businessName: string | null } | null; firstName: string; lastName: string } })[]> {
    const items = await this.prisma.walletLedger.findMany({ where: { wallet: { ownerType: WalletOwnerType.PROVIDER }, ...where }, include: { wallet: { select: { ownerId: true } } }, take: 10000 });
    const providerIds = [...new Set(items.map((item) => item.wallet.ownerId).filter((id): id is string => !!id))];
    const providers = await this.prisma.user.findMany({ where: { id: { in: providerIds } }, select: { id: true, firstName: true, lastName: true, providerProfile: { select: { businessName: true } } } });
    const providerMap = new Map(providers.map((provider) => [provider.id, provider]));
    return items.map((item) => {
      const providerId = item.wallet.ownerId as string;
      const provider = providerMap.get(providerId) ?? { id: providerId, firstName: '', lastName: '', providerProfile: null };
      const { wallet, ...rest } = item;
      return { ...rest, providerId, provider };
    });
  }

  findCommissionTiers() {
    return this.prisma.commissionTier.findMany({ where: { deletedAt: null, isActive: true }, orderBy: { orderVolumeThreshold: 'asc' } });
  }

  transitionPayout(params: { payoutId: string; providerId: string; walletId: string; amount: Prisma.Decimal; status: ProviderPayoutStatus; failureReason?: string; releaseLedger: boolean; settleLedger?: boolean; actorId?: string; action?: string; notification?: { title: string; message: string; type: string; metadataJson: Prisma.InputJsonValue } }): Promise<AdminPayoutRecord> {
    return this.prisma.$transaction(async (tx) => {
      // Reject/cancel: money already left the wallet at request time, so return it and void the debit ledger.
      if (params.releaseLedger) {
        await tx.walletLedger.updateMany({ where: { withdrawalId: params.payoutId, status: WalletLedgerStatus.PENDING }, data: { status: WalletLedgerStatus.CANCELLED, description: `Withdrawal released: ${params.failureReason ?? params.status}` } });
        await tx.wallet.update({ where: { id: params.walletId }, data: { balance: { increment: params.amount } } });
      }
      // Completed: the withdrawal succeeded, so finalize the debit ledger entry.
      if (params.settleLedger) {
        await tx.walletLedger.updateMany({ where: { withdrawalId: params.payoutId, status: WalletLedgerStatus.PENDING }, data: { status: WalletLedgerStatus.SUCCESS, description: 'Withdrawal settled to bank account.' } });
      }
      const payout = await tx.walletWithdrawal.update({ where: { id: params.payoutId }, data: { status: params.status, failureReason: params.failureReason, ...(params.status === ProviderPayoutStatus.COMPLETED ? { completedAt: new Date() } : {}) }, include: { wallet: { select: { ownerId: true } } } });
      if (params.notification) await this.notificationDispatch.createAndEmit({ recipientId: params.providerId, recipientType: NotificationRecipientType.PROVIDER, title: params.notification.title, message: params.notification.message, type: params.notification.type, metadataJson: params.notification.metadataJson });
      const [hydrated] = await this.hydrate([payout]);
      return hydrated;
    });
  }

  private async hydrate(items: (WithdrawalRow & { wallet: { ownerId: string | null } })[]): Promise<AdminPayoutRecord[]> {
    if (!items.length) return [];
    const providerIds = [...new Set(items.map((item) => item.wallet.ownerId).filter((id): id is string => !!id))];
    const bankAccountIds = [...new Set(items.map((item) => item.bankAccountId))];
    const [providers, methods] = await Promise.all([
      this.prisma.user.findMany({ where: { id: { in: providerIds } }, select: { id: true, firstName: true, lastName: true, avatarUrl: true, providerProfile: { select: { businessName: true } } } }),
      this.prisma.providerPayoutMethod.findMany({ where: { id: { in: bankAccountIds } }, select: { id: true, bankName: true, maskedAccount: true, last4: true, verificationStatus: true } }),
    ]);
    const providerMap = new Map(providers.map((provider) => [provider.id, provider]));
    const methodMap = new Map(methods.map((method) => [method.id, method]));
    return items.map((item) => {
      const providerId = item.wallet.ownerId as string;
      const provider = providerMap.get(providerId) ?? { id: providerId, firstName: '', lastName: '', avatarUrl: null, providerProfile: null };
      const payoutMethod = methodMap.get(item.bankAccountId) ?? { id: item.bankAccountId, bankName: '', maskedAccount: '', last4: '', verificationStatus: 'PENDING' as PayoutMethodSummary['verificationStatus'] };
      const { wallet, ...rest } = item;
      return { ...rest, providerId, provider, payoutMethod };
    });
  }
}
