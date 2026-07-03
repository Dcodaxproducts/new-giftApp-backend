import { Injectable } from '@nestjs/common';
import { GiftStatus, NotificationRecipientType, OrderStatus, Prisma, ReviewStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { NotificationDispatchService } from '../../notifications/notification-dispatch.service';

export const GIFT_MANAGEMENT_INCLUDE = Prisma.validator<Prisma.GiftInclude>()({
  category: { select: { id: true, name: true, isActive: true, deletedAt: true } },
  provider: { select: { id: true, email: true, providerProfile: { select: { businessName: true } }, firstName: true, lastName: true, isActive: true, isApproved: true, suspendedAt: true } },
  variants: { orderBy: { name: 'asc' } },
});

type GiftTx = Prisma.TransactionClient;
type GiftCreateData = Prisma.Args<PrismaService['gift'], 'create'>['data'];
type GiftUpdateData = Prisma.GiftUncheckedUpdateInput;
type GiftCategoryCreateData = Prisma.Args<PrismaService['giftCategory'], 'create'>['data'];
type GiftCategoryUpdateData = Prisma.Args<PrismaService['giftCategory'], 'update'>['data'];
type GiftVariantCreateData = Prisma.Args<GiftTx['giftVariant'], 'create'>['data'];
type GiftVariantUpdateData = Prisma.Args<GiftTx['giftVariant'], 'update'>['data'];
type PopularGiftCategoryRow = { name: string; totalQuantity: bigint; totalSales: Prisma.Decimal };

@Injectable()
export class GiftManagementRepository {
  constructor(private readonly prisma: PrismaService, private readonly notificationDispatch: NotificationDispatchService) {}

  findGiftCategories(params: { where: Prisma.GiftCategoryWhereInput; orderBy: Prisma.GiftCategoryOrderByWithRelationInput; skip: number; take: number }) {
    return this.prisma.giftCategory.findMany({ where: params.where, include: { _count: { select: { gifts: true } } }, orderBy: params.orderBy, skip: params.skip, take: params.take });
  }

  countGiftCategories(where: Prisma.GiftCategoryWhereInput) { return this.prisma.giftCategory.count({ where }); }

  findGiftCategoriesAndCount(params: { where: Prisma.GiftCategoryWhereInput; orderBy: Prisma.GiftCategoryOrderByWithRelationInput; skip: number; take: number }) {
    return this.prisma.$transaction([this.findGiftCategories(params), this.countGiftCategories(params.where)]);
  }

  findGiftCategoryById(id: string) { return this.prisma.giftCategory.findFirst({ where: { id, deletedAt: null } }); }

  findGiftCategoryBySlug(slug: string, exceptId?: string) { return this.prisma.giftCategory.findFirst({ where: { slug, id: exceptId ? { not: exceptId } : undefined } }); }

  createGiftCategory(data: GiftCategoryCreateData) { return this.prisma.giftCategory.create({ data }); }

  updateGiftCategory(id: string, data: GiftCategoryUpdateData) { return this.prisma.giftCategory.update({ where: { id }, data }); }

  deleteGiftCategory(id: string) { return this.prisma.giftCategory.delete({ where: { id } }); }

  countGiftsByCategory(categoryId: string) { return this.prisma.gift.count({ where: { categoryId } }); }

  findGiftCategoryLookup() { return this.prisma.giftCategory.findMany({ where: { isActive: true, deletedAt: null }, orderBy: { name: 'asc' }, select: { id: true, name: true, slug: true, backgroundColor: true, imageUrl: true, color: true } }); }

  findGiftCategoryStats() { return this.prisma.$transaction([this.prisma.giftCategory.count({ where: { deletedAt: null } }), this.prisma.gift.count({ where: { status: GiftStatus.ACTIVE } })]); }

  async findMostPopularGiftCategory() {
    const salesStatuses = [OrderStatus.DELIVERED, OrderStatus.COMPLETED, OrderStatus.PARTIALLY_COMPLETED];
    const rows = await this.prisma.$queryRaw<PopularGiftCategoryRow[]>(Prisma.sql`
      SELECT gc.name AS "name", SUM(oi.quantity)::bigint AS "totalQuantity", COALESCE(SUM(oi.total), 0) AS "totalSales"
      FROM order_items oi
      INNER JOIN orders o ON o.id = oi.order_id
      INNER JOIN gifts g ON g.id = oi.gift_id
      INNER JOIN gift_categories gc ON gc.id = g.category_id
      WHERE oi.status::text IN (${Prisma.join(salesStatuses)})
        AND o.status::text IN (${Prisma.join(salesStatuses)})
        AND gc.deleted_at IS NULL
      GROUP BY gc.id, gc.name
      ORDER BY "totalQuantity" DESC, "totalSales" DESC, gc.name ASC
      LIMIT 1
    `);
    return rows[0]?.name ?? null;
  }

  findGiftsForAdmin(params: { where: Prisma.GiftWhereInput; orderBy: Prisma.GiftOrderByWithRelationInput; skip: number; take: number }) {
    return this.prisma.gift.findMany({ where: params.where, include: GIFT_MANAGEMENT_INCLUDE, orderBy: params.orderBy, skip: params.skip, take: params.take });
  }

  countGiftsForAdmin(where: Prisma.GiftWhereInput) { return this.prisma.gift.count({ where }); }

  findGiftsAndCountForAdmin(params: { where: Prisma.GiftWhereInput; orderBy: Prisma.GiftOrderByWithRelationInput; skip: number; take: number }) {
    return this.prisma.$transaction([this.findGiftsForAdmin(params), this.countGiftsForAdmin(params.where)]);
  }

  findProviderReviewSummaries(providerIds: string[]) {
    return this.prisma.review.groupBy({ by: ['providerId'], where: { providerId: { in: providerIds }, deletedAt: null, status: ReviewStatus.PUBLISHED }, _avg: { rating: true }, _count: { _all: true } });
  }

  findGiftByIdWithVariants(id: string) { return this.prisma.gift.findFirst({ where: { id }, include: GIFT_MANAGEMENT_INCLUDE }); }

  findGiftBySlug(slug: string, exceptId?: string) { return this.prisma.gift.findFirst({ where: { slug, id: exceptId ? { not: exceptId } : undefined } }); }

  findProviderById(id: string) { return this.prisma.user.findFirst({ where: { id, role: UserRole.PROVIDER } }); }

  createGiftWithVariants(data: GiftCreateData) { return this.prisma.gift.create({ data, include: GIFT_MANAGEMENT_INCLUDE }); }

  runGiftTransaction<T>(callback: (tx: GiftTx) => Promise<T>) { return this.prisma.$transaction(callback); }

  updateGiftBase(tx: GiftTx, id: string, data: GiftUpdateData) { return tx.gift.update({ where: { id }, data }); }

  findGiftByIdWithVariantsTx(tx: GiftTx, id: string) { return tx.gift.findUniqueOrThrow({ where: { id }, include: GIFT_MANAGEMENT_INCLUDE }); }

  deleteVariantsForGift(tx: GiftTx, giftId: string, incomingIds: string[]) { return tx.giftVariant.deleteMany({ where: { giftId, id: { notIn: incomingIds } } }); }

  findGiftVariantForGift(tx: GiftTx, giftId: string, variantId: string) { return tx.giftVariant.findFirst({ where: { id: variantId, giftId } }); }

  findGiftVariantById(tx: GiftTx, variantId: string) { return tx.giftVariant.findFirst({ where: { id: variantId }, select: { id: true, giftId: true } }); }

  updateGiftVariant(tx: GiftTx, id: string, data: GiftVariantUpdateData) { return tx.giftVariant.update({ where: { id }, data }); }

  createGiftVariant(tx: GiftTx, data: GiftVariantCreateData) { return tx.giftVariant.create({ data }); }

  updateGiftWithVariants(id: string, data: GiftUpdateData) { return this.prisma.gift.update({ where: { id }, data, include: GIFT_MANAGEMENT_INCLUDE }); }

  deleteGift(id: string) { return this.prisma.gift.delete({ where: { id } }); }

  findGiftStats() { return this.prisma.$transaction([this.prisma.gift.count(), this.prisma.gift.count({ where: { status: GiftStatus.ACTIVE } })]); }

  findGiftsForExport(where: Prisma.GiftWhereInput) { return this.prisma.gift.findMany({ where, include: GIFT_MANAGEMENT_INCLUDE, orderBy: { createdAt: 'desc' }, take: 10000 }); }

  createProviderNotification(data: { providerId: string; title: string; message: string; type: string; giftId: string }) {
    return this.notificationDispatch.createAndEmit({ recipientId: data.providerId, recipientType: NotificationRecipientType.PROVIDER, title: data.title, message: data.message, type: data.type, metadataJson: { giftId: data.giftId } })
  }
}
