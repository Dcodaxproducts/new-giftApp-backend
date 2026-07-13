import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Gift, GiftCategory, GiftStatus, GiftVariant, Prisma, UserRole, UserStatus } from '@prisma/client';
import { AuthUserContext } from '../../common/decorators/current-user.decorator';
import { AuditLogWriterService } from '../../common/services/audit-log.service';
import { GIFT_MANAGEMENT_INCLUDE, GiftManagementRepository } from './gift-management.repository';
import {
  CreateGiftCategoryDto,
  CreateGiftDto,
  ExportFormat,
  ExportGiftsDto,
  GiftVariantDto,
  GiftCategorySortBy,
  GiftListStatus,
  GiftSortBy,
  ListGiftCategoriesDto,
  ListGiftsDto,
  SortOrder,
  UpdateGiftCategoryDto,
  UpdateGiftDto,
  UpdateGiftVariantDto,
} from './dto/gift-management.dto';
import { getPagination } from '../../common/pagination/pagination.util';

type GiftWithRelations = Gift & {
  category: Pick<GiftCategory, 'id' | 'name' | 'isActive'>;
  provider: { id: string; email: string; providerProfile: { businessName: string | null } | null; firstName: string; lastName: string; status: UserStatus };
  variants: GiftVariant[];
};
type RatingSummary = { rating: number; reviewCount: number };

@Injectable()
export class GiftManagementService {
  constructor(
    private readonly giftManagementRepository: GiftManagementRepository,
    private readonly auditLog: AuditLogWriterService,
  ) { }

  async createCategory(user: AuthUserContext, dto: CreateGiftCategoryDto) {
    const category = await this.giftManagementRepository.createGiftCategory({
      name: dto.name.trim(),
      slug: await this.uniqueCategorySlug(dto.name),
      description: dto.description?.trim(),
      imageUrl: dto.imageUrl?.trim(),
      isActive: dto.isActive ?? true,
    });
    await this.audit(user, category.id, 'GIFT_CATEGORY_CREATED', undefined, this.toCategory(category, 0));
    return { data: this.toCategory(category, 0), message: 'Gift category created successfully' };
  }

  async listCategories(query: ListGiftCategoriesDto, user?: AuthUserContext) {
    if (query.lookup) {
      const items = await this.giftManagementRepository.lookupGiftCategories();
      return { data: items, message: 'Gift categories lookup fetched successfully' };
    }
    const isAdmin = user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.STAFF;
    const { page, limit, skip, take } = getPagination(query);
    const where: Prisma.GiftCategoryWhereInput = {
      ...(isAdmin ? (query.isActive === undefined ? {} : { isActive: query.isActive }) : { isActive: true }),
      ...(query.search ? { name: { contains: query.search, mode: 'insensitive' } } : {}),
    };
    const [items, total] = await this.giftManagementRepository.findGiftCategoriesAndCount({ where, orderBy: this.categoryOrderBy(query.sortBy, query.sortOrder), skip, take });
    return {
      data: items.map((item) => this.toCategory(item, item._count.gifts)),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
      message: 'Gift categories fetched successfully',
    };
  }

  async updateCategory(user: AuthUserContext, id: string, dto: UpdateGiftCategoryDto) {
    const category = await this.getCategory(id);
    const before = this.toCategory(category, await this.giftManagementRepository.countGiftsByCategory(id));
    const updated = await this.giftManagementRepository.updateGiftCategory(id, {
      name: dto.name?.trim(),
      slug: dto.name ? await this.uniqueCategorySlug(dto.name, id) : undefined,
      description: dto.description?.trim(),
      imageUrl: dto.imageUrl?.trim(),
      isActive: dto.isActive,
    });
    await this.audit(user, id, 'GIFT_CATEGORY_UPDATED', before, this.toCategory(updated, before.totalGifts));
    return { data: this.toCategory(updated, before.totalGifts), message: 'Gift category updated successfully' };
  }

  async deleteCategory(user: AuthUserContext, id: string) {
    const category = await this.getCategory(id);
    const gifts = await this.giftManagementRepository.countGiftsByCategory(id);
    if (gifts > 0) throw new BadRequestException('Category has attached gifts and cannot be deleted');
    await this.giftManagementRepository.deleteGiftCategory(id);
    await this.audit(user, id, 'GIFT_CATEGORY_DELETED', this.toCategory(category, 0), null);
    return { data: null, message: 'Gift category deleted successfully' };
  }

  async createGift(user: AuthUserContext, dto: CreateGiftDto) {
    this.assertGiftCreatePermission(user);
    if (user.role !== UserRole.PROVIDER && !dto.providerId) throw new BadRequestException('Provider is required');
    const providerId = user.role === UserRole.PROVIDER ? user.uid : dto.providerId!;
    await this.assertCategory(dto.categoryId);
    await this.assertProvider(providerId);
    const variants = this.normalizeVariants(dto.variants);
    const gift = await this.giftManagementRepository.createGiftWithVariants({
      name: dto.name.trim(),
      slug: await this.uniqueGiftSlug(dto.name),
      description: dto.description?.trim(),
      categoryId: dto.categoryId,
      providerId,
      price: new Prisma.Decimal(dto.price),
      currency: dto.currency ?? 'USD',
      imageUrls: dto.imageUrls ?? [],
      isFeatured: dto.isFeatured ?? false,
      status: user.role === UserRole.PROVIDER ? GiftStatus.INACTIVE : GiftStatus.ACTIVE,
      variants: variants.length ? { create: variants.map((variant) => this.variantCreateData(variant)) } : undefined,
    });
    const data = this.toGiftDetail(gift, this.emptyRatingSummary());
    await this.audit(user, gift.id, 'GIFT_CREATED', undefined, data);
    return { data, message: 'Gift created successfully' };
  }

  async listGifts(query: ListGiftsDto) {
    const { page, limit, skip, take } = getPagination(query);
    const where = this.giftWhere(query);
    const [items, total] = await this.giftManagementRepository.findGiftsAndCountForAdmin({ where, orderBy: this.giftOrderBy(query.sortBy, query.sortOrder), skip, take });
    const ratings = await this.ratingSummaries(items);
    return { data: items.map((gift) => this.toGiftListItem(gift, ratings.get(gift.providerId) ?? this.emptyRatingSummary())), meta: { page, limit, total, totalPages: Math.ceil(total / limit) }, message: 'Gifts fetched successfully' };
  }

  async giftDetails(id: string) {
    const gift = await this.getGift(id);
    return { data: this.toGiftDetail(gift, await this.ratingSummary(gift.providerId)), message: 'Gift details fetched successfully' };
  }

  async updateGift(user: AuthUserContext, id: string, dto: UpdateGiftDto) {
    const gift = await this.getGift(id);
    this.assertCanManageGift(user, gift);
    this.assertGiftUpdatePermission(user, dto);
    if (dto.categoryId) await this.assertCategory(dto.categoryId);
    if (dto.providerId) await this.assertProvider(dto.providerId);
    const normalizedVariants = dto.variants ? this.normalizeUpdateVariants(dto.variants) : undefined;
    const providerId = user.role === UserRole.PROVIDER ? gift.providerId : dto.providerId;
    const updated = await this.giftManagementRepository.runGiftTransaction(async (tx) => {
      const base = await this.giftManagementRepository.updateGiftBase(tx, id, {
        name: dto.name?.trim(),
        slug: dto.name ? await this.uniqueGiftSlug(dto.name, id) : undefined,
        description: dto.description?.trim(),
        categoryId: dto.categoryId,
        providerId,
        price: dto.price === undefined ? undefined : new Prisma.Decimal(dto.price),
        currency: dto.currency,
        imageUrls: dto.imageUrls,
        isFeatured: dto.isFeatured,
        status: dto.status,
      });
      if (normalizedVariants) await this.upsertVariants(tx, id, normalizedVariants, dto.replaceVariants ?? false);
      return this.giftManagementRepository.findGiftByIdWithVariantsTx(tx, base.id);
    });
    const beforeRating = await this.ratingSummary(gift.providerId);
    const afterRating = updated.providerId === gift.providerId ? beforeRating : await this.ratingSummary(updated.providerId);
    const before = this.toGiftDetail(gift, beforeRating);
    const after = this.toGiftDetail(updated, afterRating);
    const auditReason = dto.reason?.trim();
    await this.audit(user, id, dto.status === undefined ? 'GIFT_UPDATED' : 'GIFT_STATUS_CHANGED', auditReason ? { ...before, reason: auditReason } : before, auditReason ? { ...after, reason: auditReason } : after);
    return { data: after, message: 'Gift updated successfully' };
  }

  async deleteGift(user: AuthUserContext, id: string) {
    const gift = await this.getGift(id);
    this.assertCanManageGift(user, gift);
    await this.giftManagementRepository.deleteGift(id);
    await this.audit(user, id, 'GIFT_DELETED', this.toGiftDetail(gift, await this.ratingSummary(gift.providerId)), null);
    return { data: null, message: 'Gift deleted successfully' };
  }

  async exportGifts(query: ExportGiftsDto) {
    const gifts = await this.giftManagementRepository.findGiftsForExport(this.giftWhere(query));
    const rows = [['ID', 'Name', 'Category', 'Provider', 'Price', 'Currency', 'Status'], ...gifts.map((gift) => [gift.id, gift.name, gift.category.name, this.providerName(gift.provider), gift.price.toString(), gift.currency, gift.status])];
    const csv = rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(',')).join('\n');
    return { filename: `gifts.${query.format === ExportFormat.XLSX ? 'xlsx' : 'csv'}`, contentType: query.format === ExportFormat.XLSX ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'text/csv; charset=utf-8', content: csv };
  }

  private flattenPermissions(permissions?: Prisma.JsonValue): Set<string> {
    const granted = new Set<string>();
    if (!permissions || typeof permissions !== 'object' || Array.isArray(permissions)) return granted;
    for (const [module, values] of Object.entries(permissions)) {
      if (!Array.isArray(values)) continue;
      for (const value of values) if (typeof value === 'string') granted.add(`${module}.${value}`);
    }
    return granted;
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

  private giftWhere(query: ListGiftsDto | ExportGiftsDto): Prisma.GiftWhereInput {
    return { categoryId: query.categoryId, providerId: query.providerId, ...(query.search ? { OR: [{ name: { contains: query.search, mode: 'insensitive' } }, { provider: { providerProfile: { is: { businessName: { contains: query.search, mode: 'insensitive' } } } } }] } : {}), ...this.statusWhere(query.status) };
  }
  private statusWhere(status?: GiftListStatus): Prisma.GiftWhereInput {
    if (!status || status === GiftListStatus.ALL) return {};
    return { status };
  }
  private categoryOrderBy(sortBy?: GiftCategorySortBy, sortOrder?: SortOrder): Prisma.GiftCategoryOrderByWithRelationInput { return { [sortBy === GiftCategorySortBy.NAME ? sortBy : 'createdAt']: this.dir(sortOrder) }; }
  private giftOrderBy(sortBy?: GiftSortBy, sortOrder?: SortOrder): Prisma.GiftOrderByWithRelationInput { const field = sortBy === GiftSortBy.NAME || sortBy === GiftSortBy.PRICE ? sortBy : sortBy === GiftSortBy.RATING ? 'ratingPlaceholder' : 'createdAt'; return { [field]: this.dir(sortOrder) }; }
  private dir(sortOrder?: SortOrder): Prisma.SortOrder { return sortOrder === SortOrder.ASC ? 'asc' : 'desc'; }
  private giftInclude() { return GIFT_MANAGEMENT_INCLUDE; }

  private normalizeVariants(variants?: GiftVariantDto[]): GiftVariantDto[] {
    if (!variants?.length) return [];
    return variants.map((variant) => ({ ...variant }));
  }
  private normalizeUpdateVariants(variants: UpdateGiftVariantDto[]): UpdateGiftVariantDto[] {
    for (const variant of variants) {
      if (!variant.id && (variant.name === undefined || variant.price === undefined)) {
        throw new BadRequestException('New variants must include name and price');
      }
    }
    return variants.map((variant) => ({ ...variant }));
  }
  private variantCreateData(variant: GiftVariantDto): Prisma.GiftVariantCreateWithoutGiftInput { return this.variantCreateDataFromUpdate(variant); }
  private variantCreateDataFromUpdate(variant: UpdateGiftVariantDto): Prisma.GiftVariantCreateWithoutGiftInput {
    if (variant.name === undefined || variant.price === undefined) throw new BadRequestException('New variants must include name and price');
    return { name: variant.name.trim(), price: new Prisma.Decimal(variant.price) };
  }
  private async notifyProvider(providerId: string, giftId: string, title: string, message: string, type: string): Promise<void> { await this.giftManagementRepository.createProviderNotification({ providerId, giftId, title, message, type }); }
  private variantUpdateData(variant: UpdateGiftVariantDto): Prisma.GiftVariantUpdateInput { return { name: variant.name?.trim(), price: variant.price === undefined ? undefined : new Prisma.Decimal(variant.price) }; }
  private async upsertVariants(tx: Prisma.TransactionClient, giftId: string, variants: UpdateGiftVariantDto[], replaceVariants: boolean): Promise<void> {
    const normalized = this.normalizeUpdateVariants(variants);
    const incomingIds = normalized.map((variant) => variant.id).filter((id): id is string => Boolean(id));
    if (replaceVariants) await this.giftManagementRepository.deleteVariantsForGift(tx, giftId, incomingIds);
    for (const variant of normalized) {
      if (variant.id) {
        const existing = await this.giftManagementRepository.findGiftVariantForGift(tx, giftId, variant.id);
        if (existing) {
          await this.giftManagementRepository.updateGiftVariant(tx, variant.id, this.variantUpdateData(variant));
          continue;
        }
        const variantById = await this.giftManagementRepository.findGiftVariantById(tx, variant.id);
        if (variantById && variantById.giftId !== giftId) throw new BadRequestException('Variant does not belong to gift');
        await this.giftManagementRepository.createGiftVariant(tx, { giftId, ...this.variantCreateDataFromUpdate(variant) });
      } else {
        await this.giftManagementRepository.createGiftVariant(tx, { giftId, ...this.variantCreateDataFromUpdate(variant) });
      }
    }
  }

  private toCategory(category: GiftCategory, totalGifts: number) { return { id: category.id, name: category.name, slug: category.slug, description: category.description, imageUrl: category.imageUrl, totalGifts, isActive: category.isActive, createdAt: category.createdAt, updatedAt: category.updatedAt }; }
  private toGiftListItem(gift: GiftWithRelations, ratingSummary: RatingSummary) { const imageUrls = this.stringArray(gift.imageUrls); return { id: gift.id, name: gift.name, category: gift.category, provider: { id: gift.provider.id, businessName: this.providerName(gift.provider) }, price: Number(gift.price), currency: gift.currency, rating: ratingSummary.rating, reviewCount: ratingSummary.reviewCount, status: gift.status, imageUrl: imageUrls[0] ?? null, imageUrls, createdAt: gift.createdAt }; }
  private toGiftDetail(gift: GiftWithRelations, ratingSummary: RatingSummary) { return { ...this.toGiftListItem(gift, ratingSummary), description: gift.description, isFeatured: gift.isFeatured, variants: (gift.variants ?? []).map((variant) => this.toVariant(variant)), updatedAt: gift.updatedAt }; }
  private toVariant(variant: GiftVariant) { return { id: variant.id, name: variant.name, price: Number(variant.price) }; }
  private providerName(provider: GiftWithRelations['provider']): string { return provider.providerProfile?.businessName ?? `${provider.firstName} ${provider.lastName}`.trim(); }
  private firstImage(gift: Gift): string | null { return this.stringArray(gift.imageUrls)[0] ?? null; }
  private stringArray(value: Prisma.JsonValue): string[] { return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []; }
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
  private assertGiftUpdatePermission(user: AuthUserContext, dto: UpdateGiftDto): void {
    if (user.role === UserRole.SUPER_ADMIN || user.role === UserRole.PROVIDER) return;
    const permissions = this.flattenPermissions(user.permissions);
    const statusChanged = dto.status !== undefined;
    const standardChanged = this.hasStandardGiftUpdateFields(dto);
    if (statusChanged && !permissions.has('gifts.status.update')) throw new ForbiddenException('Your role does not have the required permission');
    if (standardChanged && !permissions.has('gifts.update')) throw new ForbiddenException('Your role does not have the required permission');
    if (!statusChanged && !standardChanged && !permissions.has('gifts.update')) throw new ForbiddenException('Your role does not have the required permission');
  }
  private assertGiftCreatePermission(user: AuthUserContext): void {
    if (user.role === UserRole.SUPER_ADMIN || user.role === UserRole.PROVIDER) return;
    if (user.role !== UserRole.STAFF || !this.flattenPermissions(user.permissions).has('gifts.create')) {
      throw new ForbiddenException('Your role does not have the required permission');
    }
  }
  private hasStandardGiftUpdateFields(dto: UpdateGiftDto): boolean {
    return dto.name !== undefined || dto.description !== undefined || dto.categoryId !== undefined || dto.providerId !== undefined || dto.price !== undefined || dto.currency !== undefined || dto.imageUrls !== undefined || dto.isFeatured !== undefined || dto.replaceVariants !== undefined || dto.variants !== undefined;
  }
  private async uniqueCategorySlug(name: string, exceptId?: string): Promise<string> { return this.uniqueSlug(name, (slug) => this.giftManagementRepository.findGiftCategoryBySlug(slug, exceptId)); }
  private async uniqueGiftSlug(name: string, exceptId?: string): Promise<string> { return this.uniqueSlug(name, (slug) => this.giftManagementRepository.findGiftBySlug(slug, exceptId)); }
  private async uniqueSlug(name: string, exists: (slug: string) => Promise<unknown>): Promise<string> { const base = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'item'; let slug = base; let i = 1; while (await exists(slug)) slug = `${base}-${i++}`; return slug; }
  private async audit(actor: AuthUserContext, targetId: string, action: string, beforeJson: unknown, afterJson: unknown): Promise<void> {
    await this.auditLog.write({
      actorId: actor.uid,
      actorType: actor.role,
      targetId,
      targetType: action.startsWith('GIFT_CATEGORY') ? 'GIFT_CATEGORY' : 'GIFT',
      action,
      beforeJson,
      afterJson,
    });
  }
}
