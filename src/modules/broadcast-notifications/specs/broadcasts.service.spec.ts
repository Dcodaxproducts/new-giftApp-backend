/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { BadRequestException, ForbiddenException, ValidationPipe } from '@nestjs/common';
import { BroadcastChannel, BroadcastPriority, BroadcastStatus, UserRole } from '@prisma/client';
import { BroadcastNotificationsRepository } from '../repositories/broadcast-notifications.repository';
import { BroadcastRecipientsRepository } from '../repositories/broadcast-recipients.repository';
import { BroadcastsService } from '../services/broadcasts.service';
import { BroadcastManagementAction, BroadcastScheduleType, BroadcastWizardAction, CreateBroadcastDto, TargetingMode, TargetRole } from '../dto/broadcast-notifications.dto';

const futureSendAt = () => new Date(Date.now() + 60 * 60 * 1000).toISOString();

function createBroadcast(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'broadcast_1',
    title: 'Title',
    message: 'Message',
    imageUrl: null,
    ctaLabel: null,
    ctaUrl: null,
    channels: [BroadcastChannel.IN_APP],
    priority: BroadcastPriority.NORMAL,
    status: BroadcastStatus.DRAFT,
    targetingJson: { mode: TargetingMode.ALL_USERS },
    estimatedReachJson: { total: 6 },
    sendMode: null,
    scheduledAt: null,
    timezone: 'UTC',
    isRecurring: false,
    recurrenceJson: null,
    createdBy: 'admin_1',
    updatedBy: null,
    cancelledAt: null,
    cancelledBy: null,
    cancelReason: null,
    startedAt: null,
    completedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function wizardDto(action: BroadcastWizardAction = BroadcastWizardAction.SAVE_DRAFT): CreateBroadcastDto {
  return {
    action,
    content: { title: 'Maintenance Notice', message: 'Type your message here...', ctaLabel: 'View Details', ctaUrl: 'https://gift.dcodax.net/notice' },
    channels: [BroadcastChannel.IN_APP, BroadcastChannel.PUSH],
    priority: BroadcastPriority.NORMAL,
    targeting: { mode: TargetingMode.SPECIFIC_ROLES, roles: [TargetRole.ADMIN, TargetRole.PROVIDER, TargetRole.REGISTERED_USER] },
    schedule: { type: action === BroadcastWizardAction.SCHEDULE ? BroadcastScheduleType.SCHEDULED : BroadcastScheduleType.SEND_NOW, sendAt: action === BroadcastWizardAction.SCHEDULE ? futureSendAt() : null, timezone: 'UTC', recurring: { enabled: false, frequency: null } },
  };
}

function createService(overrides: Partial<Record<string, unknown>> = {}) {
  const broadcast = createBroadcast(overrides);
  const prisma = {
    broadcast: {
      create: jest.fn().mockImplementation((args: { data: Partial<Record<string, unknown>> }) => Promise.resolve(createBroadcast({ ...args.data, id: 'broadcast_created' }))),
      findUnique: jest.fn().mockResolvedValue(broadcast),
      update: jest.fn().mockImplementation((args: { data: Partial<Record<string, unknown>> }) => Promise.resolve({ ...broadcast, ...args.data })),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
    },
    user: { count: jest.fn().mockResolvedValueOnce(1).mockResolvedValueOnce(2).mockResolvedValueOnce(3), findMany: jest.fn().mockResolvedValue([]) },
    notificationDeviceToken: { count: jest.fn().mockResolvedValue(2) },
    broadcastDelivery: { findMany: jest.fn().mockResolvedValue([]), count: jest.fn().mockResolvedValue(0) },
    $transaction: jest.fn().mockImplementation((items: unknown[]) => Promise.all(items)),
  };
  const audit = { write: jest.fn().mockResolvedValue(undefined) };
  const queue = { enqueueNow: jest.fn().mockResolvedValue(undefined), enqueueScheduled: jest.fn().mockResolvedValue(undefined), cancel: jest.fn().mockResolvedValue(undefined) };
  const gateway = { emitEvent: jest.fn(), emitToUser: jest.fn() };
  const broadcastNotificationsRepository = new BroadcastNotificationsRepository(prisma as unknown as ConstructorParameters<typeof BroadcastNotificationsRepository>[0]);
  const broadcastRecipientsRepository = new BroadcastRecipientsRepository(prisma as unknown as ConstructorParameters<typeof BroadcastRecipientsRepository>[0]);
  const service = new BroadcastsService(
    broadcastNotificationsRepository,
    broadcastRecipientsRepository,
    audit as unknown as ConstructorParameters<typeof BroadcastsService>[2],
    queue as unknown as ConstructorParameters<typeof BroadcastsService>[3],
    gateway as unknown as ConstructorParameters<typeof BroadcastsService>[4],
  );
  return { service, prisma, audit, queue };
}

const createUser = { uid: 'admin_1', role: UserRole.ADMIN, permissions: { broadcasts: ['create'] } };
const readUser = { uid: 'admin_1', role: UserRole.ADMIN, permissions: { broadcasts: ['read'] } };

describe('BroadcastsService', () => {
  it('ESTIMATE_REACH returns estimatedReach and does not create broadcast', async () => {
    const { service, prisma } = createService();
    const result = await service.create(readUser, wizardDto(BroadcastWizardAction.ESTIMATE_REACH));

    expect(result.data).toEqual({ estimatedReach: 6 });
    expect(prisma.broadcast.create).not.toHaveBeenCalled();
  });

  it('SAVE_DRAFT creates draft broadcast and writes audit log', async () => {
    const { service, prisma, audit } = createService();
    await service.create(createUser, wizardDto(BroadcastWizardAction.SAVE_DRAFT));

    expect(prisma.broadcast.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: BroadcastStatus.DRAFT, createdBy: 'admin_1' }) }));
    expect(audit.write).toHaveBeenCalledWith(expect.objectContaining({ action: 'BROADCAST_CREATED', actorType: UserRole.ADMIN }));
  });

  it('SEND_NOW creates processing broadcast and queues it', async () => {
    const { service, prisma, queue } = createService();
    await service.create(createUser, wizardDto(BroadcastWizardAction.SEND_NOW));

    expect(prisma.broadcast.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: BroadcastStatus.PROCESSING, sendMode: 'NOW' }) }));
    expect(queue.enqueueNow).toHaveBeenCalledWith('broadcast_created');
  });

  it('SCHEDULE creates scheduled broadcast and queues delayed delivery', async () => {
    const { service, prisma, queue } = createService();
    await service.create(createUser, wizardDto(BroadcastWizardAction.SCHEDULE));

    expect(prisma.broadcast.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: BroadcastStatus.SCHEDULED, sendMode: 'SCHEDULED' }) }));
    expect(queue.enqueueScheduled).toHaveBeenCalledWith('broadcast_created', expect.any(Date));
  });

  it('requires future sendAt for scheduled broadcasts', async () => {
    const { service } = createService();
    const dto = wizardDto(BroadcastWizardAction.SCHEDULE);
    dto.schedule.sendAt = new Date(Date.now() - 1000).toISOString();

    await expect(service.create(createUser, dto)).rejects.toThrow(BadRequestException);
  });

  it('requires frequency when recurring is enabled', async () => {
    const { service } = createService();
    const dto = wizardDto(BroadcastWizardAction.SCHEDULE);
    dto.schedule.recurring = { enabled: true, frequency: null };

    await expect(service.create(createUser, dto)).rejects.toThrow(BadRequestException);
  });

  it('provider-only location targeting works and uses real provider coordinates', async () => {
    const { service, prisma } = createService();
    prisma.user.findMany.mockResolvedValue([
      { id: 'provider_near', providerStoreAddress: { lat: 31.51, lng: 74.31 } },
      { id: 'provider_far', providerStoreAddress: { lat: 33.7, lng: 73.1 } },
      { id: 'provider_missing_location', providerStoreAddress: null },
    ]);
    const dto = wizardDto(BroadcastWizardAction.ESTIMATE_REACH);
    dto.targeting = { mode: TargetingMode.SPECIFIC_ROLES, roles: [TargetRole.PROVIDER], filters: { location: { lat: 31.5, lng: 74.3, radiusKm: 25 } } };

    const result = await service.create(readUser, dto);

    expect(result.data).toEqual({ estimatedReach: 1 });
    expect(prisma.user.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ role: UserRole.PROVIDER, providerApprovalStatus: 'APPROVED' }),
      select: { id: true, providerStoreAddress: true },
    }));
    expect(prisma.notificationDeviceToken.count).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ userId: { in: ['provider_near'] } }) }));
  });

  it('valid provider-only location targeting returns zero when no providers have matching location', async () => {
    const { service, prisma } = createService();
    prisma.user.findMany.mockResolvedValue([{ id: 'provider_missing_location', providerStoreAddress: null }]);
    const dto = wizardDto(BroadcastWizardAction.ESTIMATE_REACH);
    dto.targeting = { mode: TargetingMode.SPECIFIC_ROLES, roles: [TargetRole.PROVIDER], filters: { location: { lat: 31.5, lng: 74.3, radiusKm: 25 } } };

    const result = await service.create(readUser, dto);

    expect(result.data).toEqual({ estimatedReach: 0 });
  });

  it('rejects mixed provider/user/admin location targeting clearly', async () => {
    const { service } = createService();
    const dto = wizardDto(BroadcastWizardAction.ESTIMATE_REACH);
    dto.targeting.filters = { location: { lat: 31.5, lng: 74.3, radiusKm: 25 } };

    await expect(service.create(readUser, dto)).rejects.toThrow('LOCATION_FILTER_UNSUPPORTED_FOR_SELECTED_ROLES');
  });

  it('rejects invalid location filter coordinates and radius', async () => {
    const pipe = new ValidationPipe({ transform: true, whitelist: true });
    const dto = wizardDto(BroadcastWizardAction.ESTIMATE_REACH);

    await expect(pipe.transform({ ...dto, targeting: { mode: TargetingMode.SPECIFIC_ROLES, roles: [TargetRole.PROVIDER], filters: { location: { lat: 91, lng: 74.3, radiusKm: 25 } } } }, { type: 'body', metatype: CreateBroadcastDto })).rejects.toThrow();
    await expect(pipe.transform({ ...dto, targeting: { mode: TargetingMode.SPECIFIC_ROLES, roles: [TargetRole.PROVIDER], filters: { location: { lat: 31.5, lng: -181, radiusKm: 25 } } } }, { type: 'body', metatype: CreateBroadcastDto })).rejects.toThrow();
    await expect(pipe.transform({ ...dto, targeting: { mode: TargetingMode.SPECIFIC_ROLES, roles: [TargetRole.PROVIDER], filters: { location: { lat: 31.5, lng: 74.3, radiusKm: 501 } } } }, { type: 'body', metatype: CreateBroadcastDto })).rejects.toThrow();
    await expect(pipe.transform({ ...dto, targeting: { mode: TargetingMode.SPECIFIC_ROLES, roles: [TargetRole.PROVIDER], filters: { location: { lat: 31.5, lng: 74.3, radiusKm: 25 } } } }, { type: 'body', metatype: CreateBroadcastDto })).resolves.toBeInstanceOf(CreateBroadcastDto);
  });

  it('PATCH updates content, targeting, schedule and recalculates reach', async () => {
    const { service, prisma, audit } = createService({ status: BroadcastStatus.DRAFT });
    await service.update({ uid: 'admin_1', role: UserRole.ADMIN }, 'broadcast_1', {
      content: { title: 'Updated Notice', message: 'Updated message' },
      targeting: { mode: TargetingMode.SPECIFIC_ROLES, roles: [TargetRole.ADMIN] },
      schedule: { type: BroadcastScheduleType.SCHEDULED, sendAt: futureSendAt(), timezone: 'UTC', recurring: { enabled: false, frequency: null } },
    });

    expect(prisma.broadcast.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ title: 'Updated Notice', targetingJson: expect.any(Object), estimatedReachJson: expect.any(Object), status: BroadcastStatus.SCHEDULED }) }));
    expect(audit.write).toHaveBeenCalledWith(expect.objectContaining({ action: 'BROADCAST_UPDATED' }));
  });

  it('action CANCEL cancels editable broadcast and writes audit log', async () => {
    const { service, prisma, audit, queue } = createService({ status: BroadcastStatus.SCHEDULED, scheduledAt: new Date(Date.now() + 60 * 60 * 1000) });
    await service.action({ uid: 'admin_1', role: UserRole.ADMIN, permissions: { broadcasts: ['cancel'] } }, 'broadcast_1', { action: BroadcastManagementAction.CANCEL, reason: 'Campaign no longer needed.' });

    expect(prisma.broadcast.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: BroadcastStatus.CANCELLED, cancelReason: 'Campaign no longer needed.' }) }));
    expect(queue.cancel).toHaveBeenCalled();
    expect(audit.write).toHaveBeenCalledWith(expect.objectContaining({ action: 'BROADCAST_CANCELLED' }));
  });

  it('enforces action-specific permissions', async () => {
    const { service } = createService();
    await expect(service.create({ uid: 'admin_1', role: UserRole.ADMIN, permissions: { broadcasts: ['read'] } }, wizardDto(BroadcastWizardAction.SEND_NOW))).rejects.toThrow(ForbiddenException);
  });
});
