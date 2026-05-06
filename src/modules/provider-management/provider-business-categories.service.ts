import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ListProviderBusinessCategoriesDto } from './dto/provider-business-categories.dto';

const DEFAULT_PROVIDER_BUSINESS_CATEGORIES = [
  { name: 'Logistics', slug: 'logistics' },
  { name: 'Gift Supplier', slug: 'gift-supplier' },
  { name: 'Florist', slug: 'florist' },
  { name: 'Experiences', slug: 'experiences' },
];

@Injectable()
export class ProviderBusinessCategoriesService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

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
      data: items.map((category) => ({ id: category.id, name: category.name })),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
      message: 'Provider business categories fetched successfully',
    };
  }
}
