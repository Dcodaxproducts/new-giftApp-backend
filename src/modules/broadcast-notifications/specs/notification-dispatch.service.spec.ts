/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { NotificationDeliveryStatus, NotificationRecipientType } from '@prisma/client';
import { NotificationDeliveryLogRepository } from '../repositories/notification-delivery-log.repository';
import { NotificationPreferencesRepository } from '../repositories/notification-preferences.repository';
import { NotificationsRepository } from '../repositories/notifications.repository';
import { NotificationDispatchService } from '../services/notification-dispatch.service';

function createService(options: { pushFails?: boolean; emailFails?: boolean; preferences?: Record<string, boolean> } = {}) {
  const createdAt = new Date('2026-05-18T10:00:00.000Z');
  const notification = { id: 'notification_id', recipientId: 'user_1', recipientType: NotificationRecipientType.REGISTERED_USER, title: 'Payment successful', message: 'Your payment was completed successfully.', type: 'PAYMENT_SUCCEEDED', imageUrl: null, iconKey: null, ctaUrl: null, metadataJson: { paymentId: 'payment_id', stripeClientSecret: 'secret', bankAccountNumber: '1234567890', nested: { authToken: 'token', safe: 'ok' } }, actionsJson: null, isRead: false, readAt: null, createdAt, deletedAt: null, broadcastId: null };
  const log = { id: 'log_1', notificationId: null, recipientId: 'user_1', recipientType: NotificationRecipientType.REGISTERED_USER, notificationType: 'PAYMENT_SUCCEEDED', channelsJson: ['IN_APP', 'SOCKET', 'PUSH', 'EMAIL'], idempotencyKey: null, inAppStatus: NotificationDeliveryStatus.QUEUED, socketStatus: NotificationDeliveryStatus.QUEUED, pushStatus: NotificationDeliveryStatus.QUEUED, emailStatus: NotificationDeliveryStatus.QUEUED, lastError: null, retryCount: 0, createdAt, updatedAt: createdAt };
  const prisma = {
    notification: { create: jest.fn().mockResolvedValue(notification), findUnique: jest.fn().mockResolvedValue(notification) },
    notificationPreference: { findUnique: jest.fn().mockResolvedValue({ userId: 'user_1', inAppEnabled: options.preferences?.inAppEnabled ?? true, pushEnabled: options.preferences?.pushEnabled ?? true, emailEnabled: options.preferences?.emailEnabled ?? true }) },
    notificationDeliveryLog: { create: jest.fn().mockResolvedValue(log), findFirst: jest.fn().mockResolvedValue(null), findUnique: jest.fn().mockResolvedValue(log), update: jest.fn().mockResolvedValue(log) },
    user: { findUnique: jest.fn().mockResolvedValue({ email: 'user@example.com' }) },
  };
  const gateway = { emitToUser: jest.fn(() => { if (options.pushFails) throw new Error('socket down'); }) };
  const mailer = { sendProviderMessageEmail: jest.fn(options.emailFails ? () => Promise.reject(new Error('smtp down')) : () => Promise.resolve()) };
  const notificationsRepository = new NotificationsRepository(prisma as unknown as ConstructorParameters<typeof NotificationsRepository>[0]);
  const preferencesRepository = new NotificationPreferencesRepository(prisma as unknown as ConstructorParameters<typeof NotificationPreferencesRepository>[0]);
  const logsRepository = new NotificationDeliveryLogRepository(prisma as unknown as ConstructorParameters<typeof NotificationDeliveryLogRepository>[0]);
  const service = new NotificationDispatchService(notificationsRepository, preferencesRepository, gateway as never, logsRepository, mailer as never);
  return { service, prisma, gateway, notification, mailer };
}

describe('NotificationDispatchService', () => {
  it('creates notification, emits socket event, and creates delivery log', async () => {
    const { service, prisma, gateway } = createService();
    await service.createAndEmit({ recipientId: 'user_1', recipientType: NotificationRecipientType.REGISTERED_USER, title: 'Payment successful', message: 'Your payment was completed successfully.', type: 'PAYMENT_SUCCEEDED', metadataJson: { paymentId: 'payment_id' } });
    expect(prisma.notification.create).toHaveBeenCalledWith({ data: expect.objectContaining({ recipientId: 'user_1', type: 'PAYMENT_SUCCEEDED' }) });
    expect(prisma.notificationDeliveryLog.create).toHaveBeenCalledWith({ data: expect.objectContaining({ recipientId: 'user_1', notificationType: 'PAYMENT_SUCCEEDED' }) });
    expect(gateway.emitToUser).toHaveBeenCalledWith('user_1', 'notification.received', expect.objectContaining({ id: 'notification_id', title: 'Payment successful', type: 'PAYMENT_SUCCEEDED', isRead: false }));
  });

  it('does not emit sensitive metadata', async () => {
    const { service, gateway } = createService();
    await service.createAndEmit({ recipientId: 'user_1', recipientType: NotificationRecipientType.REGISTERED_USER, title: 'Payment successful', message: 'Done', type: 'PAYMENT_SUCCEEDED', metadataJson: { paymentId: 'payment_id' } });
    const payload = (gateway.emitToUser.mock.calls as unknown[][])[0][2] as { metadata: Record<string, unknown> };
    expect(payload.metadata).toEqual({ paymentId: 'payment_id', nested: { safe: 'ok' } });
    expect(JSON.stringify(payload.metadata)).not.toContain('secret');
    expect(JSON.stringify(payload.metadata)).not.toContain('1234567890');
    expect(JSON.stringify(payload.metadata)).not.toContain('token');
  });

  it('respects preferences and skips disabled channels', async () => {
    const { service, prisma, gateway, mailer } = createService({ preferences: { inAppEnabled: false, pushEnabled: false, emailEnabled: false } });
    await service.createAndEmit({ recipientId: 'user_1', recipientType: NotificationRecipientType.REGISTERED_USER, title: 'Silent', message: 'Silent', type: 'SILENT', channels: ['IN_APP', 'SOCKET', 'PUSH', 'EMAIL'], metadataJson: {} });
    expect(gateway.emitToUser).not.toHaveBeenCalled();
    expect(mailer.sendProviderMessageEmail).not.toHaveBeenCalled();
    expect(prisma.notificationDeliveryLog.update).toHaveBeenCalledWith({ where: { id: 'log_1' }, data: expect.objectContaining({ socketStatus: NotificationDeliveryStatus.SKIPPED }) });
  });

  it('idempotency blocks duplicate notifications', async () => {
    const { service, prisma } = createService();
    prisma.notificationDeliveryLog.findFirst.mockResolvedValueOnce({ notificationId: 'notification_id' });
    await service.createAndEmit({ recipientId: 'user_1', recipientType: NotificationRecipientType.REGISTERED_USER, title: 'Payment successful', message: 'Done', type: 'PAYMENT_SUCCEEDED', idempotencyKey: 'payment_1:succeeded' });
    expect(prisma.notification.create).not.toHaveBeenCalled();
    expect(prisma.notification.findUnique).toHaveBeenCalledWith({ where: { id: 'notification_id' } });
  });

  it('socket/email failures do not break business action', async () => {
    await expect(createService({ pushFails: true, emailFails: true }).service.createAndEmit({ recipientId: 'user_1', recipientType: NotificationRecipientType.REGISTERED_USER, title: 'Payment successful', message: 'Done', type: 'PAYMENT_SUCCEEDED', channels: ['IN_APP', 'SOCKET', 'EMAIL'], metadataJson: {} })).resolves.toEqual(expect.objectContaining({ id: 'notification_id' }));
  });

  it('emitRead keeps notification.read behavior centralized', () => {
    const { service, gateway } = createService();
    service.emitRead('user_1', { notificationId: 'notification_id' });
    expect(gateway.emitToUser).toHaveBeenCalledWith('user_1', 'notification.read', { notificationId: 'notification_id' });
  });
});
