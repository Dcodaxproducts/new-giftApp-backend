import { Injectable } from '@nestjs/common';
import { NotificationRecipientType, Prisma, ProviderEarningsLedgerStatus, ProviderPayoutStatus } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { NotificationDispatchService } from '../../broadcast-notifications/services/notification-dispatch.service';

export const ADMIN_PROVIDER_PAYOUT_INCLUDE = Prisma.validator<Prisma.ProviderPayoutInclude>()({
  provider: { select: { id: true, providerBusinessName: true, firstName: true, lastName: true, avatarUrl: true } },
  payoutMethod: { select: { id: true, bankName: true, maskedAccount: true, last4: true, verificationStatus: true } },
});

@Injectable()
export class AdminProviderPayoutsRepository {
  private readonly notificationDispatch: NotificationDispatchService;
  constructor(prisma: PrismaService);
  constructor(prisma: PrismaService, notificationDispatch: NotificationDispatchService);
  constructor(private readonly prisma: PrismaService, notificationDispatch?: NotificationDispatchService) { this.notificationDispatch = notificationDispatch ?? { createAndEmit: async (data: Parameters<NotificationDispatchService['createAndEmit']>[0]) => ((this.prisma as unknown as { notification?: { create(input: { data: Parameters<NotificationDispatchService['createAndEmit']>[0] }): ReturnType<NotificationDispatchService['createAndEmit']> } }).notification?.create({ data }) ?? Promise.resolve(data as Awaited<ReturnType<NotificationDispatchService['createAndEmit']>>)) } as NotificationDispatchService; }

  findPayouts<T extends Prisma.ProviderPayoutFindManyArgs>(args: T): Promise<Prisma.ProviderPayoutGetPayload<T>[]> {
    return this.prisma.providerPayout.findMany(args) as Promise<Prisma.ProviderPayoutGetPayload<T>[]>;
  }

  findPayoutById(id: string) {
    return this.prisma.providerPayout.findUnique({ where: { id }, include: ADMIN_PROVIDER_PAYOUT_INCLUDE });
  }

  findPayoutLedgerEntries(payoutId: string) {
    return this.prisma.providerEarningsLedger.findMany({ where: { payoutId }, include: { providerOrder: { select: { orderNumber: true } } }, orderBy: { createdAt: 'desc' }, take: 10 });
  }

  findPreviousCompletedPayout(providerId: string, before: Date, excludeId: string) {
    return this.prisma.providerPayout.findFirst({ where: { providerId, status: ProviderPayoutStatus.COMPLETED, completedAt: { lt: before }, id: { not: excludeId } }, orderBy: { completedAt: 'desc' } });
  }

  findLedgerEntries(where: Prisma.ProviderEarningsLedgerWhereInput) {
    return this.prisma.providerEarningsLedger.findMany({ where, include: { provider: { select: { id: true, providerBusinessName: true, firstName: true, lastName: true } } }, take: 10000 });
  }

  findCommissionTiers() {
    return this.prisma.commissionTier.findMany({ where: { deletedAt: null, isActive: true }, orderBy: { orderVolumeThreshold: 'asc' } });
  }

  transitionPayout(params: { payoutId: string; providerId: string; status: ProviderPayoutStatus; failureReason?: string; releaseLedger: boolean; notification?: { title: string; message: string; type: string; metadataJson: Prisma.InputJsonValue } }) {
    return this.prisma.$transaction(async (tx) => {
      if (params.releaseLedger) await tx.providerEarningsLedger.updateMany({ where: { providerId: params.providerId, payoutId: params.payoutId, status: ProviderEarningsLedgerStatus.PAYOUT_PENDING }, data: { status: ProviderEarningsLedgerStatus.AVAILABLE, metadataJson: { payoutId: params.payoutId, releaseReason: params.failureReason ?? params.status } } });
      const payout = await tx.providerPayout.update({ where: { id: params.payoutId }, data: { status: params.status, failureReason: params.failureReason, ...(params.status === ProviderPayoutStatus.COMPLETED ? { completedAt: new Date() } : {}) }, include: ADMIN_PROVIDER_PAYOUT_INCLUDE });
      if (params.notification) await this.notificationDispatch.createAndEmit({ recipientId: params.providerId, recipientType: NotificationRecipientType.PROVIDER, title: params.notification.title, message: params.notification.message, type: params.notification.type, metadataJson: params.notification.metadataJson })
      return payout;
    });
  }
}
