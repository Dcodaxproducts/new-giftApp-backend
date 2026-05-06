import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

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

  async list() {
    const categories = await this.prisma.providerBusinessCategory.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    return {
      data: categories.map((category) => ({ id: category.id, name: category.name })),
      message: 'Provider business categories fetched successfully',
    };
  }
}
