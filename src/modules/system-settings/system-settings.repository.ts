import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
const UPDATED_BY_INCLUDE = { updatedBy: { select: { id: true, firstName: true, lastName: true } } } as const;
@Injectable()
export class SystemSettingsRepository {
  constructor(private readonly prisma: PrismaService) {}
  findFirstSettings() { return this.prisma.systemSettings.findFirst({ orderBy: { createdAt: 'asc' }, include: UPDATED_BY_INCLUDE }); }
  createDefaultSettings(data: Prisma.SystemSettingsUncheckedCreateInput) { return this.prisma.systemSettings.create({ data, include: UPDATED_BY_INCLUDE }); }
  updateSettings(id: string, data: Prisma.SystemSettingsUncheckedUpdateInput) { return this.prisma.systemSettings.update({ where: { id }, data, include: UPDATED_BY_INCLUDE }); }
}
