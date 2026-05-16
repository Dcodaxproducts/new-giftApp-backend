import { NotificationDevicePlatform, UserRole } from '@prisma/client';
import { NotificationActionDto, NotificationFilterDto, NotificationTypeDto } from '../dto/broadcast-notifications.dto';
import { DeviceTokensRepository } from '../repositories/device-tokens.repository';
import { NotificationPreferencesRepository } from '../repositories/notification-preferences.repository';
import { NotificationsRepository } from '../repositories/notifications.repository';
import { NotificationsService } from '../services/notifications.service';

function createService() {
  const notification = { id: 'notif_1', recipientId: 'user_1', recipientType: 'REGISTERED_USER', title: "Sarah's Birthday Tomorrow", message: 'Send a gift', type: NotificationTypeDto.BIRTHDAY_REMINDER, imageUrl: null, iconKey: 'birthday', ctaUrl: null, metadataJson: { eventId: 'event_1', contactId: 'contact_1' }, actionsJson: null, isRead: false, readAt: null, createdAt: new Date(), deletedAt: null, broadcastId: null };
  const preference = { id: 'pref_1', userId: 'user_1', pushEnabled: true, emailEnabled: true, smsEnabled: false, inAppEnabled: true, marketingEnabled: true, dealUpdatesEnabled: true, birthdayRemindersEnabled: true, deliveryUpdatesEnabled: true, newContactAlertsEnabled: true, systemEnabled: true, createdAt: new Date(), updatedAt: new Date() };
  const prisma = {
    notification: { findMany: jest.fn().mockResolvedValue([notification]), count: jest.fn().mockResolvedValue(1), findFirst: jest.fn().mockResolvedValue(notification), update: jest.fn().mockResolvedValue({ ...notification, isRead: true, readAt: new Date() }), updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
    notificationPreference: { findUnique: jest.fn().mockResolvedValue(preference), create: jest.fn().mockResolvedValue(preference), update: jest.fn().mockResolvedValue({ ...preference, pushEnabled: false }) },
    notificationDeviceToken: { upsert: jest.fn().mockResolvedValue({ id: 'token_1', platform: NotificationDevicePlatform.IOS, deviceId: 'device_1', isActive: true }), findFirst: jest.fn().mockResolvedValue({ id: 'token_1', userId: 'user_1' }), update: jest.fn().mockResolvedValue({}) },
    $transaction: jest.fn().mockImplementation((items: unknown[]) => Promise.all(items)),
  };
  const audit = { write: jest.fn().mockResolvedValue(undefined) };
  const gateway = { emitToUser: jest.fn() };
  const notificationsRepository = new NotificationsRepository(prisma as unknown as ConstructorParameters<typeof NotificationsRepository>[0]);
  const notificationPreferencesRepository = new NotificationPreferencesRepository(prisma as unknown as ConstructorParameters<typeof NotificationPreferencesRepository>[0]);
  const deviceTokensRepository = new DeviceTokensRepository(prisma as unknown as ConstructorParameters<typeof DeviceTokensRepository>[0]);
  const service = new NotificationsService(
    notificationsRepository,
    notificationPreferencesRepository,
    deviceTokensRepository,
    audit as unknown as ConstructorParameters<typeof NotificationsService>[3],
    gateway as unknown as ConstructorParameters<typeof NotificationsService>[4],
  );
  return { service, prisma, audit, gateway, notificationsRepository, notificationPreferencesRepository, deviceTokensRepository };
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

  it('filter=BIRTHDAYS returns birthday reminders only', async () => {
    const { service, prisma } = createService();
    await service.list(user, { filter: NotificationFilterDto.BIRTHDAYS });
    const calls = prisma.notification.findMany.mock.calls as FindManyCall[];
    expect(calls[0][0].where?.type).toBe(NotificationTypeDto.BIRTHDAY_REMINDER);
  });

  it('filter=DELIVERIES returns gift delivered only', async () => {
    const { service, prisma } = createService();
    await service.list(user, { filter: NotificationFilterDto.DELIVERIES });
    const calls = prisma.notification.findMany.mock.calls as FindManyCall[];
    expect(calls[0][0].where?.type).toBe(NotificationTypeDto.GIFT_DELIVERED);
  });

  it('filter=NEW_CONTACTS returns new contact notifications only', async () => {
    const { service, prisma } = createService();
    await service.list(user, { filter: NotificationFilterDto.NEW_CONTACTS });
    const calls = prisma.notification.findMany.mock.calls as FindManyCall[];
    expect(calls[0][0].where?.type).toBe(NotificationTypeDto.NEW_CONTACT_AVAILABLE);
  });

  it('mark read only works for own notification', async () => {
    const { service, audit, gateway } = createService();
    await service.markRead(user, 'notif_1');
    expect(audit.write).toHaveBeenCalledWith(expect.objectContaining({ action: 'NOTIFICATION_MARKED_READ' }));
    expect(gateway.emitToUser).toHaveBeenCalledWith('user_1', 'notification.read', { notificationId: 'notif_1' });
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
    expect(result.data).toEqual({ total: 1, unread: 1, birthdays: 1, deliveries: 1, newContacts: 1 });
  });

  it('preferences can be fetched and updated by owner', async () => {
    const { service } = createService();
    await service.preferences(user);
    const updated = await service.updatePreferences(user, { pushEnabled: false });
    expect(updated.data.pushEnabled).toBe(false);
  });

  it('device token duplicate updates existing record', async () => {
    const { service, prisma } = createService();
    await service.saveDeviceToken(user, { token: 'fcm', platform: NotificationDevicePlatform.IOS, deviceId: 'device_1' });
    expect(prisma.notificationDeviceToken.upsert).toHaveBeenCalledWith(expect.objectContaining({ where: { userId_deviceId: { userId: 'user_1', deviceId: 'device_1' } } }));
  });

  it('notification action SEND_GIFT returns deepLink', async () => {
    const { service } = createService();
    const result = await service.action(user, 'notif_1', { action: NotificationActionDto.SEND_GIFT });
    expect(result.data.deepLink).toBe('/customer/gifts?eventId=event_1&contactId=contact_1');
  });

  it('notification action REMIND_ME_LATER works', async () => {
    const { service } = createService();
    const result = await service.action(user, 'notif_1', { action: NotificationActionDto.REMIND_ME_LATER });
    expect(result.data.deepLink).toBe('/customer/events/event_1');
  });
});
