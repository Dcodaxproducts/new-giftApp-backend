import { ConflictException, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
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
        update: { name: category.name },
      });
    }
  }

  async list(query: ListProviderBusinessCategoriesDto = {}) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 100;
    const where = {
      ...(query.search
        ? { name: { contains: query.search, mode: 'insensitive' as const } }
        : {}),
      ...(query.isActive === undefined ? {} : { isActive: query.isActive }),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.providerBusinessCategory.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.providerBusinessCategory.count({ where }),
    ]);

    return {
      data: items.map((category) => this.toItem(category)),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
      message: 'Provider business categories fetched successfully',
    };
  }

  async details(id: string) {
    const category = await this.getCategory(id);
    return {
      data: this.toItem(category),
      message: 'Provider business category fetched successfully',
    };
  }

  async create(user: AuthUserContext, dto: CreateProviderBusinessCategoryDto) {
    await this.assertUniqueName(dto.name);
    const category = await this.prisma.providerBusinessCategory.create({
      data: {
        name: dto.name.trim(),
        slug: this.slugify(dto.name),
        description: dto.description?.trim(),
        isActive: dto.isActive ?? true,
      },
    });
    await this.auditLog.write({
      actorId: user.uid,
      targetId: category.id,
      targetType: 'PROVIDER_BUSINESS_CATEGORY',
      action: 'PROVIDER_BUSINESS_CATEGORY_CREATED',
      afterJson: this.toItem(category),
    });
    return {
      data: this.toItem(category),
      message: 'Provider business category created successfully',
    };
  }

  async update(user: AuthUserContext, id: string, dto: UpdateProviderBusinessCategoryDto) {
    const category = await this.getCategory(id);
    if (dto.name && dto.name.trim().toLowerCase() !== category.name.toLowerCase()) {
      await this.assertUniqueName(dto.name, id);
    }
    const updated = await this.prisma.providerBusinessCategory.update({
      where: { id },
      data: {
        name: dto.name?.trim(),
        slug: dto.name ? this.slugify(dto.name) : undefined,
        description: dto.description?.trim(),
        isActive: dto.isActive,
      },
    });
    await this.auditLog.write({
      actorId: user.uid,
      targetId: id,
      targetType: 'PROVIDER_BUSINESS_CATEGORY',
      action: 'PROVIDER_BUSINESS_CATEGORY_UPDATED',
      beforeJson: this.toItem(category),
      afterJson: this.toItem(updated),
    });
    return {
      data: this.toItem(updated),
      message: 'Provider business category updated successfully',
    };
  }

  async delete(user: AuthUserContext, id: string) {
    const category = await this.getCategory(id);
    const linkedProviders = await this.prisma.user.count({
      where: { providerBusinessCategoryId: id, deletedAt: null },
    });
    if (linkedProviders > 0) {
      throw new ConflictException('Provider business category is already assigned to providers');
    }
    await this.prisma.providerBusinessCategory.update({
      where: { id },
      data: { isActive: false },
    });
    await this.auditLog.write({
      actorId: user.uid,
      targetId: id,
      targetType: 'PROVIDER_BUSINESS_CATEGORY',
      action: 'PROVIDER_BUSINESS_CATEGORY_DELETED',
      beforeJson: this.toItem(category),
      afterJson: { ...this.toItem(category), isActive: false },
    });
    return { data: null, message: 'Provider business category deactivated successfully' };
  }

  private async getCategory(id: string) {
    const category = await this.prisma.providerBusinessCategory.findUnique({ where: { id } });
    if (!category) {
      throw new NotFoundException('Provider business category not found');
    }
    return category;
  }

  private async assertUniqueName(name: string, exceptId?: string) {
    const slug = this.slugify(name);
    const existing = await this.prisma.providerBusinessCategory.findFirst({
      where: { slug, ...(exceptId ? { id: { not: exceptId } } : {}) },
    });
    if (existing) {
      throw new ConflictException('Provider business category already exists');
    }
  }

  private slugify(value: string) {
    return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  private toItem(category: { id: string; name: string; description: string | null; isActive: boolean }) {
    return {
      id: category.id,
      name: category.name,
      description: category.description,
      isActive: category.isActive,
    };
  }
}
