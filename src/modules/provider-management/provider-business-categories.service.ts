import { BadRequestException, ConflictException, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { ProviderBusinessCategory, Prisma } from '@prisma/client';
import { AuthUserContext } from '../../common/decorators/current-user.decorator';
import { AuditLogWriterService } from '../../common/services/audit-log.service';
import { PrismaService } from '../../database/prisma.service';
import { CreateProviderBusinessCategoryDto, ListProviderBusinessCategoriesDto, UpdateProviderBusinessCategoryDto } from './dto/provider-business-categories.dto';

const DEFAULT_PROVIDER_BUSINESS_CATEGORIES = [
  { name: 'Logistics', slug: 'logistics' },
  { name: 'Gift Supplier', slug: 'gift-supplier' },
  { name: 'Florist', slug: 'florist' },
  { name: 'Experiences', slug: 'experiences' },
];

@Injectable()
export class ProviderBusinessCategoriesService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogWriterService,
  ) {}

  async onModuleInit(): Promise<void> {
    for (const category of DEFAULT_PROVIDER_BUSINESS_CATEGORIES) {
      await this.prisma.providerBusinessCategory.upsert({
        where: { slug: category.slug },
        create: category,
        update: { name: category.name, deletedAt: null },
      });
    }
  }

  async list(query: ListProviderBusinessCategoriesDto = {}) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 100;
    const where: Prisma.ProviderBusinessCategoryWhereInput = {
      deletedAt: null,
      ...(query.search ? { name: { contains: query.search, mode: 'insensitive' } } : {}),
      isActive: true,
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.providerBusinessCategory.findMany({
        where,
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.providerBusinessCategory.count({ where }),
    ]);

    return {
      data: items.map((category) => this.toCategory(category)),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
      message: 'Provider business categories fetched successfully',
    };
  }

  async details(id: string) {
    const category = await this.getCategory(id);
    return { data: this.toCategory(category), message: 'Provider business category fetched successfully' };
  }

  async create(user: AuthUserContext, dto: CreateProviderBusinessCategoryDto) {
    const slug = await this.uniqueSlug(dto.name);
    const category = await this.prisma.providerBusinessCategory.create({
      data: {
        name: dto.name.trim(),
        slug,
        description: dto.description?.trim(),
        iconKey: dto.iconKey?.trim(),
        sortOrder: dto.sortOrder ?? 0,
        isActive: dto.isActive ?? true,
      },
    });
    await this.audit(user.uid, category.id, 'PROVIDER_BUSINESS_CATEGORY_CREATED', undefined, this.toCategory(category));
    return { data: this.toCategory(category), message: 'Provider business category created successfully' };
  }

  async update(user: AuthUserContext, id: string, dto: UpdateProviderBusinessCategoryDto) {
    const category = await this.getCategory(id);
    if (dto.name) await this.ensureUniqueName(dto.name, id);
    const updated = await this.prisma.providerBusinessCategory.update({
      where: { id },
      data: {
        name: dto.name?.trim(),
        slug: dto.name ? await this.uniqueSlug(dto.name, id) : undefined,
        description: dto.description?.trim(),
        iconKey: dto.iconKey?.trim(),
        sortOrder: dto.sortOrder,
        isActive: dto.isActive,
      },
    });
    await this.audit(user.uid, id, 'PROVIDER_BUSINESS_CATEGORY_UPDATED', this.toCategory(category), this.toCategory(updated));
    return { data: this.toCategory(updated), message: 'Provider business category updated successfully' };
  }

  async delete(user: AuthUserContext, id: string) {
    const category = await this.getCategory(id);
    const activeProviders = await this.prisma.user.count({ where: { providerBusinessCategoryId: id, deletedAt: null, isActive: true } });
    if (activeProviders > 0) throw new BadRequestException('Category has active providers and cannot be deleted');
    await this.prisma.providerBusinessCategory.delete({ where: { id } });
    await this.audit(user.uid, id, 'PROVIDER_BUSINESS_CATEGORY_DELETED', this.toCategory(category), null);
    return { data: null, message: 'Provider business category deleted successfully' };
  }

  private async getCategory(id: string): Promise<ProviderBusinessCategory> {
    const category = await this.prisma.providerBusinessCategory.findFirst({ where: { id, deletedAt: null } });
    if (!category) throw new NotFoundException('Provider business category not found');
    return category;
  }

  private async ensureUniqueName(name: string, exceptId?: string): Promise<void> {
    const exists = await this.prisma.providerBusinessCategory.findFirst({ where: { name: name.trim(), id: exceptId ? { not: exceptId } : undefined, deletedAt: null } });
    if (exists) throw new ConflictException('Provider business category name already exists');
  }

  private async uniqueSlug(name: string, exceptId?: string): Promise<string> {
    await this.ensureUniqueName(name, exceptId);
    const base = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'category';
    let slug = base;
    let index = 1;
    while (await this.prisma.providerBusinessCategory.findFirst({ where: { slug, id: exceptId ? { not: exceptId } : undefined } })) slug = `${base}-${index++}`;
    return slug;
  }

  private toCategory(category: ProviderBusinessCategory) {
    return { id: category.id, name: category.name, slug: category.slug, description: category.description, iconKey: category.iconKey, sortOrder: category.sortOrder, isActive: category.isActive, createdAt: category.createdAt, updatedAt: category.updatedAt };
  }

  private async audit(actorId: string, targetId: string, action: string, beforeJson: unknown, afterJson: unknown): Promise<void> {
    await this.auditLog.write({ actorId, targetId, targetType: 'PROVIDER_BUSINESS_CATEGORY', action, beforeJson, afterJson });
  }
}
