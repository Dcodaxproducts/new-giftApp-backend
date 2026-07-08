import { Injectable } from '@nestjs/common';
import { GiftStatus, OrderStatus, Prisma, PromotionalOfferApprovalStatus, PromotionalOfferStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ProviderDashboardRepository {
  constructor(private readonly prisma: PrismaService) {}

  findProviderById(id: string) {
    return this.prisma.user.findFirst({ where: { id, role: UserRole.PROVIDER }, include: { providerProfile: true } });
  }

  findDashboardData(params: { providerId: string; todayStart: Date; todayEnd: Date; weekStart: Date; now: Date }) {
    const baseOrderWhere: Prisma.OrderWhereInput = { providerId: params.providerId };
    return this.prisma.$transaction([
      this.prisma.order.count({ where: { ...baseOrderWhere, createdAt: { gte: params.todayStart, lte: params.todayEnd } } }),
      this.prisma.order.count({ where: { ...baseOrderWhere, status: OrderStatus.PENDING } }),
      this.prisma.promotionalOffer.count({ where: { providerId: params.providerId, deletedAt: null, isActive: true, status: PromotionalOfferStatus.ACTIVE, approvalStatus: PromotionalOfferApprovalStatus.APPROVED, startDate: { lte: params.now }, OR: [{ endDate: null }, { endDate: { gte: params.now } }] } }),
      this.prisma.gift.count({ where: { providerId: params.providerId, status: { not: GiftStatus.INACTIVE } } }),
      this.prisma.order.findMany({ where: { ...baseOrderWhere, createdAt: { gte: params.weekStart, lte: params.now } }, select: { createdAt: true, total: true } }),
      this.prisma.order.findMany({ where: baseOrderWhere, include: { items: { include: { gift: true } } }, orderBy: { createdAt: 'desc' }, take: 5 }),
    ]);
  }
}
