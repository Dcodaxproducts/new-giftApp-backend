import { readFileSync } from 'fs';
import { join } from 'path';

describe('Notifications repository cleanup', () => {
  const service = readFileSync(join(__dirname, '../notifications.service.ts'), 'utf8');
  const notificationsRepository = readFileSync(join(__dirname, '../repositories/notifications.repository.ts'), 'utf8');
  const moduleFile = readFileSync(join(__dirname, '../notifications.module.ts'), 'utf8');
  const controller = readFileSync(join(__dirname, '../notifications.controller.ts'), 'utf8');

  it('keeps notification service free of direct Prisma access', () => {
    expect(service).not.toContain('PrismaService');
    expect(service).not.toContain('this.prisma');
    expect(service).toContain('NotificationsRepository');
    expect(service).not.toContain('NotificationPreferencesRepository');
    expect(service).not.toContain('DeviceTokensRepository');
  });

  it('keeps notification persistence in the notifications repository', () => {
    ['findNotificationsAndCount', 'countSummary', 'findOwnedNotification', 'markRead', 'markAllRead', 'createInAppBroadcastNotification'].forEach((method) => expect(notificationsRepository).toContain(method));
  });

  it('preserves notifications module wiring, routes, and Swagger tag', () => {
    expect(moduleFile).toContain('NotificationsRepository');
    expect(moduleFile).not.toContain('NotificationPreferencesRepository');
    expect(moduleFile).not.toContain('DeviceTokensRepository');
    expect(controller).toContain("@ApiTags('06 Notifications')");
    expect(controller).toContain("@Controller('notifications')");
    expect(controller).toContain("@Get('summary')");
    expect(controller).not.toContain("@Patch('preferences')");
    expect(controller).not.toContain("@Post('device-tokens')");
    expect(controller).not.toContain("@Delete('device-tokens/:id')");
  });
});
