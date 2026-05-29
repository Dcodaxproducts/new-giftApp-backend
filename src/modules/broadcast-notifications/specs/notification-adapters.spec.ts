import { BroadcastChannel, NotificationRecipientType, UserRole } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';
import { EmailNotificationAdapter, InAppNotificationAdapter, PushNotificationAdapter } from '../notification-adapters';

describe('Notification adapters', () => {
  const broadcast = {
    id: 'broadcast_1',
    title: 'Promo',
    message: 'Hello',
    imageUrl: 'https://cdn.example.com/image.png',
    ctaLabel: 'Open',
    ctaUrl: 'https://example.com/open',
    channels: [BroadcastChannel.IN_APP],
  };

  it('in-app adapter creates the same notification payload and delivery reference', async () => {
    const notificationDispatch = { createAndEmit: jest.fn().mockResolvedValue({ id: 'notif_1' }) };
    const adapter = new InAppNotificationAdapter(notificationDispatch as never);

    await expect(adapter.send({
      broadcast: broadcast as never,
      recipient: { id: 'user_1', role: UserRole.REGISTERED_USER } as never,
      deliveryId: 'delivery_1',
    })).resolves.toBe('in-app-delivery_1');

    expect(notificationDispatch.createAndEmit).toHaveBeenCalledWith(expect.objectContaining({
      recipientId: 'user_1',
      recipientType: NotificationRecipientType.REGISTERED_USER,
      title: 'Promo',
      message: 'Hello',
      type: 'BROADCAST',
      metadataJson: { broadcastId: 'broadcast_1', imageUrl: 'https://cdn.example.com/image.png', ctaUrl: 'https://example.com/open' },
      idempotencyKey: 'broadcast:broadcast_1:user_1:in-app',
    }));
  });

  it('recipient type mapping remains unchanged', async () => {
    const notificationDispatch = { createAndEmit: jest.fn().mockResolvedValue({ id: 'notif_1' }) };
    const adapter = new InAppNotificationAdapter(notificationDispatch as never);

    await adapter.send({ broadcast: broadcast as never, recipient: { id: 'provider_1', role: UserRole.PROVIDER } as never, deliveryId: 'delivery_2' });
    await adapter.send({ broadcast: broadcast as never, recipient: { id: 'admin_1', role: UserRole.ADMIN } as never, deliveryId: 'delivery_3' });

    expect(notificationDispatch.createAndEmit).toHaveBeenNthCalledWith(1, expect.objectContaining({ recipientType: NotificationRecipientType.PROVIDER }));
    expect(notificationDispatch.createAndEmit).toHaveBeenNthCalledWith(2, expect.objectContaining({ recipientType: NotificationRecipientType.ADMIN }));
  });

  it('email adapter behavior remains unchanged', async () => {
    const mailer = { sendBroadcastEmail: jest.fn().mockResolvedValue(undefined) };
    const adapter = new EmailNotificationAdapter(mailer as never);

    await expect(adapter.send({
      broadcast: broadcast as never,
      recipient: { id: 'user_1', email: 'user@example.com' } as never,
      deliveryId: 'delivery_4',
    })).resolves.toBe('email-delivery_4');

    expect(mailer.sendBroadcastEmail).toHaveBeenCalledWith({
      to: 'user@example.com',
      title: 'Promo',
      message: 'Hello',
      imageUrl: 'https://cdn.example.com/image.png',
      ctaLabel: 'Open',
      ctaUrl: 'https://example.com/open',
    });
  });

  it('push adapter behavior remains unchanged', async () => {
    const adapter = new PushNotificationAdapter();
    await expect(adapter.send({ broadcast: broadcast as never, recipient: { id: 'user_1' } as never, deliveryId: 'delivery_5' })).resolves.toBe('mock-push-delivery_5');
  });

  it('notification adapter source no longer imports PrismaService or uses this.prisma and repository owns create query', () => {
    const adapterSource = readFileSync(join(__dirname, '../notification-adapters.ts'), 'utf8');
    const repositorySource = readFileSync(join(__dirname, '../repositories/notifications.repository.ts'), 'utf8');
    const deliverySource = readFileSync(join(__dirname, '../services/broadcast-delivery.service.ts'), 'utf8');

    expect(adapterSource).not.toContain('PrismaService');
    expect(adapterSource).not.toContain('this.prisma');
    expect(adapterSource).toContain('NotificationDispatchService');
    expect(adapterSource).toContain('createAndEmit');
    expect(repositorySource).toContain('createInAppBroadcastNotification');
    expect(repositorySource).toContain('this.prisma.notification.create');
    expect(deliverySource).toContain('this.adapters.adapter(channel).send');
  });
});
