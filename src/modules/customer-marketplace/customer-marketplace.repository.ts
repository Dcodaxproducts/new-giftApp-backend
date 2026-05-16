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

  findCustomerWishlistRows(userId: string) {
    return this.prisma.customerWishlist.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  }

  findWishlistGifts(params: { giftIds: string[]; where: Prisma.GiftWhereInput; include: Prisma.GiftInclude }) {
    return this.prisma.gift.findMany({ where: { id: { in: params.giftIds }, ...params.where }, include: params.include });
  }

  addCustomerWishlistGift(userId: string, giftId: string) {
    return this.prisma.customerWishlist.upsert({ where: { userId_giftId: { userId, giftId } }, create: { userId, giftId }, update: {} });
  }

  removeCustomerWishlistGift(userId: string, giftId: string) {
    return this.prisma.customerWishlist.deleteMany({ where: { userId, giftId } });
  }

  findCustomerAddresses(userId: string) {
    return this.prisma.customerAddress.findMany({ where: { userId, deletedAt: null }, orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }] });
  }

  createCustomerAddress(params: { userId: string; data: Prisma.CustomerAddressUncheckedCreateInput; isDefault?: boolean }) {
    return this.prisma.$transaction(async (tx) => {
      const shouldDefault = params.isDefault ?? (await tx.customerAddress.count({ where: { userId: params.userId, deletedAt: null } })) === 0;
      if (shouldDefault) await tx.customerAddress.updateMany({ where: { userId: params.userId, deletedAt: null }, data: { isDefault: false } });
      return tx.customerAddress.create({ data: { ...params.data, isDefault: shouldDefault } });
    });
  }

  findCustomerAddressById(userId: string, id: string) {
    return this.prisma.customerAddress.findFirst({ where: { id, userId, deletedAt: null } });
  }

  updateCustomerAddress(params: { userId: string; id: string; data: Prisma.CustomerAddressUncheckedUpdateInput; isDefault?: boolean }) {
    return this.prisma.$transaction(async (tx) => {
      if (params.isDefault) await tx.customerAddress.updateMany({ where: { userId: params.userId, deletedAt: null, id: { not: params.id } }, data: { isDefault: false } });
      return tx.customerAddress.update({ where: { id: params.id }, data: params.data });
    });
  }

  deleteCustomerAddress(id: string) {
    return this.prisma.customerAddress.delete({ where: { id } });
  }

  setDefaultCustomerAddress(userId: string, id: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.customerAddress.updateMany({ where: { userId, deletedAt: null }, data: { isDefault: false } });
      return tx.customerAddress.update({ where: { id }, data: { isDefault: true } });
    });
  }

  findCustomerReminders(userId: string) {
    return this.prisma.customerReminder.findMany({ where: { userId, deletedAt: null }, orderBy: { reminderDate: 'asc' } });
  }

  createCustomerReminder(data: Prisma.CustomerReminderUncheckedCreateInput) {
    return this.prisma.customerReminder.create({ data });
  }

  findCustomerReminderById(userId: string, id: string) {
    return this.prisma.customerReminder.findFirst({ where: { id, userId, deletedAt: null } });
  }

  updateCustomerReminder(id: string, data: Prisma.CustomerReminderUncheckedUpdateInput) {
    return this.prisma.customerReminder.update({ where: { id }, data });
  }

  deleteCustomerReminder(id: string) {
    return this.prisma.customerReminder.delete({ where: { id } });
  }

  findAvailableGift(id: string, params: { where: Prisma.GiftWhereInput; include: Prisma.GiftInclude }) {
    return this.prisma.gift.findFirst({ where: { id, ...params.where }, include: params.include });
  }

  findCustomerContactById(userId: string, id: string) {
    return this.prisma.customerContact.findFirst({ where: { id, userId, deletedAt: null }, select: { id: true } });
  }

  findCustomerEventById(userId: string, id: string) {
    return this.prisma.customerEvent.findFirst({ where: { id, userId, deletedAt: null }, select: { id: true } });
  }
}
