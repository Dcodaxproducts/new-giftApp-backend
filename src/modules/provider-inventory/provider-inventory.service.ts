import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Gift, GiftModerationStatus, GiftStatus, Prisma } from '@prisma/client';
import { AuthUserContext } from '../../common/decorators/current-user.decorator';
import { AuditLogWriterService } from '../../common/services/audit-log.service';
import { PrismaService } from '../../database/prisma.service';
import { CreateProviderInventoryItemDto, ListProviderInventoryDto, ProviderInventorySortBy, ProviderInventoryStatusFilter, SortOrder, UpdateProviderAvailabilityDto, UpdateProviderInventoryItemDto } from './dto/provider-inventory.dto';

@Injectable()
export class ProviderInventoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogWriterService,
  ) {}

  async list(user: AuthUserContext, query: ListProviderInventoryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const where = this.where(user.uid, query);
    const [items, total] = await this.prisma.$transaction([
      this.prisma.gift.findMany({ where, include: this.include(), orderBy: this.orderBy(query.sortBy, query.sortOrder), skip: (page - 1) * limit, take: limit }),
      this.prisma.gift.count({ where }),
    ]);
    return { data: items.map((item) => this.toListItem(item)), meta: { page, limit, total, totalPages: Math.ceil(total / limit) }, message: 'Provider inventory fetched successfully' };
  }

  async stats(user: AuthUserContext) {
    const where = { providerId: user.uid, deletedAt: null };
    const [totalItems, activeItems, inactiveItems, outOfStockItems, pendingApprovalItems, rejectedItems] = await this.prisma.$transaction([
      this.prisma.gift.count({ where }),
      this.prisma.gift.count({ where: { ...where, status: GiftStatus.ACTIVE } }),
      this.prisma.gift.count({ where: { ...where, status: GiftStatus.INACTIVE } }),
      this.prisma.gift.count({ where: { ...where, OR: [{ status: GiftStatus.OUT_OF_STOCK }, { stockQuantity: 0 }] } }),
      this.prisma.gift.count({ where: { ...where, moderationStatus: GiftModerationStatus.PENDING } }),
      this.prisma.gift.count({ where: { ...where, moderationStatus: GiftModerationStatus.REJECTED } }),
    ]);
    return { data: { totalItems, activeItems, inactiveItems, outOfStockItems, pendingApprovalItems, rejectedItems }, message: 'Provider inventory stats fetched successfully' };
  }

  async lookup(user: AuthUserContext) {
    const items = await this.prisma.gift.findMany({
      where: { providerId: user.uid, deletedAt: null, status: GiftStatus.ACTIVE, moderationStatus: GiftModerationStatus.APPROVED },
      orderBy: { name: 'asc' },
      take: 500,
    });
    return {
      data: items.map((item) => ({ id: item.id, name: item.name, price: Number(item.price), currency: item.currency, imageUrl: this.firstImage(item.imageUrls), status: item.status, moderationStatus: item.moderationStatus })),
      message: 'Provider inventory lookup fetched successfully',
    };
  }

  async create(user: AuthUserContext, dto: CreateProviderInventoryItemDto) {
    await this.ensureCategory(dto.categoryId);
    await this.ensureUniqueSku(dto.sku);
    const status = this.toStatus(dto.isAvailable ?? true, dto.stockQuantity ?? 0);
    const gift = await this.prisma.gift.create({
      data: {
        name: dto.name.trim(),
        slug: await this.uniqueSlug(dto.name),
        description: dto.description?.trim(),
        shortDescription: dto.shortDescription?.trim(),
        categoryId: dto.categoryId,
        providerId: user.uid,
        price: new Prisma.Decimal(dto.price),
        currency: dto.currency ?? 'USD',
        stockQuantity: dto.stockQuantity ?? 0,
        sku: dto.sku?.trim(),
        imageUrls: dto.imageUrls ?? [],
        status,
        moderationStatus: GiftModerationStatus.PENDING,
        isPublished: false,
      },
      include: this.include(),
    });
    await this.audit(user.uid, gift.id, 'PROVIDER_INVENTORY_ITEM_CREATED', null, this.toDetailItem(gift));
    return { data: this.toDetailItem(gift), message: 'Inventory item created successfully' };
  }

  async details(user: AuthUserContext, id: string) {
    const item = await this.getOwnGift(user.uid, id);
    return { data: this.toDetailItem(item), message: 'Inventory item fetched successfully' };
  }

  async update(user: AuthUserContext, id: string, dto: UpdateProviderInventoryItemDto) {
    const item = await this.getOwnGift(user.uid, id);
    if (dto.categoryId) await this.ensureCategory(dto.categoryId);
    if (dto.sku) await this.ensureUniqueSku(dto.sku, id);
    const before = this.toDetailItem(item);
    const materialChange = this.isMaterialChange(item, dto);
    const stockQuantity = dto.stockQuantity ?? item.stockQuantity;
    const availability = dto.isAvailable ?? (item.status !== GiftStatus.INACTIVE);
    const updated = await this.prisma.gift.update({
      where: { id },
      data: {
        name: dto.name?.trim(),
        slug: dto.name ? await this.uniqueSlug(dto.name, id) : undefined,
        description: dto.description?.trim(),
        shortDescription: dto.shortDescription?.trim(),
        price: dto.price === undefined ? undefined : new Prisma.Decimal(dto.price),
        currency: dto.currency,
        stockQuantity: dto.stockQuantity,
        sku: dto.sku?.trim(),
        categoryId: dto.categoryId,
        imageUrls: dto.imageUrls,
        status: this.toStatus(availability, stockQuantity),
        moderationStatus: materialChange && item.moderationStatus === GiftModerationStatus.APPROVED ? GiftModerationStatus.PENDING : item.moderationStatus,
        isPublished: materialChange && item.moderationStatus === GiftModerationStatus.APPROVED ? false : item.isPublished,
      },
      include: this.include(),
    });
    await this.audit(user.uid, id, 'PROVIDER_INVENTORY_ITEM_UPDATED', before, this.toDetailItem(updated));
    if (materialChange && item.moderationStatus === GiftModerationStatus.APPROVED) {
      await this.audit(user.uid, id, 'PROVIDER_INVENTORY_ITEM_RESUBMITTED_FOR_MODERATION', { moderationStatus: item.moderationStatus }, { moderationStatus: updated.moderationStatus });
    }
    return { data: this.toDetailItem(updated), message: 'Inventory item updated successfully' };
  }

  async updateAvailability(user: AuthUserContext, id: string, dto: UpdateProviderAvailabilityDto) {
    const item = await this.getOwnGift(user.uid, id);
    const status = this.toStatus(dto.isAvailable, item.stockQuantity);
    const updated = await this.prisma.gift.update({ where: { id }, data: { status }, include: this.include() });
    await this.audit(user.uid, id, 'PROVIDER_INVENTORY_AVAILABILITY_CHANGED', { status: item.status }, { status: updated.status, isAvailable: dto.isAvailable });
    return { data: { id, status: updated.status, isAvailable: dto.isAvailable }, message: 'Inventory availability updated successfully' };
  }

  async delete(user: AuthUserContext, id: string) {
    const item = await this.getOwnGift(user.uid, id);
    await this.prisma.gift.update({ where: { id }, data: { deletedAt: new Date(), isPublished: false, status: GiftStatus.INACTIVE } });
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
        { sku: { contains: query.search, mode: 'insensitive' } },
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
      case ProviderInventoryStatusFilter.OUT_OF_STOCK:
        return { OR: [{ status: GiftStatus.OUT_OF_STOCK }, { stockQuantity: 0 }] };
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
    const field = sortBy === ProviderInventorySortBy.NAME || sortBy === ProviderInventorySortBy.PRICE || sortBy === ProviderInventorySortBy.STOCK_QUANTITY ? sortBy : 'createdAt';
    return { [field]: direction };
  }

  private include() {
    return { category: { select: { id: true, name: true } } } as const;
  }

  private async getOwnGift(providerId: string, id: string) {
    const item = await this.prisma.gift.findFirst({ where: { id, providerId, deletedAt: null }, include: this.include() });
    if (!item) throw new NotFoundException('Inventory item not found');
    return item;
  }

  private async ensureCategory(categoryId: string) {
    const category = await this.prisma.giftCategory.findFirst({ where: { id: categoryId, isActive: true, deletedAt: null } });
    if (!category) throw new BadRequestException('Gift category not found');
  }

  private async ensureUniqueSku(sku?: string, exceptId?: string) {
    if (!sku) return;
    const existing = await this.prisma.gift.findFirst({ where: { sku: sku.trim(), deletedAt: null, ...(exceptId ? { id: { not: exceptId } } : {}) } });
    if (existing) throw new BadRequestException('Inventory SKU already exists');
  }

  private async uniqueSlug(name: string, exceptId?: string) {
    const base = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'item';
    let slug = base;
    let index = 1;
    while (await this.prisma.gift.findFirst({ where: { slug, ...(exceptId ? { id: { not: exceptId } } : {}) } })) slug = `${base}-${index++}`;
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

  private toStatus(isAvailable: boolean, stockQuantity: number) {
    if (!isAvailable) return GiftStatus.INACTIVE;
    if (stockQuantity <= 0) return GiftStatus.OUT_OF_STOCK;
    return GiftStatus.ACTIVE;
  }

  private firstImage(value: Prisma.JsonValue) {
    return Array.isArray(value) ? value.find((entry): entry is string => typeof entry === 'string') ?? null : null;
  }

  private imageUrls(value: Prisma.JsonValue) {
    return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string') : [];
  }

  private toListItem(item: Gift & { category: { id: string; name: string } }) {
    return {
      id: item.id,
      name: item.name,
      description: item.shortDescription ?? item.description,
      imageUrl: this.firstImage(item.imageUrls),
      price: Number(item.price),
      currency: item.currency,
      stockQuantity: item.stockQuantity,
      sku: item.sku,
      category: item.category,
      status: item.status,
      moderationStatus: item.moderationStatus,
      isPublished: item.isPublished,
      createdAt: item.createdAt,
    };
  }

  private toDetailItem(item: Gift & { category: { id: string; name: string } }) {
    return {
      id: item.id,
      name: item.name,
      description: item.description,
      shortDescription: item.shortDescription,
      price: Number(item.price),
      currency: item.currency,
      stockQuantity: item.stockQuantity,
      sku: item.sku,
      category: item.category,
      imageUrls: this.imageUrls(item.imageUrls),
      status: item.status,
      moderationStatus: item.moderationStatus,
      isPublished: item.isPublished,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  private async audit(actorId: string, targetId: string, action: string, beforeJson: unknown, afterJson: unknown) {
    await this.auditLog.write({ actorId, targetId, targetType: 'GIFT', action, beforeJson, afterJson });
  }
}
