import { Injectable, NotFoundException } from '@nestjs/common';
import { BroadcastChannel, BroadcastDeliveryStatus, BroadcastStatus, NotificationRecipientType, Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { NotificationAdapterRegistry } from './notification-adapters';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class BroadcastDeliveryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly adapters: NotificationAdapterRegistry,
    private readonly gateway: NotificationsGateway,
  ) {}

  async process(broadcastId: string): Promise<void> {
    const broadcast = await this.prisma.broadcast.findUnique({ where: { id: broadcastId } });
    if (!broadcast) throw new NotFoundException('Broadcast not found');
    if (broadcast.status === BroadcastStatus.CANCELLED || broadcast.status === BroadcastStatus.SENT) return;

    await this.prisma.broadcast.update({ where: { id: broadcastId }, data: { status: BroadcastStatus.PROCESSING, startedAt: new Date() } });
    this.gateway.emitEvent('broadcast.processing', { broadcastId, status: BroadcastStatus.PROCESSING });

    const channels = this.channels(broadcast.channels);
    const recipients = await this.resolveRecipients(broadcast.targetingJson as Prisma.JsonObject | null);
    const targeted = recipients.length * channels.length;
    let processed = 0;
    let sent = 0;
    let failed = 0;

    for (const recipient of recipients) {
      for (const channel of channels) {
        const delivery = await this.prisma.broadcastDelivery.create({
          data: {
            broadcastId,
            recipientId: recipient.id,
            recipientType: this.recipientType(recipient.role),
            channel,
            status: BroadcastDeliveryStatus.QUEUED,
            email: recipient.email,
          },
        });
        try {
          const providerMessageId = await this.adapters.adapter(channel).send({ broadcast, recipient, deliveryId: delivery.id });
          await this.prisma.broadcastDelivery.update({
            where: { id: delivery.id },
            data: { status: BroadcastDeliveryStatus.DELIVERED, providerMessageId, sentAt: new Date(), deliveredAt: new Date() },
          });
          sent += 1;
          if (channel === BroadcastChannel.IN_APP) {
            this.gateway.emitToUser(recipient.id, 'notification.received', { broadcastId, title: broadcast.title, message: broadcast.message });
          }
        } catch (error) {
          failed += 1;
          await this.prisma.broadcastDelivery.update({
            where: { id: delivery.id },
            data: { status: BroadcastDeliveryStatus.FAILED, failureReason: error instanceof Error ? error.message : 'Unknown delivery error' },
          });
          this.gateway.emitEvent('broadcast.delivery.failed', { broadcastId, deliveryId: delivery.id });
        }
        processed += 1;
        this.gateway.emitEvent('broadcast.delivery.progress', {
          broadcastId,
          status: BroadcastStatus.PROCESSING,
          targeted,
          processed,
          sent,
          failed,
          progressPercent: targeted === 0 ? 100 : Number(((processed / targeted) * 100).toFixed(1)),
        });
      }
    }

    await this.prisma.broadcast.update({ where: { id: broadcastId }, data: { status: BroadcastStatus.SENT, completedAt: new Date() } });
    this.gateway.emitEvent('broadcast.delivery.completed', { broadcastId, status: BroadcastStatus.SENT, targeted, processed, sent, failed, progressPercent: 100 });
  }

  private async resolveRecipients(targeting: Prisma.JsonObject | null) {
    const roles = this.targetRoles(targeting);
    return this.prisma.user.findMany({
      where: {
        role: { in: roles },
        deletedAt: null,
        deleteAfter: null,
        isActive: true,
        suspendedAt: null,
        ...(this.onlyVerified(targeting) ? { isVerified: true } : {}),
      },
      take: 10000,
    });
  }

  private targetRoles(targeting: Prisma.JsonObject | null): UserRole[] {
    const roles = targeting?.roles;
    if (Array.isArray(roles) && roles.length > 0) {
      return roles.filter((role): role is UserRole => role === UserRole.ADMIN || role === UserRole.PROVIDER || role === UserRole.REGISTERED_USER);
    }
    return [UserRole.ADMIN, UserRole.PROVIDER, UserRole.REGISTERED_USER];
  }

  private onlyVerified(targeting: Prisma.JsonObject | null): boolean {
    const filters = targeting?.filters;
    return typeof filters === 'object' && filters !== null && !Array.isArray(filters) && filters.onlyVerifiedEmails === true;
  }

  private channels(value: Prisma.JsonValue): BroadcastChannel[] {
    return Array.isArray(value) ? value.filter((channel): channel is BroadcastChannel => Object.values(BroadcastChannel).includes(channel as BroadcastChannel)) : [];
  }

  private recipientType(role: UserRole): NotificationRecipientType {
    if (role === UserRole.PROVIDER) return NotificationRecipientType.PROVIDER;
    if (role === UserRole.REGISTERED_USER) return NotificationRecipientType.REGISTERED_USER;
    return NotificationRecipientType.ADMIN;
  }
}
