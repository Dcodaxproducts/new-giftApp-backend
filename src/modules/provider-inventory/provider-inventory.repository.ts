import { Injectable } from '@nestjs/common';
import { GiftStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

export const PROVIDER_INVENTORY_INCLUDE = Prisma.validator<Prisma.GiftInclude>()({
  category: { select: { id: true, name: true } },
  variants: { orderBy: { name: 'asc' } },
});

export type ProviderInventoryVariantWrite = {
  id?: string;
  createData: Prisma.GiftVariantCreateWithoutGiftInput;
  updateData: Prisma.GiftVariantUpdateInput;
};

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
    const where: Prisma.GiftWhereInput = { providerId };
    return this.prisma.$transaction([
      this.prisma.gift.count({ where }),
      this.prisma.gift.count({ where: { ...where, status: GiftStatus.ACTIVE } }),
      this.prisma.gift.count({ where: { ...where, status: GiftStatus.INACTIVE } }),
    ]);
  }

  findLookupItemsForProvider(providerId: string) {
    return this.prisma.gift.findMany({ where: { providerId, status: GiftStatus.ACTIVE }, orderBy: { name: 'asc' }, take: 500 });
  }

  findOwnedItemById(providerId: string, id: string) {
    return this.prisma.gift.findFirst({ where: { id, providerId }, include: PROVIDER_INVENTORY_INCLUDE });
  }

  findActiveCategory(categoryId: string) {
    return this.prisma.giftCategory.findFirst({ where: { id: categoryId, isActive: true, deletedAt: null } });
  }

  findBySlug(slug: string, exceptId?: string) {
    return this.prisma.gift.findFirst({ where: { slug, ...(exceptId ? { id: { not: exceptId } } : {}) } });
  }

  findVariantsByIdsForItem(giftId: string, ids: string[]) {
    return this.prisma.giftVariant.findMany({ where: { giftId, id: { in: ids } }, select: { id: true } });
  }

  createItemWithVariants(data: Prisma.GiftCreateArgs['data']) {
    return this.prisma.gift.create({ data, include: PROVIDER_INVENTORY_INCLUDE });
  }

  updateItemWithVariants(params: { id: string; data: Prisma.GiftUpdateArgs['data']; variants?: ProviderInventoryVariantWrite[]; replaceVariants: boolean; incomingIds: string[] }) {
    return this.prisma.$transaction(async (tx) => {
      const base = await tx.gift.update({ where: { id: params.id }, data: params.data });
      if (params.variants) await this.upsertVariants(tx, { id: params.id, variants: params.variants, replaceVariants: params.replaceVariants, incomingIds: params.incomingIds });
      return tx.gift.findUniqueOrThrow({ where: { id: base.id }, include: PROVIDER_INVENTORY_INCLUDE });
    });
  }

  private async upsertVariants(tx: Prisma.TransactionClient, params: { id: string; variants: ProviderInventoryVariantWrite[]; replaceVariants: boolean; incomingIds: string[] }) {
    if (params.replaceVariants) await tx.giftVariant.deleteMany({ where: { giftId: params.id, id: { notIn: params.incomingIds } } });
    for (const variant of params.variants) {
      if (variant.id) await tx.giftVariant.update({ where: { id: variant.id }, data: variant.updateData });
      else await tx.giftVariant.create({ data: { giftId: params.id, ...variant.createData } });
    }
  }
  deleteItem(id: string) {
    return this.prisma.gift.delete({ where: { id } });
  }
}
