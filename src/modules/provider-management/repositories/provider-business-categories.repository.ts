import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class ProviderBusinessCategoriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  upsertDefaultCategory(data: { name: string; slug: string }) {
    return this.prisma.providerBusinessCategory.upsert({ where: { slug: data.slug }, create: data, update: { name: data.name, deletedAt: null } });
  }

  findManyForList(params: { where: Prisma.ProviderBusinessCategoryWhereInput; skip: number; take: number }) {
    return this.prisma.$transaction([
      this.prisma.providerBusinessCategory.findMany({ where: params.where, orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }], skip: params.skip, take: params.take }),
      this.prisma.providerBusinessCategory.count({ where: params.where }),
    ]);
  }

  findById(id: string) {
    return this.prisma.providerBusinessCategory.findFirst({ where: { id, deletedAt: null } });
  }

  findByName(name: string, exceptId?: string) {
    return this.prisma.providerBusinessCategory.findFirst({ where: { name, id: exceptId ? { not: exceptId } : undefined, deletedAt: null } });
  }

  findBySlug(slug: string, exceptId?: string) {
    return this.prisma.providerBusinessCategory.findFirst({ where: { slug, id: exceptId ? { not: exceptId } : undefined } });
  }

  create(data: Prisma.ProviderBusinessCategoryUncheckedCreateInput) {
    return this.prisma.providerBusinessCategory.create({ data });
  }

  update(id: string, data: Prisma.ProviderBusinessCategoryUncheckedUpdateInput) {
    return this.prisma.providerBusinessCategory.update({ where: { id }, data });
  }

  countActiveProviders(categoryId: string) {
    return this.prisma.user.count({ where: { providerBusinessCategoryId: categoryId, deletedAt: null, isActive: true } });
  }

  delete(id: string) {
    return this.prisma.providerBusinessCategory.delete({ where: { id } });
  }
}
