import { Injectable } from '@nestjs/common';
import { NotificationRecipientType, Prisma, ProviderEarningsLedgerStatus, ProviderPayoutStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { NotificationDispatchService } from '../notifications/notification-dispatch.service';

export const ADMIN_PROVIDER_PAYOUT_INCLUDE = Prisma.validator<Prisma.ProviderPayoutInclude>()({
  provider: { select: { id: true, providerProfile: { select: { businessName: true } }, firstName: true, lastName: true, avatarUrl: true } },
  payoutMethod: { select: { id: true, bankName: true, maskedAccount: true, last4: true, verificationStatus: true } },
});

@Injectable()
export class AdminProviderPayoutsRepository {
  constructor(private readonly prisma: PrismaService, private readonly notificationDispatch: NotificationDispatchService) {}

  findPayouts<T extends Prisma.ProviderPayoutFindManyArgs>(args: T): Promise<Prisma.ProviderPayoutGetPayload<T>[]> {
    return this.prisma.providerPayout.findMany(args) as Promise<Prisma.ProviderPayoutGetPayload<T>[]>;
  }

  findPayoutById(id: string) {
    return this.prisma.providerPayout.findUnique({ where: { id }, include: ADMIN_PROVIDER_PAYOUT_INCLUDE });
  }

  findPayoutLedgerEntries(payoutId: string) {
    return this.prisma.providerEarningsLedger.findMany({ where: { payoutId }, include: { order: { select: { orderNumber: true } } }, orderBy: { createdAt: 'desc' }, take: 10 });
  }

  findPreviousCompletedPayout(providerId: string, before: Date, excludeId: string) {
    return this.prisma.providerPayout.findFirst({ where: { providerId, status: ProviderPayoutStatus.COMPLETED, completedAt: { lt: before }, id: { not: excludeId } }, orderBy: { completedAt: 'desc' } });
  }

  findLedgerEntries(where: Prisma.ProviderEarningsLedgerWhereInput) {
    return this.prisma.providerEarningsLedger.findMany({ where, include: { provider: { select: { id: true, providerProfile: { select: { businessName: true } }, firstName: true, lastName: true } } }, take: 10000 });
  }

  findCommissionTiers() {
    return this.prisma.commissionTier.findMany({ where: { deletedAt: null, isActive: true }, orderBy: { orderVolumeThreshold: 'asc' } });
  }

  transitionPayout(params: { payoutId: string; providerId: string; status: ProviderPayoutStatus; failureReason?: string; releaseLedger: boolean; settleLedger?: boolean; actorId?: string; action?: string; notification?: { title: string; message: string; type: string; metadataJson: Prisma.InputJsonValue } }) {
    return this.prisma.$transaction(async (tx) => {
      if (params.releaseLedger) await tx.providerEarningsLedger.updateMany({ where: { providerId: params.providerId, payoutId: params.payoutId, status: ProviderEarningsLedgerStatus.PAYOUT_PENDING }, data: { status: ProviderEarningsLedgerStatus.AVAILABLE, payoutId: null, metadataJson: { payoutId: params.payoutId, releaseReason: params.failureReason ?? params.status } } });
      if (params.settleLedger) await tx.providerEarningsLedger.updateMany({ where: { providerId: params.providerId, payoutId: params.payoutId, status: ProviderEarningsLedgerStatus.PAYOUT_PENDING }, data: { status: ProviderEarningsLedgerStatus.PAID, metadataJson: { payoutId: params.payoutId, settledAt: new Date().toISOString() } } });
      const payout = await tx.providerPayout.update({ where: { id: params.payoutId }, data: { status: params.status, failureReason: params.failureReason, ...(params.status === ProviderPayoutStatus.COMPLETED ? { completedAt: new Date() } : {}) }, include: ADMIN_PROVIDER_PAYOUT_INCLUDE });
      if (params.notification) await this.notificationDispatch.createAndEmit({ recipientId: params.providerId, recipientType: NotificationRecipientType.PROVIDER, title: params.notification.title, message: params.notification.message, type: params.notification.type, metadataJson: params.notification.metadataJson })
      return payout;
    });
  }
}
