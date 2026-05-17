import { Injectable, NotFoundException } from '@nestjs/common';
import { CommissionTier, Prisma, ProviderEarningsLedgerDirection, ProviderEarningsLedgerStatus, ProviderEarningsLedgerType, ProviderPayout, ProviderPayoutMethod, ProviderPayoutStatus } from '@prisma/client';
import { AdminProviderPayoutSortBy, AdminProviderPayoutSortOrder, AdminProviderPayoutStatusFilter, ExportAdminProviderPayoutsDto, ListAdminProviderPayoutsDto } from '../dto/admin-provider-payouts.dto';
import { ADMIN_PROVIDER_PAYOUT_INCLUDE, AdminProviderPayoutsRepository } from '../repositories/admin-provider-payouts.repository';

type PayoutWithRelations = Prisma.ProviderPayoutGetPayload<{ include: typeof ADMIN_PROVIDER_PAYOUT_INCLUDE }>;
type LedgerWithProvider = Awaited<ReturnType<AdminProviderPayoutsRepository['findLedgerEntries']>>[number];
type FileResult = { content: string; filename: string; contentType: string };

@Injectable()
export class AdminProviderPayoutsService {
  constructor(private readonly repository: AdminProviderPayoutsRepository) {}

  async stats() {
    const { currentStart, previousStart, previousEnd } = this.monthRanges();
    const payouts = await this.repository.findPayouts({ where: { createdAt: { gte: previousStart } } });
    const current = payouts.filter((item) => item.createdAt >= currentStart);
    const previous = payouts.filter((item) => item.createdAt >= previousStart && item.createdAt < previousEnd);
    const totalPayoutsThisMonth = this.sumPayouts(current);
    const previousTotalPayouts = this.sumPayouts(previous);
    const pendingPayouts = this.sumPayouts(current.filter((item) => this.pendingStatuses().includes(item.status)));
    const previousPendingPayouts = this.sumPayouts(previous.filter((item) => this.pendingStatuses().includes(item.status)));
    const completedPayouts = this.sumPayouts(current.filter((item) => item.status === ProviderPayoutStatus.COMPLETED));
    const previousCompletedPayouts = this.sumPayouts(previous.filter((item) => item.status === ProviderPayoutStatus.COMPLETED));
    const platformRevenue = this.sumFees(current);
    const previousPlatformRevenue = this.sumFees(previous);
    return { data: { totalPayoutsThisMonth, totalPayoutsDeltaPercent: this.delta(totalPayoutsThisMonth, previousTotalPayouts), pendingPayouts, pendingPayoutsDeltaPercent: this.delta(pendingPayouts, previousPendingPayouts), completedPayouts, completedPayoutsDeltaPercent: this.delta(completedPayouts, previousCompletedPayouts), platformRevenue, platformRevenueDeltaPercent: this.delta(platformRevenue, previousPlatformRevenue), currency: current[0]?.currency ?? payouts[0]?.currency ?? 'USD' }, message: 'Provider payout stats fetched successfully.' };
  }

  async trends() {
    const months = this.lastTwelveMonths();
    const payouts = await this.repository.findPayouts({ where: { createdAt: { gte: months[0].start } } });
    return { data: { range: 'LAST_12_MONTHS', labels: months.map((month) => month.label), values: months.map((month) => this.sumPayouts(payouts.filter((payout) => payout.createdAt >= month.start && payout.createdAt < month.end))), currency: payouts[0]?.currency ?? 'USD' }, message: 'Provider payout trends fetched successfully.' };
  }

  async earningDistribution() {
    const [ledger, tiers] = await Promise.all([
      this.repository.findLedgerEntries({ direction: ProviderEarningsLedgerDirection.CREDIT, type: ProviderEarningsLedgerType.ORDER_EARNING, status: { in: [ProviderEarningsLedgerStatus.AVAILABLE, ProviderEarningsLedgerStatus.PAYOUT_PENDING, ProviderEarningsLedgerStatus.PAID] } }),
      this.repository.findCommissionTiers(),
    ]);
    const providerTotals = this.providerEarningTotals(ledger);
    const distribution = new Map<string, { tierId: string; tierName: string; providerCount: number; totalEarnings: number; currency: string }>();
    for (const total of providerTotals.values()) {
      const tier = this.tierFor(total.totalEarnings, tiers);
      const key = tier?.id ?? 'unassigned';
      const current = distribution.get(key) ?? { tierId: key, tierName: tier?.name ?? 'Unassigned', providerCount: 0, totalEarnings: 0, currency: total.currency };
      current.providerCount += 1;
      current.totalEarnings = this.money(current.totalEarnings + total.totalEarnings);
      distribution.set(key, current);
    }
    return { data: [...distribution.values()].sort((left, right) => right.totalEarnings - left.totalEarnings), message: 'Provider earning distribution fetched successfully.' };
  }

  async list(query: ListAdminProviderPayoutsDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const items = await this.filteredPayouts(query);
    const paged = items.slice((page - 1) * limit, page * limit);
    const data = await Promise.all(paged.map((item) => this.toListItem(item)));
    return { data, meta: { page, limit, total: items.length, totalPages: Math.ceil(items.length / limit) }, message: 'Provider payouts fetched successfully.' };
  }

  async export(query: ExportAdminProviderPayoutsDto): Promise<FileResult> {
    const items = await this.filteredPayouts(query);
    const rows = await Promise.all(items.map((item) => this.toListItem(item)));
    const header = ['Payout ID', 'Provider ID', 'Provider Business', 'Provider Code', 'Amount', 'Currency', 'Status', 'Last Payout Date', 'Next Payout Date'];
    const lines = [header, ...rows.map((row) => [row.id, row.provider.id, row.provider.businessName, row.provider.providerCode, String(row.pendingAmount), row.currency, row.status, row.lastPayoutDate ? row.lastPayoutDate.toISOString() : '', row.nextPayoutDate ? row.nextPayoutDate.toISOString() : ''])];
    return { content: lines.map((line) => line.map((value) => this.csv(value)).join(',')).join('\n'), filename: `provider-payouts-${Date.now()}.csv`, contentType: 'text/csv' };
  }

  async details(id: string) {
    const payout = await this.repository.findPayoutById(id);
    if (!payout) throw new NotFoundException('Provider payout not found');
    const listItem = await this.toListItem(payout);
    return { data: { ...listItem, transactionId: payout.transactionId, amount: this.money(payout.amount), processingFee: this.money(payout.processingFee), totalToReceive: this.money(payout.totalToReceive), externalPayoutId: payout.externalPayoutId, failureReason: payout.failureReason, destination: this.toDestination(payout.payoutMethod), createdAt: payout.createdAt, completedAt: payout.completedAt }, message: 'Provider payout details fetched successfully.' };
  }

  private async filteredPayouts(query: ListAdminProviderPayoutsDto): Promise<PayoutWithRelations[]> {
    if (query.status === AdminProviderPayoutStatusFilter.ON_HOLD || query.status === AdminProviderPayoutStatusFilter.REJECTED) return [];
    const payouts = await this.repository.findPayouts({ where: this.where(query), include: ADMIN_PROVIDER_PAYOUT_INCLUDE, orderBy: { createdAt: 'desc' }, take: 10000 });
    const searched = query.search?.trim() ? payouts.filter((item) => this.matchesSearch(item, query.search?.trim() ?? '')) : payouts;
    return this.sort(searched, query.sortBy ?? AdminProviderPayoutSortBy.createdAt, query.sortOrder ?? AdminProviderPayoutSortOrder.DESC);
  }

  private where(query: ListAdminProviderPayoutsDto): Prisma.ProviderPayoutWhereInput {
    const status = this.toProviderPayoutStatus(query.status);
    return { ...(query.providerId ? { providerId: query.providerId } : {}), ...(status ? { status } : {}), ...(query.fromDate || query.toDate ? { createdAt: { gte: query.fromDate ? new Date(query.fromDate) : undefined, lte: query.toDate ? new Date(query.toDate) : undefined } } : {}) };
  }

  private sort(items: PayoutWithRelations[], sortBy: AdminProviderPayoutSortBy, sortOrder: AdminProviderPayoutSortOrder): PayoutWithRelations[] { const direction = sortOrder === AdminProviderPayoutSortOrder.ASC ? 1 : -1; return [...items].sort((left, right) => { const leftValue = this.sortValue(left, sortBy); const rightValue = this.sortValue(right, sortBy); if (leftValue < rightValue) return -1 * direction; if (leftValue > rightValue) return 1 * direction; return 0; }); }
  private sortValue(item: PayoutWithRelations, sortBy: AdminProviderPayoutSortBy): string | number { if (sortBy === AdminProviderPayoutSortBy.amount) return Number(item.amount); if (sortBy === AdminProviderPayoutSortBy.status) return item.status; if (sortBy === AdminProviderPayoutSortBy.nextPayoutDate) return item.expectedArrivalAt?.getTime() ?? 0; return item.createdAt.getTime(); }
  private async toListItem(item: PayoutWithRelations) { const previous = await this.repository.findPreviousCompletedPayout(item.providerId, item.completedAt ?? item.createdAt, item.id); return { id: item.id, provider: { id: item.provider.id, businessName: item.provider.providerBusinessName ?? this.name(item.provider), providerCode: this.providerCode(item.provider.id), avatarUrl: item.provider.avatarUrl }, pendingAmount: this.money(item.amount), currency: item.currency, lastPayoutDate: previous?.completedAt ?? null, nextPayoutDate: item.expectedArrivalAt, status: item.status }; }
  private toDestination(method: Pick<ProviderPayoutMethod, 'id' | 'bankName' | 'maskedAccount' | 'last4' | 'verificationStatus'>) { return { id: method.id, bankName: method.bankName, maskedAccount: method.maskedAccount, last4: method.last4, verificationStatus: method.verificationStatus }; }
  private toProviderPayoutStatus(status?: AdminProviderPayoutStatusFilter): ProviderPayoutStatus | undefined { if (!status || status === AdminProviderPayoutStatusFilter.ALL || status === AdminProviderPayoutStatusFilter.ON_HOLD || status === AdminProviderPayoutStatusFilter.REJECTED) return undefined; return status; }
  private matchesSearch(item: PayoutWithRelations, search: string): boolean { const normalized = search.toLowerCase(); return [item.id, item.transactionId, item.provider.id, item.provider.providerBusinessName, item.provider.firstName, item.provider.lastName].filter(Boolean).some((value) => String(value).toLowerCase().includes(normalized)); }
  private pendingStatuses(): ProviderPayoutStatus[] { return [ProviderPayoutStatus.PENDING, ProviderPayoutStatus.PROCESSING]; }
  private sumPayouts(items: Pick<ProviderPayout, 'amount'>[]): number { return this.money(items.reduce((sum, item) => sum + Number(item.amount), 0)); }
  private sumFees(items: Pick<ProviderPayout, 'processingFee'>[]): number { return this.money(items.reduce((sum, item) => sum + Number(item.processingFee), 0)); }
  private providerEarningTotals(ledger: LedgerWithProvider[]): Map<string, { totalEarnings: number; currency: string }> { const totals = new Map<string, { totalEarnings: number; currency: string }>(); for (const item of ledger) { const current = totals.get(item.providerId) ?? { totalEarnings: 0, currency: item.currency }; current.totalEarnings = this.money(current.totalEarnings + Number(item.amount)); totals.set(item.providerId, current); } return totals; }
  private tierFor(total: number, tiers: CommissionTier[]): CommissionTier | null { return [...tiers].filter((tier) => total >= Number(tier.orderVolumeThreshold)).sort((left, right) => Number(right.orderVolumeThreshold) - Number(left.orderVolumeThreshold))[0] ?? null; }
  private monthRanges(): { currentStart: Date; previousStart: Date; previousEnd: Date } { const now = new Date(); const currentStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)); return { currentStart, previousStart: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1)), previousEnd: currentStart }; }
  private lastTwelveMonths(): { label: string; start: Date; end: Date }[] { const now = new Date(); return Array.from({ length: 12 }, (_, index) => { const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (11 - index), 1)); return { label: start.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' }), start, end: new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1)) }; }); }
  private delta(current: number, previous: number): number { if (previous === 0) return current === 0 ? 0 : 100; return this.money(((current - previous) / previous) * 100); }
  private providerCode(id: string): string { return `PRV-${id.slice(-5).toUpperCase()}`; }
  private name(user: { firstName: string; lastName: string }): string { return `${user.firstName} ${user.lastName}`.trim(); }
  private money(value: Prisma.Decimal | number): number { return Number(Number(value).toFixed(2)); }
  private csv(value: string): string { return `"${value.replaceAll('"', '""')}"`; }
}
