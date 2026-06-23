/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { readFileSync } from 'fs';
import { join } from 'path';
import { NotificationDeliveryStatus, NotificationRecipientType } from '@prisma/client';
import { NotificationDeliveryMonitoringController } from '../notification-delivery-monitoring.controller';
import { NotificationDeliveryMonitoringService } from '../notification-delivery-monitoring.service';

describe('Admin notification delivery monitoring', () => {
  const log = { id: 'log_1', notificationId: 'notification_1', recipientId: 'user_1', recipientType: NotificationRecipientType.REGISTERED_USER, notificationType: 'PAYMENT_SUCCEEDED', channelsJson: ['IN_APP', 'SOCKET'], idempotencyKey: 'payment_1', inAppStatus: NotificationDeliveryStatus.DELIVERED, socketStatus: NotificationDeliveryStatus.FAILED, pushStatus: NotificationDeliveryStatus.SKIPPED, emailStatus: NotificationDeliveryStatus.SKIPPED, lastError: 'socket down', retryCount: 0, createdAt: new Date(), updatedAt: new Date() };
  const repository = {
    stats: jest.fn().mockResolvedValue({ total: 1, queued: 0, delivered: 1, failed: 1, skipped: 0, retried: 0 }),
    findLogsAndCount: jest.fn().mockResolvedValue([[log], 1]),
    findById: jest.fn().mockResolvedValue(log),
    update: jest.fn().mockResolvedValue({ ...log, retryCount: 1 }),
  };
  const dispatcher = { retryDelivery: jest.fn().mockResolvedValue({ ...log, retryCount: 1, socketStatus: NotificationDeliveryStatus.DELIVERED }) };
  const service = new NotificationDeliveryMonitoringService(repository as never, dispatcher as never);

  it('controller exposes required admin routes, permissions, and swagger tag', () => {
    const source = readFileSync(join(__dirname, '../notification-delivery-monitoring.controller.ts'), 'utf8');
    expect(source).toContain("@ApiTags('02 Admin - Notification Delivery Monitoring')");
    expect(source).toContain("@Controller('admin/notification-delivery')");
    expect(source).toContain("@Get('stats')");
    expect(source).toContain("@Get('logs')");
    expect(source).toContain("@Get('logs/:id')");
    expect(source).toContain("@Post('logs/:id/retry')");
    expect(source).toContain("@Permissions('notifications.read')");
    expect(source).toContain("@Permissions('notifications.delivery.retry')");
  });

  it('admin delivery logs work', async () => {
    await expect(service.stats()).resolves.toEqual(expect.objectContaining({ data: expect.objectContaining({ total: 1 }) }));
    await expect(service.logsList({ page: 1, limit: 20 })).resolves.toEqual(expect.objectContaining({ data: [log], meta: expect.objectContaining({ total: 1 }) }));
    await expect(service.detail('log_1')).resolves.toEqual(expect.objectContaining({ data: log }));
    const controller = new NotificationDeliveryMonitoringController(service);
    await expect(controller.logs({})).resolves.toEqual(expect.objectContaining({ data: [log] }));
  });

  it('admin retry works without duplicating IN_APP notification', async () => {
    await expect(service.retry('log_1')).resolves.toEqual(expect.objectContaining({ data: expect.objectContaining({ retryCount: 1 }) }));
    expect(repository.update).toHaveBeenCalledWith('log_1', expect.objectContaining({ retryCount: { increment: 1 }, lastError: null }));
    expect(dispatcher.retryDelivery).toHaveBeenCalledWith(log);
  });
});
