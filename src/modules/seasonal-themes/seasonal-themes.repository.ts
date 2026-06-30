import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class SeasonalThemesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findManyAndCount(params: { where: Prisma.SeasonalThemeWhereInput; skip: number; take: number }) {
    return this.prisma.$transaction([
      this.prisma.seasonalTheme.findMany({ where: params.where, orderBy: { startsAt: 'desc' }, skip: params.skip, take: params.take }),
      this.prisma.seasonalTheme.count({ where: params.where }),
    ]);
  }

  findById(id: string) {
    return this.prisma.seasonalTheme.findUnique({ where: { id } });
  }

  findActiveAt(now: Date) {
    return this.prisma.seasonalTheme.findFirst({
      where: { isActive: true, startsAt: { lte: now }, endsAt: { gte: now } },
      orderBy: { startsAt: 'desc' },
    });
  }

  findOverlappingActive(params: { startsAt: Date; endsAt: Date; excludeId?: string }) {
    return this.prisma.seasonalTheme.findFirst({
      where: {
        isActive: true,
        id: params.excludeId ? { not: params.excludeId } : undefined,
        startsAt: { lt: params.endsAt },
        endsAt: { gt: params.startsAt },
      },
      select: { id: true },
    });
  }

  create(data: Prisma.SeasonalThemeCreateInput) {
    return this.prisma.seasonalTheme.create({ data });
  }

  update(id: string, data: Prisma.SeasonalThemeUpdateInput) {
    return this.prisma.seasonalTheme.update({ where: { id }, data });
  }

  delete(id: string) {
    return this.prisma.seasonalTheme.delete({ where: { id } });
  }

  findCompletedThemeAssetByUrl(imageUrl: string) {
    const normalizedUrl = imageUrl.split('?')[0];
    return this.prisma.uploadedFile.findFirst({
      where: { fileUrl: normalizedUrl, folder: 'seasonal-theme-assets', status: 'COMPLETED', deletedAt: null },
      select: { id: true, fileUrl: true },
    });
  }
}
