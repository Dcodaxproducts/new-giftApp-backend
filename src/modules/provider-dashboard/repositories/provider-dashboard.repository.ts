import { Injectable } from '@nestjs/common';
import { GiftStatus, Prisma, PromotionalOfferApprovalStatus, PromotionalOfferStatus, ProviderOrderStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class ProviderDashboardRepository {
  constructor(private readonly prisma: PrismaService) {}

  findProviderById(id: string) {
    return this.prisma.user.findFirst({ where: { id, role: UserRole.PROVIDER, deletedAt: null } });
  }

  findDashboardData(params: { providerId: string; todayStart: Date; todayEnd: Date; weekStart: Date; now: Date }) {
    const baseOrderWhere: Prisma.ProviderOrderWhereInput = { providerId: params.providerId };
    return this.prisma.$transaction([
      this.prisma.providerOrder.count({ where: { ...baseOrderWhere, createdAt: { gte: params.todayStart, lte: params.todayEnd } } }),
      this.prisma.providerOrder.count({ where: { ...baseOrderWhere, status: ProviderOrderStatus.PENDING } }),
      this.prisma.promotionalOffer.count({ where: { providerId: params.providerId, deletedAt: null, isActive: true, status: PromotionalOfferStatus.ACTIVE, approvalStatus: PromotionalOfferApprovalStatus.APPROVED, startDate: { lte: params.now }, OR: [{ endDate: null }, { endDate: { gte: params.now } }] } }),
      this.prisma.gift.count({ where: { providerId: params.providerId, deletedAt: null, status: { not: GiftStatus.INACTIVE } } }),
      this.prisma.providerOrder.findMany({ where: { ...baseOrderWhere, createdAt: { gte: params.weekStart, lte: params.now } }, select: { createdAt: true, totalPayout: true, total: true, currency: true } }),
      this.prisma.providerOrder.findMany({ where: baseOrderWhere, include: { order: true, items: true }, orderBy: { createdAt: 'desc' }, take: 5 }),
    ]);
  }
}
