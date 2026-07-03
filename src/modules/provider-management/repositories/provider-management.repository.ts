import { Injectable } from '@nestjs/common';
import { GiftStatus, PaymentStatus, Prisma, ProviderEarningsLedgerDirection, ProviderEarningsLedgerStatus, ProviderOrderStatus, ReviewStatus, UploadedFileStatus, UserRole, UserStatus } from '@prisma/client';
import { ADMIN_AUDIT_ACTOR_SELECT, buildAdminAuditLogData } from '../../../common/audit/admin-audit-log.util';
import { getPagination } from '../../../common/pagination/pagination.util';
import { PrismaService } from '../../../database/prisma.service';
import { NotificationDispatchService } from '../../notifications/notification-dispatch.service';
import {
  ExportProvidersDto,
  ListProviderItemsDto,
  ListProvidersDto,
  ProviderItemSortBy,
  ProviderItemStatus,
  ProviderLookupDto,
  ProviderSortBy,
  ProviderStatusFilter,
  SortOrder,
} from '../dto/provider-management.dto';

export interface ProviderAggregateStats {
  revenue: number;
  performanceStats: number;
  performanceChangePercent: number;
  listedItems: number;
  listedItemsChange: number;
  orderFulfillment: number;
  orderFulfillmentChangePercent: number;
  disputeCount: number;
  disputeChangePercent: number;
  averageRating: number;
  reviewCount: number;
}

export interface ProviderListedItem {
  id: string;
  name: string;
  createdAt: Date;
  price: number;
  currency: string;
  salesCount: number;
  salesPercentage: number;
  status: ProviderItemStatus;
  imageUrl: string | null;
}

interface ProviderPlatformStats {
  totalProviders: number;
  totalProvidersCurrentPeriod: number;
  totalProvidersPreviousPeriod: number;
  pendingApproval: number;
  inactiveProviders: number;
  inactiveProvidersCurrentPeriod: number;
  inactiveProvidersPreviousPeriod: number;
  activeRevenue: number;
  activeRevenueCurrentPeriod: number;
  activeRevenuePreviousPeriod: number;
}

@Injectable()
export class ProviderManagementRepository {
  constructor(private readonly prisma: PrismaService, private readonly notificationDispatch: NotificationDispatchService) {}

  findManyProviders(query: ListProvidersDto | ExportProvidersDto, pagination?: { skip: number; take: number }) {
    return this.prisma.user.findMany({
      where: this.buildProviderWhere(query),
      include: { providerProfile: true },
      orderBy: this.toOrderBy('sortBy' in query ? query.sortBy : undefined, 'sortOrder' in query ? query.sortOrder : undefined),
      skip: pagination?.skip,
      take: pagination?.take,
    });
  }

  countProviders(query: ListProvidersDto | ExportProvidersDto) {
    return this.prisma.user.count({ where: this.buildProviderWhere(query) });
  }

  findProviderById(id: string) {
    return this.prisma.user.findFirst({ where: { id, role: UserRole.PROVIDER }, include: { providerProfile: true } });
  }

  findProviderByUserId(userId: string) {
    return this.findProviderById(userId);
  }

  findProviderByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findProviderLookup(query: ProviderLookupDto) {
    const { take } = getPagination(query);
    return this.prisma.user.findMany({
      where: {
        role: UserRole.PROVIDER,
        status: query.isActive ?? true ? UserStatus.APPROVED : { in: [UserStatus.BLOCKED, UserStatus.SUSPENDED, UserStatus.REJECTED] },
        ...(query.search
          ? {
              OR: [
                { providerProfile: { is: { businessName: { contains: query.search, mode: 'insensitive' } } } },
                { email: { contains: query.search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: { providerProfile: true },
      orderBy: { providerProfile: { businessName: 'asc' } },
      take,
    });
  }

  async findProviderStats() {
    const [totalProviders, pendingApproval, inactiveProviders] = await this.prisma.$transaction([
      this.prisma.user.count({ where: { role: UserRole.PROVIDER } }),
      this.prisma.user.count({ where: { role: UserRole.PROVIDER, status: UserStatus.PENDING } }),
      this.prisma.user.count({ where: { role: UserRole.PROVIDER, status: { in: [UserStatus.BLOCKED, UserStatus.SUSPENDED, UserStatus.REJECTED] } } }),
    ]);
    return { totalProviders, pendingApproval, inactiveProviders };
  }

  async findProviderAggregateMap(providerIds: string[]): Promise<Map<string, ProviderAggregateStats>> {
    const result = new Map<string, ProviderAggregateStats>();
    if (!providerIds.length) {
      return result;
    }

    const uniqueProviderIds = [...new Set(providerIds)];
    const currentWindow = this.currentWindow();
    const previousWindow = this.previousWindow(currentWindow.start);

    const [
      revenueRows,
      fallbackRevenueRows,
      listedItemsRows,
      listedItemsCurrentRows,
      listedItemsPreviousRows,
      fulfilledTotalRows,
      orderTotalRows,
      fulfilledCurrentRows,
      orderCurrentRows,
      fulfilledPreviousRows,
      orderPreviousRows,
      disputeTotalRows,
      disputeCurrentRows,
      disputePreviousRows,
      reviewRows,
    ] = await Promise.all([
      this.prisma.providerEarningsLedger.groupBy({
        by: ['providerId'],
        where: {
          providerId: { in: uniqueProviderIds },
          direction: ProviderEarningsLedgerDirection.CREDIT,
          status: { in: [ProviderEarningsLedgerStatus.AVAILABLE, ProviderEarningsLedgerStatus.PAYOUT_PENDING, ProviderEarningsLedgerStatus.PAID] },
        },
        _sum: { amount: true },
        _count: { _all: true },
      }),
      this.prisma.providerOrder.groupBy({
        by: ['providerId'],
        where: {
          providerId: { in: uniqueProviderIds },
          status: { in: this.revenueEligibleStatuses() },
          order: { paymentStatus: PaymentStatus.SUCCEEDED },
        },
        _sum: { totalPayout: true, total: true },
      }),
      this.prisma.gift.groupBy({
        by: ['providerId'],
        where: { providerId: { in: uniqueProviderIds }, status: GiftStatus.ACTIVE },
        _count: { _all: true },
      }),
      this.prisma.gift.groupBy({
        by: ['providerId'],
        where: { providerId: { in: uniqueProviderIds }, status: GiftStatus.ACTIVE, createdAt: { gte: currentWindow.start, lt: currentWindow.end } },
        _count: { _all: true },
      }),
      this.prisma.gift.groupBy({
        by: ['providerId'],
        where: { providerId: { in: uniqueProviderIds }, status: GiftStatus.ACTIVE, createdAt: { gte: previousWindow.start, lt: previousWindow.end } },
        _count: { _all: true },
      }),
      this.prisma.providerOrder.groupBy({
        by: ['providerId'],
        where: { providerId: { in: uniqueProviderIds }, status: { in: this.fulfillmentSuccessStatuses() }, order: { paymentStatus: PaymentStatus.SUCCEEDED } },
        _count: { _all: true },
      }),
      this.prisma.providerOrder.groupBy({
        by: ['providerId'],
        where: { providerId: { in: uniqueProviderIds }, status: { notIn: [ProviderOrderStatus.CANCELLED, ProviderOrderStatus.REJECTED] } },
        _count: { _all: true },
      }),
      this.prisma.providerOrder.groupBy({
        by: ['providerId'],
        where: { providerId: { in: uniqueProviderIds }, createdAt: { gte: currentWindow.start, lt: currentWindow.end }, status: { in: this.fulfillmentSuccessStatuses() }, order: { paymentStatus: PaymentStatus.SUCCEEDED } },
        _count: { _all: true },
      }),
      this.prisma.providerOrder.groupBy({
        by: ['providerId'],
        where: { providerId: { in: uniqueProviderIds }, createdAt: { gte: currentWindow.start, lt: currentWindow.end }, status: { notIn: [ProviderOrderStatus.CANCELLED, ProviderOrderStatus.REJECTED] } },
        _count: { _all: true },
      }),
      this.prisma.providerOrder.groupBy({
        by: ['providerId'],
        where: { providerId: { in: uniqueProviderIds }, createdAt: { gte: previousWindow.start, lt: previousWindow.end }, status: { in: this.fulfillmentSuccessStatuses() }, order: { paymentStatus: PaymentStatus.SUCCEEDED } },
        _count: { _all: true },
      }),
      this.prisma.providerOrder.groupBy({
        by: ['providerId'],
        where: { providerId: { in: uniqueProviderIds }, createdAt: { gte: previousWindow.start, lt: previousWindow.end }, status: { notIn: [ProviderOrderStatus.CANCELLED, ProviderOrderStatus.REJECTED] } },
        _count: { _all: true },
      }),
      this.prisma.dispute.groupBy({
        by: ['providerId'],
        where: { providerId: { in: uniqueProviderIds } },
        _count: { _all: true },
      }),
      this.prisma.dispute.groupBy({
        by: ['providerId'],
        where: { providerId: { in: uniqueProviderIds }, createdAt: { gte: currentWindow.start, lt: currentWindow.end } },
        _count: { _all: true },
      }),
      this.prisma.dispute.groupBy({
        by: ['providerId'],
        where: { providerId: { in: uniqueProviderIds }, createdAt: { gte: previousWindow.start, lt: previousWindow.end } },
        _count: { _all: true },
      }),
      this.prisma.review.groupBy({
        by: ['providerId'],
        where: { providerId: { in: uniqueProviderIds }, deletedAt: null, status: ReviewStatus.PUBLISHED },
        _avg: { rating: true },
        _count: { _all: true },
      }),
    ]);

    const revenueMap = new Map(revenueRows.map((row) => [row.providerId, { total: Number(row._sum.amount ?? 0), count: row._count._all }]));
    const fallbackRevenueMap = new Map(fallbackRevenueRows.map((row) => [row.providerId, Number(row._sum.totalPayout ?? row._sum.total ?? 0)]));
    const listedItemsMap = new Map(listedItemsRows.map((row) => [row.providerId, row._count._all]));
    const listedItemsCurrentMap = new Map(listedItemsCurrentRows.map((row) => [row.providerId, row._count._all]));
    const listedItemsPreviousMap = new Map(listedItemsPreviousRows.map((row) => [row.providerId, row._count._all]));
    const fulfilledTotalMap = new Map(fulfilledTotalRows.map((row) => [row.providerId, row._count._all]));
    const orderTotalMap = new Map(orderTotalRows.map((row) => [row.providerId, row._count._all]));
    const fulfilledCurrentMap = new Map(fulfilledCurrentRows.map((row) => [row.providerId, row._count._all]));
    const orderCurrentMap = new Map(orderCurrentRows.map((row) => [row.providerId, row._count._all]));
    const fulfilledPreviousMap = new Map(fulfilledPreviousRows.map((row) => [row.providerId, row._count._all]));
    const orderPreviousMap = new Map(orderPreviousRows.map((row) => [row.providerId, row._count._all]));
    const disputeTotalMap = new Map(disputeTotalRows.map((row) => [row.providerId, row._count._all]));
    const disputeCurrentMap = new Map(disputeCurrentRows.map((row) => [row.providerId, row._count._all]));
    const disputePreviousMap = new Map(disputePreviousRows.map((row) => [row.providerId, row._count._all]));
    const reviewMap = new Map(reviewRows.map((row) => [row.providerId, { averageRating: this.round(Number(row._avg.rating ?? 0)), reviewCount: row._count._all }]));

    for (const providerId of uniqueProviderIds) {
      const revenueInfo = revenueMap.get(providerId);
      const revenue = revenueInfo && revenueInfo.count > 0
        ? this.round(revenueInfo.total)
        : this.round(fallbackRevenueMap.get(providerId) ?? 0);
      const listedItems = listedItemsMap.get(providerId) ?? 0;
      const listedItemsChange = (listedItemsCurrentMap.get(providerId) ?? 0) - (listedItemsPreviousMap.get(providerId) ?? 0);
      const totalOrders = orderTotalMap.get(providerId) ?? 0;
      const fulfilledOrders = fulfilledTotalMap.get(providerId) ?? 0;
      const orderFulfillment = this.safeRatioPercent(fulfilledOrders, totalOrders);
      const currentFulfillment = this.safeRatioPercent(fulfilledCurrentMap.get(providerId) ?? 0, orderCurrentMap.get(providerId) ?? 0);
      const previousFulfillment = this.safeRatioPercent(fulfilledPreviousMap.get(providerId) ?? 0, orderPreviousMap.get(providerId) ?? 0);
      const disputeCount = disputeTotalMap.get(providerId) ?? 0;
      const disputeChangePercent = this.changePercent(disputeCurrentMap.get(providerId) ?? 0, disputePreviousMap.get(providerId) ?? 0);
      const review = reviewMap.get(providerId) ?? { averageRating: 0, reviewCount: 0 };

      result.set(providerId, {
        revenue,
        performanceStats: currentFulfillment,
        performanceChangePercent: this.changePercent(currentFulfillment, previousFulfillment),
        listedItems,
        listedItemsChange,
        orderFulfillment,
        orderFulfillmentChangePercent: this.changePercent(currentFulfillment, previousFulfillment),
        disputeCount,
        disputeChangePercent,
        averageRating: review.averageRating,
        reviewCount: review.reviewCount,
      });
    }

    return result;
  }

  async findSingleProviderAggregate(providerId: string): Promise<ProviderAggregateStats> {
    const map = await this.findProviderAggregateMap([providerId]);
    return map.get(providerId) ?? this.zeroAggregateStats();
  }

  async findProviderListedItems(providerId: string, query: ListProviderItemsDto): Promise<{ items: ProviderListedItem[]; total: number }> {
    const gifts = await this.prisma.gift.findMany({
      where: {
        providerId,
        ...(query.search ? { name: { contains: query.search, mode: 'insensitive' } } : {}),
      },
    });

    const giftIds = gifts.map((gift) => gift.id);
    const salesRows = giftIds.length
      ? await this.prisma.providerOrderItem.groupBy({
          by: ['giftId'],
          where: {
            giftId: { in: giftIds },
            providerOrder: {
              providerId,
              status: { in: this.fulfillmentSuccessStatuses() },
              order: { paymentStatus: PaymentStatus.SUCCEEDED },
            },
          },
          _sum: { quantity: true },
        })
      : [];
    const salesMap = new Map(salesRows.map((row) => [row.giftId, Number(row._sum.quantity ?? 0)]));
    const totalSales = [...salesMap.values()].reduce((sum, value) => sum + value, 0);

    const items = gifts
      .map<ProviderListedItem>((gift) => {
        const salesCount = salesMap.get(gift.id) ?? 0;
        return {
          id: gift.id,
          name: gift.name,
          createdAt: gift.createdAt,
          price: Number(gift.price),
          currency: gift.currency,
          salesCount,
          salesPercentage: totalSales === 0 ? 0 : this.round((salesCount / totalSales) * 100),
          status: this.toProviderItemStatus(gift.status),
          imageUrl: this.firstImage(gift.imageUrls),
        };
      })
      .filter((item) => !query.status || query.status === ProviderItemStatus.ALL || item.status === query.status);

    items.sort((left, right) => this.sortProviderItems(left, right, query.sortBy, query.sortOrder));
    return { items, total: items.length };
  }

  async findProviderPlatformStats(): Promise<ProviderPlatformStats> {
    const currentWindow = this.currentWindow();
    const previousWindow = this.previousWindow(currentWindow.start);
    const [
      totalProviders,
      totalProvidersCurrentPeriod,
      totalProvidersPreviousPeriod,
      pendingApproval,
      inactiveProviders,
      inactiveProvidersCurrentPeriod,
      inactiveProvidersPreviousPeriod,
      revenueRows,
      revenueCurrentRows,
      revenuePreviousRows,
      fallbackOrders,
      fallbackOrdersCurrent,
      fallbackOrdersPrevious,
    ] = await Promise.all([
      this.prisma.user.count({ where: { role: UserRole.PROVIDER } }),
      this.prisma.user.count({ where: { role: UserRole.PROVIDER, createdAt: { gte: currentWindow.start, lt: currentWindow.end } } }),
      this.prisma.user.count({ where: { role: UserRole.PROVIDER, createdAt: { gte: previousWindow.start, lt: previousWindow.end } } }),
      this.prisma.user.count({ where: { role: UserRole.PROVIDER, status: UserStatus.PENDING } }),
      this.prisma.user.count({ where: { role: UserRole.PROVIDER, status: { in: [UserStatus.BLOCKED, UserStatus.SUSPENDED, UserStatus.REJECTED] } } }),
      this.prisma.user.count({ where: { role: UserRole.PROVIDER, status: { in: [UserStatus.BLOCKED, UserStatus.SUSPENDED, UserStatus.REJECTED] }, createdAt: { gte: currentWindow.start, lt: currentWindow.end } } }),
      this.prisma.user.count({ where: { role: UserRole.PROVIDER, status: { in: [UserStatus.BLOCKED, UserStatus.SUSPENDED, UserStatus.REJECTED] }, createdAt: { gte: previousWindow.start, lt: previousWindow.end } } }),
      this.prisma.providerEarningsLedger.aggregate({ where: { direction: ProviderEarningsLedgerDirection.CREDIT, status: { in: [ProviderEarningsLedgerStatus.AVAILABLE, ProviderEarningsLedgerStatus.PAYOUT_PENDING, ProviderEarningsLedgerStatus.PAID] } }, _sum: { amount: true }, _count: { _all: true } }),
      this.prisma.providerEarningsLedger.aggregate({ where: { direction: ProviderEarningsLedgerDirection.CREDIT, status: { in: [ProviderEarningsLedgerStatus.AVAILABLE, ProviderEarningsLedgerStatus.PAYOUT_PENDING, ProviderEarningsLedgerStatus.PAID] }, createdAt: { gte: currentWindow.start, lt: currentWindow.end } }, _sum: { amount: true }, _count: { _all: true } }),
      this.prisma.providerEarningsLedger.aggregate({ where: { direction: ProviderEarningsLedgerDirection.CREDIT, status: { in: [ProviderEarningsLedgerStatus.AVAILABLE, ProviderEarningsLedgerStatus.PAYOUT_PENDING, ProviderEarningsLedgerStatus.PAID] }, createdAt: { gte: previousWindow.start, lt: previousWindow.end } }, _sum: { amount: true }, _count: { _all: true } }),
      this.prisma.providerOrder.aggregate({ where: { status: { in: this.revenueEligibleStatuses() }, order: { paymentStatus: PaymentStatus.SUCCEEDED } }, _sum: { totalPayout: true, total: true } }),
      this.prisma.providerOrder.aggregate({ where: { status: { in: this.revenueEligibleStatuses() }, order: { paymentStatus: PaymentStatus.SUCCEEDED }, createdAt: { gte: currentWindow.start, lt: currentWindow.end } }, _sum: { totalPayout: true, total: true } }),
      this.prisma.providerOrder.aggregate({ where: { status: { in: this.revenueEligibleStatuses() }, order: { paymentStatus: PaymentStatus.SUCCEEDED }, createdAt: { gte: previousWindow.start, lt: previousWindow.end } }, _sum: { totalPayout: true, total: true } }),
    ]);

    const activeRevenue = revenueRows._count._all > 0 ? Number(revenueRows._sum.amount ?? 0) : Number(fallbackOrders._sum.totalPayout ?? fallbackOrders._sum.total ?? 0);
    const activeRevenueCurrentPeriod = revenueCurrentRows._count._all > 0 ? Number(revenueCurrentRows._sum.amount ?? 0) : Number(fallbackOrdersCurrent._sum.totalPayout ?? fallbackOrdersCurrent._sum.total ?? 0);
    const activeRevenuePreviousPeriod = revenuePreviousRows._count._all > 0 ? Number(revenuePreviousRows._sum.amount ?? 0) : Number(fallbackOrdersPrevious._sum.totalPayout ?? fallbackOrdersPrevious._sum.total ?? 0);

    return {
      totalProviders,
      totalProvidersCurrentPeriod,
      totalProvidersPreviousPeriod,
      pendingApproval,
      inactiveProviders,
      inactiveProvidersCurrentPeriod,
      inactiveProvidersPreviousPeriod,
      activeRevenue: this.round(activeRevenue),
      activeRevenueCurrentPeriod: this.round(activeRevenueCurrentPeriod),
      activeRevenuePreviousPeriod: this.round(activeRevenuePreviousPeriod),
    };
  }

  findProviderBusinessCategory(categoryId: string) {
    return this.prisma.providerBusinessCategory.findUnique({ where: { id: categoryId } });
  }

  findCompletedUploadsByUrls(urls: string[]) {
    return this.prisma.uploadedFile.findMany({
      where: {
        fileUrl: { in: urls },
        deletedAt: null,
        status: UploadedFileStatus.COMPLETED,
      },
      select: { fileUrl: true, folder: true, sizeBytes: true },
    });
  }

  createProviderWithUser(data: Prisma.UserCreateInput) {
    return this.prisma.user.create({ data, include: { providerProfile: true } });
  }

  updateProvider(id: string, data: Prisma.UserUpdateInput, profileData?: Prisma.ProviderProfileUncheckedUpdateInput) {
    return this.prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id }, data });
      if (profileData) {
        const safeProfileData = this.sanitizeProviderProfileData(profileData);
        await tx.providerProfile.upsert({
          where: { userId: id },
          create: { userId: id, ...safeProfileData } as Prisma.ProviderProfileUncheckedCreateInput,
          update: safeProfileData,
        });
      }
      return tx.user.findUniqueOrThrow({ where: { id }, include: { providerProfile: true } });
    });
  }

  updateProviderLifecycleStatus(id: string, data: Prisma.UserUpdateInput, profileData?: Prisma.ProviderProfileUncheckedUpdateInput) {
    return this.updateProvider(id, data, profileData);
  }

  private sanitizeProviderProfileData(profileData: Prisma.ProviderProfileUncheckedUpdateInput): Prisma.ProviderProfileUncheckedUpdateInput {
    const {
      approvedAt: _approvedAt,
      approvedBy: _approvedBy,
      rejectedAt: _rejectedAt,
      rejectedBy: _rejectedBy,
      ...safeProfileData
    } = profileData as Prisma.ProviderProfileUncheckedUpdateInput & {
      approvedAt?: unknown;
      approvedBy?: unknown;
      rejectedAt?: unknown;
      rejectedBy?: unknown;
    };

    return safeProfileData;
  }

  countActiveProcessingOrders(providerId: string) {
    return this.prisma.providerOrder.count({
      where: { providerId, status: { in: ['PENDING', 'ACCEPTED', 'PROCESSING', 'PACKED', 'READY_FOR_PICKUP', 'SHIPPED', 'OUT_FOR_DELIVERY'] } },
    });
  }

  deleteProviderPermanently(params: { actorId: string; providerId: string; providerEmail: string; providerRole: UserRole; reason: string; deleteRelatedRecords: boolean }) {
    return this.prisma.$transaction(async (tx) => {
      const actor = await tx.user.findUnique({ where: { id: params.actorId }, select: ADMIN_AUDIT_ACTOR_SELECT });
      await tx.adminAuditLog.create({
        data: buildAdminAuditLogData({
          actorId: params.actorId,
          targetId: params.providerId,
          targetType: 'PROVIDER',
          action: 'PROVIDER_PERMANENTLY_DELETED',
          beforeJson: { id: params.providerId, email: params.providerEmail, role: params.providerRole },
          afterJson: { reason: params.reason, deleteRelatedRecords: params.deleteRelatedRecords },
        }, actor),
      });
      await tx.authSession.deleteMany({ where: { userId: params.providerId } });
      await tx.notification.deleteMany({ where: { recipientId: params.providerId } });
      await tx.notificationDeviceToken.deleteMany({ where: { userId: params.providerId } });
      await tx.uploadedFile.deleteMany({ where: { ownerId: params.providerId } });
      await tx.promotionalOffer.deleteMany({ where: { providerId: params.providerId } });
      await tx.gift.deleteMany({ where: { providerId: params.providerId } });
      await tx.user.delete({ where: { id: params.providerId } });
    });
  }

  findProviderActivity(providerId: string) {
    return this.prisma.adminAuditLog.findMany({
      where: { targetId: providerId },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  createProviderMessage() {
    return Promise.resolve(null);
  }

  createProviderNotification(data: Prisma.NotificationUncheckedCreateInput) {
    return this.notificationDispatch.createAndEmit(data);
  }

  async createAuditLog(data: Prisma.AdminAuditLogUncheckedCreateInput) {
    const actor = data.actorId ? await this.prisma.user.findUnique({ where: { id: data.actorId }, select: ADMIN_AUDIT_ACTOR_SELECT }) : null;
    return this.prisma.adminAuditLog.create({ data: buildAdminAuditLogData(data, actor) });
  }

  private buildProviderWhere(query: ListProvidersDto | ExportProvidersDto): Prisma.UserWhereInput {
    return {
      role: UserRole.PROVIDER,
      ...(query.search
        ? {
            OR: [
              { providerProfile: { is: { businessName: { contains: query.search, mode: 'insensitive' } } } },
              { email: { contains: query.search, mode: 'insensitive' } },
              { phone: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...this.statusWhere(query.status),
    };
  }

  private statusWhere(status?: ProviderStatusFilter): Prisma.UserWhereInput {
    switch (status) {
      case ProviderStatusFilter.ACTIVE:
        return { status: UserStatus.APPROVED };
      case ProviderStatusFilter.INACTIVE:
      case ProviderStatusFilter.DISABLED:
        return { status: { in: [UserStatus.BLOCKED, UserStatus.REJECTED] } };
      case ProviderStatusFilter.SUSPENDED:
        return { status: UserStatus.SUSPENDED };
      case ProviderStatusFilter.ALL:
      case undefined:
        return {};
    }
  }

  private toOrderBy(sortBy?: ProviderSortBy, sortOrder?: SortOrder): Prisma.UserOrderByWithRelationInput {
    const direction = sortOrder === SortOrder.ASC ? 'asc' : 'desc';
    if (sortBy === ProviderSortBy.BUSINESS_NAME) {
      return { providerProfile: { businessName: direction } };
    }

    if (sortBy === ProviderSortBy.STATUS) {
      return { status: direction };
    }

    return { createdAt: direction };
  }

  private currentWindow() {
    const end = new Date();
    const start = new Date(end.getTime() - (30 * 24 * 60 * 60 * 1000));
    return { start, end };
  }

  private previousWindow(anchor: Date) {
    const end = anchor;
    const start = new Date(end.getTime() - (30 * 24 * 60 * 60 * 1000));
    return { start, end };
  }

  private revenueEligibleStatuses(): ProviderOrderStatus[] {
    return [ProviderOrderStatus.SHIPPED, ProviderOrderStatus.OUT_FOR_DELIVERY, ProviderOrderStatus.DELIVERED, ProviderOrderStatus.COMPLETED];
  }

  private fulfillmentSuccessStatuses(): ProviderOrderStatus[] {
    return [ProviderOrderStatus.DELIVERED, ProviderOrderStatus.COMPLETED];
  }

  private safeRatioPercent(numerator: number, denominator: number): number {
    if (denominator <= 0) {
      return 0;
    }
    return this.round((numerator / denominator) * 100);
  }

  private changePercent(current: number, previous: number): number {
    if (previous === 0) {
      return current > 0 ? 100 : 0;
    }
    return this.round(((current - previous) / previous) * 100);
  }

  private round(value: number): number {
    return Number(value.toFixed(2));
  }

  private zeroAggregateStats(): ProviderAggregateStats {
    return {
      revenue: 0,
      performanceStats: 0,
      performanceChangePercent: 0,
      listedItems: 0,
      listedItemsChange: 0,
      orderFulfillment: 0,
      orderFulfillmentChangePercent: 0,
      disputeCount: 0,
      disputeChangePercent: 0,
      averageRating: 0,
      reviewCount: 0,
    };
  }

  private toProviderItemStatus(status: GiftStatus): ProviderItemStatus {
    if (status === GiftStatus.ACTIVE) return ProviderItemStatus.ACTIVE;
    if (status === GiftStatus.OUT_OF_STOCK) return ProviderItemStatus.OUT_OF_STOCK;
    return ProviderItemStatus.INACTIVE;
  }

  private firstImage(value: Prisma.JsonValue): string | null {
    if (!Array.isArray(value)) {
      return null;
    }
    const first = value.find((item) => typeof item === 'string');
    return typeof first === 'string' ? first : null;
  }

  private sortProviderItems(left: ProviderListedItem, right: ProviderListedItem, sortBy?: ProviderItemSortBy, sortOrder?: SortOrder): number {
    const direction = sortOrder === SortOrder.ASC ? 1 : -1;
    switch (sortBy) {
      case ProviderItemSortBy.NAME:
        return left.name.localeCompare(right.name) * direction;
      case ProviderItemSortBy.PRICE:
        return (left.price - right.price) * direction;
      case ProviderItemSortBy.SALES_COUNT:
        return (left.salesCount - right.salesCount) * direction;
      case ProviderItemSortBy.CREATED_AT:
      default:
        return (left.createdAt.getTime() - right.createdAt.getTime()) * direction;
    }
  }
}
