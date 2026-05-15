import { Injectable } from '@nestjs/common';
import { GiftModerationStatus, GiftStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

export const PROVIDER_INVENTORY_INCLUDE = Prisma.validator<Prisma.GiftInclude>()({
  category: { select: { id: true, name: true } },
  variants: { where: { deletedAt: null }, orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] },
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

  findActiveCategory(categoryId: string) {
    return this.prisma.giftCategory.findFirst({ where: { id: categoryId, isActive: true, deletedAt: null } });
  }

  findBySku(sku: string, exceptId?: string) {
    return this.prisma.gift.findFirst({ where: { sku, deletedAt: null, ...(exceptId ? { id: { not: exceptId } } : {}) } });
  }

  findBySlug(slug: string, exceptId?: string) {
    return this.prisma.gift.findFirst({ where: { slug, ...(exceptId ? { id: { not: exceptId } } : {}) } });
  }

  findVariantBySku(skus: string[], giftId?: string) {
    return this.prisma.giftVariant.findFirst({ where: { sku: { in: skus }, deletedAt: null, giftId: giftId ? { not: giftId } : undefined } });
  }

  findVariantsByIdsForItem(giftId: string, ids: string[]) {
    return this.prisma.giftVariant.findMany({ where: { id: { in: ids }, giftId, deletedAt: null }, select: { id: true } });
  }

  createItemWithVariants(data: Prisma.GiftCreateArgs['data']) {
    return this.prisma.gift.create({ data, include: PROVIDER_INVENTORY_INCLUDE });
  }

  updateItemWithVariants(params: { id: string; data: Prisma.GiftUpdateArgs['data']; variants?: ProviderInventoryVariantWrite[]; replaceVariants: boolean; incomingIds: string[]; clearDefault: boolean }) {
    return this.prisma.$transaction(async (tx) => {
      const base = await tx.gift.update({ where: { id: params.id }, data: params.data });
      if (params.variants) await this.upsertVariants(tx, { id: params.id, variants: params.variants, replaceVariants: params.replaceVariants, incomingIds: params.incomingIds, clearDefault: params.clearDefault });
      return tx.gift.findUniqueOrThrow({ where: { id: base.id }, include: PROVIDER_INVENTORY_INCLUDE });
    });
  }

  private async upsertVariants(tx: Prisma.TransactionClient, params: { id: string; variants: ProviderInventoryVariantWrite[]; replaceVariants: boolean; incomingIds: string[]; clearDefault: boolean }) {
    if (params.replaceVariants) await tx.giftVariant.updateMany({ where: { giftId: params.id, deletedAt: null, id: { notIn: params.incomingIds } }, data: { deletedAt: new Date(), isActive: false, isDefault: false } });
    if (params.clearDefault) await tx.giftVariant.updateMany({ where: { giftId: params.id, deletedAt: null }, data: { isDefault: false } });
    for (const variant of params.variants) {
      if (variant.id) await tx.giftVariant.update({ where: { id: variant.id }, data: variant.updateData });
      else await tx.giftVariant.create({ data: { giftId: params.id, ...variant.createData } });
    }
  }

  updateAvailability(id: string, status: GiftStatus) {
    return this.prisma.gift.update({ where: { id }, data: { status }, include: PROVIDER_INVENTORY_INCLUDE });
  }

  softDeleteItem(id: string) {
    return this.prisma.gift.delete({ where: { id } });
  }
}
