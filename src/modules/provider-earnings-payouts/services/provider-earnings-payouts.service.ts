import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { NotificationRecipientType, Prisma, WalletLedgerDirection, WalletLedgerStatus, WalletLedgerType, WalletOwnerType, OrderStatus, ProviderPayoutMethod, ProviderPayoutStatus, ProviderPayoutVerificationStatus, UserStatus } from '@prisma/client';
import { AuthUserContext } from '../../../common/decorators/current-user.decorator';
import { EarningsChartQueryDto, EarningsLedgerQueryDto, EarningsLedgerStatusFilter, EarningsLedgerTypeFilter, EarningsSummaryQueryDto, EarningsSummaryRange, PayoutHistoryQueryDto, PayoutHistoryRange, PayoutPreviewQueryDto, PayoutSortBy, PayoutStatusFilter, ProviderPayoutAction, ProviderPayoutActionDto, RequestProviderPayoutDto, SortOrder } from '../dto/provider-earnings-payouts.dto';
import { ProviderEarningsPayoutsRepository, WalletWithdrawalWithMethod } from '../repositories/provider-earnings-payouts.repository';
import { getPagination } from '../../../common/pagination/pagination.util';

@Injectable()
export class ProviderEarningsPayoutsService {
  constructor(private readonly repository: ProviderEarningsPayoutsRepository) {}

  async earningsSummary(user: AuthUserContext, query: EarningsSummaryQueryDto) {
    await this.getApprovedActiveProvider(user.uid);
    const range = this.dateRange(query.range ?? EarningsSummaryRange.LAST_30_DAYS, query.fromDate, query.toDate);
    const previous = range.from ? this.previousRange(range.from, range.to ?? new Date()) : { from: undefined, to: undefined };
    const [ledger, previousLedger, pendingPayouts, defaultPayoutMethod] = await Promise.all([
      this.repository.findLedgerEntriesForProvider({ providerId: user.uid, ...(range.from || range.to ? { createdAt: { gte: range.from, lte: range.to } } : {}) }),
      this.repository.findLedgerEntriesForProvider({ providerId: user.uid, ...(previous.from || previous.to ? { createdAt: { gte: previous.from, lte: previous.to } } : {}) }),
      this.repository.findPendingPayoutsForProvider(user.uid),
      this.repository.findDefaultPayoutMethodForProvider(user.uid),
    ]);
    const availableForPayout = await this.availableBalance(user.uid);
    const totalEarnings = this.sumLedger(ledger, [WalletLedgerType.ORDER_EARNING, WalletLedgerType.ADJUSTMENT], [WalletLedgerDirection.CREDIT]);
    const previousEarnings = this.sumLedger(previousLedger, [WalletLedgerType.ORDER_EARNING, WalletLedgerType.ADJUSTMENT], [WalletLedgerDirection.CREDIT]);
    const pendingPayoutTotal = this.money(pendingPayouts.reduce((sum, item) => sum + Number(item.amount), 0));
    return { data: { totalBalance: availableForPayout, giftCredits: 0, totalEarnings, totalEarningsDeltaPercent: this.deltaPercent(totalEarnings, previousEarnings), pendingPayouts: pendingPayoutTotal, pendingPayoutExpectedBy: pendingPayouts[0]?.expectedArrivalAt ?? null, availableForPayout, currency: defaultPayoutMethod?.currency ?? ledger[0]?.currency ?? 'USD', defaultPayoutMethod: defaultPayoutMethod ? this.toPayoutMethod(defaultPayoutMethod) : null }, message: 'Provider earnings summary fetched successfully.' };
  }

  async earningsChart(user: AuthUserContext, query: EarningsChartQueryDto) {
    await this.getApprovedActiveProvider(user.uid);
    const range = this.chartRange(query.range ?? 'DAILY', query.fromDate, query.toDate);
    const ledger = await this.repository.findEarningsChartRows({ providerId: user.uid, direction: WalletLedgerDirection.CREDIT, status: WalletLedgerStatus.SUCCESS, createdAt: { gte: range.from, lte: range.to } });
    const values = range.labels.map(() => 0);
    for (const item of ledger) { const index = Math.min(values.length - 1, Math.max(0, Math.floor((item.createdAt.getTime() - range.from.getTime()) / range.bucketMs))); values[index] += Number(item.amount); }
    return { data: { range: query.range ?? 'DAILY', labels: range.labels, values: values.map((value) => this.money(value)), currency: ledger[0]?.currency ?? 'USD' }, message: 'Provider earnings chart fetched successfully.' };
  }

  async earningsLedger(user: AuthUserContext, query: EarningsLedgerQueryDto) {
    await this.getApprovedActiveProvider(user.uid);
    const { page, limit, skip, take } = getPagination(query);
    const where: Prisma.WalletLedgerWhereInput = { wallet: { ownerType: 'PROVIDER', ownerId: user.uid } };
    if (query.type && query.type !== EarningsLedgerTypeFilter.ALL) where.type = query.type as unknown as WalletLedgerType;
    if (query.status && query.status !== EarningsLedgerStatusFilter.ALL) where.status = query.status as unknown as WalletLedgerStatus;
    if (query.fromDate || query.toDate) where.createdAt = { gte: query.fromDate ? new Date(query.fromDate) : undefined, lte: query.toDate ? new Date(query.toDate) : undefined };
    const [items, total] = await this.repository.findLedgerEntriesAndCountForProvider(where, { skip, take });
    return { data: items.map((item) => ({ id: item.id, type: item.type, description: item.description, amount: Number(item.amount), currency: item.currency, status: item.status, orderNumber: item.order?.orderNumber ?? null, createdAt: item.createdAt })), meta: { page, limit, total, totalPages: Math.ceil(total / limit) }, message: 'Provider earnings ledger fetched successfully.' };
  }

  async payoutSummary(user: AuthUserContext) {
    await this.getApprovedActiveProvider(user.uid);
    const payouts = await this.repository.findPayoutsForProvider(user.uid);
    return { data: { totalPaidOut: this.sumPayouts(payouts, [ProviderPayoutStatus.COMPLETED]), pendingPayouts: this.sumPayouts(payouts, [ProviderPayoutStatus.PENDING, ProviderPayoutStatus.PROCESSING]), failedPayouts: payouts.filter((item) => item.status === ProviderPayoutStatus.FAILED).length, currency: payouts[0]?.currency ?? 'USD' }, message: 'Provider payout summary fetched successfully.' };
  }

  async payoutHistory(user: AuthUserContext, query: PayoutHistoryQueryDto) {
    await this.getApprovedActiveProvider(user.uid);
    const { page, limit, skip, take } = getPagination(query);
    const range = this.dateRange(query.range ?? PayoutHistoryRange.ALL_TIME, query.fromDate, query.toDate);
    const where: Prisma.WalletWithdrawalWhereInput = { ...(query.status && query.status !== PayoutStatusFilter.ALL ? { status: query.status as unknown as ProviderPayoutStatus } : {}), ...(range.from || range.to ? { createdAt: { gte: range.from, lte: range.to } } : {}) };
    const [items, total] = await this.repository.findPayoutsAndCountForProvider(user.uid, where, { orderBy: { [query.sortBy ?? PayoutSortBy.createdAt]: query.sortOrder === SortOrder.ASC ? 'asc' : 'desc' }, skip, take });
    return { data: items.map((item) => this.toPayoutListItem(item)), meta: { page, limit, total, totalPages: Math.ceil(total / limit) }, message: 'Provider payouts fetched successfully.' };
  }

  async payoutPreview(user: AuthUserContext, query: PayoutPreviewQueryDto) { await this.getApprovedActiveProvider(user.uid); return { data: await this.preview(user.uid, query.amount, query.payoutMethodId), message: 'Payout preview fetched successfully.' }; }

  async requestPayout(user: AuthUserContext, dto: RequestProviderPayoutDto) {
    await this.getApprovedActiveProvider(user.uid);
    const duplicate = await this.repository.findExistingPayoutByIdempotencyKey(user.uid, dto.idempotencyKey);
    if (duplicate) throw new ConflictException('Duplicate payout request');
    const preview = await this.preview(user.uid, dto.amount, dto.payoutMethodId);
    const activeForMethod = await this.repository.findActivePayoutForMethod(user.uid, preview.destination.id);
    if (activeForMethod) throw new ConflictException('Active payout already exists for this payout method');
    const wallet = await this.repository.getOrCreateProviderWallet(user.uid, preview.currency);
    const transactionId = this.transactionId();
    const amount = new Prisma.Decimal(preview.requestedAmount);
    const payout = await this.repository.createPayoutRequest({
      walletId: wallet.id,
      withdrawalData: { bankAccountId: preview.destination.id, transactionId, amount, processingFee: new Prisma.Decimal(preview.processingFee), totalToReceive: new Prisma.Decimal(preview.totalToReceive), currency: preview.currency, status: ProviderPayoutStatus.PENDING, expectedArrivalAt: this.expectedArrivalAt(), idempotencyKey: dto.idempotencyKey },
      amount,
      currency: preview.currency,
      notificationData: { recipientId: user.uid, recipientType: NotificationRecipientType.PROVIDER, title: 'Payout requested', message: 'Your payout request was submitted.', type: 'PROVIDER_PAYOUT_REQUESTED' },
    });
    return { data: this.toPayoutResponse(payout, preview.destination), message: 'Payout requested successfully.' };
  }

  async payoutDetails(user: AuthUserContext, id: string) { await this.getApprovedActiveProvider(user.uid); const payout = await this.getOwnedPayout(user.uid, id); return { data: this.toPayoutDetail(payout), message: 'Provider payout fetched successfully.' }; }

  async payoutAction(user: AuthUserContext, id: string, dto: ProviderPayoutActionDto) {
    if (dto.action === ProviderPayoutAction.CANCEL) return this.cancelPayout(user, id, dto.reason);
    throw new BadRequestException('Unsupported payout action');
  }

  private async cancelPayout(user: AuthUserContext, id: string, reason?: string) {
    await this.getApprovedActiveProvider(user.uid);
    const payout = await this.getOwnedPayout(user.uid, id);
    if (payout.status !== ProviderPayoutStatus.PENDING) throw new ConflictException('Only pending payouts can be cancelled');
    const cancelReason = reason?.trim() || 'Requested by provider.';
    const updated = await this.repository.cancelPayoutRequest({
      walletId: payout.walletId,
      payoutId: payout.id,
      amount: payout.amount,
      cancelReason,
      notificationData: { recipientId: user.uid, recipientType: NotificationRecipientType.PROVIDER, title: 'Payout cancelled', message: 'Your payout request was cancelled.', type: 'PROVIDER_PAYOUT_CANCELLED', metadataJson: { payoutId: payout.id } },
    });
    return { data: { id: updated.id, status: updated.status }, message: 'Provider payout cancelled successfully.' };
  }

  async recordOrderEarning(orderId: string): Promise<void> {
    const order = await this.repository.findOrderForEarning(orderId);
    if (!order || !([OrderStatus.DELIVERED, OrderStatus.COMPLETED] as OrderStatus[]).includes(order.status)) return;
    await this.repository.createOrderEarningLedgerEntry({ providerId: order.providerId, orderId: order.id, amount: order.total, currency: 'USD', description: `Order #${order.orderNumber} payout` });
  }

  async returnFailedPayoutBalance(providerId: string, payoutId: string, reason: string): Promise<void> {
    const payout = await this.repository.findPayoutByIdForProvider(providerId, payoutId);
    if (!payout) return;
    await this.repository.returnFailedPayoutBalance({ walletId: payout.walletId, payoutId, amount: payout.amount, reason });
  }

  private async preview(providerId: string, amount: number, payoutMethodId?: string) {
    if (amount <= 0) throw new BadRequestException('Payout amount must be greater than 0');
    const availableBalance = await this.availableBalance(providerId);
    if (amount > availableBalance) throw new BadRequestException('Payout amount exceeds available balance');
    const method = payoutMethodId ? await this.getOwnedPayoutMethod(providerId, payoutMethodId) : await this.defaultPayoutMethod(providerId);
    if (method.verificationStatus !== ProviderPayoutVerificationStatus.VERIFIED || !method.isActive) throw new BadRequestException('Verified payout method is required');
    return { requestedAmount: this.money(amount), processingFee: 0, totalToReceive: this.money(amount), availableBalance, currency: method.currency, destination: { id: method.id, bankName: method.bankName, maskedAccount: method.maskedAccount }, expectedArrivalText: '2-3 Business Days' };
  }

  private async availableBalance(providerId: string): Promise<number> { const wallet = await this.repository.findProviderWallet(providerId); return this.money(Number(wallet?.balance ?? 0)); }
  private async getApprovedActiveProvider(id: string) { const provider = await this.repository.findProviderUserById(id); if (!provider) throw new NotFoundException('Provider not found'); if (provider.status !== UserStatus.APPROVED) throw new ForbiddenException('Only approved active providers can access earnings and payouts'); return provider; }
  private async getOwnedPayoutMethod(providerId: string, id: string): Promise<ProviderPayoutMethod> { const method = await this.repository.findPayoutMethodForProvider(providerId, id); if (!method) throw new NotFoundException('Provider payout method not found'); return method; }
  private async defaultPayoutMethod(providerId: string): Promise<ProviderPayoutMethod> { const method = await this.repository.findDefaultPayoutMethodForProvider(providerId); if (!method) throw new NotFoundException('Default payout method not found'); return method; }
  private async getOwnedPayout(providerId: string, id: string): Promise<WalletWithdrawalWithMethod> { const payout = await this.repository.findPayoutByIdForProvider(providerId, id); if (!payout) throw new NotFoundException('Provider payout not found'); return payout; }
  private toPayoutMethod(method: ProviderPayoutMethod) { return { id: method.id, bankName: method.bankName, maskedAccount: method.maskedAccount, verificationStatus: method.verificationStatus }; }
  private toPayoutListItem(item: WalletWithdrawalWithMethod) { return { id: item.id, transactionId: item.transactionId, title: 'Payout to Bank', amount: Number(item.amount), currency: item.currency, status: item.status, destination: { bankName: item.payoutMethod?.bankName ?? '', maskedAccount: item.payoutMethod?.maskedAccount ?? '' }, expectedArrivalText: this.expectedArrivalText(item), createdAt: item.createdAt }; }
  private toPayoutDetail(item: WalletWithdrawalWithMethod) { return { ...this.toPayoutListItem(item), failureReason: item.failureReason, referenceId: item.externalPayoutId ?? `PAY-${item.id.slice(-6).toUpperCase()}-TRX`, createdAt: item.createdAt }; }
  private toPayoutResponse(payout: { id: string; transactionId: string; amount: Prisma.Decimal; currency: string; status: ProviderPayoutStatus }, destination: { bankName: string; maskedAccount: string }) { return { id: payout.id, transactionId: payout.transactionId, amount: Number(payout.amount), currency: payout.currency, status: payout.status, destination, expectedArrivalText: '2-3 Business Days' }; }
  private sumLedger(items: { type: WalletLedgerType; direction: WalletLedgerDirection; amount: Prisma.Decimal }[], types: WalletLedgerType[], directions: WalletLedgerDirection[]): number { return this.money(items.filter((item) => types.includes(item.type) && directions.includes(item.direction)).reduce((sum, item) => sum + Number(item.amount), 0)); }
  private sumPayouts(items: { status: ProviderPayoutStatus; amount: Prisma.Decimal }[], statuses: ProviderPayoutStatus[]): number { return this.money(items.filter((item) => statuses.includes(item.status)).reduce((sum, item) => sum + Number(item.amount), 0)); }
  private dateRange(range: string, fromDate?: string, toDate?: string) { const now = new Date(); if (range === 'CUSTOM') return { from: fromDate ? new Date(fromDate) : undefined, to: toDate ? new Date(toDate) : now }; if (range === 'ALL_TIME') return { from: undefined, to: undefined }; const days = range === 'LAST_7_DAYS' ? 7 : range === 'LAST_90_DAYS' ? 90 : 30; return { from: new Date(now.getTime() - days * 86_400_000), to: now }; }
  private previousRange(from: Date, to: Date) { const diff = to.getTime() - from.getTime(); return { from: new Date(from.getTime() - diff), to: from }; }
  private chartRange(range: string, fromDate?: string, toDate?: string) { const now = new Date(); const from = fromDate ? new Date(fromDate) : new Date(now.getTime() - 6 * 86_400_000); const to = toDate ? new Date(toDate) : now; const labels = range === 'MONTHLY' ? ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'] : range === 'WEEKLY' ? ['W1','W2','W3','W4'] : ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']; return { from, to, labels, bucketMs: Math.max(1, (to.getTime() - from.getTime()) / labels.length) }; }
  private expectedArrivalAt(): Date { return new Date(Date.now() + 3 * 86_400_000); }
  private expectedArrivalText(item: { expectedArrivalAt: Date | null }): string { return item.expectedArrivalAt ? '2-3 Business Days' : 'Pending schedule'; }
  private transactionId(): string { return `TXN-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`; }
  private deltaPercent(current: number, previous: number): number { if (previous === 0) return current > 0 ? 100 : 0; return this.money(((current - previous) / previous) * 100); }
  private money(value: number): number { return Number(value.toFixed(2)); }
}
