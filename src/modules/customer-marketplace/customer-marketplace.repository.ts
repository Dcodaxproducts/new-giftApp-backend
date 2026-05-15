import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class CustomerMarketplaceRepository {
  constructor(private readonly prisma: PrismaService) {}

  findCustomerHomeData(params: { userId: string; giftWhere: Prisma.GiftWhereInput; activeOfferWhere: Prisma.PromotionalOfferWhereInput; giftInclude: Prisma.GiftInclude }) {
    return this.prisma.$transaction([
      this.findDefaultAddressForUser(params.userId),
      this.findUpcomingReminderForUser(params.userId),
      this.prisma.giftCategory.findMany({ where: { isActive: true, deletedAt: null, gifts: { some: params.giftWhere } }, orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }], take: 12, select: { id: true, name: true, slug: true, color: true, backgroundColor: true, imageUrl: true } }),
      this.findDiscountedGifts({ where: params.giftWhere, activeOfferWhere: params.activeOfferWhere, include: params.giftInclude, take: 12 }),
    ]);
  }

  findDefaultAddressForUser(userId: string) {
    return this.prisma.customerAddress.findFirst({ where: { userId, isDefault: true, deletedAt: null }, orderBy: { createdAt: 'desc' } });
  }

  findUpcomingReminderForUser(userId: string) {
    return this.prisma.customerReminder.findFirst({ where: { userId, isActive: true, deletedAt: null, reminderDate: { gte: new Date() } }, orderBy: { reminderDate: 'asc' } });
  }

  findMarketplaceCategories(giftWhere: Prisma.GiftWhereInput) {
    return this.prisma.giftCategory.findMany({ where: { isActive: true, deletedAt: null, gifts: { some: giftWhere } }, include: { _count: { select: { gifts: { where: giftWhere } } } }, orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] });
  }

  findMarketplaceGifts(params: { where: Prisma.GiftWhereInput; include: Prisma.GiftInclude; orderBy: Prisma.GiftOrderByWithRelationInput; skip: number; take: number }) {
    return this.prisma.gift.findMany({ where: params.where, include: params.include, orderBy: params.orderBy, skip: params.skip, take: params.take });
  }

  countMarketplaceGifts(where: Prisma.GiftWhereInput) {
    return this.prisma.gift.count({ where });
  }

  findMarketplaceGiftsAndCount(params: { where: Prisma.GiftWhereInput; include: Prisma.GiftInclude; orderBy: Prisma.GiftOrderByWithRelationInput; skip: number; take: number }) {
    return this.prisma.$transaction([
      this.findMarketplaceGifts(params),
      this.countMarketplaceGifts(params.where),
    ]);
  }

  findDiscountedGifts(params: { where: Prisma.GiftWhereInput; activeOfferWhere: Prisma.PromotionalOfferWhereInput; include: Prisma.GiftInclude; take?: number }) {
    return this.prisma.gift.findMany({ where: { ...params.where, promotionalOffers: { some: params.activeOfferWhere } }, include: params.include, orderBy: { createdAt: 'desc' }, take: params.take });
  }

  findGiftDetailsForCustomer(id: string, params: { where: Prisma.GiftWhereInput; include: Prisma.GiftInclude }) {
    return this.prisma.gift.findFirst({ where: { id, ...params.where }, include: params.include });
  }

  findGiftFilterOptions(params: { giftWhere: Prisma.GiftWhereInput; approvedProviderWhere: Prisma.UserWhereInput }) {
    return this.prisma.$transaction([
      this.prisma.giftCategory.findMany({ where: { isActive: true, deletedAt: null, gifts: { some: params.giftWhere } }, orderBy: { name: 'asc' }, select: { id: true, name: true, slug: true, color: true, backgroundColor: true, imageUrl: true } }),
      this.prisma.gift.aggregate({ where: params.giftWhere, _min: { price: true }, _max: { price: true } }),
      this.prisma.user.findMany({ where: params.approvedProviderWhere, orderBy: { providerBusinessName: 'asc' }, select: { providerBusinessName: true, firstName: true, lastName: true } }),
    ]);
  }

  findCustomerWishlistGiftIds(userId: string, giftIds: string[]) {
    return this.prisma.customerWishlist.findMany({ where: { userId, giftId: { in: giftIds } }, select: { giftId: true } });
  }
}
