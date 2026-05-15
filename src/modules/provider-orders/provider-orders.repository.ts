import { Injectable } from '@nestjs/common';
import { ProviderOrderStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

export const PROVIDER_ORDER_LIST_INCLUDE = Prisma.validator<Prisma.ProviderOrderInclude>()({
  order: true,
  items: true,
  refundRequests: { orderBy: { requestedAt: 'desc' }, take: 1 },
});

@Injectable()
export class ProviderOrdersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findManyProviderOrders(params: { where: Prisma.ProviderOrderWhereInput; include: Prisma.ProviderOrderInclude; orderBy: Prisma.ProviderOrderOrderByWithRelationInput; skip: number; take: number }) {
    return this.prisma.providerOrder.findMany({ where: params.where, include: params.include, orderBy: params.orderBy, skip: params.skip, take: params.take });
  }

  countProviderOrders(where: Prisma.ProviderOrderWhereInput) {
    return this.prisma.providerOrder.count({ where });
  }

  findManyAndCountProviderOrders(params: { where: Prisma.ProviderOrderWhereInput; include: Prisma.ProviderOrderInclude; orderBy: Prisma.ProviderOrderOrderByWithRelationInput; skip: number; take: number }) {
    return this.prisma.$transaction([
      this.findManyProviderOrders(params),
      this.countProviderOrders(params.where),
    ]);
  }

  findProviderOrderById(providerId: string, id: string, include: Prisma.ProviderOrderInclude = PROVIDER_ORDER_LIST_INCLUDE) {
    return this.prisma.providerOrder.findFirst({ where: { id, providerId }, include });
  }

  findCustomerAddressForProviderOrder(order: { deliveryAddressId: string; userId: string }) {
    return this.prisma.customerAddress.findFirst({ where: { id: order.deliveryAddressId, userId: order.userId } });
  }

  findProviderOrderTimeline(providerOrderId: string) {
    return this.prisma.providerOrderTimeline.findMany({ where: { providerOrderId }, orderBy: { createdAt: 'asc' } });
  }

  findProviderOrderChecklist(providerOrderId: string) {
    return this.prisma.providerOrderChecklist.findUnique({ where: { providerOrderId } });
  }

  findProviderOrderSummary(params: { base: Prisma.ProviderOrderWhereInput; todayWhere: Prisma.ProviderOrderWhereInput }) {
    return this.prisma.$transaction([
      this.prisma.providerOrder.findMany({ where: params.todayWhere }),
      this.prisma.providerOrder.count({ where: { ...params.base, status: ProviderOrderStatus.PENDING } }),
      this.prisma.providerOrder.count({ where: { ...params.base, status: { in: [ProviderOrderStatus.ACCEPTED, ProviderOrderStatus.PROCESSING, ProviderOrderStatus.PACKED] } } }),
      this.prisma.providerOrder.count({ where: { ...params.base, status: ProviderOrderStatus.SHIPPED } }),
      this.prisma.providerOrder.count({ where: { ...params.base, status: { in: [ProviderOrderStatus.DELIVERED, ProviderOrderStatus.COMPLETED] } } }),
      this.prisma.providerOrder.count({ where: { ...params.base, status: { in: [ProviderOrderStatus.CANCELLED, ProviderOrderStatus.REJECTED, ProviderOrderStatus.REFUNDED] } } }),
    ]);
  }

  findRecentProviderOrders(providerId: string, limit: number) {
    return this.prisma.providerOrder.findMany({ where: { providerId }, orderBy: { createdAt: 'desc' }, take: limit });
  }

  findPerformanceRows(params: { providerId: string; range: { from: Date; to: Date }; previous: { from: Date; to: Date } }) {
    return Promise.all([
      this.prisma.providerOrder.findMany({ where: { providerId: params.providerId, createdAt: { gte: params.range.from, lte: params.range.to } } }),
      this.prisma.providerOrder.findMany({ where: { providerId: params.providerId, createdAt: { gte: params.previous.from, lte: params.previous.to } } }),
    ]);
  }

  findRevenueAnalyticsRows(params: { providerId: string; range: { from: Date; to: Date }; previous: { from: Date; to: Date }; statuses: ProviderOrderStatus[] }) {
    return Promise.all([
      this.prisma.providerOrder.findMany({ where: { providerId: params.providerId, createdAt: { gte: params.range.from, lte: params.range.to }, status: { in: params.statuses } } }),
      this.prisma.providerOrder.findMany({ where: { providerId: params.providerId, createdAt: { gte: params.previous.from, lte: params.previous.to }, status: { in: params.statuses } } }),
    ]);
  }

  findRatingAnalyticsRows(providerId: string) {
    return this.prisma.review.findMany({ where: { providerId, deletedAt: null } });
  }

  findProviderOrdersForExport(params: { where: Prisma.ProviderOrderWhereInput; include: Prisma.ProviderOrderInclude }) {
    return this.prisma.providerOrder.findMany({ where: params.where, include: params.include, orderBy: { createdAt: 'desc' } });
  }
}
