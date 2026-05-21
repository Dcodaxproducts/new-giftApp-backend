import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Gift, GiftCategory, GiftModerationStatus, GiftStatus, GiftVariant, Prisma, UserRole } from '@prisma/client';
import { AuthUserContext } from '../../../common/decorators/current-user.decorator';
import { AuditLogWriterService } from '../../../common/services/audit-log.service';
import { GIFT_MANAGEMENT_INCLUDE, GiftManagementRepository } from '../repositories/gift-management.repository';
import {
  ApproveGiftDto,
  CreateGiftCategoryDto,
  CreateGiftDto,
  ExportFormat,
  ExportGiftsDto,
  FlagGiftDto,
  GiftVariantDto,
  GiftCategorySortBy,
  GiftListStatus,
  GiftModerationFilter,
  GiftSortBy,
  ListGiftCategoriesDto,
  ListGiftModerationDto,
  ListGiftsDto,
  ModerationSortBy,
  RejectGiftDto,
  SortOrder,
  UpdateGiftCategoryDto,
  UpdateGiftDto,
  UpdateGiftStatusDto,
} from '../dto/gift-management.dto';

type GiftWithRelations = Gift & {
  category: Pick<GiftCategory, 'id' | 'name' | 'isActive' | 'deletedAt'>;
  provider: { id: string; email: string; providerBusinessName: string | null; firstName: string; lastName: string; isActive?: boolean; isApproved?: boolean; providerApprovalStatus?: string | null; suspendedAt?: Date | null; deletedAt?: Date | null };
  variants: GiftVariant[];
};
type RatingSummary = { rating: number; reviewCount: number };

@Injectable()
export class GiftManagementService {
  constructor(
    private readonly giftManagementRepository: GiftManagementRepository,
    private readonly auditLog: AuditLogWriterService,
  ) {}

  async createCategory(user: AuthUserContext, dto: CreateGiftCategoryDto) {
    const category = await this.giftManagementRepository.createGiftCategory({
      name: dto.name.trim(),
      slug: await this.uniqueCategorySlug(dto.name),
      description: dto.description?.trim(),
      iconKey: dto.iconKey?.trim(),
      color: dto.color ?? dto.backgroundColor,
      backgroundColor: dto.backgroundColor ?? dto.color ?? '#F3E8FF',
      imageUrl: dto.imageUrl?.trim(),
      sortOrder: dto.sortOrder ?? 0,
      isActive: dto.isActive ?? true,
    });
    await this.audit(user.uid, category.id, 'GIFT_CATEGORY_CREATED', undefined, this.toCategory(category, 0));
    return { data: this.toCategory(category, 0), message: 'Gift category created successfully' };
  }

  async listCategories(query: ListGiftCategoriesDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const where: Prisma.GiftCategoryWhereInput = {
      deletedAt: null,
      isActive: query.isActive,
      ...(query.search ? { name: { contains: query.search, mode: 'insensitive' } } : {}),
    };
    const [items, total] = await this.giftManagementRepository.findGiftCategoriesAndCount({ where, orderBy: this.categoryOrderBy(query.sortBy, query.sortOrder), skip: (page - 1) * limit, take: limit });
    return {
      data: items.map((item) => this.toCategory(item, item._count.gifts)),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
      message: 'Gift categories fetched successfully',
    };
  }

  async lookupActiveCategories() {
    const categories = await this.giftManagementRepository.findGiftCategoryLookup();
    return { data: categories.map((category) => ({ ...category, backgroundColor: category.backgroundColor ?? category.color ?? '#F3E8FF' })), message: 'Gift category lookup fetched successfully' };
  }

  async categoryStats() {
    const [[totalCategories, activeGiftItems], mostPopularCategory] = await Promise.all([
      this.giftManagementRepository.findGiftCategoryStats(),
      this.giftManagementRepository.findMostPopularGiftCategory(),
    ]);
    return {
      data: {
        totalCategories,
        activeGiftItems,
        mostPopularCategory,
      },
      message: 'Gift category stats fetched successfully',
    };
  }

  async categoryDetails(id: string) {
    const category = await this.getCategory(id);
    const totalGifts = await this.giftManagementRepository.countGiftsByCategory(id);
    return { data: this.toCategory(category, totalGifts), message: 'Gift category details fetched successfully' };
  }

  async updateCategory(user: AuthUserContext, id: string, dto: UpdateGiftCategoryDto) {
    const category = await this.getCategory(id);
    const before = this.toCategory(category, await this.giftManagementRepository.countGiftsByCategory(id));
    const updated = await this.giftManagementRepository.updateGiftCategory(id, {
      name: dto.name?.trim(),
      slug: dto.name ? await this.uniqueCategorySlug(dto.name, id) : undefined,
      description: dto.description?.trim(),
      iconKey: dto.iconKey?.trim(),
      color: dto.color,
      backgroundColor: dto.backgroundColor ?? dto.color,
      imageUrl: dto.imageUrl?.trim(),
      sortOrder: dto.sortOrder,
      isActive: dto.isActive,
    });
    await this.audit(user.uid, id, 'GIFT_CATEGORY_UPDATED', before, this.toCategory(updated, before.totalGifts));
    return { data: this.toCategory(updated, before.totalGifts), message: 'Gift category updated successfully' };
  }

  async deleteCategory(user: AuthUserContext, id: string) {
    const category = await this.getCategory(id);
    const gifts = await this.giftManagementRepository.countGiftsByCategory(id);
    if (gifts > 0) throw new BadRequestException('Category has attached gifts and cannot be deleted');
    await this.giftManagementRepository.deleteGiftCategory(id);
    await this.audit(user.uid, id, 'GIFT_CATEGORY_DELETED', this.toCategory(category, 0), null);
    return { data: null, message: 'Gift category deleted successfully' };
  }

  async createGift(user: AuthUserContext, dto: CreateGiftDto) {
    const providerId = user.role === UserRole.PROVIDER ? user.uid : dto.providerId;
    await this.assertCategory(dto.categoryId);
    await this.assertProvider(providerId);
    await this.assertUniqueSku(dto.sku);
    await this.assertVariantSkus(dto.variants);
    const variants = this.normalizeVariants(dto.variants);
    const isProviderCreatedInventory = user.role === UserRole.PROVIDER;
    const moderationStatus = isProviderCreatedInventory
      ? GiftModerationStatus.NOT_REQUIRED
      : user.role === UserRole.SUPER_ADMIN && dto.isPublished
      ? (dto.moderationStatus ?? GiftModerationStatus.APPROVED)
      : GiftModerationStatus.PENDING;
    const isPublished = isProviderCreatedInventory ? (dto.isPublished ?? true) : (dto.isPublished ?? false);
    const status = this.statusFromStock(this.stockForStatus(dto.stockQuantity, variants), isPublished, moderationStatus);
    const gift = await this.giftManagementRepository.createGiftWithVariants({
      name: dto.name.trim(),
      slug: await this.uniqueGiftSlug(dto.name),
      description: dto.description?.trim(),
      shortDescription: dto.shortDescription?.trim(),
      categoryId: dto.categoryId,
      providerId,
      price: new Prisma.Decimal(dto.price),
      currency: dto.currency ?? 'USD',
      stockQuantity: dto.stockQuantity ?? 0,
      sku: dto.sku?.trim(),
      imageUrls: dto.imageUrls ?? [],
      isPublished,
      isFeatured: dto.isFeatured ?? false,
      tags: dto.tags ?? [],
      moderationStatus,
      requiresManualReview: false,
      hiddenByModeration: false,
      status,
      approvedAt: moderationStatus === GiftModerationStatus.APPROVED ? new Date() : null,
      approvedBy: moderationStatus === GiftModerationStatus.APPROVED ? user.uid : null,
      variants: variants.length ? { create: variants.map((variant) => this.variantCreateData(variant)) } : undefined,
    });
    const data = this.toGiftDetail(gift, this.emptyRatingSummary());
    await this.audit(user.uid, gift.id, 'GIFT_CREATED', undefined, data);
    return { data, message: 'Gift created successfully' };
  }

  async listGifts(query: ListGiftsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const where = this.giftWhere(query);
    const [items, total] = await this.giftManagementRepository.findGiftsAndCountForAdmin({ where, orderBy: this.giftOrderBy(query.sortBy, query.sortOrder), skip: (page - 1) * limit, take: limit });
    const ratings = await this.ratingSummaries(items);
    return { data: items.map((gift) => this.toGiftListItem(gift, ratings.get(gift.providerId) ?? this.emptyRatingSummary())), meta: { page, limit, total, totalPages: Math.ceil(total / limit) }, message: 'Gifts fetched successfully' };
  }

  async giftStats() {
    const [totalGifts, activeListings, pendingApproval] = await this.giftManagementRepository.findGiftStats();
    return {
      data: { totalGifts, totalGiftsChangePercent: 0, activeListings, activeListingsChangePercent: 0, pendingApproval, pendingApprovalChangePercent: 0 },
      message: 'Gift inventory stats fetched successfully',
    };
  }

  async giftDetails(id: string) {
    const gift = await this.getGift(id);
    return { data: this.toGiftDetail(gift, await this.ratingSummary(gift.providerId)), message: 'Gift details fetched successfully' };
  }

  async updateGift(user: AuthUserContext, id: string, dto: UpdateGiftDto) {
    const gift = await this.getGift(id);
    this.assertCanManageGift(user, gift);
    if (dto.categoryId) await this.assertCategory(dto.categoryId);
    if (dto.providerId) await this.assertProvider(dto.providerId);
    if (dto.sku) await this.assertUniqueSku(dto.sku, id);
    await this.assertVariantSkus(dto.variants, id);
    this.assertSingleDefaultVariant(dto.variants);
    const normalizedVariants = dto.variants ? this.normalizeVariants(dto.variants) : undefined;
    const providerId = user.role === UserRole.PROVIDER ? gift.providerId : dto.providerId;
    const nextModeration = user.role === UserRole.PROVIDER && gift.moderationStatus === GiftModerationStatus.APPROVED
      ? GiftModerationStatus.PENDING
      : gift.moderationStatus;
    const updated = await this.giftManagementRepository.runGiftTransaction(async (tx) => {
      const base = await this.giftManagementRepository.updateGiftBase(tx, id, {
        name: dto.name?.trim(),
        slug: dto.name ? await this.uniqueGiftSlug(dto.name, id) : undefined,
        description: dto.description?.trim(),
        shortDescription: dto.shortDescription?.trim(),
        categoryId: dto.categoryId,
        providerId,
        price: dto.price === undefined ? undefined : new Prisma.Decimal(dto.price),
        currency: dto.currency,
        stockQuantity: dto.stockQuantity,
        sku: dto.sku?.trim(),
        imageUrls: dto.imageUrls,
        isPublished: dto.isPublished,
        isFeatured: dto.isFeatured,
        tags: dto.tags,
        moderationStatus: nextModeration,
        status: this.nextStatusForUpdate(gift, dto, normalizedVariants),
      });
      if (normalizedVariants) await this.upsertVariants(tx, id, normalizedVariants, dto.replaceVariants ?? false);
      return this.giftManagementRepository.findGiftByIdWithVariantsTx(tx, base.id);
    });
    const beforeRating = await this.ratingSummary(gift.providerId);
    const afterRating = updated.providerId === gift.providerId ? beforeRating : await this.ratingSummary(updated.providerId);
    await this.audit(user.uid, id, 'GIFT_UPDATED', this.toGiftDetail(gift, beforeRating), this.toGiftDetail(updated, afterRating));
    return { data: this.toGiftDetail(updated, afterRating), message: 'Gift updated successfully' };
  }

  async updateGiftStatus(user: AuthUserContext, id: string, dto: UpdateGiftStatusDto) {
    const gift = await this.getGift(id);
    this.assertCanManageGift(user, gift);
    const updated = await this.giftManagementRepository.updateGiftStatus(id, { status: dto.status, isPublished: dto.status === GiftStatus.ACTIVE ? true : gift.isPublished });
    await this.audit(user.uid, id, 'GIFT_STATUS_CHANGED', { status: gift.status, reason: dto.reason }, { status: updated.status, reason: dto.reason });
    return { data: this.toGiftDetail(updated, await this.ratingSummary(updated.providerId)), message: 'Gift status updated successfully' };
  }

  async deleteGift(user: AuthUserContext, id: string) {
    const gift = await this.getGift(id);
    this.assertCanManageGift(user, gift);
    await this.giftManagementRepository.deleteGift(id);
    await this.audit(user.uid, id, 'GIFT_DELETED', this.toGiftDetail(gift, await this.ratingSummary(gift.providerId)), null);
    return { data: null, message: 'Gift deleted successfully' };
  }

  async exportGifts(query: ExportGiftsDto) {
    const gifts = await this.giftManagementRepository.findGiftsForExport(this.giftWhere(query));
    const rows = [['ID', 'Name', 'SKU', 'Category', 'Provider', 'Price', 'Currency', 'Status', 'Moderation', 'Published'], ...gifts.map((gift) => [gift.id, gift.name, gift.sku ?? '', gift.category.name, this.providerName(gift.provider), gift.price.toString(), gift.currency, gift.status, gift.moderationStatus, String(gift.isPublished)])];
    const csv = rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(',')).join('\n');
    return { filename: `gifts.${query.format === ExportFormat.XLSX ? 'xlsx' : 'csv'}`, contentType: query.format === ExportFormat.XLSX ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'text/csv; charset=utf-8', content: csv };
  }

  async moderationQueue(query: ListGiftModerationDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const where: Prisma.GiftWhereInput = { deletedAt: null, providerId: query.providerId, ...(query.search ? { name: { contains: query.search, mode: 'insensitive' } } : {}), ...this.moderationQueueWhere(query) };
    const [items, total] = await this.giftManagementRepository.findGiftModerationQueue({ where, orderBy: query.sortBy === ModerationSortBy.NAME ? { name: this.dir(query.sortOrder) } : { createdAt: this.dir(query.sortOrder) }, skip: (page - 1) * limit, take: limit });
    return { data: items.map((gift) => ({ id: gift.id, name: gift.name, provider: { id: gift.provider.id, businessName: this.providerName(gift.provider) }, imageUrl: this.firstImage(gift), submittedAt: gift.createdAt, moderationStatus: gift.moderationStatus, status: gift.moderationStatus })), meta: { page, limit, total, totalPages: Math.ceil(total / limit) }, message: 'Gift moderation queue fetched successfully' };
  }

  async approveGift(user: AuthUserContext, id: string, dto: ApproveGiftDto) {
    const gift = await this.getGift(id);
    const canRestore = this.canPublishAfterApproval(gift);
    const updated = await this.giftManagementRepository.updateGiftModerationStatus(id, { moderationStatus: GiftModerationStatus.APPROVED, requiresManualReview: false, hiddenByModeration: false, manualReviewReason: null, moderationResolvedAt: new Date(), status: dto.publishNow && canRestore ? GiftStatus.ACTIVE : gift.status, isPublished: dto.publishNow && canRestore ? true : gift.isPublished, approvedAt: new Date(), approvedBy: user.uid, rejectedAt: null, rejectedBy: null, rejectionReason: null, rejectionComment: null });
    const data = { id, moderationStatus: updated.moderationStatus, status: updated.status, isPublished: updated.isPublished, approvedAt: updated.approvedAt, approvedBy: updated.approvedBy };
    await this.audit(user.uid, id, 'GIFT_APPROVED', this.toGiftDetail(gift, await this.ratingSummary(gift.providerId)), data);
    return { data, message: 'Gift approved successfully' };
  }

  async rejectGift(user: AuthUserContext, id: string, dto: RejectGiftDto) {
    const gift = await this.getGift(id);
    const updated = await this.giftManagementRepository.updateGiftModerationStatus(id, { moderationStatus: GiftModerationStatus.REJECTED, requiresManualReview: false, hiddenByModeration: true, isPublished: false, status: GiftStatus.INACTIVE, moderationResolvedAt: new Date(), rejectedAt: new Date(), rejectedBy: user.uid, rejectionReason: dto.reason, rejectionComment: dto.comment?.trim() });
    const data = { id, moderationStatus: updated.moderationStatus, status: updated.status, rejectedAt: updated.rejectedAt, rejectedBy: updated.rejectedBy, rejectionReason: updated.rejectionReason, rejectionComment: updated.rejectionComment };
    await this.audit(user.uid, id, 'GIFT_REJECTED', this.toGiftDetail(gift, await this.ratingSummary(gift.providerId)), data);
    if (dto.notifyProvider) await this.notifyProvider(gift.providerId, id, 'Gift rejected', dto.comment?.trim() ?? 'Your gift was rejected by moderation.', 'GIFT_REJECTED');
    return { data, message: 'Gift rejected successfully' };
  }

  async flagGift(user: AuthUserContext, id: string, dto: FlagGiftDto) {
    const gift = await this.getGift(id);
    const hide = dto.hideFromMarketplace ?? false;
    const updated = await this.giftManagementRepository.updateGiftModerationStatus(id, { moderationStatus: GiftModerationStatus.FLAGGED, requiresManualReview: true, manualReviewReason: dto.reason, hiddenByModeration: hide, isPublished: hide ? false : gift.isPublished, flaggedAt: new Date(), flaggedById: user.uid, flagReason: dto.reason, flagComment: dto.comment?.trim(), moderationResolvedAt: null });
    const data = { id, moderationStatus: updated.moderationStatus, status: updated.status, isPublished: updated.isPublished, requiresManualReview: updated.requiresManualReview, hiddenByModeration: updated.hiddenByModeration, flaggedAt: updated.flaggedAt, flaggedById: updated.flaggedById, flagReason: updated.flagReason, flagComment: updated.flagComment };
    await this.audit(user.uid, id, 'GIFT_FLAGGED', this.toGiftDetail(gift, await this.ratingSummary(gift.providerId)), data);
    if (dto.notifyProvider) await this.notifyProvider(gift.providerId, id, 'Gift flagged for review', dto.comment?.trim() ?? 'Your gift requires manual moderation review.', 'GIFT_FLAGGED');
    return { data, message: 'Gift flagged successfully' };
  }

  private async getCategory(id: string): Promise<GiftCategory> {
    const category = await this.giftManagementRepository.findGiftCategoryById(id);
    if (!category) throw new NotFoundException('Gift category not found');
    return category;
  }

  private async getGift(id: string): Promise<GiftWithRelations> {
    const gift = await this.giftManagementRepository.findGiftByIdWithVariants(id);
    if (!gift) throw new NotFoundException('Gift not found');
    return gift;
  }

  private async assertCategory(id: string) { await this.getCategory(id); }
  private async assertProvider(id: string) {
    const provider = await this.giftManagementRepository.findProviderById(id);
    if (!provider) throw new BadRequestException('Provider must exist and have PROVIDER role');
  }
  private async assertUniqueSku(sku?: string, exceptGiftId?: string) {
    if (!sku) return;
    const existing = await this.giftManagementRepository.findGiftBySku(sku, exceptGiftId);
    if (existing) throw new BadRequestException('Gift SKU already exists');
  }

  private giftWhere(query: ListGiftsDto | ExportGiftsDto): Prisma.GiftWhereInput {
    return { deletedAt: null, categoryId: query.categoryId, providerId: query.providerId, isPublished: query.isPublished, ...(query.search ? { OR: [{ name: { contains: query.search, mode: 'insensitive' } }, { sku: { contains: query.search, mode: 'insensitive' } }, { provider: { providerBusinessName: { contains: query.search, mode: 'insensitive' } } }] } : {}), ...this.statusWhere(query.status), ...(query.moderationStatus && query.moderationStatus !== GiftModerationFilter.ALL ? { moderationStatus: query.moderationStatus } : {}) };
  }
  private moderationQueueWhere(query: ListGiftModerationDto): Prisma.GiftWhereInput {
    if (query.status) return { moderationStatus: query.status };
    if (query.includeResolved) return {};
    return { OR: [{ moderationStatus: { in: [GiftModerationStatus.PENDING, GiftModerationStatus.FLAGGED, GiftModerationStatus.REJECTED] } }, { requiresManualReview: true }] };
  }
  private statusWhere(status?: GiftListStatus): Prisma.GiftWhereInput {
    if (!status || status === GiftListStatus.ALL) return {};
    if (status === GiftListStatus.PENDING || status === GiftListStatus.REJECTED || status === GiftListStatus.FLAGGED) return { moderationStatus: status };
    return { status };
  }
  private categoryOrderBy(sortBy?: GiftCategorySortBy, sortOrder?: SortOrder): Prisma.GiftCategoryOrderByWithRelationInput { return { [sortBy === GiftCategorySortBy.NAME || sortBy === GiftCategorySortBy.SORT_ORDER ? sortBy : 'createdAt']: this.dir(sortOrder) }; }
  private giftOrderBy(sortBy?: GiftSortBy, sortOrder?: SortOrder): Prisma.GiftOrderByWithRelationInput { const field = sortBy === GiftSortBy.NAME || sortBy === GiftSortBy.PRICE || sortBy === GiftSortBy.STOCK_QUANTITY ? sortBy : sortBy === GiftSortBy.RATING ? 'ratingPlaceholder' : 'createdAt'; return { [field]: this.dir(sortOrder) }; }
  private dir(sortOrder?: SortOrder): Prisma.SortOrder { return sortOrder === SortOrder.ASC ? 'asc' : 'desc'; }
  private giftInclude() { return GIFT_MANAGEMENT_INCLUDE; }

  private normalizeVariants(variants?: GiftVariantDto[]): GiftVariantDto[] {
    if (!variants?.length) return [];
    this.assertSingleDefaultVariant(variants);
    const normalized = variants.map((variant) => ({ ...variant }));
    if (!normalized.some((variant) => variant.isDefault)) normalized[0].isDefault = true;
    return normalized;
  }
  private assertSingleDefaultVariant(variants?: GiftVariantDto[]): void { if ((variants ?? []).filter((variant) => variant.isDefault).length > 1) throw new BadRequestException('Only one default variant is allowed'); }
  private async assertVariantSkus(variants?: GiftVariantDto[], giftId?: string): Promise<void> { const skus = (variants ?? []).map((variant) => variant.sku?.trim()).filter((sku): sku is string => Boolean(sku)); if (new Set(skus).size !== skus.length) throw new BadRequestException('Variant SKU must be unique'); if (!skus.length) return; const existing = await this.giftManagementRepository.findGiftVariantBySku(skus, giftId); if (existing) throw new BadRequestException('Variant SKU already exists'); }
  private variantCreateData(variant: GiftVariantDto): Prisma.GiftVariantCreateWithoutGiftInput { return { name: variant.name.trim(), price: new Prisma.Decimal(variant.price), originalPrice: variant.originalPrice === undefined ? undefined : new Prisma.Decimal(variant.originalPrice), stockQuantity: variant.stockQuantity ?? 0, sku: variant.sku?.trim(), isPopular: variant.isPopular ?? false, isDefault: variant.isDefault ?? false, sortOrder: variant.sortOrder ?? 0, isActive: variant.isActive ?? true }; }
  private canPublishAfterApproval(gift: GiftWithRelations): boolean { return gift.status === GiftStatus.ACTIVE && gift.deletedAt === null && this.giftHasStock(gift) && gift.category.isActive && gift.category.deletedAt === null && (gift.provider.isActive ?? true) && gift.provider.deletedAt === null && gift.provider.suspendedAt === null; }
  private async notifyProvider(providerId: string, giftId: string, title: string, message: string, type: string): Promise<void> { await this.giftManagementRepository.createProviderNotification({ providerId, giftId, title, message, type }); }
  private variantUpdateData(variant: GiftVariantDto): Prisma.GiftVariantUpdateInput { return { name: variant.name?.trim(), price: variant.price === undefined ? undefined : new Prisma.Decimal(variant.price), originalPrice: variant.originalPrice === undefined ? undefined : new Prisma.Decimal(variant.originalPrice), stockQuantity: variant.stockQuantity, sku: variant.sku?.trim(), isPopular: variant.isPopular, isDefault: variant.isDefault, sortOrder: variant.sortOrder, isActive: variant.isActive }; }
  private async upsertVariants(tx: Prisma.TransactionClient, giftId: string, variants: GiftVariantDto[], replaceVariants: boolean): Promise<void> {
    const normalized = this.normalizeVariants(variants);
    const incomingIds = normalized.map((variant) => variant.id).filter((id): id is string => Boolean(id));
    if (replaceVariants) await this.giftManagementRepository.softDeleteVariantsForGift(tx, giftId, incomingIds);
    if (normalized.some((variant) => variant.isDefault)) await this.giftManagementRepository.clearDefaultVariantsForGift(tx, giftId);
    for (const variant of normalized) {
      if (variant.id) {
        const existing = await this.giftManagementRepository.findGiftVariantForGift(tx, giftId, variant.id);
        if (!existing) throw new BadRequestException('Variant does not belong to gift');
        await this.giftManagementRepository.updateGiftVariant(tx, variant.id, this.variantUpdateData(variant));
      } else {
        await this.giftManagementRepository.createGiftVariant(tx, { giftId, ...this.variantCreateData(variant) });
      }
    }
  }

  private toCategory(category: GiftCategory, totalGifts: number) { const backgroundColor = category.backgroundColor ?? category.color ?? '#F3E8FF'; return { id: category.id, name: category.name, slug: category.slug, description: category.description, iconKey: category.iconKey, color: category.color ?? backgroundColor, backgroundColor, imageUrl: category.imageUrl, totalGifts, isActive: category.isActive, sortOrder: category.sortOrder, createdAt: category.createdAt, updatedAt: category.updatedAt }; }
  private toGiftListItem(gift: GiftWithRelations, ratingSummary: RatingSummary) { const imageUrls = this.stringArray(gift.imageUrls); return { id: gift.id, name: gift.name, shortDescription: gift.shortDescription, category: gift.category, provider: { id: gift.provider.id, businessName: this.providerName(gift.provider) }, price: Number(gift.price), currency: gift.currency, rating: ratingSummary.rating, reviewCount: ratingSummary.reviewCount, status: gift.status, moderationStatus: gift.moderationStatus, isPublished: gift.isPublished, stockQuantity: gift.stockQuantity, sku: gift.sku, imageUrl: imageUrls[0] ?? null, imageUrls, createdAt: gift.createdAt }; }
  private toGiftDetail(gift: GiftWithRelations, ratingSummary: RatingSummary) { return { ...this.toGiftListItem(gift, ratingSummary), description: gift.description, isFeatured: gift.isFeatured, tags: this.stringArray(gift.tags), variants: (gift.variants ?? []).map((variant) => this.toVariant(variant)), updatedAt: gift.updatedAt }; }
  private toVariant(variant: GiftVariant) { return { id: variant.id, name: variant.name, price: Number(variant.price), originalPrice: variant.originalPrice === null ? null : Number(variant.originalPrice), stockQuantity: variant.stockQuantity, sku: variant.sku, isPopular: variant.isPopular, isDefault: variant.isDefault, sortOrder: variant.sortOrder, isActive: variant.isActive }; }
  private providerName(provider: GiftWithRelations['provider']): string { return provider.providerBusinessName ?? `${provider.firstName} ${provider.lastName}`.trim(); }
  private firstImage(gift: Gift): string | null { return this.stringArray(gift.imageUrls)[0] ?? null; }
  private stringArray(value: Prisma.JsonValue): string[] { return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []; }
  private statusFromStock(stockQuantity: number, isPublished: boolean, moderationStatus: GiftModerationStatus): GiftStatus { if (stockQuantity === 0) return GiftStatus.OUT_OF_STOCK; return isPublished && moderationStatus === GiftModerationStatus.APPROVED ? GiftStatus.ACTIVE : GiftStatus.INACTIVE; }
  private stockForStatus(stockQuantity?: number, variants?: { stockQuantity?: number }[]): number { return (stockQuantity ?? 0) > 0 ? stockQuantity ?? 0 : variants?.reduce((total, variant) => total + (variant.stockQuantity ?? 0), 0) ?? 0; }
  private giftHasStock(gift: GiftWithRelations): boolean { return gift.stockQuantity > 0 || gift.variants.some((variant) => variant.stockQuantity > 0); }
  private nextStatusForUpdate(gift: GiftWithRelations, dto: UpdateGiftDto, variants?: GiftVariantDto[]): GiftStatus | undefined {
    if (dto.stockQuantity === undefined && variants === undefined) return undefined;
    const stockQuantity = dto.stockQuantity ?? (dto.replaceVariants ? undefined : gift.stockQuantity);
    const nextVariants = variants ?? gift.variants;
    return this.statusFromStock(this.stockForStatus(stockQuantity, nextVariants), dto.isPublished ?? gift.isPublished, gift.moderationStatus);
  }
  private emptyRatingSummary(): RatingSummary { return { rating: 0, reviewCount: 0 }; }
  private async ratingSummary(providerId: string): Promise<RatingSummary> { return (await this.ratingSummaries([{ providerId }])).get(providerId) ?? this.emptyRatingSummary(); }
  private async ratingSummaries(gifts: Pick<Gift, 'providerId'>[]): Promise<Map<string, RatingSummary>> {
    const providerIds = [...new Set(gifts.map((gift) => gift.providerId))];
    if (providerIds.length === 0) return new Map();
    const rows = await this.giftManagementRepository.findProviderReviewSummaries(providerIds);
    return new Map(rows.map((row) => [row.providerId, { rating: this.round(Number(row._avg.rating ?? 0)), reviewCount: this.groupCount(row._count) }]));
  }
  private round(value: number): number { return Number(value.toFixed(1)); }
  private groupCount(count: true | { _all?: number }): number { return typeof count === 'object' ? count._all ?? 0 : 0; }
  private assertCanManageGift(user: AuthUserContext, gift: Gift): void { if (user.role === UserRole.PROVIDER && gift.providerId !== user.uid) throw new ForbiddenException('Provider cannot manage another provider gift'); }
  private async uniqueCategorySlug(name: string, exceptId?: string): Promise<string> { return this.uniqueSlug(name, (slug) => this.giftManagementRepository.findGiftCategoryBySlug(slug, exceptId)); }
  private async uniqueGiftSlug(name: string, exceptId?: string): Promise<string> { return this.uniqueSlug(name, (slug) => this.giftManagementRepository.findGiftBySlug(slug, exceptId)); }
  private async uniqueSlug(name: string, exists: (slug: string) => Promise<unknown>): Promise<string> { const base = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'item'; let slug = base; let i = 1; while (await exists(slug)) slug = `${base}-${i++}`; return slug; }
  private async audit(actorId: string, targetId: string, action: string, beforeJson: unknown, afterJson: unknown): Promise<void> {
    await this.auditLog.write({
      actorId,
      targetId,
      targetType: action.startsWith('GIFT_CATEGORY') ? 'GIFT_CATEGORY' : 'GIFT',
      action,
      beforeJson,
      afterJson,
    });
  }
}
