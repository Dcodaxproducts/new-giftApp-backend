import { Injectable } from '@nestjs/common';
import { WalletLedgerStatus, WalletLedgerType, WalletLedgerDirection, WalletOwnerType, NotificationRecipientType, PaymentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { DispatchNotificationInput, NotificationDispatchService } from '../notifications/notification-dispatch.service';

type CustomerNotificationInput = Omit<DispatchNotificationInput, 'recipientType'>;

@Injectable()
export class CustomerWalletRepository {
  constructor(private readonly prisma: PrismaService, private readonly notificationDispatch: NotificationDispatchService) {}

  findWalletByUserId(userId: string) {
    return this.prisma.wallet.findUnique({ where: { ownerType_ownerId: { ownerType: WalletOwnerType.USER, ownerId: userId } } });
  }

  createWalletForUser(userId: string, currency: string) {
    return this.prisma.wallet.create({ data: { ownerType: WalletOwnerType.USER, ownerId: userId, currency } });
  }

  findDefaultPaymentMethodForUser(userId: string) {
    return this.prisma.customerPaymentMethod.findFirst({ where: { userId, isDefault: true, deletedAt: null } });
  }

  findDefaultBankAccountForUser(userId: string) {
    return this.prisma.customerBankAccount.findFirst({ where: { userId, isDefault: true, deletedAt: null } });
  }

  findWalletLedgerEntries(params: { where: Prisma.WalletLedgerWhereInput; skip: number; take: number }) {
    return this.prisma.walletLedger.findMany({ where: params.where, orderBy: { createdAt: 'desc' }, skip: params.skip, take: params.take });
  }

  countWalletLedgerEntries(where: Prisma.WalletLedgerWhereInput) {
    return this.prisma.walletLedger.count({ where });
  }

  findWalletHistoryRows(params: { where: Prisma.WalletLedgerWhereInput; skip: number; take: number }) {
    return this.prisma.$transaction([
      this.prisma.walletLedger.findMany({ where: params.where, orderBy: { createdAt: 'desc' }, skip: params.skip, take: params.take }),
      this.prisma.walletLedger.count({ where: params.where }),
    ]);
  }

  createWalletLedgerEntry(data: Prisma.WalletLedgerUncheckedCreateInput) {
    return this.prisma.walletLedger.create({ data });
  }

  createWalletTopUpPayment(data: Prisma.PaymentUncheckedCreateInput) {
    return this.prisma.payment.create({ data });
  }

  findWalletTopUpPaymentByIdempotencyKey(userId: string, idempotencyKey: string) {
    return this.prisma.payment.findFirst({ where: { userId, idempotencyKey } });
  }

  markWalletTopUpPending(ledgerId: string, paymentId: string) {
    return this.prisma.walletLedger.update({ where: { id: ledgerId }, data: { paymentId } });
  }

  markWalletTopUpPaymentProcessing(params: { paymentId: string; providerPaymentIntentId: string; metadataJson: Prisma.InputJsonObject }) {
    return this.prisma.payment.update({ where: { id: params.paymentId }, data: { providerPaymentIntentId: params.providerPaymentIntentId, status: PaymentStatus.PROCESSING, metadataJson: params.metadataJson } });
  }

  findWalletTopUpLedger(params: { walletTopUpId: string; userId: string }) {
    return this.prisma.walletLedger.findFirst({ where: { id: params.walletTopUpId, wallet: { ownerType: WalletOwnerType.USER, ownerId: params.userId } } });
  }

  // Atomically credits a top-up. The ledger is flipped PENDING -> SUCCESS with a conditional
  // updateMany; only the first caller (webhook OR manual confirm) that wins the flip increments
  // the balance, so concurrent confirmations can never double-credit the wallet.
  completeWalletTopUp(params: { ledgerId: string; walletId: string; amount: Prisma.Decimal; paymentId: string }): Promise<{ credited: boolean }> {
    return this.prisma.$transaction(async (tx) => {
      const flipped = await tx.walletLedger.updateMany({ where: { id: params.ledgerId, status: WalletLedgerStatus.PENDING }, data: { status: WalletLedgerStatus.SUCCESS, description: 'Wallet top-up completed.', paymentId: params.paymentId } });
      if (flipped.count === 0) return { credited: false };
      await tx.wallet.update({ where: { id: params.walletId }, data: { balance: { increment: params.amount } } });
      return { credited: true };
    });
  }

  findTopUpPaymentByIntentId(stripePaymentIntentId: string, userId: string) {
    return this.prisma.payment.findFirst({ where: { providerPaymentIntentId: stripePaymentIntentId, userId } });
  }

  markTopUpPaymentStatus(paymentId: string, status: PaymentStatus) {
    return this.prisma.payment.update({ where: { id: paymentId }, data: { status } });
  }

  updateWalletTopUpStatus(params: { walletTopUpId: string; userId: string; status: WalletLedgerStatus; description: string }) {
    return this.prisma.walletLedger.updateMany({ where: { id: params.walletTopUpId, wallet: { ownerType: WalletOwnerType.USER, ownerId: params.userId }, status: WalletLedgerStatus.PENDING }, data: { status: params.status, description: params.description } });
  }

  findRewardWalletLedger(params: { userId: string; rewardLedgerId: string }) {
    return this.prisma.walletLedger.findFirst({ where: { rewardLedgerId: params.rewardLedgerId, wallet: { ownerType: WalletOwnerType.USER, ownerId: params.userId } } });
  }

  creditRewardWallet(params: { userId: string; walletId: string; rewardLedgerId: string; amount: Prisma.Decimal; currency: string; transactionId: string }) {
    return this.prisma.$transaction([
      this.prisma.walletLedger.create({ data: { walletId: params.walletId, type: WalletLedgerType.REWARD_CREDIT, direction: WalletLedgerDirection.CREDIT, amount: params.amount, currency: params.currency, status: WalletLedgerStatus.SUCCESS, rewardLedgerId: params.rewardLedgerId, transactionId: params.transactionId, description: 'Referral reward credit added to wallet.' } }),
      this.prisma.wallet.update({ where: { id: params.walletId }, data: { giftCredits: { increment: params.amount } } }),
    ]);
  }

  createCustomerNotification(data: CustomerNotificationInput) {
    return this.notificationDispatch.createAndEmit({ ...data, recipientType: NotificationRecipientType.REGISTERED_USER })
  }

  findBankAccountsByUserId(userId: string) {
    return this.prisma.customerBankAccount.findMany({ where: { userId, deletedAt: null }, orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }] });
  }

  findBankAccountForUser(userId: string, id: string) {
    return this.prisma.customerBankAccount.findFirst({ where: { id, userId, deletedAt: null } });
  }

  findDefaultBankAccountForUserIncludingDeletedFilter(userId: string) {
    return this.prisma.customerBankAccount.findFirst({ where: { userId, deletedAt: null, isDefault: true } });
  }

  createBankAccountWithDefault(params: { userId: string; data: Omit<Prisma.CustomerBankAccountUncheckedCreateInput, 'userId'>; shouldDefault: boolean }) {
    return this.prisma.$transaction(async (tx) => {
      if (params.shouldDefault) await tx.customerBankAccount.updateMany({ where: { userId: params.userId, isDefault: true }, data: { isDefault: false } });
      return tx.customerBankAccount.create({ data: { userId: params.userId, ...params.data } });
    });
  }

  setDefaultBankAccountForUser(userId: string, id: string) {
    return this.prisma.$transaction([
      this.prisma.customerBankAccount.updateMany({ where: { userId, isDefault: true }, data: { isDefault: false } }),
      this.prisma.customerBankAccount.update({ where: { id }, data: { isDefault: true } }),
    ]);
  }

  deleteBankAccount(id: string) {
    return this.prisma.customerBankAccount.delete({ where: { id } });
  }
}
