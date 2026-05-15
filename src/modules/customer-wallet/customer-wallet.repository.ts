import { Injectable } from '@nestjs/common';
import { PaymentStatus, Prisma } from '@prisma/client';
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
}
