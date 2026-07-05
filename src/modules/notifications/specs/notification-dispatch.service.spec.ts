/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { NotificationRecipientType } from '@prisma/client';
import { NotificationsRepository } from '../repositories/notifications.repository';
import { NotificationDispatchService } from '../notification-dispatch.service';

function createService(options: { socketFails?: boolean; emailFails?: boolean } = {}) {
  const createdAt = new Date('2026-05-18T10:00:00.000Z');
  const notification = { id: 'notification_id', recipientId: 'user_1', recipientType: NotificationRecipientType.REGISTERED_USER, title: 'Payment successful', message: 'Your payment was completed successfully.', isRead: false, readAt: null, createdAt, broadcastId: null };
  const prisma = {
    notification: { create: jest.fn().mockResolvedValue(notification), findUnique: jest.fn().mockResolvedValue(notification) },
    user: { findUnique: jest.fn().mockResolvedValue({ email: 'user@example.com' }) },
  };
  const gateway = { emitToUser: jest.fn(() => { if (options.socketFails) throw new Error('socket down'); }) };
  const mailer = { sendProviderMessageEmail: jest.fn(options.emailFails ? () => Promise.reject(new Error('smtp down')) : () => Promise.resolve()) };
  const notificationsRepository = new NotificationsRepository(prisma as unknown as ConstructorParameters<typeof NotificationsRepository>[0]);
  const service = new NotificationDispatchService(notificationsRepository, gateway as never, mailer as never);
  return { service, prisma, gateway, notification, mailer };
}

describe('NotificationDispatchService', () => {
  it('creates notification and emits socket event', async () => {
    const { service, prisma, gateway } = createService();
    await service.createAndEmit({ recipientId: 'user_1', recipientType: NotificationRecipientType.REGISTERED_USER, title: 'Payment successful', message: 'Your payment was completed successfully.', type: 'PAYMENT_SUCCEEDED', metadataJson: { paymentId: 'payment_id' } });
    expect(prisma.notification.create).toHaveBeenCalledWith({ data: expect.objectContaining({ recipientId: 'user_1', title: 'Payment successful', message: 'Your payment was completed successfully.' }) });
    expect(gateway.emitToUser).toHaveBeenCalledWith('user_1', 'notification.received', expect.objectContaining({ id: 'notification_id', title: 'Payment successful', isRead: false }));
  });

  it('does not emit metadata payload', async () => {
    const { service, gateway } = createService();
    await service.createAndEmit({ recipientId: 'user_1', recipientType: NotificationRecipientType.REGISTERED_USER, title: 'Payment successful', message: 'Done', type: 'PAYMENT_SUCCEEDED', metadataJson: { paymentId: 'payment_id' } });
    const payload = (gateway.emitToUser.mock.calls as unknown[][])[0][2] as Record<string, unknown>;
    expect(payload).not.toHaveProperty('metadata');
    expect(payload).not.toHaveProperty('type');
  });

  it('email failures do not break business action', async () => {
    await expect(createService({ emailFails: true }).service.createAndEmit({ recipientId: 'user_1', recipientType: NotificationRecipientType.REGISTERED_USER, title: 'Payment successful', message: 'Done', type: 'PAYMENT_SUCCEEDED', channels: ['IN_APP', 'EMAIL'], metadataJson: {} })).resolves.toEqual(expect.objectContaining({ id: 'notification_id' }));
  });

  it('emitRead keeps notification.read behavior centralized', () => {
    const { service, gateway } = createService();
    service.emitRead('user_1', { notificationId: 'notification_id' });
    expect(gateway.emitToUser).toHaveBeenCalledWith('user_1', 'notification.read', { notificationId: 'notification_id' });
  });
});
