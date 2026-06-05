import { Injectable } from '@nestjs/common';
import { PaymentStatus, Prisma } from '@prisma/client';
import { AuthUserContext } from '../../common/decorators/current-user.decorator';
import { AuditLogWriterService } from '../../common/services/audit-log.service';
import { AdminPlatformAnalyticsRepository, PlatformAnalyticsPayment } from './admin-platform-analytics.repository';
import {
  PlatformAnalyticsRange,
  PlatformAnalyticsReportFormat,
  PlatformAnalyticsReportQueryDto,
  PlatformAnalyticsSortBy,
  PlatformAnalyticsSortOrder,
  PlatformAnalyticsSummaryQueryDto,
  PlatformAnalyticsTransactionStatus,
  PlatformAnalyticsTransactionsQueryDto,
} from './dto/platform-analytics-query.dto';

type DateRange = { fromDate: Date; toDate: Date };
type FileResult = { content: string; filename: string; contentType: string };
type Metric = { value: number; changePercent: number };
type NormalizedRevenueTransaction = {
  id: string;
  date: Date;
  userEmail: string;
  plan: string | null;
  amount: number;
  status: PlatformAnalyticsTransactionStatus;
  currency: string;
  provider: { id: string; businessName: string } | null;
  category: { id: string; name: string } | null;
  searchText: string;
};

@Injectable()
export class AdminPlatformAnalyticsService {
  constructor(
    private readonly repository: AdminPlatformAnalyticsRepository,
    private readonly auditLog: AuditLogWriterService,
  ) {}

  async summary(query: PlatformAnalyticsSummaryQueryDto) {
    const current = this.range(query);
    const previous = this.previousRange(current);
    const [currentRevenue, previousRevenue, currentNewSubscriptions, previousNewSubscriptions, currentChurn, previousChurn, currentActiveUsers, previousActiveUsers] = await Promise.all([
      this.repository.sumSuccessfulPayments(this.paymentWhere(query, current)),
      this.repository.sumSuccessfulPayments(this.paymentWhere(query, previous)),
      this.repository.countNewSubscriptions(current.fromDate, current.toDate),
      this.repository.countNewSubscriptions(previous.fromDate, previous.toDate),
      this.churnRate(current),
      this.churnRate(previous),
      this.repository.countActiveRegisteredUsers(current.toDate),
      this.repository.countActiveRegisteredUsers(previous.toDate),
    ]);

    return {
      data: {
        totalRevenue: this.metric(this.money(currentRevenue._sum.amount), this.money(previousRevenue._sum.amount)),
        newSubscriptions: this.metric(currentNewSubscriptions, previousNewSubscriptions),
        churnRate: this.metric(currentChurn, previousChurn),
        activeUsers: this.metric(currentActiveUsers, previousActiveUsers),
      },
      message: 'Platform analytics summary fetched successfully.',
    };
  }

  async revenueTransactions(query: PlatformAnalyticsTransactionsQueryDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 10, 100);
    const items = this.sort(await this.filteredTransactions(query), query.sortBy ?? PlatformAnalyticsSortBy.CREATED_AT, query.sortOrder ?? PlatformAnalyticsSortOrder.DESC);
    const paged = items.slice((page - 1) * limit, page * limit);

    return {
      data: paged.map((item) => this.transactionItem(item)),
      meta: { page, limit, total: items.length, totalPages: Math.ceil(items.length / limit) },
      message: 'Revenue transactions fetched successfully.',
    };
  }

  async filterOptions() {
    const [categories, providers, plans] = await Promise.all([
      this.repository.findFilterCategories(),
      this.repository.findFilterProviders(),
      this.repository.findFilterPlans(),
    ]);
    const planNames = [...new Set(plans.map((plan) => plan.name))];

    return {
      data: {
        categories,
        providers: providers.map((provider) => ({ id: provider.id, businessName: this.providerName(provider) })),
        plans: planNames,
        statuses: [
          PlatformAnalyticsTransactionStatus.COMPLETED,
          PlatformAnalyticsTransactionStatus.PENDING,
          PlatformAnalyticsTransactionStatus.FAILED,
          PlatformAnalyticsTransactionStatus.REFUNDED,
        ],
      },
      message: 'Platform analytics filter options fetched successfully.',
    };
  }

  async report(user: AuthUserContext, query: PlatformAnalyticsReportQueryDto): Promise<FileResult> {
    const items = await this.filteredTransactions({ ...query, limit: 100, sortBy: PlatformAnalyticsSortBy.CREATED_AT, sortOrder: PlatformAnalyticsSortOrder.DESC });
    const rows = [
      ['Transaction ID', 'Date', 'User Email', 'Plan', 'Amount', 'Currency', 'Status', 'Provider', 'Category'],
      ...items.map((item) => [item.id, item.date.toISOString(), item.userEmail, item.plan ?? '', item.amount.toString(), item.currency, item.status, item.provider?.businessName ?? '', item.category?.name ?? '']),
    ];
    const content = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n');
    const format = query.format ?? PlatformAnalyticsReportFormat.CSV;
    await this.auditLog.write({ actorId: user.uid, targetId: null, targetType: 'PLATFORM_ANALYTICS_REPORT', action: 'PLATFORM_ANALYTICS_REPORT_GENERATED', module: 'Platform Analytics', afterJson: { filters: this.safeReportFilters(query), count: items.length, requestedFormat: format, deliveredFormat: PlatformAnalyticsReportFormat.CSV } });

    return { content, filename: 'platform-analytics-report.csv', contentType: 'text/csv' };
  }

  private async filteredTransactions(query: Partial<PlatformAnalyticsTransactionsQueryDto>): Promise<NormalizedRevenueTransaction[]> {
    const range = this.range(query);
    const payments = await this.repository.findPayments({ where: this.paymentWhere(query, range), orderBy: { createdAt: 'desc' }, take: 10000 });
    return payments.map((payment) => this.normalize(payment)).filter((item) => this.matches(item, query));
  }

  private paymentWhere(query: Partial<PlatformAnalyticsTransactionsQueryDto>, range: DateRange): Prisma.PaymentWhereInput {
    const orderFilter = this.orderFilter(query);
    const where: Prisma.PaymentWhereInput = {
      createdAt: { gte: range.fromDate, lte: range.toDate },
      ...(orderFilter ? { order: orderFilter } : {}),
    };

    if (query.plan) where.customerSubscription = { plan: { name: { contains: query.plan, mode: 'insensitive' } } };
    if (query.status === PlatformAnalyticsTransactionStatus.COMPLETED) where.status = PaymentStatus.SUCCEEDED;
    if (query.status === PlatformAnalyticsTransactionStatus.PENDING) where.status = { in: [PaymentStatus.PENDING, PaymentStatus.PROCESSING] };
    if (query.status === PlatformAnalyticsTransactionStatus.FAILED) where.status = { in: [PaymentStatus.FAILED, PaymentStatus.CANCELLED] };
    if (query.search) {
      where.OR = [
        { id: { contains: query.search, mode: 'insensitive' } },
        { providerPaymentIntentId: { contains: query.search, mode: 'insensitive' } },
        { user: { email: { contains: query.search, mode: 'insensitive' } } },
        { order: { orderNumber: { contains: query.search, mode: 'insensitive' } } },
        { order: { items: { some: { gift: { name: { contains: query.search, mode: 'insensitive' } } } } } },
        { order: { providerOrders: { some: { provider: { providerBusinessName: { contains: query.search, mode: 'insensitive' } } } } } },
      ];
    }

    return where;
  }

  private orderFilter(query: Partial<PlatformAnalyticsTransactionsQueryDto>): Prisma.OrderWhereInput | null {
    const AND: Prisma.OrderWhereInput[] = [];
    if (query.categoryId) AND.push({ items: { some: { gift: { categoryId: query.categoryId } } } });
    if (query.providerId) AND.push({ OR: [{ providerOrders: { some: { providerId: query.providerId } } }, { items: { some: { providerId: query.providerId } } }] });
    return AND.length ? { AND } : null;
  }

  private normalize(payment: PlatformAnalyticsPayment): NormalizedRevenueTransaction {
    const providerOrder = payment.order?.providerOrders[0];
    const provider = providerOrder?.provider
      ? { id: providerOrder.provider.id, businessName: this.providerName(providerOrder.provider) }
      : null;
    const category = payment.order?.items[0]?.gift.category ?? null;
    const plan = payment.customerSubscription?.plan.name ?? null;
    const id = payment.providerPaymentIntentId ?? payment.id;
    const status = this.status(payment);
    const searchText = [
      id,
      payment.id,
      payment.order?.orderNumber,
      payment.user.email,
      plan,
      provider?.businessName,
      category?.name,
      ...payment.order?.items.map((item) => item.gift.name) ?? [],
    ].filter(Boolean).join(' ').toLowerCase();

    return { id, date: payment.createdAt, userEmail: payment.user.email, plan, amount: this.money(payment.amount), status, currency: payment.currency, provider, category, searchText };
  }

  private matches(item: NormalizedRevenueTransaction, query: Partial<PlatformAnalyticsTransactionsQueryDto>): boolean {
    if (query.status && query.status !== PlatformAnalyticsTransactionStatus.ALL && item.status !== query.status) return false;
    if (query.plan && item.plan?.toLowerCase() !== query.plan.toLowerCase()) return false;
    if (query.search && !item.searchText.includes(query.search.toLowerCase())) return false;
    return true;
  }

  private status(payment: PlatformAnalyticsPayment): PlatformAnalyticsTransactionStatus {
    const refundedAmount = payment.refundRequests.reduce((sum, refund) => sum + Number(refund.approvedAmount ?? refund.requestedAmount), 0);
    if (payment.status === PaymentStatus.REFUNDED || refundedAmount >= Number(payment.amount) || refundedAmount > 0) return PlatformAnalyticsTransactionStatus.REFUNDED;
    if (payment.status === PaymentStatus.SUCCEEDED) return PlatformAnalyticsTransactionStatus.COMPLETED;
    if (payment.status === PaymentStatus.FAILED || payment.status === PaymentStatus.CANCELLED) return PlatformAnalyticsTransactionStatus.FAILED;
    return PlatformAnalyticsTransactionStatus.PENDING;
  }

  private async churnRate(range: DateRange): Promise<number> {
    const [cancelled, activeAtStart] = await Promise.all([
      this.repository.countCancelledSubscriptions(range.fromDate, range.toDate),
      this.repository.countActiveSubscriptionsAt(range.fromDate),
    ]);
    return activeAtStart === 0 ? 0 : this.round((cancelled / activeAtStart) * 100);
  }

  private range(query: Partial<PlatformAnalyticsSummaryQueryDto>): DateRange {
    if (query.range === PlatformAnalyticsRange.CUSTOM || query.fromDate || query.toDate) {
      const toDate = query.toDate ? new Date(query.toDate) : new Date();
      const fromDate = query.fromDate ? new Date(query.fromDate) : new Date(toDate.getTime() - 30 * 86_400_000);
      return { fromDate, toDate };
    }

    const now = new Date();
    if (query.range === PlatformAnalyticsRange.TODAY) {
      const fromDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      return { fromDate, toDate: now };
    }

    const days = query.range === PlatformAnalyticsRange.LAST_7_DAYS ? 7 : query.range === PlatformAnalyticsRange.LAST_90_DAYS ? 90 : 30;
    return { fromDate: new Date(now.getTime() - days * 86_400_000), toDate: now };
  }

  private previousRange(range: DateRange): DateRange {
    const duration = Math.max(range.toDate.getTime() - range.fromDate.getTime(), 86_400_000);
    return { fromDate: new Date(range.fromDate.getTime() - duration), toDate: new Date(range.fromDate.getTime()) };
  }

  private metric(current: number, previous: number): Metric {
    return { value: current, changePercent: this.delta(current, previous) };
  }

  private delta(current: number, previous: number): number {
    if (previous === 0) return current === 0 ? 0 : 100;
    return this.round(((current - previous) / previous) * 100);
  }

  private sort(items: NormalizedRevenueTransaction[], sortBy: PlatformAnalyticsSortBy, sortOrder: PlatformAnalyticsSortOrder): NormalizedRevenueTransaction[] {
    const direction = sortOrder === PlatformAnalyticsSortOrder.ASC ? 1 : -1;
    return [...items].sort((left, right) => {
      if (sortBy === PlatformAnalyticsSortBy.AMOUNT) return (left.amount - right.amount) * direction;
      if (sortBy === PlatformAnalyticsSortBy.STATUS) return left.status.localeCompare(right.status) * direction;
      return (left.date.getTime() - right.date.getTime()) * direction;
    });
  }

  private transactionItem(item: NormalizedRevenueTransaction) {
    return {
      id: item.id,
      date: item.date,
      userEmail: item.userEmail,
      plan: item.plan,
      amount: item.amount,
      status: item.status,
      currency: item.currency,
      provider: item.provider,
      category: item.category,
    };
  }

  private safeReportFilters(query: PlatformAnalyticsReportQueryDto): Record<string, unknown> {
    const { format, range, fromDate, toDate, categoryId, providerId, status, search } = query;
    return { format, range, fromDate, toDate, categoryId, providerId, status, search };
  }

  private providerName(provider: { providerBusinessName: string | null; firstName: string; lastName: string }): string {
    return provider.providerBusinessName ?? (`${provider.firstName} ${provider.lastName}`.trim() || 'Provider');
  }

  private money(value: Prisma.Decimal | number | null | undefined): number {
    return this.round(Number(value ?? 0));
  }

  private round(value: number): number {
    return Number(value.toFixed(2));
  }
}
