import { readFileSync } from 'fs';
import { join } from 'path';

describe('Notifications repository cleanup', () => {
  const service = readFileSync(join(__dirname, '../services/notifications.service.ts'), 'utf8');
  const notificationsRepository = readFileSync(join(__dirname, '../repositories/notifications.repository.ts'), 'utf8');
  const preferencesRepository = readFileSync(join(__dirname, '../repositories/notification-preferences.repository.ts'), 'utf8');
  const tokensRepository = readFileSync(join(__dirname, '../repositories/device-tokens.repository.ts'), 'utf8');
  const moduleFile = readFileSync(join(__dirname, '../broadcast-notifications.module.ts'), 'utf8');
  const controller = readFileSync(join(__dirname, '../controllers/notifications.controller.ts'), 'utf8');

  it('keeps notification service free of direct Prisma access', () => {
    expect(service).not.toContain('PrismaService');
    expect(service).not.toContain('this.prisma');
    expect(service).toContain('NotificationsRepository');
    expect(service).toContain('NotificationPreferencesRepository');
    expect(service).toContain('DeviceTokensRepository');
  });

  it('moves notifications, preferences, and device-token persistence into repositories', () => {
    ['findNotificationsAndCount', 'countSummary', 'findOwnedNotification', 'markRead', 'markAllRead', 'updateMetadata', 'createInAppBroadcastNotification'].forEach((method) => expect(notificationsRepository).toContain(method));
    ['findPreferences', 'createPreferences', 'updatePreferences'].forEach((method) => expect(preferencesRepository).toContain(method));
    ['upsertDeviceToken', 'findOwnedDeviceToken', 'disableDeviceToken'].forEach((method) => expect(tokensRepository).toContain(method));
  });

  it('preserves notifications module wiring, routes, and Swagger tag', () => {
    expect(moduleFile).toContain('NotificationsRepository');
    expect(moduleFile).toContain('NotificationPreferencesRepository');
    expect(moduleFile).toContain('DeviceTokensRepository');
    expect(controller).toContain("@ApiTags('06 Notifications')");
    expect(controller).toContain("@Controller('notifications')");
    expect(controller).toContain("@Get('summary')");
    expect(controller).toContain("@Patch('preferences')");
    expect(controller).toContain("@Post('device-tokens')");
    expect(controller).toContain("@Delete('device-tokens/:id')");
  });
});
