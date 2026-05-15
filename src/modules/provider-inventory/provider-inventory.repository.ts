import { Injectable } from '@nestjs/common';
import { GiftModerationStatus, GiftStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

export const PROVIDER_INVENTORY_INCLUDE = Prisma.validator<Prisma.GiftInclude>()({
  category: { select: { id: true, name: true } },
  variants: { where: { deletedAt: null }, orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] },
});

@Injectable()
export class ProviderInventoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  findManyForProviderList(params: { where: Prisma.GiftWhereInput; orderBy: Prisma.GiftOrderByWithRelationInput; skip: number; take: number }) {
    return this.prisma.$transaction([
      this.prisma.gift.findMany({ where: params.where, include: PROVIDER_INVENTORY_INCLUDE, orderBy: params.orderBy, skip: params.skip, take: params.take }),
      this.prisma.gift.count({ where: params.where }),
    ]);
  }

  findStatsForProvider(providerId: string) {
    const where: Prisma.GiftWhereInput = { providerId, deletedAt: null };
    return this.prisma.$transaction([
      this.prisma.gift.count({ where }),
      this.prisma.gift.count({ where: { ...where, status: GiftStatus.ACTIVE } }),
      this.prisma.gift.count({ where: { ...where, status: GiftStatus.INACTIVE } }),
      this.prisma.gift.count({ where: { ...where, OR: [{ status: GiftStatus.OUT_OF_STOCK }, { stockQuantity: 0 }] } }),
      this.prisma.gift.count({ where: { ...where, moderationStatus: GiftModerationStatus.PENDING } }),
      this.prisma.gift.count({ where: { ...where, moderationStatus: GiftModerationStatus.REJECTED } }),
    ]);
  }

  findLookupItemsForProvider(providerId: string) {
    return this.prisma.gift.findMany({ where: { providerId, deletedAt: null, status: GiftStatus.ACTIVE }, orderBy: { name: 'asc' }, take: 500 });
  }

  findOwnedItemById(providerId: string, id: string) {
    return this.prisma.gift.findFirst({ where: { id, providerId, deletedAt: null }, include: PROVIDER_INVENTORY_INCLUDE });
  }
}
