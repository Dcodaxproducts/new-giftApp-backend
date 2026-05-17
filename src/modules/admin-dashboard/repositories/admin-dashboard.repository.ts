import { Injectable } from '@nestjs/common';
import { PaymentStatus, Prisma, ProviderOrderStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class AdminDashboardRepository {
  constructor(private readonly prisma: PrismaService) {}

  countUsers(where: Prisma.UserWhereInput): Promise<number> {
    return this.prisma.user.count({ where });
  }

  countProviders(where: Prisma.UserWhereInput): Promise<number> {
    return this.prisma.user.count({ where: { ...where, role: UserRole.PROVIDER } });
  }

  countPayments(where: Prisma.PaymentWhereInput): Promise<number> {
    return this.prisma.payment.count({ where });
  }

  sumPayments(where: Prisma.PaymentWhereInput): Promise<Prisma.GetPaymentAggregateType<{ _sum: { amount: true }; where: Prisma.PaymentWhereInput }>> {
    return this.prisma.payment.aggregate({ where, _sum: { amount: true } });
  }

  findRevenuePayments() {
    return this.prisma.payment.findMany({ where: { status: PaymentStatus.SUCCEEDED }, select: { amount: true, currency: true, createdAt: true }, orderBy: { createdAt: 'asc' }, take: 10000 });
  }

  findDistributionPayments() {
    return this.prisma.payment.findMany({ where: { status: PaymentStatus.SUCCEEDED }, select: { moneyGiftId: true }, take: 10000 });
  }

  findProviderOrders() {
    return this.prisma.providerOrder.findMany({
      where: { status: { notIn: [ProviderOrderStatus.CANCELLED, ProviderOrderStatus.REJECTED] } },
      select: { providerId: true, status: true, total: true, currency: true, provider: { select: { providerBusinessName: true, firstName: true, lastName: true } } },
      take: 10000,
    });
  }

  findRecentCustomerDisputes() {
    return this.prisma.disputeCase.findMany({
      select: { id: true, caseId: true, reason: true, priority: true, status: true, createdAt: true, user: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
  }

  findRecentProviderDisputes() {
    return this.prisma.providerDisputeCase.findMany({
      select: { id: true, caseId: true, reason: true, priority: true, status: true, createdAt: true, customer: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
  }
}
