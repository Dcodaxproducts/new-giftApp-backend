import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Gift, GiftModerationStatus, GiftStatus, GiftVariant, Prisma } from '@prisma/client';
import { AuthUserContext } from '../../../common/decorators/current-user.decorator';
import { AuditLogWriterService } from '../../../common/services/audit-log.service';
import { PROVIDER_INVENTORY_INCLUDE, ProviderInventoryRepository } from '../repositories/provider-inventory.repository';
import { CreateProviderInventoryItemDto, ListProviderInventoryDto, ProviderInventoryManualStatus, ProviderInventorySortBy, ProviderInventoryStatusFilter, ProviderInventoryVariantDto, SortOrder, UpdateProviderInventoryItemDto } from '../dto/provider-inventory.dto';

type ProviderGift = Prisma.GiftGetPayload<{ include: typeof PROVIDER_INVENTORY_INCLUDE }>;

@Injectable()
export class ProviderInventoryService {
  constructor(
    private readonly repository: ProviderInventoryRepository,
    private readonly auditLog: AuditLogWriterService,
  ) {}

  async list(user: AuthUserContext, query: ListProviderInventoryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const where = this.where(user.uid, query);
    const [items, total] = await this.repository.findManyForProviderList({ where, orderBy: this.orderBy(query.sortBy, query.sortOrder), skip: (page - 1) * limit, take: limit });
    return { data: items.map((item) => this.toListItem(item)), meta: { page, limit, total, totalPages: Math.ceil(total / limit) }, message: 'Provider inventory fetched successfully' };
  }

  async stats(user: AuthUserContext) {
    const [totalItems, activeItems, inactiveItems, pendingApprovalItems, rejectedItems] = await this.repository.findStatsForProvider(user.uid);
    return { data: { totalItems, activeItems, inactiveItems, pendingApprovalItems, rejectedItems }, message: 'Provider inventory stats fetched successfully' };
  }

  async lookup(user: AuthUserContext) {
    const items = await this.repository.findLookupItemsForProvider(user.uid);
    return {
      data: items.map((item) => ({ id: item.id, name: item.name, price: Number(item.price), currency: item.currency, imageUrl: this.firstImage(item.imageUrls), status: item.status, moderationStatus: item.moderationStatus })),
      message: 'Provider inventory lookup fetched successfully',
    };
  }

  async create(user: AuthUserContext, dto: CreateProviderInventoryItemDto) {
    await this.ensureCategory(dto.categoryId);
    const variants = this.normalizeVariants(dto.variants);
    const gift = await this.repository.createItemWithVariants({
      name: dto.name.trim(),
      slug: await this.uniqueSlug(dto.name),
      description: dto.description?.trim(),
      shortDescription: dto.shortDescription?.trim(),
      categoryId: dto.categoryId,
      providerId: user.uid,
      price: new Prisma.Decimal(dto.price),
      currency: dto.currency ?? 'USD',
      imageUrls: dto.imageUrls ?? [],
      status: GiftStatus.ACTIVE,
      moderationStatus: GiftModerationStatus.NOT_REQUIRED,
      isPublished: true,
      variants: variants.length ? { create: variants.map((variant) => this.variantCreateData(variant)) } : undefined,
    });
    await this.audit(user.uid, gift.id, 'PROVIDER_INVENTORY_ITEM_CREATED', null, this.toDetailItem(gift));
    return { data: this.toDetailItem(gift), message: 'Inventory item created successfully' };
  }

  async details(user: AuthUserContext, id: string) {
    const item = await this.getOwnGiftForRead(user.uid, id);
    return { data: this.toDetailItem(item), message: 'Inventory item fetched successfully' };
  }

  async update(user: AuthUserContext, id: string, dto: UpdateProviderInventoryItemDto) {
    const item = await this.getOwnGift(user.uid, id);
    if (dto.categoryId) await this.ensureCategory(dto.categoryId);
    this.assertSingleDefaultVariant(dto.variants);
    const before = this.toDetailItem(item);
    const materialChange = this.isMaterialChange(item, dto) || this.hasMaterialVariantChange(dto.variants);
    const normalizedVariants = dto.variants ? this.normalizeVariants(dto.variants) : undefined;
    if (normalizedVariants) await this.assertVariantOwnership(id, normalizedVariants);
    const incomingIds = normalizedVariants?.map((variant) => variant.id).filter((variantId): variantId is string => Boolean(variantId)) ?? [];
    const status = this.nextStatus(item, dto);
    const updated = await this.repository.updateItemWithVariants({
      id,
      data: {
        name: dto.name?.trim(),
        slug: dto.name ? await this.uniqueSlug(dto.name, id) : undefined,
        description: dto.description?.trim(),
        shortDescription: dto.shortDescription?.trim(),
        price: dto.price === undefined ? undefined : new Prisma.Decimal(dto.price),
        currency: dto.currency,
        categoryId: dto.categoryId,
        imageUrls: dto.imageUrls,
        status,
        moderationStatus: item.moderationStatus,
        isPublished: item.isPublished,
      },
      variants: normalizedVariants?.map((variant) => ({ id: variant.id, createData: this.variantCreateData(variant), updateData: this.variantUpdateData(variant) })),
      replaceVariants: dto.replaceVariants ?? false,
      incomingIds,
      clearDefault: Boolean(normalizedVariants?.some((variant) => variant.isDefault)),
    });
    await this.audit(user.uid, id, 'PROVIDER_INVENTORY_ITEM_UPDATED', before, this.toDetailItem(updated));
    if (materialChange) {
      await this.audit(user.uid, id, 'PROVIDER_INVENTORY_ITEM_MATERIAL_UPDATED', before, this.toDetailItem(updated));
    }
    return { data: this.toDetailItem(updated), message: 'Inventory item updated successfully' };
  }

  async delete(user: AuthUserContext, id: string) {
    const item = await this.getOwnGift(user.uid, id);
    await this.repository.deleteItem(id);
    await this.audit(user.uid, id, 'PROVIDER_INVENTORY_ITEM_DELETED', this.toDetailItem(item), null);
    return { data: null, message: 'Inventory item deleted successfully' };
  }

  private where(providerId: string, query: ListProviderInventoryDto): Prisma.GiftWhereInput {
    return {
      providerId,
      deletedAt: null,
      categoryId: query.categoryId,
      ...(query.search ? { OR: [
        { name: { contains: query.search, mode: 'insensitive' } },
        { category: { name: { contains: query.search, mode: 'insensitive' } } },
      ] } : {}),
      ...this.statusFilter(query.status),
    };
  }

  private statusFilter(status?: ProviderInventoryStatusFilter): Prisma.GiftWhereInput {
    switch (status) {
      case ProviderInventoryStatusFilter.ACTIVE:
        return { status: GiftStatus.ACTIVE };
      case ProviderInventoryStatusFilter.INACTIVE:
        return { status: GiftStatus.INACTIVE };
      case ProviderInventoryStatusFilter.PENDING:
        return { moderationStatus: GiftModerationStatus.PENDING };
      case ProviderInventoryStatusFilter.REJECTED:
        return { moderationStatus: GiftModerationStatus.REJECTED };
      default:
        return {};
    }
  }

  private orderBy(sortBy?: ProviderInventorySortBy, sortOrder?: SortOrder): Prisma.GiftOrderByWithRelationInput {
    const direction = sortOrder === SortOrder.ASC ? 'asc' : 'desc';
    const field = sortBy === ProviderInventorySortBy.NAME || sortBy === ProviderInventorySortBy.PRICE ? sortBy : 'createdAt';
    return { [field]: direction };
  }

  private async getOwnGiftForRead(providerId: string, id: string) {
    const item = await this.repository.findOwnedItemById(providerId, id);
    if (!item) throw new NotFoundException('Inventory item not found');
    return item;
  }

  private async getOwnGift(providerId: string, id: string) {
    const item = await this.repository.findOwnedItemById(providerId, id);
    if (!item) throw new NotFoundException('Inventory item not found');
    return item;
  }

  private async ensureCategory(categoryId: string) {
    const category = await this.repository.findActiveCategory(categoryId);
    if (!category) throw new BadRequestException('Gift category not found');
  }

  private async uniqueSlug(name: string, exceptId?: string) {
    const base = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'item';
    let slug = base;
    let index = 1;
    while (await this.repository.findBySlug(slug, exceptId)) slug = `${base}-${index++}`;
    return slug;
  }

  private isMaterialChange(item: Gift, dto: UpdateProviderInventoryItemDto) {
    return (
      (dto.name !== undefined && dto.name.trim() !== item.name) ||
      (dto.description !== undefined && dto.description !== item.description) ||
      (dto.shortDescription !== undefined && dto.shortDescription !== item.shortDescription) ||
      (dto.categoryId !== undefined && dto.categoryId !== item.categoryId) ||
      (dto.price !== undefined && Number(item.price) !== dto.price) ||
      (dto.imageUrls !== undefined)
    );
  }

  private nextStatus(item: Gift, dto: UpdateProviderInventoryItemDto): GiftStatus | undefined {
    if (dto.status === ProviderInventoryManualStatus.ACTIVE) return GiftStatus.ACTIVE;
    if (dto.status === ProviderInventoryManualStatus.INACTIVE) return GiftStatus.INACTIVE;
    if (dto.isAvailable === true) return GiftStatus.ACTIVE;
    if (dto.isAvailable === false) return GiftStatus.INACTIVE;
    return item.status;
  }

  private firstImage(value: Prisma.JsonValue) {
    return Array.isArray(value) ? value.find((entry): entry is string => typeof entry === 'string') ?? null : null;
  }

  private imageUrls(value: Prisma.JsonValue) {
    return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string') : [];
  }

  private toListItem(item: ProviderGift) {
    return {
      id: item.id,
      name: item.name,
      description: item.shortDescription ?? item.description,
      imageUrl: this.firstImage(item.imageUrls),
      price: Number(item.price),
      currency: item.currency,
      category: item.category,
      status: item.status,
      isAvailable: item.status === GiftStatus.ACTIVE,
      moderationStatus: item.moderationStatus,
      isPublished: item.isPublished,
      createdAt: item.createdAt,
    };
  }

  private toDetailItem(item: ProviderGift) {
    return {
      id: item.id,
      name: item.name,
      description: item.description,
      shortDescription: item.shortDescription,
      price: Number(item.price),
      currency: item.currency,
      category: item.category,
      imageUrls: this.imageUrls(item.imageUrls),
      status: item.status,
      isAvailable: item.status === GiftStatus.ACTIVE,
      moderationStatus: item.moderationStatus,
      isPublished: item.isPublished,
      variants: item.variants.map((variant) => this.toVariant(variant)),
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  private normalizeVariants(variants?: ProviderInventoryVariantDto[]): ProviderInventoryVariantDto[] { if (!variants?.length) return []; this.assertSingleDefaultVariant(variants); const normalized = variants.map((variant) => ({ ...variant })); if (!normalized.some((variant) => variant.isDefault)) normalized[0].isDefault = true; return normalized; }
  private assertSingleDefaultVariant(variants?: ProviderInventoryVariantDto[]): void { if ((variants ?? []).filter((variant) => variant.isDefault).length > 1) throw new BadRequestException('Only one default variant is allowed'); }
  private variantCreateData(variant: ProviderInventoryVariantDto): Prisma.GiftVariantCreateWithoutGiftInput { return { name: variant.name.trim(), price: new Prisma.Decimal(variant.price), originalPrice: variant.originalPrice === undefined ? undefined : new Prisma.Decimal(variant.originalPrice), isPopular: variant.isPopular ?? false, isDefault: variant.isDefault ?? false, sortOrder: variant.sortOrder ?? 0, isActive: variant.isActive ?? true }; }
  private variantUpdateData(variant: ProviderInventoryVariantDto): Prisma.GiftVariantUpdateInput { return { name: variant.name?.trim(), price: variant.price === undefined ? undefined : new Prisma.Decimal(variant.price), originalPrice: variant.originalPrice === undefined ? undefined : new Prisma.Decimal(variant.originalPrice), isPopular: variant.isPopular, isDefault: variant.isDefault, sortOrder: variant.sortOrder, isActive: variant.isActive }; }
  private async assertVariantOwnership(giftId: string, variants: ProviderInventoryVariantDto[]): Promise<void> { const ids = variants.map((variant) => variant.id).filter((variantId): variantId is string => Boolean(variantId)); if (!ids.length) return; const existing = await this.repository.findVariantsByIdsForItem(giftId, ids); if (existing.length !== ids.length) throw new BadRequestException('Variant does not belong to inventory item'); }
  private hasMaterialVariantChange(variants?: ProviderInventoryVariantDto[]): boolean { return (variants ?? []).some((variant) => variant.name !== undefined || variant.price !== undefined || variant.originalPrice !== undefined); }
  private toVariant(variant: GiftVariant) { return { id: variant.id, name: variant.name, price: Number(variant.price), originalPrice: variant.originalPrice === null ? null : Number(variant.originalPrice), isPopular: variant.isPopular, isDefault: variant.isDefault, sortOrder: variant.sortOrder, isActive: variant.isActive }; }

  private async audit(actorId: string, targetId: string, action: string, beforeJson: unknown, afterJson: unknown) {
    await this.auditLog.write({ actorId, targetId, targetType: 'GIFT', action, beforeJson, afterJson });
  }
}
