/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import { NotificationRecipientType } from '@prisma/client';
import { NotificationPreferencesRepository } from '../repositories/notification-preferences.repository';
import { NotificationsRepository } from '../repositories/notifications.repository';
import { NotificationDispatchService } from '../services/notification-dispatch.service';

function createService() {
  const createdAt = new Date('2026-05-18T10:00:00.000Z');
  const notification = { id: 'notification_id', recipientId: 'user_1', recipientType: NotificationRecipientType.REGISTERED_USER, title: 'Payment successful', message: 'Your payment was completed successfully.', type: 'PAYMENT_SUCCEEDED', imageUrl: null, iconKey: null, ctaUrl: null, metadataJson: { paymentId: 'payment_id', stripeClientSecret: 'secret', bankAccountNumber: '1234567890', nested: { authToken: 'token', safe: 'ok' } }, actionsJson: null, isRead: false, readAt: null, createdAt, deletedAt: null, broadcastId: null };
  const prisma = {
    notification: { create: jest.fn().mockResolvedValue(notification) },
    notificationPreference: { findUnique: jest.fn().mockResolvedValue({ userId: 'user_1', inAppEnabled: true }) },
  };
  const gateway = { emitToUser: jest.fn() };
  const notificationsRepository = new NotificationsRepository(prisma as unknown as ConstructorParameters<typeof NotificationsRepository>[0]);
  const preferencesRepository = new NotificationPreferencesRepository(prisma as unknown as ConstructorParameters<typeof NotificationPreferencesRepository>[0]);
  const service = new NotificationDispatchService(notificationsRepository, preferencesRepository, gateway as never);
  return { service, prisma, gateway, notification };
}

describe('NotificationDispatchService', () => {
  it('createAndEmit persists notification and emits notification.received to recipient room', async () => {
    const { service, prisma, gateway } = createService();

    await service.createAndEmit({ recipientId: 'user_1', recipientType: NotificationRecipientType.REGISTERED_USER, title: 'Payment successful', message: 'Your payment was completed successfully.', type: 'PAYMENT_SUCCEEDED', metadataJson: { paymentId: 'payment_id' } });

    expect(prisma.notification.create).toHaveBeenCalledWith({ data: expect.objectContaining({ recipientId: 'user_1', type: 'PAYMENT_SUCCEEDED' }) });
    expect(gateway.emitToUser).toHaveBeenCalledWith('user_1', 'notification.received', expect.objectContaining({ id: 'notification_id', title: 'Payment successful', type: 'PAYMENT_SUCCEEDED', isRead: false, metadata: expect.objectContaining({ paymentId: 'payment_id' }) }));
  });

  it('does not emit sensitive metadata', async () => {
    const { service, gateway } = createService();

    await service.createAndEmit({ recipientId: 'user_1', recipientType: NotificationRecipientType.REGISTERED_USER, title: 'Payment successful', message: 'Done', type: 'PAYMENT_SUCCEEDED', metadataJson: { paymentId: 'payment_id' } });

    const payload = gateway.emitToUser.mock.calls[0][2] as { metadata: Record<string, unknown> };
    expect(payload.metadata).toEqual({ paymentId: 'payment_id', nested: { safe: 'ok' } });
    expect(JSON.stringify(payload.metadata)).not.toContain('secret');
    expect(JSON.stringify(payload.metadata)).not.toContain('1234567890');
    expect(JSON.stringify(payload.metadata)).not.toContain('token');
  });

  it('emitRead keeps notification.read behavior centralized', () => {
    const { service, gateway } = createService();

    service.emitRead('user_1', { notificationId: 'notification_id' });

    expect(gateway.emitToUser).toHaveBeenCalledWith('user_1', 'notification.read', { notificationId: 'notification_id' });
  });

  it('does not emit when in-app notifications are disabled', async () => {
    const { service, prisma, gateway } = createService();
    prisma.notificationPreference.findUnique.mockResolvedValueOnce({ userId: 'user_1', inAppEnabled: false });

    await service.createAndEmit({ recipientId: 'user_1', recipientType: NotificationRecipientType.REGISTERED_USER, title: 'Silent', message: 'Silent', type: 'SILENT', metadataJson: {} });

    expect(prisma.notification.create).toHaveBeenCalled();
    expect(gateway.emitToUser).not.toHaveBeenCalled();
  });
});
