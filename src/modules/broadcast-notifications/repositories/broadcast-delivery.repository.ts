import { Injectable } from '@nestjs/common';
import { BroadcastDeliveryStatus, Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class BroadcastDeliveryRepository {
  constructor(private readonly prisma: PrismaService) {}

  findBroadcastById(broadcastId: string) {
    return this.prisma.broadcast.findUnique({ where: { id: broadcastId } });
  }

  markBroadcastProcessing(broadcastId: string) {
    return this.prisma.broadcast.update({ where: { id: broadcastId }, data: { status: 'PROCESSING', startedAt: new Date() } });
  }

  markBroadcastSent(broadcastId: string) {
    return this.prisma.broadcast.update({ where: { id: broadcastId }, data: { status: 'SENT', completedAt: new Date() } });
  }

  createBroadcastDelivery(data: Prisma.BroadcastDeliveryUncheckedCreateInput) {
    return this.prisma.broadcastDelivery.create({ data });
  }

  markBroadcastDeliveryDelivered(params: { deliveryId: string; providerMessageId: string | null }) {
    return this.prisma.broadcastDelivery.update({ where: { id: params.deliveryId }, data: { status: BroadcastDeliveryStatus.DELIVERED, providerMessageId: params.providerMessageId, sentAt: new Date(), deliveredAt: new Date() } });
  }

  markBroadcastDeliveryFailed(params: { deliveryId: string; failureReason: string }) {
    return this.prisma.broadcastDelivery.update({ where: { id: params.deliveryId }, data: { status: BroadcastDeliveryStatus.FAILED, failureReason: params.failureReason } });
  }

  findBroadcastRecipients(params: { roles: UserRole[]; onlyVerified: boolean }) {
    return this.prisma.user.findMany({
      where: {
        role: { in: params.roles },
        deletedAt: null,
        deleteAfter: null,
        isActive: true,
        suspendedAt: null,
        ...(params.onlyVerified ? { isVerified: true } : {}),
      },
      take: 10000,
    });
  }
}
