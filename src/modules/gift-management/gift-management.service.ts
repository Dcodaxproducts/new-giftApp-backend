import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Gift, GiftCategory, GiftModerationStatus, GiftStatus, Prisma, UserRole } from '@prisma/client';
import { AuthUserContext } from '../../common/decorators/current-user.decorator';
import { AuditLogWriterService } from '../../common/services/audit-log.service';
import { PrismaService } from '../../database/prisma.service';
import {
  ApproveGiftDto,
  CreateGiftCategoryDto,
  CreateGiftDto,
  ExportFormat,
  ExportGiftsDto,
  FlagGiftDto,
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
} from './dto/gift-management.dto';

type GiftWithRelations = Gift & {
  category: Pick<GiftCategory, 'id' | 'name'>;
  provider: { id: string; email: string; providerBusinessName: string | null; firstName: string; lastName: string };
};

@Injectable()
export class GiftManagementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogWriterService,
  ) {}

  async createCategory(user: AuthUserContext, dto: CreateGiftCategoryDto) {
    const category = await this.prisma.giftCategory.create({
      data: {
        name: dto.name.trim(),
        slug: await this.uniqueCategorySlug(dto.name),
        description: dto.description?.trim(),
        iconKey: dto.iconKey?.trim(),
        color: dto.color ?? dto.backgroundColor,
        backgroundColor: dto.backgroundColor ?? dto.color ?? '#F3E8FF',
        imageUrl: dto.imageUrl?.trim(),
        sortOrder: dto.sortOrder ?? 0,
        isActive: dto.isActive ?? true,
      },
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
    const [items, total] = await this.prisma.$transaction([
      this.prisma.giftCategory.findMany({
        where,
        include: { _count: { select: { gifts: { where: { deletedAt: null } } } } },
        orderBy: this.categoryOrderBy(query.sortBy, query.sortOrder),
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.giftCategory.count({ where }),
    ]);
    return {
      data: items.map((item) => this.toCategory(item, item._count.gifts)),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
      message: 'Gift categories fetched successfully',
    };
  }

  async categoryStats() {
    const [totalCategories, activeGiftItems] = await this.prisma.$transaction([
      this.prisma.giftCategory.count({ where: { deletedAt: null } }),
      this.prisma.gift.count({ where: { deletedAt: null, status: GiftStatus.ACTIVE } }),
    ]);
    return {
      data: {
        totalCategories,
        activeGiftItems,
        // TODO(PROD): replace placeholder mostPopularCategory with Order/Sales aggregates.
        mostPopularCategory: 'Digital',
      },
      message: 'Gift category stats fetched successfully',
    };
  }

  async categoryDetails(id: string) {
    const category = await this.getCategory(id);
    const totalGifts = await this.prisma.gift.count({ where: { categoryId: id, deletedAt: null } });
    return { data: this.toCategory(category, totalGifts), message: 'Gift category details fetched successfully' };
  }

  async updateCategory(user: AuthUserContext, id: string, dto: UpdateGiftCategoryDto) {
    const category = await this.getCategory(id);
    const before = this.toCategory(category, await this.prisma.gift.count({ where: { categoryId: id, deletedAt: null } }));
    const updated = await this.prisma.giftCategory.update({
      where: { id },
      data: {
        name: dto.name?.trim(),
        slug: dto.name ? await this.uniqueCategorySlug(dto.name, id) : undefined,
        description: dto.description?.trim(),
        iconKey: dto.iconKey?.trim(),
        color: dto.color,
        backgroundColor: dto.backgroundColor ?? dto.color,
        imageUrl: dto.imageUrl?.trim(),
        sortOrder: dto.sortOrder,
        isActive: dto.isActive,
      },
    });
    await this.audit(user.uid, id, 'GIFT_CATEGORY_UPDATED', before, this.toCategory(updated, before.totalGifts));
    return { data: this.toCategory(updated, before.totalGifts), message: 'Gift category updated successfully' };
  }

  async deleteCategory(user: AuthUserContext, id: string) {
    const category = await this.getCategory(id);
    const gifts = await this.prisma.gift.count({ where: { categoryId: id, deletedAt: null } });
    if (gifts > 0) throw new BadRequestException('Category has attached gifts and cannot be deleted');
    const deleted = await this.prisma.giftCategory.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });
    await this.audit(user.uid, id, 'GIFT_CATEGORY_DELETED', this.toCategory(category, 0), this.toCategory(deleted, 0));
    return { data: null, message: 'Gift category deleted successfully' };
  }

  async createGift(user: AuthUserContext, dto: CreateGiftDto) {
    const providerId = user.role === UserRole.PROVIDER ? user.uid : dto.providerId;
    await this.assertCategory(dto.categoryId);
    await this.assertProvider(providerId);
    await this.assertUniqueSku(dto.sku);
    const moderationStatus = user.role === UserRole.SUPER_ADMIN && dto.isPublished
      ? (dto.moderationStatus ?? GiftModerationStatus.APPROVED)
      : GiftModerationStatus.PENDING;
    const status = this.statusFromStock(dto.stockQuantity ?? 0, dto.isPublished ?? false, moderationStatus);
    const gift = await this.prisma.gift.create({
      data: {
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
        isPublished: dto.isPublished ?? false,
        isFeatured: dto.isFeatured ?? false,
        tags: dto.tags ?? [],
        moderationStatus,
        status,
        approvedAt: moderationStatus === GiftModerationStatus.APPROVED ? new Date() : null,
        approvedBy: moderationStatus === GiftModerationStatus.APPROVED ? user.uid : null,
      },
      include: this.giftInclude(),
    });
    await this.audit(user.uid, gift.id, 'GIFT_CREATED', undefined, this.toGiftDetail(gift));
    return { data: this.toGiftDetail(gift), message: 'Gift created successfully' };
  }

  async listGifts(query: ListGiftsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const where = this.giftWhere(query);
    const [items, total] = await this.prisma.$transaction([
      this.prisma.gift.findMany({ where, include: this.giftInclude(), orderBy: this.giftOrderBy(query.sortBy, query.sortOrder), skip: (page - 1) * limit, take: limit }),
      this.prisma.gift.count({ where }),
    ]);
    return { data: items.map((gift) => this.toGiftListItem(gift)), meta: { page, limit, total, totalPages: Math.ceil(total / limit) }, message: 'Gifts fetched successfully' };
  }

  async giftStats() {
    const [totalGifts, activeListings, pendingApproval] = await this.prisma.$transaction([
      this.prisma.gift.count({ where: { deletedAt: null } }),
      this.prisma.gift.count({ where: { deletedAt: null, status: GiftStatus.ACTIVE } }),
      this.prisma.gift.count({ where: { deletedAt: null, moderationStatus: GiftModerationStatus.PENDING } }),
    ]);
    return {
      data: { totalGifts, totalGiftsChangePercent: 0, activeListings, activeListingsChangePercent: 0, pendingApproval, pendingApprovalChangePercent: 0 },
      message: 'Gift inventory stats fetched successfully',
    };
  }

  async giftDetails(id: string) {
    const gift = await this.getGift(id);
    return { data: this.toGiftDetail(gift), message: 'Gift details fetched successfully' };
  }

  async updateGift(user: AuthUserContext, id: string, dto: UpdateGiftDto) {
    const gift = await this.getGift(id);
    this.assertCanManageGift(user, gift);
    if (dto.categoryId) await this.assertCategory(dto.categoryId);
    if (dto.providerId) await this.assertProvider(dto.providerId);
    if (dto.sku) await this.assertUniqueSku(dto.sku, id);
    const providerId = user.role === UserRole.PROVIDER ? gift.providerId : dto.providerId;
    const nextModeration = user.role === UserRole.PROVIDER && gift.moderationStatus === GiftModerationStatus.APPROVED
      ? GiftModerationStatus.PENDING
      : gift.moderationStatus;
    const updated = await this.prisma.gift.update({
      where: { id },
      data: {
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
        status: dto.stockQuantity === 0 ? GiftStatus.OUT_OF_STOCK : undefined,
      },
      include: this.giftInclude(),
    });
    await this.audit(user.uid, id, 'GIFT_UPDATED', this.toGiftDetail(gift), this.toGiftDetail(updated));
    return { data: this.toGiftDetail(updated), message: 'Gift updated successfully' };
  }

  async updateGiftStatus(user: AuthUserContext, id: string, dto: UpdateGiftStatusDto) {
    const gift = await this.getGift(id);
    this.assertCanManageGift(user, gift);
    const updated = await this.prisma.gift.update({ where: { id }, data: { status: dto.status, isPublished: dto.status === GiftStatus.ACTIVE ? true : gift.isPublished }, include: this.giftInclude() });
    await this.audit(user.uid, id, 'GIFT_STATUS_CHANGED', { status: gift.status, reason: dto.reason }, { status: updated.status, reason: dto.reason });
    return { data: this.toGiftDetail(updated), message: 'Gift status updated successfully' };
  }

  async deleteGift(user: AuthUserContext, id: string) {
    const gift = await this.getGift(id);
    this.assertCanManageGift(user, gift);
    const deleted = await this.prisma.gift.update({ where: { id }, data: { deletedAt: new Date(), isPublished: false, status: GiftStatus.INACTIVE }, include: this.giftInclude() });
    await this.audit(user.uid, id, 'GIFT_DELETED', this.toGiftDetail(gift), this.toGiftDetail(deleted));
    return { data: null, message: 'Gift deleted successfully' };
  }

  async exportGifts(query: ExportGiftsDto) {
    const gifts = await this.prisma.gift.findMany({ where: this.giftWhere(query), include: this.giftInclude(), orderBy: { createdAt: 'desc' }, take: 10000 });
    const rows = [['ID', 'Name', 'SKU', 'Category', 'Provider', 'Price', 'Currency', 'Status', 'Moderation', 'Published'], ...gifts.map((gift) => [gift.id, gift.name, gift.sku ?? '', gift.category.name, this.providerName(gift.provider), gift.price.toString(), gift.currency, gift.status, gift.moderationStatus, String(gift.isPublished)])];
    const csv = rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(',')).join('\n');
    return { filename: `gifts.${query.format === ExportFormat.XLSX ? 'xlsx' : 'csv'}`, contentType: query.format === ExportFormat.XLSX ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'text/csv; charset=utf-8', content: csv };
  }

  async moderationQueue(query: ListGiftModerationDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const where: Prisma.GiftWhereInput = { deletedAt: null, moderationStatus: query.status, providerId: query.providerId, ...(query.search ? { name: { contains: query.search, mode: 'insensitive' } } : {}) };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.gift.findMany({ where, include: this.giftInclude(), orderBy: query.sortBy === ModerationSortBy.NAME ? { name: this.dir(query.sortOrder) } : { createdAt: this.dir(query.sortOrder) }, skip: (page - 1) * limit, take: limit }),
      this.prisma.gift.count({ where }),
    ]);
    return { data: items.map((gift) => ({ id: gift.id, name: gift.name, provider: { id: gift.provider.id, businessName: this.providerName(gift.provider) }, imageUrl: this.firstImage(gift), submittedAt: gift.createdAt, moderationStatus: gift.moderationStatus, status: gift.moderationStatus })), meta: { page, limit, total, totalPages: Math.ceil(total / limit) }, message: 'Gift moderation queue fetched successfully' };
  }

  async approveGift(user: AuthUserContext, id: string, dto: ApproveGiftDto) {
    const gift = await this.getGift(id);
    const updated = await this.prisma.gift.update({ where: { id }, data: { moderationStatus: GiftModerationStatus.APPROVED, status: dto.publishNow ? GiftStatus.ACTIVE : gift.status, isPublished: dto.publishNow ?? gift.isPublished, approvedAt: new Date(), approvedBy: user.uid, rejectedAt: null, rejectedBy: null, rejectionReason: null, rejectionComment: null }, include: this.giftInclude() });
    const data = { id, moderationStatus: updated.moderationStatus, status: updated.status, isPublished: updated.isPublished, approvedAt: updated.approvedAt, approvedBy: updated.approvedBy };
    await this.audit(user.uid, id, 'GIFT_APPROVED', this.toGiftDetail(gift), data);
    return { data, message: 'Gift approved successfully' };
  }

  async rejectGift(user: AuthUserContext, id: string, dto: RejectGiftDto) {
    const gift = await this.getGift(id);
    const updated = await this.prisma.gift.update({ where: { id }, data: { moderationStatus: GiftModerationStatus.REJECTED, isPublished: false, status: GiftStatus.INACTIVE, rejectedAt: new Date(), rejectedBy: user.uid, rejectionReason: dto.reason, rejectionComment: dto.comment?.trim() }, include: this.giftInclude() });
    const data = { id, moderationStatus: updated.moderationStatus, status: updated.status, rejectedAt: updated.rejectedAt, rejectedBy: updated.rejectedBy, rejectionReason: updated.rejectionReason, rejectionComment: updated.rejectionComment };
    await this.audit(user.uid, id, 'GIFT_REJECTED', this.toGiftDetail(gift), data);
    return { data, message: 'Gift rejected successfully' };
  }

  async flagGift(user: AuthUserContext, id: string, dto: FlagGiftDto) {
    const gift = await this.getGift(id);
    const updated = await this.prisma.gift.update({ where: { id }, data: { moderationStatus: GiftModerationStatus.FLAGGED, flaggedAt: new Date(), flaggedBy: user.uid, flagReason: dto.reason, flagComment: dto.comment?.trim() }, include: this.giftInclude() });
    const data = { id, moderationStatus: updated.moderationStatus, status: updated.status, flaggedAt: updated.flaggedAt, flaggedBy: updated.flaggedBy, flagReason: updated.flagReason, flagComment: updated.flagComment };
    await this.audit(user.uid, id, 'GIFT_FLAGGED', this.toGiftDetail(gift), data);
    return { data, message: 'Gift flagged successfully' };
  }

  private async getCategory(id: string): Promise<GiftCategory> {
    const category = await this.prisma.giftCategory.findFirst({ where: { id, deletedAt: null } });
    if (!category) throw new NotFoundException('Gift category not found');
    return category;
  }

  private async getGift(id: string): Promise<GiftWithRelations> {
    const gift = await this.prisma.gift.findFirst({ where: { id, deletedAt: null }, include: this.giftInclude() });
    if (!gift) throw new NotFoundException('Gift not found');
    return gift;
  }

  private async assertCategory(id: string) { await this.getCategory(id); }
  private async assertProvider(id: string) {
    const provider = await this.prisma.user.findFirst({ where: { id, role: UserRole.PROVIDER, deletedAt: null } });
    if (!provider) throw new BadRequestException('Provider must exist and have PROVIDER role');
  }
  private async assertUniqueSku(sku?: string, exceptGiftId?: string) {
    if (!sku) return;
    const existing = await this.prisma.gift.findFirst({ where: { sku: sku.trim(), id: exceptGiftId ? { not: exceptGiftId } : undefined, deletedAt: null } });
    if (existing) throw new BadRequestException('Gift SKU already exists');
  }

  private giftWhere(query: ListGiftsDto | ExportGiftsDto): Prisma.GiftWhereInput {
    return { deletedAt: null, categoryId: query.categoryId, providerId: query.providerId, isPublished: query.isPublished, ...(query.search ? { OR: [{ name: { contains: query.search, mode: 'insensitive' } }, { sku: { contains: query.search, mode: 'insensitive' } }, { provider: { providerBusinessName: { contains: query.search, mode: 'insensitive' } } }] } : {}), ...this.statusWhere(query.status), ...(query.moderationStatus && query.moderationStatus !== GiftModerationFilter.ALL ? { moderationStatus: query.moderationStatus } : {}) };
  }
  private statusWhere(status?: GiftListStatus): Prisma.GiftWhereInput {
    if (!status || status === GiftListStatus.ALL) return {};
    if (status === GiftListStatus.PENDING || status === GiftListStatus.REJECTED || status === GiftListStatus.FLAGGED) return { moderationStatus: status };
    return { status };
  }
  private categoryOrderBy(sortBy?: GiftCategorySortBy, sortOrder?: SortOrder): Prisma.GiftCategoryOrderByWithRelationInput { return { [sortBy === GiftCategorySortBy.NAME || sortBy === GiftCategorySortBy.SORT_ORDER ? sortBy : 'createdAt']: this.dir(sortOrder) }; }
  private giftOrderBy(sortBy?: GiftSortBy, sortOrder?: SortOrder): Prisma.GiftOrderByWithRelationInput { const field = sortBy === GiftSortBy.NAME || sortBy === GiftSortBy.PRICE || sortBy === GiftSortBy.STOCK_QUANTITY ? sortBy : sortBy === GiftSortBy.RATING ? 'ratingPlaceholder' : 'createdAt'; return { [field]: this.dir(sortOrder) }; }
  private dir(sortOrder?: SortOrder): Prisma.SortOrder { return sortOrder === SortOrder.ASC ? 'asc' : 'desc'; }
  private giftInclude() { return { category: { select: { id: true, name: true } }, provider: { select: { id: true, email: true, providerBusinessName: true, firstName: true, lastName: true } } } as const; }

  private toCategory(category: GiftCategory, totalGifts: number) { const backgroundColor = category.backgroundColor ?? category.color ?? '#F3E8FF'; return { id: category.id, name: category.name, slug: category.slug, description: category.description, iconKey: category.iconKey, color: category.color ?? backgroundColor, backgroundColor, imageUrl: category.imageUrl, totalGifts, isActive: category.isActive, sortOrder: category.sortOrder, createdAt: category.createdAt, updatedAt: category.updatedAt }; }
  private toGiftListItem(gift: GiftWithRelations) { return { id: gift.id, name: gift.name, shortDescription: gift.shortDescription, category: gift.category, provider: { id: gift.provider.id, businessName: this.providerName(gift.provider) }, price: Number(gift.price), currency: gift.currency, rating: Number(gift.ratingPlaceholder), status: gift.status, moderationStatus: gift.moderationStatus, isPublished: gift.isPublished, stockQuantity: gift.stockQuantity, sku: gift.sku, imageUrl: this.firstImage(gift), createdAt: gift.createdAt }; }
  private toGiftDetail(gift: GiftWithRelations) { return { ...this.toGiftListItem(gift), description: gift.description, imageUrls: this.stringArray(gift.imageUrls), isFeatured: gift.isFeatured, tags: this.stringArray(gift.tags), updatedAt: gift.updatedAt }; }
  private providerName(provider: GiftWithRelations['provider']): string { return provider.providerBusinessName ?? `${provider.firstName} ${provider.lastName}`.trim(); }
  private firstImage(gift: Gift): string | null { return this.stringArray(gift.imageUrls)[0] ?? null; }
  private stringArray(value: Prisma.JsonValue): string[] { return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []; }
  private statusFromStock(stockQuantity: number, isPublished: boolean, moderationStatus: GiftModerationStatus): GiftStatus { if (stockQuantity === 0) return GiftStatus.OUT_OF_STOCK; return isPublished && moderationStatus === GiftModerationStatus.APPROVED ? GiftStatus.ACTIVE : GiftStatus.INACTIVE; }
  private assertCanManageGift(user: AuthUserContext, gift: Gift): void { if (user.role === UserRole.PROVIDER && gift.providerId !== user.uid) throw new ForbiddenException('Provider cannot manage another provider gift'); }
  private async uniqueCategorySlug(name: string, exceptId?: string): Promise<string> { return this.uniqueSlug(name, (slug) => this.prisma.giftCategory.findFirst({ where: { slug, id: exceptId ? { not: exceptId } : undefined } })); }
  private async uniqueGiftSlug(name: string, exceptId?: string): Promise<string> { return this.uniqueSlug(name, (slug) => this.prisma.gift.findFirst({ where: { slug, id: exceptId ? { not: exceptId } : undefined } })); }
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
