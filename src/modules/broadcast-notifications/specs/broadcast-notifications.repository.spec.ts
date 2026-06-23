import { readFileSync } from 'fs';
import { join } from 'path';

describe('Broadcast notifications repository cleanup', () => {
  const service = readFileSync(join(__dirname, '../broadcast-notifications.service.ts'), 'utf8');
  const repository = readFileSync(join(__dirname, '../repositories/broadcast-notifications.repository.ts'), 'utf8');
  const moduleFile = readFileSync(join(__dirname, '../broadcast-notifications.module.ts'), 'utf8');
  const controller = readFileSync(join(__dirname, '../broadcast-notifications.controller.ts'), 'utf8');

  it('keeps broadcasts service free of direct Prisma access', () => {
    expect(service).not.toContain('PrismaService');
    expect(service).not.toContain('this.prisma');
    expect(service).toContain('BroadcastNotificationsRepository');
  });

  it('keeps broadcast create persistence in the repository', () => {
    expect(repository).toContain('createBroadcast');
    expect(repository).toContain('this.prisma.broadcast.create');
    expect(repository).not.toContain('findBroadcastsAndCount');
    expect(repository).not.toContain('updateBroadcast');
  });

  it('keeps broadcast module wiring minimal with only create route, permissions, and Swagger tag', () => {
    expect(moduleFile).toContain('BroadcastNotificationsRepository');
    expect(moduleFile).toContain('BroadcastNotificationsService');
    expect(moduleFile).not.toContain('BroadcastDeliveryRepository');
    expect(moduleFile).not.toContain('BroadcastQueueRepository');
    expect(moduleFile).not.toContain('NotificationAdapterRegistry');
    expect(controller).toContain("@ApiTags('06 Broadcast Notifications')");
    expect(controller).toContain("@Controller('broadcasts')");
    expect(controller).toContain('@Post()');
    expect(controller).not.toContain('@Get(');
    expect(controller).not.toContain('@Patch(');
    expect(controller).not.toContain("@Post(':id/action')");
    expect(controller).not.toContain("@Post('estimate-reach')");
    expect(controller).not.toContain("@Patch(':id/targeting')");
    expect(controller).not.toContain("@Patch(':id/schedule')");
    expect(controller).not.toContain("@Post(':id/cancel')");
  });
});
