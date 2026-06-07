import { Injectable, NotFoundException } from '@nestjs/common';
import { BroadcastChannel, BroadcastDeliveryStatus, BroadcastStatus, NotificationRecipientType, Prisma, UserRole } from '@prisma/client';
import { BroadcastDeliveryRepository } from '../repositories/broadcast-delivery.repository';
import { NotificationAdapterRegistry } from '../notification-adapters';
import { NotificationsGateway } from '../notifications.gateway';

@Injectable()
export class BroadcastDeliveryService {
  constructor(
    private readonly repository: BroadcastDeliveryRepository,
    private readonly adapters: NotificationAdapterRegistry,
    private readonly gateway: NotificationsGateway,
  ) {}

  async process(broadcastId: string): Promise<void> {
    const broadcast = await this.repository.findBroadcastById(broadcastId);
    if (!broadcast) throw new NotFoundException('Broadcast not found');
    if (broadcast.status === BroadcastStatus.CANCELLED || broadcast.status === BroadcastStatus.SENT) return;

    await this.repository.markBroadcastProcessing(broadcastId);
    this.gateway.emitEvent('broadcast.processing', { broadcastId, status: BroadcastStatus.PROCESSING });

    const channels = this.channels(broadcast.channels);
    const recipients = await this.resolveRecipients(broadcast.targetingJson as Prisma.JsonObject | null);
    const targeted = recipients.length * channels.length;
    let processed = 0;
    let sent = 0;
    let failed = 0;

    for (const recipient of recipients) {
      for (const channel of channels) {
        const delivery = await this.repository.createBroadcastDelivery({
            broadcastId,
            recipientId: recipient.id,
            recipientType: this.recipientType(recipient.role),
            channel,
            status: BroadcastDeliveryStatus.QUEUED,
            email: recipient.email,
        });
        try {
          const providerMessageId = await this.adapters.adapter(channel).send({ broadcast, recipient, deliveryId: delivery.id });
          await this.repository.markBroadcastDeliveryDelivered({ deliveryId: delivery.id, providerMessageId });
          sent += 1;
          if (channel === BroadcastChannel.IN_APP) {
            this.gateway.emitToUser(recipient.id, 'notification.received', { broadcastId, title: broadcast.title, message: broadcast.message });
          }
        } catch (error) {
          failed += 1;
          await this.repository.markBroadcastDeliveryFailed({ deliveryId: delivery.id, failureReason: error instanceof Error ? error.message : 'Unknown delivery error' });
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

    await this.repository.markBroadcastSent(broadcastId);
    this.gateway.emitEvent('broadcast.delivery.completed', { broadcastId, status: BroadcastStatus.SENT, targeted, processed, sent, failed, progressPercent: 100 });
  }

  private async resolveRecipients(targeting: Prisma.JsonObject | null) {
    const roles = this.targetRoles(targeting);
    const recipients = await this.repository.findBroadcastRecipients({ roles, onlyVerified: this.onlyVerified(targeting), excludeUnsubscribed: this.excludeUnsubscribed(targeting) });
    const location = this.locationFilter(targeting);
    if (!location) return recipients;
    return recipients.filter((recipient) => recipient.role === UserRole.PROVIDER && this.isProviderInsideRadius(recipient.providerStoreAddress, location));
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

  private excludeUnsubscribed(targeting: Prisma.JsonObject | null): boolean {
    const filters = targeting?.filters;
    return typeof filters === 'object' && filters !== null && !Array.isArray(filters) && filters.excludeUnsubscribed === true;
  }

  private channels(value: Prisma.JsonValue): BroadcastChannel[] {
    return Array.isArray(value) ? value.filter((channel): channel is BroadcastChannel => Object.values(BroadcastChannel).includes(channel as BroadcastChannel)) : [];
  }

  private locationFilter(targeting: Prisma.JsonObject | null): { lat: number; lng: number; radiusKm: number } | null {
    const filters = targeting?.filters;
    if (!filters || typeof filters !== 'object' || Array.isArray(filters)) return null;
    const location = (filters as Record<string, unknown>).location;
    if (!location || typeof location !== 'object' || Array.isArray(location)) return null;
    const record = location as Record<string, unknown>;
    const lat = this.numericCoordinate(record.lat);
    const lng = this.numericCoordinate(record.lng);
    const radiusKm = this.numericCoordinate(record.radiusKm);
    return lat === null || lng === null || radiusKm === null ? null : { lat, lng, radiusKm };
  }

  private isProviderInsideRadius(value: Prisma.JsonValue, center: { lat: number; lng: number; radiusKm: number }): boolean {
    const providerLocation = this.providerLocation(value);
    if (!providerLocation) return false;
    return this.distanceKm(center, providerLocation) <= center.radiusKm;
  }

  private providerLocation(value: Prisma.JsonValue): { lat: number; lng: number } | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    const record = value as Record<string, unknown>;
    const lat = this.numericCoordinate(record.lat ?? record.latitude);
    const lng = this.numericCoordinate(record.lng ?? record.longitude);
    return lat === null || lng === null ? null : { lat, lng };
  }

  private numericCoordinate(value: unknown): number | null {
    if (typeof value === 'number') return Number.isFinite(value) ? value : null;
    if (typeof value === 'string') {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  }

  private distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
    const earthRadiusKm = 6371;
    const dLat = this.radians(b.lat - a.lat);
    const dLng = this.radians(b.lng - a.lng);
    const lat1 = this.radians(a.lat);
    const lat2 = this.radians(b.lat);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    return 2 * earthRadiusKm * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  }

  private radians(value: number): number {
    return (value * Math.PI) / 180;
  }

  private recipientType(role: UserRole): NotificationRecipientType {
    if (role === UserRole.PROVIDER) return NotificationRecipientType.PROVIDER;
    if (role === UserRole.REGISTERED_USER) return NotificationRecipientType.REGISTERED_USER;
    return NotificationRecipientType.ADMIN;
  }
}
