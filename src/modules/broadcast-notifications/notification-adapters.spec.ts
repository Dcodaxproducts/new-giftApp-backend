import { BroadcastChannel, NotificationRecipientType, UserRole } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';
import { EmailNotificationAdapter, InAppNotificationAdapter, PushNotificationAdapter } from './notification-adapters';

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
    const notificationsRepository = { createInAppBroadcastNotification: jest.fn().mockResolvedValue({ id: 'notif_1' }) };
    const adapter = new InAppNotificationAdapter(notificationsRepository as never);

    await expect(adapter.send({
      broadcast: broadcast as never,
      recipient: { id: 'user_1', role: UserRole.REGISTERED_USER } as never,
      deliveryId: 'delivery_1',
    })).resolves.toBe('in-app-delivery_1');

    expect(notificationsRepository.createInAppBroadcastNotification).toHaveBeenCalledWith({
      recipientId: 'user_1',
      recipientType: NotificationRecipientType.REGISTERED_USER,
      broadcastId: 'broadcast_1',
      title: 'Promo',
      message: 'Hello',
      imageUrl: 'https://cdn.example.com/image.png',
      ctaUrl: 'https://example.com/open',
    });
  });

  it('recipient type mapping remains unchanged', async () => {
    const notificationsRepository = { createInAppBroadcastNotification: jest.fn().mockResolvedValue({ id: 'notif_1' }) };
    const adapter = new InAppNotificationAdapter(notificationsRepository as never);

    await adapter.send({ broadcast: broadcast as never, recipient: { id: 'provider_1', role: UserRole.PROVIDER } as never, deliveryId: 'delivery_2' });
    await adapter.send({ broadcast: broadcast as never, recipient: { id: 'admin_1', role: UserRole.ADMIN } as never, deliveryId: 'delivery_3' });

    expect(notificationsRepository.createInAppBroadcastNotification).toHaveBeenNthCalledWith(1, expect.objectContaining({ recipientType: NotificationRecipientType.PROVIDER }));
    expect(notificationsRepository.createInAppBroadcastNotification).toHaveBeenNthCalledWith(2, expect.objectContaining({ recipientType: NotificationRecipientType.ADMIN }));
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
    const adapterSource = readFileSync(join(__dirname, 'notification-adapters.ts'), 'utf8');
    const repositorySource = readFileSync(join(__dirname, 'notifications.repository.ts'), 'utf8');
    const deliverySource = readFileSync(join(__dirname, 'broadcast-delivery.service.ts'), 'utf8');

    expect(adapterSource).not.toContain('PrismaService');
    expect(adapterSource).not.toContain('this.prisma');
    expect(adapterSource).toContain('NotificationsRepository');
    expect(adapterSource).toContain('createInAppBroadcastNotification');
    expect(repositorySource).toContain('createInAppBroadcastNotification');
    expect(repositorySource).toContain('this.prisma.notification.create');
    expect(deliverySource).toContain('this.adapters.adapter(channel).send');
  });
});
