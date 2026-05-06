/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { BroadcastChannel, BroadcastPriority, BroadcastStatus, UserRole } from '@prisma/client';
import { BroadcastsService } from './broadcasts.service';
import { SendMode, TargetingMode, TargetRole } from './dto/broadcast-notifications.dto';

function createService() {
  const broadcast = { id: 'broadcast_1', title: 'Title', message: 'Message', imageUrl: null, ctaLabel: null, ctaUrl: null, channels: [BroadcastChannel.IN_APP], priority: BroadcastPriority.NORMAL, status: BroadcastStatus.DRAFT, targetingJson: null, estimatedReachJson: null, sendMode: null, scheduledAt: null, timezone: 'UTC', isRecurring: false, recurrenceJson: null, createdBy: 'admin_1', updatedBy: null, cancelledAt: null, cancelledBy: null, cancelReason: null, startedAt: null, completedAt: null, createdAt: new Date(), updatedAt: new Date() };
  const prisma = {
    broadcast: { create: jest.fn().mockResolvedValue(broadcast), findUnique: jest.fn().mockResolvedValue(broadcast), update: jest.fn().mockImplementation(({ data }) => Promise.resolve({ ...broadcast, ...data })), findMany: jest.fn().mockResolvedValue([]), count: jest.fn().mockResolvedValue(0) },
    user: { count: jest.fn().mockResolvedValueOnce(1).mockResolvedValueOnce(2).mockResolvedValueOnce(3) },
    notificationDeviceToken: { count: jest.fn().mockResolvedValue(2) },
    broadcastDelivery: { findMany: jest.fn().mockResolvedValue([]), count: jest.fn().mockResolvedValue(0) },
    $transaction: jest.fn().mockImplementation((items: unknown[]) => Promise.all(items)),
  };
  const audit = { write: jest.fn().mockResolvedValue(undefined) };
  const queue = { enqueueNow: jest.fn().mockResolvedValue(undefined), enqueueScheduled: jest.fn().mockResolvedValue(undefined), cancel: jest.fn().mockResolvedValue(undefined) };
  const gateway = { emitEvent: jest.fn(), emitToUser: jest.fn() };
  const service = new BroadcastsService(prisma as unknown as ConstructorParameters<typeof BroadcastsService>[0], audit as unknown as ConstructorParameters<typeof BroadcastsService>[1], queue as unknown as ConstructorParameters<typeof BroadcastsService>[2], gateway as unknown as ConstructorParameters<typeof BroadcastsService>[3]);
  return { service, prisma, audit, queue, gateway };
}

describe('BroadcastsService', () => {
  it('creates draft broadcast and writes audit log', async () => {
    const { service, prisma, audit } = createService();
    await service.create({ uid: 'admin_1', role: UserRole.ADMIN }, { title: 'Title', message: 'Message', channels: [BroadcastChannel.IN_APP] });
    expect(prisma.broadcast.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: BroadcastStatus.DRAFT, createdBy: 'admin_1' }) }));
    expect(audit.write).toHaveBeenCalledWith(expect.objectContaining({ action: 'BROADCAST_CREATED' }));
  });

  it('estimates reach by target roles and channels', async () => {
    const { service } = createService();
    const result = await service.estimateReach({ channels: [BroadcastChannel.EMAIL, BroadcastChannel.PUSH], targeting: { mode: TargetingMode.SPECIFIC_ROLES, roles: [TargetRole.ADMIN, TargetRole.PROVIDER, TargetRole.REGISTERED_USER] } });
    expect(result.data.total).toBe(6);
    expect(result.data.push).toBe(2);
  });

  it('queues send-now broadcast', async () => {
    const { service, queue } = createService();
    await service.schedule({ uid: 'admin_1', role: UserRole.ADMIN, permissions: { broadcasts: ['send'] } }, 'broadcast_1', { sendMode: SendMode.NOW });
    expect(queue.enqueueNow).toHaveBeenCalledWith('broadcast_1');
  });
});
