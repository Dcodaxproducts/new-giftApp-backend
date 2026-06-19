import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

const UPDATED_BY_INCLUDE = { updatedBy: { select: { id: true, firstName: true, lastName: true } } } as const;

@Injectable()
export class RefundPolicySettingsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findFirstSettings() {
    return this.prisma.refundPolicySettings.findFirst({ orderBy: { createdAt: 'asc' }, include: UPDATED_BY_INCLUDE });
  }

  createDefaultSettings(currency: string) {
    return this.prisma.refundPolicySettings.create({ data: { currency }, include: UPDATED_BY_INCLUDE });
  }

  updateSettings(id: string, data: Prisma.RefundPolicySettingsUncheckedUpdateInput) {
    return this.prisma.refundPolicySettings.update({ where: { id }, data, include: UPDATED_BY_INCLUDE });
  }
}
