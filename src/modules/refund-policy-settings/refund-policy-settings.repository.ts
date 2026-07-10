import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class RefundPolicySettingsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findFirstSettings() {
    return this.prisma.refundPolicySettings.findFirst({ orderBy: { createdAt: 'asc' } });
  }

  createDefaultSettings(currency: string) {
    return this.prisma.refundPolicySettings.create({ data: { currency } });
  }

  updateSettings(id: string, data: Prisma.RefundPolicySettingsUncheckedUpdateInput) {
    return this.prisma.refundPolicySettings.update({ where: { id }, data });
  }
}
