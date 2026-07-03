import { ForbiddenException } from '@nestjs/common';
import { BroadcastAudience, BroadcastStatus, UserRole } from '@prisma/client';
import { BroadcastNotificationsRepository } from './broadcast-notifications.repository';
import { BroadcastNotificationsService } from './broadcast-notifications.service';
import { BroadcastAudienceDto } from './dto/broadcast-notifications.dto';

function createBroadcast(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'broadcast_1',
    title: 'Maintenance Notice',
    message: 'Type your message here...',
    audience: BroadcastAudience.ALL_USERS,
    status: BroadcastStatus.SENT,
    createdBy: 'admin_1',
    updatedBy: null,
    startedAt: null,
    completedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function createService() {
  const prisma = {
    broadcast: {
      create: jest.fn().mockImplementation((args: { data: Partial<Record<string, unknown>> }) => Promise.resolve(createBroadcast({ ...args.data, id: 'broadcast_created' }))),
    },
  };
  const audit = { write: jest.fn().mockResolvedValue(undefined) };
  const broadcastNotificationsRepository = new BroadcastNotificationsRepository(prisma as unknown as ConstructorParameters<typeof BroadcastNotificationsRepository>[0]);
  const service = new BroadcastNotificationsService(
    broadcastNotificationsRepository,
    audit as unknown as ConstructorParameters<typeof BroadcastNotificationsService>[1],
  );
  return { service, prisma, audit };
}

const createUser = { uid: 'admin_1', role: UserRole.STAFF, permissions: { broadcasts: ['create'] } };

describe('BroadcastNotificationsService', () => {
  it('creates a broadcast with only frontend fields', async () => {
    const { service, prisma, audit } = createService();
    const result = await service.create(createUser, {
      title: ' Maintenance Notice ',
      message: ' Type your message here... ',
      audience: BroadcastAudienceDto.ALL_USERS,
    });

    expect(prisma.broadcast.create).toHaveBeenCalledWith({
      data: {
        title: 'Maintenance Notice',
        message: 'Type your message here...',
        audience: BroadcastAudience.ALL_USERS,
        status: BroadcastStatus.SENT,
        createdBy: 'admin_1',
      },
    });
    expect(audit.write).toHaveBeenCalledWith(expect.objectContaining({ action: 'BROADCAST_CREATED', actorType: UserRole.STAFF }));
    expect(result.data).toEqual(expect.objectContaining({ id: 'broadcast_created', audience: BroadcastAudience.ALL_USERS }));
  });

  it('maps provider and user audiences to the persisted enum', async () => {
    const { service, prisma } = createService();

    await service.create(createUser, { title: 'Provider Notice', message: 'Provider message', audience: BroadcastAudienceDto.PROVIDER });
    await service.create(createUser, { title: 'User Notice', message: 'User message', audience: BroadcastAudienceDto.USER });

    expect(prisma.broadcast.create).toHaveBeenNthCalledWith(1, expect.objectContaining({ data: expect.objectContaining({ audience: BroadcastAudience.PROVIDER }) }));
    expect(prisma.broadcast.create).toHaveBeenNthCalledWith(2, expect.objectContaining({ data: expect.objectContaining({ audience: BroadcastAudience.USER }) }));
  });

  it('enforces create permission', async () => {
    const { service } = createService();
    await expect(service.create({ uid: 'admin_1', role: UserRole.STAFF, permissions: { broadcasts: ['read'] } }, {
      title: 'Maintenance Notice',
      message: 'Type your message here...',
      audience: BroadcastAudienceDto.ALL_USERS,
    })).rejects.toThrow(ForbiddenException);
  });
});
