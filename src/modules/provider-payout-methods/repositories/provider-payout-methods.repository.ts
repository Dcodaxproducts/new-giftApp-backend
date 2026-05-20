import { Injectable } from '@nestjs/common';
import { Prisma, ProviderPayoutVerificationStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { NotificationDispatchService } from '../../broadcast-notifications/services/notification-dispatch.service';

@Injectable()
export class ProviderPayoutMethodsRepository {
  constructor(private readonly prisma: PrismaService, private readonly notificationDispatch: NotificationDispatchService) {}

  findApprovedProviderById(id: string) {
    return this.prisma.user.findFirst({ where: { id, role: UserRole.PROVIDER, deletedAt: null } });
  }

  findManyByProviderId(providerId: string) {
    return this.prisma.providerPayoutMethod.findMany({ where: { providerId, deletedAt: null }, orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }] });
  }

  findByIdForProvider(providerId: string, id: string) {
    return this.prisma.providerPayoutMethod.findFirst({ where: { id, providerId, deletedAt: null } });
  }

  createBankAccount(data: Prisma.ProviderPayoutMethodUncheckedCreateInput) {
    return this.prisma.providerPayoutMethod.create({ data });
  }

  updateMetadata(id: string, data: Prisma.ProviderPayoutMethodUncheckedUpdateInput) {
    return this.prisma.providerPayoutMethod.update({ where: { id }, data });
  }

  setDefault(providerId: string, id: string) {
    return this.prisma.$transaction([
      this.prisma.providerPayoutMethod.updateMany({ where: { providerId, isDefault: true }, data: { isDefault: false } }),
      this.prisma.providerPayoutMethod.update({ where: { id }, data: { isDefault: true } }),
    ]);
  }

  findPendingPayoutUsage(providerId: string) {
    return this.prisma.providerFinancialAdjustment.findFirst({ where: { providerId, direction: 'CREDIT', status: 'PENDING' } });
  }

  deleteAndPromoteNextDefault(providerId: string, id: string, promoteNext: boolean) {
    return this.prisma.$transaction(async (tx) => {
      await tx.providerPayoutMethod.delete({ where: { id } });
      if (!promoteNext) return;
      const next = await tx.providerPayoutMethod.findFirst({ where: { providerId, deletedAt: null, isActive: true, verificationStatus: ProviderPayoutVerificationStatus.VERIFIED }, orderBy: { createdAt: 'desc' } });
      if (next) await tx.providerPayoutMethod.update({ where: { id: next.id }, data: { isDefault: true } });
    });
  }

  markVerificationStatus(id: string, data: Prisma.ProviderPayoutMethodUncheckedUpdateInput) {
    return this.prisma.providerPayoutMethod.update({ where: { id }, data });
  }

  createNotification(data: Prisma.NotificationUncheckedCreateInput) {
    return this.notificationDispatch.createAndEmit(data);
  }
}
