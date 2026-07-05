import { UserRole } from '@prisma/client';
import { NotificationFilterDto } from '../dto/notifications.dto';
import { NotificationsRepository } from '../repositories/notifications.repository';
import { NotificationsService } from '../notifications.service';

function createService() {
  const notification = { id: 'notif_1', recipientId: 'user_1', recipientType: 'REGISTERED_USER', title: "Sarah's Birthday Tomorrow", message: 'Send a gift', isRead: false, readAt: null, createdAt: new Date(), broadcastId: null };
  const prisma = {
    notification: { findMany: jest.fn().mockResolvedValue([notification]), count: jest.fn().mockResolvedValue(1), findFirst: jest.fn().mockResolvedValue(notification), update: jest.fn().mockResolvedValue({ ...notification, isRead: true, readAt: new Date() }), updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
    $transaction: jest.fn().mockImplementation((items: unknown[]) => Promise.all(items)),
  };
  const audit = { write: jest.fn().mockResolvedValue(undefined) };
  const gateway = { emitRead: jest.fn() };
  const notificationsRepository = new NotificationsRepository(prisma as unknown as ConstructorParameters<typeof NotificationsRepository>[0]);
  const service = new NotificationsService(
    notificationsRepository,
    audit as unknown as ConstructorParameters<typeof NotificationsService>[1],
    gateway as unknown as ConstructorParameters<typeof NotificationsService>[2],
  );
  return { service, prisma, audit, gateway, notificationsRepository };
}

const user = { uid: 'user_1', role: UserRole.REGISTERED_USER };
type FindManyCall = [{ where?: Record<string, unknown> }];
type UpdateManyCall = [{ where?: Record<string, unknown> }];

describe('NotificationsService', () => {
  it('GET /notifications returns only logged-in user notifications', async () => {
    const { service, prisma } = createService();
    await service.list(user, {});
    const calls = prisma.notification.findMany.mock.calls as FindManyCall[];
    expect(calls[0][0].where?.recipientId).toBe('user_1');
  });

  it('filter=UNREAD returns unread only', async () => {
    const { service, prisma } = createService();
    await service.list(user, { filter: NotificationFilterDto.UNREAD });
    const calls = prisma.notification.findMany.mock.calls as FindManyCall[];
    expect(calls[0][0].where?.isRead).toBe(false);
  });

  it('mark read only works for own notification', async () => {
    const { service, audit, gateway } = createService();
    await service.markRead(user, 'notif_1');
    expect(audit.write).toHaveBeenCalledWith(expect.objectContaining({ action: 'NOTIFICATION_MARKED_READ' }));
    expect(gateway.emitRead).toHaveBeenCalledWith('user_1', { notificationId: 'notif_1' });
  });

  it('read-all marks only own notifications', async () => {
    const { service, prisma } = createService();
    await service.markAllRead(user);
    const calls = prisma.notification.updateMany.mock.calls as UpdateManyCall[];
    expect(calls[0][0].where?.recipientId).toBe('user_1');
  });

  it('summary returns requested counters', async () => {
    const { service } = createService();
    const result = await service.summary(user);
    expect(result.data).toEqual({ total: 1, unread: 1 });
  });
});
