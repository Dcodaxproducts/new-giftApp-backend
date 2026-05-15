import { readFileSync } from 'fs';
import { join } from 'path';

describe('Broadcast notifications repository cleanup', () => {
  const service = readFileSync(join(__dirname, 'broadcasts.service.ts'), 'utf8');
  const repository = readFileSync(join(__dirname, 'broadcast-notifications.repository.ts'), 'utf8');
  const recipientsRepository = readFileSync(join(__dirname, 'broadcast-recipients.repository.ts'), 'utf8');
  const moduleFile = readFileSync(join(__dirname, 'broadcast-notifications.module.ts'), 'utf8');
  const controller = readFileSync(join(__dirname, 'broadcasts.controller.ts'), 'utf8');

  it('keeps broadcasts service free of direct Prisma access', () => {
    expect(service).not.toContain('PrismaService');
    expect(service).not.toContain('this.prisma');
    expect(service).toContain('BroadcastNotificationsRepository');
    expect(service).toContain('BroadcastRecipientsRepository');
  });

  it('moves broadcast and recipient persistence into repositories', () => {
    ['createBroadcast', 'findBroadcastsAndCount', 'findBroadcastById', 'updateBroadcast', 'updateBroadcastTargeting', 'scheduleBroadcast', 'cancelBroadcast'].forEach((method) => expect(repository).toContain(method));
    ['findBroadcastDeliveries', 'findDeliveriesAndCount', 'countReachByRole'].forEach((method) => expect(recipientsRepository).toContain(method));
  });

  it('preserves broadcast module wiring, routes, permissions, and Swagger tag', () => {
    expect(moduleFile).toContain('BroadcastNotificationsRepository');
    expect(moduleFile).toContain('BroadcastRecipientsRepository');
    expect(controller).toContain("@ApiTags('06 Broadcast Notifications')");
    expect(controller).toContain("@Controller('broadcasts')");
    expect(controller).toContain("@Permissions('broadcasts.create')");
    expect(controller).toContain("@Permissions('broadcasts.schedule')");
    expect(controller).toContain("@Permissions('broadcasts.report.read')");
  });
});
