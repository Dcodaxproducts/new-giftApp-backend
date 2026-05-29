import { Injectable } from '@nestjs/common';
import { DisputePriority, PaymentStatus, Prisma, ProviderDisputeSeverity, UserRole } from '@prisma/client';
import { AdminDashboardRepository } from '../repositories/admin-dashboard.repository';

type RevenuePayment = Awaited<ReturnType<AdminDashboardRepository['findRevenuePayments']>>[number];
type CustomerDispute = Awaited<ReturnType<AdminDashboardRepository['findRecentCustomerDisputes']>>[number];
type ProviderDispute = Awaited<ReturnType<AdminDashboardRepository['findRecentProviderDisputes']>>[number];
type RecentDispute = { id: string; caseId: string; userName: string; reason: string; status: string; createdAt: Date };

@Injectable()
export class AdminDashboardService {
  constructor(private readonly dashboardRepository: AdminDashboardRepository) {}

  async overview() {
    const { currentStart, previousStart, previousEnd } = this.monthRanges();
    const activeUserWhere = { deletedAt: null, role: UserRole.REGISTERED_USER } satisfies Prisma.UserWhereInput;
    const activeProviderWhere = { deletedAt: null } satisfies Prisma.UserWhereInput;
    const currentOrderWhere = { createdAt: { gte: currentStart } } satisfies Prisma.OrderWhereInput;
    const previousOrderWhere = { createdAt: { gte: previousStart, lt: previousEnd } } satisfies Prisma.OrderWhereInput;
    const currentRevenueWhere = { createdAt: { gte: currentStart }, status: PaymentStatus.SUCCEEDED } satisfies Prisma.PaymentWhereInput;
    const previousRevenueWhere = { createdAt: { gte: previousStart, lt: previousEnd }, status: PaymentStatus.SUCCEEDED } satisfies Prisma.PaymentWhereInput;
    const [totalUsers, currentUsers, previousUsers, totalProviders, currentProviders, previousProviders, totalOrders, currentOrders, previousOrders, totalRevenueAggregate, currentRevenueAggregate, previousRevenueAggregate] = await Promise.all([
      this.dashboardRepository.countUsers(activeUserWhere),
      this.dashboardRepository.countUsers({ ...activeUserWhere, createdAt: { gte: currentStart } }),
      this.dashboardRepository.countUsers({ ...activeUserWhere, createdAt: { gte: previousStart, lt: previousEnd } }),
      this.dashboardRepository.countProviders(activeProviderWhere),
      this.dashboardRepository.countProviders({ ...activeProviderWhere, createdAt: { gte: currentStart } }),
      this.dashboardRepository.countProviders({ ...activeProviderWhere, createdAt: { gte: previousStart, lt: previousEnd } }),
      this.dashboardRepository.countOrders({}),
      this.dashboardRepository.countOrders(currentOrderWhere),
      this.dashboardRepository.countOrders(previousOrderWhere),
      this.dashboardRepository.sumPayments({ status: PaymentStatus.SUCCEEDED }),
      this.dashboardRepository.sumPayments(currentRevenueWhere),
      this.dashboardRepository.sumPayments(previousRevenueWhere),
    ]);
    return { data: { totalUsers, totalUsersDeltaPercent: this.delta(currentUsers, previousUsers), totalProviders, totalProvidersDeltaPercent: this.delta(currentProviders, previousProviders), orders: totalOrders, ordersDeltaPercent: this.delta(currentOrders, previousOrders), transactions: totalOrders, transactionsDeltaPercent: this.delta(currentOrders, previousOrders), totalRevenue: this.money(totalRevenueAggregate._sum.amount), totalRevenueDeltaPercent: this.delta(this.money(currentRevenueAggregate._sum.amount), this.money(previousRevenueAggregate._sum.amount)), currency: 'USD' }, message: 'Dashboard overview fetched successfully.' };
  }

  async revenueTrends() {
    const months = this.lastTwelveMonths();
    const payments = (await this.dashboardRepository.findRevenuePayments()).filter((payment) => payment.createdAt >= months[0].start);
    const values = months.map((month) => this.money(payments.filter((payment) => payment.createdAt >= month.start && payment.createdAt < month.end).reduce((sum, payment) => sum + this.money(payment.amount), 0)));
    return { data: { range: 'LAST_12_MONTHS', labels: months.map((month) => month.label), values, currency: this.currency(payments) }, message: 'Revenue trends fetched successfully.' };
  }

  async giftVsPayment() {
    const payments = await this.dashboardRepository.findDistributionPayments();
    const giftPayments = payments.filter((payment) => payment.moneyGiftId).length;
    const giftCardsPercent = payments.length ? Math.round((giftPayments / payments.length) * 100) : 0;
    return { data: { giftCardsPercent, directPaymentsPercent: payments.length ? 100 - giftCardsPercent : 0 }, message: 'Gift vs payment distribution fetched successfully.' };
  }

  async providerPerformance() {
    const rows = await this.dashboardRepository.findProviderPerformanceRows();
    const data = rows
      .sort((left, right) => right.totalVolume - left.totalVolume)
      .slice(0, 10)
      .map((provider) => ({ providerId: provider.providerId, providerName: provider.providerName, successRate: provider.totalOrders ? this.money((provider.successfulOrders / provider.totalOrders) * 100) : 0, totalVolume: this.money(provider.totalVolume), currency: provider.currency }));
    return { data, message: 'Provider performance fetched successfully.' };
  }

  async recentDisputes() {
    const [customerDisputes, providerDisputes] = await Promise.all([this.dashboardRepository.findRecentCustomerDisputes(), this.dashboardRepository.findRecentProviderDisputes()]);
    const data = [...customerDisputes.map((dispute) => this.customerDispute(dispute)), ...providerDisputes.map((dispute) => this.providerDispute(dispute))]
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
      .slice(0, 10)
      .map((item) => ({ id: item.id, caseId: item.caseId, userName: item.userName, reason: item.reason, status: item.status }));
    return { data, message: 'Recent disputes fetched successfully.' };
  }

  private monthRanges(): { currentStart: Date; previousStart: Date; previousEnd: Date } {
    const now = new Date();
    const currentStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const previousStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
    return { currentStart, previousStart, previousEnd: currentStart };
  }

  private lastTwelveMonths(): { label: string; start: Date; end: Date }[] {
    const now = new Date();
    return Array.from({ length: 12 }, (_, index) => {
      const monthOffset = 11 - index;
      const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - monthOffset, 1));
      const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1));
      return { label: start.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' }), start, end };
    });
  }

  private customerDispute(dispute: CustomerDispute): RecentDispute {
    return { id: dispute.id, caseId: dispute.caseId, userName: this.name(dispute.user), reason: this.label(dispute.reason), status: dispute.priority === DisputePriority.HIGH || dispute.priority === DisputePriority.CRITICAL ? 'HIGH_PRIORITY' : dispute.status, createdAt: dispute.createdAt };
  }

  private providerDispute(dispute: ProviderDispute): RecentDispute {
    return { id: dispute.id, caseId: dispute.caseId, userName: this.name(dispute.customer), reason: this.label(dispute.reason), status: dispute.priority === ProviderDisputeSeverity.HIGH || dispute.priority === ProviderDisputeSeverity.CRITICAL ? 'HIGH_PRIORITY' : dispute.status, createdAt: dispute.createdAt };
  }

  private name(user: { firstName: string; lastName: string }): string {
    return `${user.firstName} ${user.lastName}`.trim();
  }

  private label(value: string): string {
    return value.toLowerCase().split('_').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
  }

  private currency(payments: RevenuePayment[]): string {
    return payments[0]?.currency ?? 'USD';
  }

  private delta(current: number, previous: number): number {
    if (previous === 0) return current === 0 ? 0 : 100;
    return this.money(((current - previous) / previous) * 100);
  }

  private money(value: Prisma.Decimal | number | null | undefined): number {
    return Number(Number(value ?? 0).toFixed(2));
  }
}
