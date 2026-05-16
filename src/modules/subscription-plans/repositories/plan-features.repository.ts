import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class PlanFeaturesRepository {
  constructor(private readonly prisma: PrismaService) {}

  upsertFeatureByKey(params: { key: string; label: string; description: string; type: string }) {
    return this.prisma.planFeatureCatalog.upsert({ where: { key: params.key }, create: params, update: params });
  }

  findActiveCatalog() {
    return this.prisma.planFeatureCatalog.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }],
    });
  }

  findManyFeatures(params: Prisma.PlanFeatureCatalogFindManyArgs) {
    return this.prisma.planFeatureCatalog.findMany(params);
  }

  countFeatures(where: Prisma.PlanFeatureCatalogWhereInput) {
    return this.prisma.planFeatureCatalog.count({ where });
  }

  findFeaturesAndCount(params: Prisma.PlanFeatureCatalogFindManyArgs & { where: Prisma.PlanFeatureCatalogWhereInput }) {
    return this.prisma.$transaction([
      this.findManyFeatures(params),
      this.countFeatures(params.where),
    ]);
  }

  findFeatureById(id: string) {
    return this.prisma.planFeatureCatalog.findFirst({ where: { id, deletedAt: null } });
  }

  findFeatureByKey(key: string, exceptId?: string) {
    return this.prisma.planFeatureCatalog.findFirst({ where: { key, id: exceptId ? { not: exceptId } : undefined, deletedAt: null } });
  }

  createFeature(data: Prisma.PlanFeatureCatalogCreateInput) {
    return this.prisma.planFeatureCatalog.create({ data });
  }

  updateFeature(id: string, data: Prisma.PlanFeatureCatalogUpdateInput) {
    return this.prisma.planFeatureCatalog.update({ where: { id }, data });
  }

  deleteFeature(id: string) {
    return this.prisma.planFeatureCatalog.delete({ where: { id } });
  }
}
