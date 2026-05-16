import { Injectable } from '@nestjs/common';
import { GiftModerationStatus, GiftStatus, Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';

export const GIFT_MANAGEMENT_INCLUDE = Prisma.validator<Prisma.GiftInclude>()({
  category: { select: { id: true, name: true } },
  provider: { select: { id: true, email: true, providerBusinessName: true, firstName: true, lastName: true } },
  variants: { where: { deletedAt: null }, orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] },
});

type GiftTx = Prisma.TransactionClient;
type GiftCreateData = Prisma.Args<PrismaService['gift'], 'create'>['data'];
type GiftUpdateData = Prisma.GiftUncheckedUpdateInput;
type GiftCategoryCreateData = Prisma.Args<PrismaService['giftCategory'], 'create'>['data'];
type GiftCategoryUpdateData = Prisma.Args<PrismaService['giftCategory'], 'update'>['data'];
type GiftVariantCreateData = Prisma.Args<GiftTx['giftVariant'], 'create'>['data'];
type GiftVariantUpdateData = Prisma.Args<GiftTx['giftVariant'], 'update'>['data'];

@Injectable()
export class GiftManagementRepository {
  constructor(private readonly prisma: PrismaService) {}

  findGiftCategories(params: { where: Prisma.GiftCategoryWhereInput; orderBy: Prisma.GiftCategoryOrderByWithRelationInput; skip: number; take: number }) {
    return this.prisma.giftCategory.findMany({ where: params.where, include: { _count: { select: { gifts: { where: { deletedAt: null } } } } }, orderBy: params.orderBy, skip: params.skip, take: params.take });
  }

  countGiftCategories(where: Prisma.GiftCategoryWhereInput) { return this.prisma.giftCategory.count({ where }); }

  findGiftCategoriesAndCount(params: { where: Prisma.GiftCategoryWhereInput; orderBy: Prisma.GiftCategoryOrderByWithRelationInput; skip: number; take: number }) {
    return this.prisma.$transaction([this.findGiftCategories(params), this.countGiftCategories(params.where)]);
  }

  findGiftCategoryById(id: string) { return this.prisma.giftCategory.findFirst({ where: { id, deletedAt: null } }); }

  findGiftCategoryBySlug(slug: string, exceptId?: string) { return this.prisma.giftCategory.findFirst({ where: { slug, id: exceptId ? { not: exceptId } : undefined } }); }

  createGiftCategory(data: GiftCategoryCreateData) { return this.prisma.giftCategory.create({ data }); }

  updateGiftCategory(id: string, data: GiftCategoryUpdateData) { return this.prisma.giftCategory.update({ where: { id }, data }); }

  softDeleteGiftCategory(id: string) { return this.prisma.giftCategory.delete({ where: { id } }); }

  countGiftsByCategory(categoryId: string) { return this.prisma.gift.count({ where: { categoryId, deletedAt: null } }); }

  findGiftCategoryLookup() { return this.prisma.giftCategory.findMany({ where: { isActive: true, deletedAt: null }, orderBy: { name: 'asc' }, select: { id: true, name: true, slug: true, backgroundColor: true, imageUrl: true, color: true } }); }

  findGiftCategoryStats() { return this.prisma.$transaction([this.prisma.giftCategory.count({ where: { deletedAt: null } }), this.prisma.gift.count({ where: { deletedAt: null, status: GiftStatus.ACTIVE } })]); }

  findGiftsForAdmin(params: { where: Prisma.GiftWhereInput; orderBy: Prisma.GiftOrderByWithRelationInput; skip: number; take: number }) {
    return this.prisma.gift.findMany({ where: params.where, include: GIFT_MANAGEMENT_INCLUDE, orderBy: params.orderBy, skip: params.skip, take: params.take });
  }

  countGiftsForAdmin(where: Prisma.GiftWhereInput) { return this.prisma.gift.count({ where }); }

  findGiftsAndCountForAdmin(params: { where: Prisma.GiftWhereInput; orderBy: Prisma.GiftOrderByWithRelationInput; skip: number; take: number }) {
    return this.prisma.$transaction([this.findGiftsForAdmin(params), this.countGiftsForAdmin(params.where)]);
  }

  findGiftByIdWithVariants(id: string) { return this.prisma.gift.findFirst({ where: { id, deletedAt: null }, include: GIFT_MANAGEMENT_INCLUDE }); }

  findGiftBySlug(slug: string, exceptId?: string) { return this.prisma.gift.findFirst({ where: { slug, id: exceptId ? { not: exceptId } : undefined } }); }

  findGiftBySku(sku: string, exceptGiftId?: string) { return this.prisma.gift.findFirst({ where: { sku: sku.trim(), id: exceptGiftId ? { not: exceptGiftId } : undefined, deletedAt: null } }); }

  findGiftVariantBySku(skus: string[], giftId?: string) { return this.prisma.giftVariant.findFirst({ where: { sku: { in: skus }, deletedAt: null, giftId: giftId ? { not: giftId } : undefined } }); }

  findProviderById(id: string) { return this.prisma.user.findFirst({ where: { id, role: UserRole.PROVIDER, deletedAt: null } }); }

  createGiftWithVariants(data: GiftCreateData) { return this.prisma.gift.create({ data, include: GIFT_MANAGEMENT_INCLUDE }); }

  runGiftTransaction<T>(callback: (tx: GiftTx) => Promise<T>) { return this.prisma.$transaction(callback); }

  updateGiftBase(tx: GiftTx, id: string, data: GiftUpdateData) { return tx.gift.update({ where: { id }, data }); }

  findGiftByIdWithVariantsTx(tx: GiftTx, id: string) { return tx.gift.findUniqueOrThrow({ where: { id }, include: GIFT_MANAGEMENT_INCLUDE }); }

  softDeleteVariantsForGift(tx: GiftTx, giftId: string, incomingIds: string[]) { return tx.giftVariant.updateMany({ where: { giftId, deletedAt: null, id: { notIn: incomingIds } }, data: { deletedAt: new Date(), isActive: false, isDefault: false } }); }

  clearDefaultVariantsForGift(tx: GiftTx, giftId: string) { return tx.giftVariant.updateMany({ where: { giftId, deletedAt: null }, data: { isDefault: false } }); }

  findGiftVariantForGift(tx: GiftTx, giftId: string, variantId: string) { return tx.giftVariant.findFirst({ where: { id: variantId, giftId, deletedAt: null } }); }

  updateGiftVariant(tx: GiftTx, id: string, data: GiftVariantUpdateData) { return tx.giftVariant.update({ where: { id }, data }); }

  createGiftVariant(tx: GiftTx, data: GiftVariantCreateData) { return tx.giftVariant.create({ data }); }

  updateGiftWithVariants(id: string, data: GiftUpdateData) { return this.prisma.gift.update({ where: { id }, data, include: GIFT_MANAGEMENT_INCLUDE }); }

  softDeleteGift(id: string) { return this.prisma.gift.delete({ where: { id } }); }

  updateGiftStatus(id: string, data: Prisma.GiftUncheckedUpdateInput) { return this.prisma.gift.update({ where: { id }, data, include: GIFT_MANAGEMENT_INCLUDE }); }

  findGiftStats() { return this.prisma.$transaction([this.prisma.gift.count({ where: { deletedAt: null } }), this.prisma.gift.count({ where: { deletedAt: null, status: GiftStatus.ACTIVE } }), this.prisma.gift.count({ where: { deletedAt: null, moderationStatus: GiftModerationStatus.PENDING } })]); }

  findGiftsForExport(where: Prisma.GiftWhereInput) { return this.prisma.gift.findMany({ where, include: GIFT_MANAGEMENT_INCLUDE, orderBy: { createdAt: 'desc' }, take: 10000 }); }

  findGiftModerationQueue(params: { where: Prisma.GiftWhereInput; orderBy: Prisma.GiftOrderByWithRelationInput; skip: number; take: number }) {
    return this.prisma.$transaction([this.prisma.gift.findMany({ where: params.where, include: GIFT_MANAGEMENT_INCLUDE, orderBy: params.orderBy, skip: params.skip, take: params.take }), this.prisma.gift.count({ where: params.where })]);
  }

  updateGiftModerationStatus(id: string, data: Prisma.GiftUncheckedUpdateInput) { return this.prisma.gift.update({ where: { id }, data, include: GIFT_MANAGEMENT_INCLUDE }); }
}
