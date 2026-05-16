import { readFileSync } from 'fs';
import { join } from 'path';

describe('Broadcast notifications repository cleanup', () => {
  const service = readFileSync(join(__dirname, '../services/broadcasts.service.ts'), 'utf8');
  const repository = readFileSync(join(__dirname, '../repositories/broadcast-notifications.repository.ts'), 'utf8');
  const recipientsRepository = readFileSync(join(__dirname, '../repositories/broadcast-recipients.repository.ts'), 'utf8');
  const deliveryService = readFileSync(join(__dirname, '../services/broadcast-delivery.service.ts'), 'utf8');
  const deliveryRepository = readFileSync(join(__dirname, '../repositories/broadcast-delivery.repository.ts'), 'utf8');
  const queueService = readFileSync(join(__dirname, '../services/broadcast-queue.service.ts'), 'utf8');
  const queueRepository = readFileSync(join(__dirname, '../repositories/broadcast-queue.repository.ts'), 'utf8');
  const moduleFile = readFileSync(join(__dirname, '../broadcast-notifications.module.ts'), 'utf8');
  const controller = readFileSync(join(__dirname, '../controllers/broadcasts.controller.ts'), 'utf8');

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

  it('keeps broadcast delivery and queue services free of direct Prisma access', () => {
    expect(deliveryService).not.toContain('PrismaService');
    expect(deliveryService).not.toContain('this.prisma');
    expect(queueService).not.toContain('PrismaService');
    expect(queueService).not.toContain('this.prisma');
    expect(deliveryService).toContain('BroadcastDeliveryRepository');
    expect(queueService).toContain('BroadcastQueueRepository');
  });

  it('moves delivery and queue persistence into repositories', () => {
    ['findBroadcastById', 'markBroadcastProcessing', 'markBroadcastSent', 'createBroadcastDelivery', 'markBroadcastDeliveryDelivered', 'markBroadcastDeliveryFailed', 'findBroadcastRecipients'].forEach((method) => expect(deliveryRepository).toContain(method));
    expect(deliveryRepository).toContain('this.prisma.broadcastDelivery.create');
    expect(deliveryRepository).toContain('this.prisma.user.findMany');
    expect(queueRepository).toContain('findBroadcastById');
    expect(queueRepository).toContain('this.prisma.broadcast.findUnique');
  });

  it('preserves broadcast module wiring, routes, permissions, and Swagger tag', () => {
    expect(moduleFile).toContain('BroadcastNotificationsRepository');
    expect(moduleFile).toContain('BroadcastRecipientsRepository');
    expect(moduleFile).toContain('BroadcastDeliveryRepository');
    expect(moduleFile).toContain('BroadcastQueueRepository');
    expect(controller).toContain("@ApiTags('06 Broadcast Notifications')");
    expect(controller).toContain("@Controller('broadcasts')");
    expect(controller).toContain("@Permissions('broadcasts.create')");
    expect(controller).toContain("@Permissions('broadcasts.schedule')");
    expect(controller).toContain("@Permissions('broadcasts.report.read')");
  });
});
