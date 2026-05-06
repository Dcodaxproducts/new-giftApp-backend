/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { NotificationDevicePlatform, UserRole } from '@prisma/client';
import { NotificationsService } from './notifications.service';

function createService() {
  const notification = { id: 'notif_1', recipientId: 'user_1', title: 'Title', message: 'Message', type: 'BROADCAST', imageUrl: null, ctaUrl: null, isRead: false, readAt: null, createdAt: new Date() };
  const prisma = {
    notification: { findMany: jest.fn().mockResolvedValue([notification]), count: jest.fn().mockResolvedValue(1), findFirst: jest.fn().mockResolvedValue(notification), update: jest.fn().mockResolvedValue({ ...notification, isRead: true, readAt: new Date() }), updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
    notificationDeviceToken: { upsert: jest.fn().mockResolvedValue({ id: 'token_1', platform: NotificationDevicePlatform.IOS, deviceId: 'device_1', isActive: true }), findFirst: jest.fn().mockResolvedValue({ id: 'token_1', userId: 'user_1' }), update: jest.fn().mockResolvedValue({}) },
    $transaction: jest.fn().mockImplementation((items: unknown[]) => Promise.all(items)),
  };
  const audit = { write: jest.fn().mockResolvedValue(undefined) };
  const gateway = { emitToUser: jest.fn() };
  const service = new NotificationsService(prisma as unknown as ConstructorParameters<typeof NotificationsService>[0], audit as unknown as ConstructorParameters<typeof NotificationsService>[1], gateway as unknown as ConstructorParameters<typeof NotificationsService>[2]);
  return { service, prisma, audit, gateway };
}

describe('NotificationsService', () => {
  it('lists current user notifications only', async () => {
    const { service, prisma } = createService();
    await service.list({ uid: 'user_1', role: UserRole.REGISTERED_USER }, {});
    expect(prisma.notification.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ recipientId: 'user_1' }) }));
  });

  it('marks notification as read and emits event', async () => {
    const { service, audit, gateway } = createService();
    await service.markRead({ uid: 'user_1', role: UserRole.REGISTERED_USER }, 'notif_1');
    expect(audit.write).toHaveBeenCalledWith(expect.objectContaining({ action: 'NOTIFICATION_MARKED_READ' }));
    expect(gateway.emitToUser).toHaveBeenCalledWith('user_1', 'notification.read', { notificationId: 'notif_1' });
  });

  it('stores device token', async () => {
    const { service, prisma } = createService();
    await service.saveDeviceToken({ uid: 'user_1', role: UserRole.REGISTERED_USER }, { token: 'fcm', platform: NotificationDevicePlatform.IOS, deviceId: 'device_1' });
    expect(prisma.notificationDeviceToken.upsert).toHaveBeenCalled();
  });
});
