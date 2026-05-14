import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { GiftStatus, PaymentStatus, Prisma, PromotionalOfferApprovalStatus, PromotionalOfferStatus, ProviderApprovalStatus, ProviderOrderStatus, UserRole } from '@prisma/client';
import { AuthUserContext } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../database/prisma.service';

type DashboardProvider = Awaited<ReturnType<ProviderDashboardService['getApprovedActiveProvider']>>;
type RecentProviderOrder = Prisma.ProviderOrderGetPayload<{ include: { order: true; items: true } }>;

@Injectable()
export class ProviderDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async get(user: AuthUserContext) {
    const provider = await this.getApprovedActiveProvider(user.uid);
    const now = new Date();
    const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const todayEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
    const weekStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - ((now.getUTCDay() + 6) % 7)));
    const baseOrderWhere: Prisma.ProviderOrderWhereInput = { providerId: provider.id };

    const [todayOrders, pendingOrders, activeOffers, totalItems, performanceOrders, recentOrders] = await this.prisma.$transaction([
      this.prisma.providerOrder.count({ where: { ...baseOrderWhere, createdAt: { gte: todayStart, lte: todayEnd } } }),
      this.prisma.providerOrder.count({ where: { ...baseOrderWhere, status: ProviderOrderStatus.PENDING } }),
      this.prisma.promotionalOffer.count({ where: { providerId: provider.id, deletedAt: null, isActive: true, status: PromotionalOfferStatus.ACTIVE, approvalStatus: PromotionalOfferApprovalStatus.APPROVED, startDate: { lte: now }, OR: [{ endDate: null }, { endDate: { gte: now } }] } }),
      this.prisma.gift.count({ where: { providerId: provider.id, deletedAt: null, status: { not: GiftStatus.INACTIVE } } }),
      this.prisma.providerOrder.findMany({ where: { ...baseOrderWhere, createdAt: { gte: weekStart, lte: now } }, select: { createdAt: true, totalPayout: true, total: true, currency: true } }),
      this.prisma.providerOrder.findMany({ where: baseOrderWhere, include: { order: true, items: true }, orderBy: { createdAt: 'desc' }, take: 5 }),
    ]);

    return {
      data: {
        provider: this.toProvider(provider),
        operationalSummary: { todayOrders, pendingOrders, activeOffers, totalItems },
        performance: this.performance(performanceOrders, weekStart),
        recentOrders: recentOrders.map((order) => this.toRecentOrder(order)),
      },
      message: 'Provider dashboard fetched successfully.',
    };
  }

  private async getApprovedActiveProvider(id: string) {
    const provider = await this.prisma.user.findFirst({ where: { id, role: UserRole.PROVIDER, deletedAt: null } });
    if (!provider) throw new NotFoundException('Provider not found');
    if (provider.providerApprovalStatus !== ProviderApprovalStatus.APPROVED || !provider.isActive || !provider.isApproved || provider.suspendedAt) {
      throw new ForbiddenException('Only approved active providers can access dashboard');
    }
    return provider;
  }

  private toProvider(provider: DashboardProvider) {
    return {
      id: provider.id,
      businessName: provider.providerBusinessName,
      avatarUrl: provider.avatarUrl,
      approvalStatus: provider.providerApprovalStatus,
      status: provider.isActive ? 'ACTIVE' : 'INACTIVE',
    };
  }

  private performance(orders: { createdAt: Date; totalPayout: Prisma.Decimal | null; total: Prisma.Decimal; currency: string }[], weekStart: Date) {
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const values = labels.map(() => 0);
    for (const order of orders) {
      const index = Math.floor((Date.UTC(order.createdAt.getUTCFullYear(), order.createdAt.getUTCMonth(), order.createdAt.getUTCDate()) - weekStart.getTime()) / 86_400_000);
      if (index >= 0 && index < values.length) values[index] += Number(order.totalPayout ?? order.total);
    }
    return { range: 'WEEKLY', labels, values: values.map((value) => this.money(value)), currency: orders[0]?.currency ?? 'PKR' };
  }

  private toRecentOrder(order: RecentProviderOrder) {
    const firstItem = order.items[0];
    return {
      id: order.id,
      orderNumber: order.orderNumber ?? order.order.orderNumber,
      itemName: firstItem?.nameSnapshot ?? 'Order item',
      imageUrl: firstItem?.imageUrl ?? null,
      amount: this.money(Number(order.totalPayout ?? order.total)),
      currency: order.currency,
      status: order.order.paymentStatus === PaymentStatus.SUCCEEDED ? 'PAID' : order.status,
      createdAgoText: this.timeAgo(order.createdAt),
    };
  }

  private timeAgo(date: Date): string {
    const diff = Math.max(0, Date.now() - date.getTime());
    const minutes = Math.floor(diff / 60_000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }

  private money(value: number): number { return Number(value.toFixed(2)); }
}
