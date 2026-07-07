import { Injectable } from '@nestjs/common';
import { PaymentStatus, Prisma, ProviderOrderStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

export interface ProviderPerformanceRow {
  providerId: string;
  providerName: string;
  totalOrders: number;
  successfulOrders: number;
  totalVolume: number;
  currency: string;
}

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

  countOrders(where: Prisma.OrderWhereInput): Promise<number> {
    return this.prisma.order.count({ where });
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

  async findProviderPerformanceRows(): Promise<ProviderPerformanceRow[]> {
    const orderRows = await this.prisma.order.groupBy({
      by: ['providerId', 'providerStatus', 'currency'],
      where: { providerStatus: { notIn: [ProviderOrderStatus.CANCELLED, ProviderOrderStatus.REJECTED] } },
      _count: { _all: true },
      _sum: { total: true },
    });
    const providerIds = [...new Set(orderRows.map((row) => row.providerId))];
    const providers = providerIds.length
      ? await this.prisma.user.findMany({
          where: { id: { in: providerIds }, role: UserRole.PROVIDER },
          select: { id: true, providerProfile: { select: { businessName: true } }, firstName: true, lastName: true },
        })
      : [];
    const providerNames = new Map(providers.map((provider) => [provider.id, provider.providerProfile?.businessName ?? (`${provider.firstName} ${provider.lastName}`.trim() || 'Provider')]));
    const aggregateMap = new Map<string, ProviderPerformanceRow>();

    for (const row of orderRows) {
      const key = `${row.providerId}:${row.currency}`;
      const current = aggregateMap.get(key) ?? {
        providerId: row.providerId,
        providerName: providerNames.get(row.providerId) ?? 'Provider',
        totalOrders: 0,
        successfulOrders: 0,
        totalVolume: 0,
        currency: row.currency,
      };
      current.totalOrders += row._count._all;
      if (row.providerStatus === ProviderOrderStatus.DELIVERED || row.providerStatus === ProviderOrderStatus.COMPLETED) {
        current.successfulOrders += row._count._all;
        current.totalVolume += Number(row._sum.total ?? 0);
      }
      aggregateMap.set(key, current);
    }

    return [...aggregateMap.values()];
  }

  findRecentCustomerDisputes() {
    return this.prisma.dispute.findMany({
      select: { id: true, reason: true, status: true, createdAt: true, user: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
  }
}
