import { BadRequestException, Injectable } from '@nestjs/common';
import { OrderStatus, WalletLedgerDirection, WalletLedgerStatus, WalletLedgerType, WalletOwnerType, Prisma, UserStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { DispatchNotificationInput, NotificationDispatchService } from '../notifications/notification-dispatch.service';

export const PROVIDER_ORDER_LIST_INCLUDE = Prisma.validator<Prisma.OrderInclude>()({
  items: { include: { gift: { select: { id: true, name: true, imageUrls: true } } } },
  refundRequests: { orderBy: { requestedAt: 'desc' }, take: 1 },
});

type ProviderOrderTransaction = Prisma.TransactionClient;

type NotificationCreateData = DispatchNotificationInput;

@Injectable()
export class ProviderOrdersRepository {
  constructor(private readonly prisma: PrismaService, private readonly notificationDispatch: NotificationDispatchService) {}

  findManyProviderOrders(params: { where: Prisma.OrderWhereInput; include: typeof PROVIDER_ORDER_LIST_INCLUDE; orderBy: Prisma.OrderOrderByWithRelationInput; skip: number; take: number }) {
    return this.prisma.order.findMany({ where: params.where, include: params.include, orderBy: params.orderBy, skip: params.skip, take: params.take });
  }

  countProviderOrders(where: Prisma.OrderWhereInput) {
    return this.prisma.order.count({ where });
  }

  findManyAndCountProviderOrders(params: { where: Prisma.OrderWhereInput; include: typeof PROVIDER_ORDER_LIST_INCLUDE; orderBy: Prisma.OrderOrderByWithRelationInput; skip: number; take: number }) {
    return this.prisma.$transaction([this.findManyProviderOrders(params), this.countProviderOrders(params.where)]);
  }

  findProviderOrderById(providerId: string, id: string, include: typeof PROVIDER_ORDER_LIST_INCLUDE = PROVIDER_ORDER_LIST_INCLUDE) {
    return this.prisma.order.findFirst({ where: { id, providerId }, include });
  }

  findProviderOrderSummary(params: { base: Prisma.OrderWhereInput; todayWhere: Prisma.OrderWhereInput }) {
    return this.prisma.$transaction([
      this.prisma.order.findMany({ where: params.todayWhere }),
      this.prisma.order.count({ where: { ...params.base, status: OrderStatus.PENDING } }),
      this.prisma.order.count({ where: { ...params.base, status: { in: [OrderStatus.ACCEPTED, OrderStatus.PROCESSING] } } }),
      this.prisma.order.count({ where: { ...params.base, status: OrderStatus.SHIPPED } }),
      this.prisma.order.count({ where: { ...params.base, status: { in: [OrderStatus.DELIVERED, OrderStatus.COMPLETED] } } }),
      this.prisma.order.count({ where: { ...params.base, status: { in: [OrderStatus.CANCELLED, OrderStatus.REJECTED] } } }),
    ]);
  }

  findRecentProviderOrders(providerId: string, limit: number) {
    return this.prisma.order.findMany({ where: { providerId }, include: PROVIDER_ORDER_LIST_INCLUDE, orderBy: { createdAt: 'desc' }, take: limit });
  }

  findPerformanceRows(params: { providerId: string; range: { from: Date; to: Date }; previous: { from: Date; to: Date } }) {
    return Promise.all([
      this.prisma.order.findMany({ where: { providerId: params.providerId, createdAt: { gte: params.range.from, lte: params.range.to } } }),
      this.prisma.order.findMany({ where: { providerId: params.providerId, createdAt: { gte: params.previous.from, lte: params.previous.to } } }),
    ]);
  }

  findRevenueAnalyticsRows(params: { providerId: string; range: { from: Date; to: Date }; previous: { from: Date; to: Date }; statuses: OrderStatus[] }) {
    return Promise.all([
      this.prisma.order.findMany({ where: { providerId: params.providerId, createdAt: { gte: params.range.from, lte: params.range.to }, status: { in: params.statuses } } }),
      this.prisma.order.findMany({ where: { providerId: params.providerId, createdAt: { gte: params.previous.from, lte: params.previous.to }, status: { in: params.statuses } } }),
    ]);
  }

  findRatingAnalyticsRows(providerId: string) {
    return this.prisma.review.findMany({ where: { providerId, deletedAt: null } });
  }

  findProviderOrdersForExport(params: { where: Prisma.OrderWhereInput; include: typeof PROVIDER_ORDER_LIST_INCLUDE }) {
    return this.prisma.order.findMany({ where: params.where, include: params.include, orderBy: { createdAt: 'desc' } });
  }

  runActionTransaction<T>(callback: (tx: ProviderOrderTransaction) => Promise<T>) {
    return this.prisma.$transaction(callback);
  }

  findProviderOrderForAction(providerId: string, id: string, include: typeof PROVIDER_ORDER_LIST_INCLUDE = PROVIDER_ORDER_LIST_INCLUDE) {
    return this.findProviderOrderById(providerId, id, include);
  }

  updateProviderOrderStatus(tx: ProviderOrderTransaction, id: string, data: { status: OrderStatus; rejectionReason?: string }) {
    return tx.order.update({ where: { id }, data: { status: data.status, rejectionReason: data.rejectionReason } });
  }

  createCustomerOrderNotification(tx: ProviderOrderTransaction, data: NotificationCreateData) {
    return this.notificationDispatch.createAndEmit(data);
  }

  findActiveSuperAdminIds(tx: ProviderOrderTransaction) {
    return tx.user.findMany({ where: { role: 'SUPER_ADMIN', status: UserStatus.APPROVED }, select: { id: true } });
  }

  async upsertOrderEarningLedger(tx: ProviderOrderTransaction, params: { providerId: string; orderId: string; amount: Prisma.Decimal; description: string }) {
    const wallet = await tx.wallet.upsert({
      where: { ownerType_ownerId: { ownerType: WalletOwnerType.PROVIDER, ownerId: params.providerId } },
      update: {},
      create: { ownerType: WalletOwnerType.PROVIDER, ownerId: params.providerId, currency: 'USD' },
    });
    const existing = await tx.walletLedger.findFirst({ where: { walletId: wallet.id, orderId: params.orderId, type: WalletLedgerType.ORDER_EARNING } });
    if (existing) return existing;
    const ledger = await tx.walletLedger.create({ data: { walletId: wallet.id, orderId: params.orderId, type: WalletLedgerType.ORDER_EARNING, direction: WalletLedgerDirection.CREDIT, amount: params.amount, currency: 'USD', status: WalletLedgerStatus.SUCCESS, transactionId: this.transactionId(), description: params.description } });
    await tx.wallet.update({ where: { id: wallet.id }, data: { balance: { increment: params.amount } } });
    return ledger;
  }

  // Charges the order to the customer's wallet at acceptance time (no Stripe). Gift credits are spent
  // first, then the cash balance. Throws (rolling back accept) if funds are short. Idempotent per order.
  async debitCustomerWalletForOrder(tx: ProviderOrderTransaction, params: { userId: string; orderId: string; amount: Prisma.Decimal }) {
    const wallet = await tx.wallet.findUnique({ where: { ownerType_ownerId: { ownerType: WalletOwnerType.USER, ownerId: params.userId } } });
    if (!wallet) throw new BadRequestException('Customer wallet not found. The customer must top up before this order can be accepted.');
    const existing = await tx.walletLedger.findFirst({ where: { walletId: wallet.id, orderId: params.orderId, type: WalletLedgerType.ORDER_PAYMENT } });
    if (existing) return existing;
    const amount = Number(params.amount);
    const giftCredits = Number(wallet.giftCredits);
    const balance = Number(wallet.balance);
    if (giftCredits + balance + 1e-9 < amount) throw new BadRequestException('Customer has insufficient wallet balance to pay for this order.');
    const giftCreditsUsed = this.round(Math.min(giftCredits, amount));
    const balanceUsed = this.round(amount - giftCreditsUsed);
    const ledger = await tx.walletLedger.create({ data: { walletId: wallet.id, orderId: params.orderId, type: WalletLedgerType.ORDER_PAYMENT, direction: WalletLedgerDirection.DEBIT, amount: params.amount, currency: 'USD', status: WalletLedgerStatus.SUCCESS, transactionId: this.transactionId(), description: 'Order payment from wallet.' } });
    await tx.wallet.update({ where: { id: wallet.id }, data: { giftCredits: { decrement: new Prisma.Decimal(giftCreditsUsed) }, balance: { decrement: new Prisma.Decimal(balanceUsed) } } });
    return ledger;
  }

  private round(value: number): number { return Number(value.toFixed(2)); }
  private transactionId(): string { return `TXN-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`; }
}
