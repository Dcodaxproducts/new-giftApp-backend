import { Injectable } from '@nestjs/common';
import { CustomerWalletLedgerStatus, CustomerWalletLedgerType, CustomerWalletLedgerDirection, NotificationRecipientType, PaymentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class CustomerWalletRepository {
  constructor(private readonly prisma: PrismaService) {}

  findWalletByUserId(userId: string) {
    return this.prisma.customerWallet.findUnique({ where: { userId } });
  }

  createWalletForUser(userId: string, currency: string) {
    return this.prisma.customerWallet.create({ data: { userId, currency } });
  }

  findDefaultPaymentMethodForUser(userId: string) {
    return this.prisma.customerPaymentMethod.findFirst({ where: { userId, isDefault: true, deletedAt: null } });
  }

  findDefaultBankAccountForUser(userId: string) {
    return this.prisma.customerBankAccount.findFirst({ where: { userId, isDefault: true, deletedAt: null } });
  }

  findWalletLedgerEntries(params: { where: Prisma.CustomerWalletLedgerWhereInput; skip: number; take: number }) {
    return this.prisma.customerWalletLedger.findMany({ where: params.where, orderBy: { createdAt: 'desc' }, skip: params.skip, take: params.take });
  }

  countWalletLedgerEntries(where: Prisma.CustomerWalletLedgerWhereInput) {
    return this.prisma.customerWalletLedger.count({ where });
  }

  findWalletHistoryRows(params: { where: Prisma.CustomerWalletLedgerWhereInput; skip: number; take: number }) {
    return this.prisma.$transaction([
      this.prisma.customerWalletLedger.findMany({ where: params.where, orderBy: { createdAt: 'desc' }, skip: params.skip, take: params.take }),
      this.prisma.customerWalletLedger.count({ where: params.where }),
    ]);
  }

  createWalletLedgerEntry(data: Prisma.CustomerWalletLedgerUncheckedCreateInput) {
    return this.prisma.customerWalletLedger.create({ data });
  }

  createWalletTopUpPayment(data: Prisma.PaymentUncheckedCreateInput) {
    return this.prisma.payment.create({ data });
  }

  markWalletTopUpPending(ledgerId: string, paymentId: string) {
    return this.prisma.customerWalletLedger.update({ where: { id: ledgerId }, data: { paymentId } });
  }

  markWalletTopUpPaymentProcessing(params: { paymentId: string; providerPaymentIntentId: string; metadataJson: Prisma.InputJsonObject }) {
    return this.prisma.payment.update({ where: { id: params.paymentId }, data: { providerPaymentIntentId: params.providerPaymentIntentId, status: PaymentStatus.PROCESSING, metadataJson: params.metadataJson } });
  }

  findWalletTopUpLedger(params: { walletTopUpId: string; userId: string }) {
    return this.prisma.customerWalletLedger.findFirst({ where: { id: params.walletTopUpId, userId: params.userId } });
  }

  completeWalletTopUp(params: { ledgerId: string; walletId: string; amount: Prisma.Decimal; paymentId: string }) {
    return this.prisma.$transaction([
      this.prisma.customerWalletLedger.update({ where: { id: params.ledgerId }, data: { status: CustomerWalletLedgerStatus.SUCCESS, description: 'Wallet top-up completed.', paymentId: params.paymentId } }),
      this.prisma.customerWallet.update({ where: { id: params.walletId }, data: { cashBalance: { increment: params.amount } } }),
    ]);
  }

  updateWalletTopUpStatus(params: { walletTopUpId: string; userId: string; status: CustomerWalletLedgerStatus; description: string }) {
    return this.prisma.customerWalletLedger.updateMany({ where: { id: params.walletTopUpId, userId: params.userId, status: CustomerWalletLedgerStatus.PENDING }, data: { status: params.status, description: params.description } });
  }

  findRewardWalletLedger(params: { userId: string; rewardLedgerId: string }) {
    return this.prisma.customerWalletLedger.findFirst({ where: { userId: params.userId, rewardLedgerId: params.rewardLedgerId } });
  }

  creditRewardWallet(params: { userId: string; walletId: string; rewardLedgerId: string; amount: Prisma.Decimal; currency: string; transactionId: string }) {
    return this.prisma.$transaction([
      this.prisma.customerWalletLedger.create({ data: { userId: params.userId, walletId: params.walletId, type: CustomerWalletLedgerType.REWARD_CREDIT, direction: CustomerWalletLedgerDirection.CREDIT, amount: params.amount, currency: params.currency, status: CustomerWalletLedgerStatus.SUCCESS, rewardLedgerId: params.rewardLedgerId, transactionId: params.transactionId, description: 'Referral reward credit added to wallet.' } }),
      this.prisma.customerWallet.update({ where: { id: params.walletId }, data: { giftCredits: { increment: params.amount } } }),
    ]);
  }

  createCustomerNotification(data: Omit<Prisma.NotificationUncheckedCreateInput, 'recipientType'>) {
    return this.prisma.notification.create({ data: { ...data, recipientType: NotificationRecipientType.REGISTERED_USER } });
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
