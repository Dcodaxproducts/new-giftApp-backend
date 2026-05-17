import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AdminPayoutSchedule, Prisma, UserRole } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';
import { AdminPayoutSettingsRepository } from '../repositories/admin-payout-settings.repository';
import { CommissionTiersRepository } from '../repositories/commission-tiers.repository';
import { AdminPayoutSettingsService } from '../services/admin-payout-settings.service';

const now = new Date('2026-05-16T10:00:00.000Z');
const settings = {
  id: 'payout_settings_1',
  platformRatePercent: new Prisma.Decimal(5),
  minimumPayoutThreshold: new Prisma.Decimal(100),
  currency: 'USD',
  payoutSchedule: AdminPayoutSchedule.MONTHLY_LAST_DAY,
  payoutTimeUtc: '00:00',
  autoPayoutEnabled: true,
  updatedById: 'admin_1',
  createdAt: now,
  updatedAt: now,
  updatedBy: { id: 'admin_1', firstName: 'Alex', lastName: 'Rivera' },
};
const tier = { id: 'tier_standard', name: 'Standard Tier', commissionRatePercent: new Prisma.Decimal(15), orderVolumeThreshold: new Prisma.Decimal(0), sortOrder: 1, isActive: true, updatedById: 'admin_1', deletedAt: null, createdAt: now, updatedAt: now, updatedBy: { id: 'admin_1', firstName: 'Alex', lastName: 'Rivera' } };

function createService(overrides: Partial<{ settings: typeof settings | null; tiers: typeof tier[]; duplicateTier: unknown; tierById: typeof tier | null }> = {}) {
  const prisma = {
    adminPayoutSettings: { findFirst: jest.fn().mockResolvedValue(overrides.settings === undefined ? settings : overrides.settings), create: jest.fn().mockResolvedValue(settings), update: jest.fn().mockResolvedValue({ ...settings, platformRatePercent: new Prisma.Decimal(6) }) },
    commissionTier: { findMany: jest.fn().mockResolvedValue(overrides.tiers ?? [tier]), findFirst: jest.fn().mockImplementation((args: { where?: { orderVolumeThreshold?: Prisma.Decimal } }) => args.where?.orderVolumeThreshold ? Promise.resolve(overrides.duplicateTier ?? null) : Promise.resolve(overrides.tierById === undefined ? tier : overrides.tierById)), create: jest.fn().mockResolvedValue({ ...tier, id: 'tier_gold', name: 'Gold Elite', commissionRatePercent: new Prisma.Decimal(10), orderVolumeThreshold: new Prisma.Decimal(15000), sortOrder: 3 }), update: jest.fn().mockResolvedValue({ ...tier, name: 'Gold Elite', commissionRatePercent: new Prisma.Decimal(10), orderVolumeThreshold: new Prisma.Decimal(15000), sortOrder: 3 }) },
    adminAuditLog: { findMany: jest.fn().mockResolvedValue([{ id: 'audit_1', action: 'PAYOUT_SETTINGS_UPDATED', targetType: 'PAYOUT_SETTINGS', beforeJson: { platformRatePercent: 5 }, afterJson: { platformRatePercent: 6 }, createdAt: now, actor: { id: 'admin_1', firstName: 'Alex', lastName: 'Rivera' } }]), count: jest.fn().mockResolvedValue(1) },
    $transaction: jest.fn((operations: Promise<unknown>[]) => Promise.all(operations)),
  };
  const auditLog = { write: jest.fn().mockResolvedValue(undefined) };
  const configService = { get: jest.fn((key: string, fallback?: string) => key === 'PAYOUT_ALLOWED_CURRENCIES' ? 'USD,PKR' : fallback) };
  const settingsRepository = new AdminPayoutSettingsRepository(prisma as never);
  const tiersRepository = new CommissionTiersRepository(prisma as never);
  const service = new AdminPayoutSettingsService(settingsRepository, tiersRepository, auditLog as never, configService as unknown as ConfigService);
  return { service, prisma, auditLog };
}

const user = { uid: 'admin_1', role: UserRole.ADMIN };
const settingsDto = { platformRatePercent: 5, minimumPayoutThreshold: 100, currency: 'USD', payoutSchedule: AdminPayoutSchedule.MONTHLY_LAST_DAY, payoutTimeUtc: '00:00', autoPayoutEnabled: true };
const tierDto = { name: 'Gold Elite', commissionRatePercent: 10, orderVolumeThreshold: 15000, sortOrder: 3, isActive: true };

describe('AdminPayoutSettingsService', () => {
  it('fetches settings with commission tiers', async () => {
    const { service } = createService();
    const response = await service.get();
    expect(response.data).toMatchObject({ platformRatePercent: 5, minimumPayoutThreshold: 100, currency: 'USD', payoutSchedule: 'MONTHLY_LAST_DAY', payoutTimeUtc: '00:00', autoPayoutEnabled: true, commissionTiers: [{ id: 'tier_standard', name: 'Standard Tier', commissionRatePercent: 15, orderVolumeThreshold: 0, sortOrder: 1, isActive: true }] });
  });

  it('creates default settings when missing', async () => {
    const { service, prisma } = createService({ settings: null });
    await service.get();
    const createCalls = prisma.adminPayoutSettings.create.mock.calls as unknown[][];
    expect(createCalls[0]?.[0]).toMatchObject({ data: { currency: 'USD' } });
  });

  it('updates settings and writes audit log without touching historical payouts', async () => {
    const { service, prisma, auditLog } = createService();
    const response = await service.update(user, settingsDto);
    expect(response.message).toBe('Payout settings updated successfully.');
    const updateCalls = prisma.adminPayoutSettings.update.mock.calls as unknown[][];
    expect(updateCalls[0]?.[0]).toMatchObject({ where: { id: 'payout_settings_1' } });
    const auditCalls = auditLog.write.mock.calls as unknown[][];
    expect(auditCalls[0]?.[0]).toMatchObject({ action: 'PAYOUT_SETTINGS_UPDATED', targetType: 'PAYOUT_SETTINGS', metadataJson: { appliesToFuturePayoutsOnly: true, tierChangesEffectiveFrom: 'NEXT_BILLING_OR_PAYOUT_CYCLE' } });
    expect(JSON.stringify(prisma)).not.toContain('providerPayout.update');
  });

  it('rejects unsupported payout currency', async () => {
    const { service } = createService();
    await expect(service.update(user, { ...settingsDto, currency: 'EUR' })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('creates, updates, and deletes commission tiers with audit logs', async () => {
    const { service, prisma, auditLog } = createService();
    await expect(service.createTier(user, tierDto)).resolves.toMatchObject({ data: { id: 'tier_gold', name: 'Gold Elite', commissionRatePercent: 10, orderVolumeThreshold: 15000 } });
    await expect(service.updateTier(user, 'tier_standard', tierDto)).resolves.toMatchObject({ message: 'Commission tier updated successfully.' });
    await expect(service.deleteTier(user, 'tier_standard')).resolves.toEqual({ data: { id: 'tier_standard', deleted: true }, message: 'Commission tier deleted successfully.' });
    expect(prisma.commissionTier.create).toHaveBeenCalledTimes(1);
    expect(prisma.commissionTier.update).toHaveBeenCalledTimes(2);
    const actions = (auditLog.write.mock.calls as unknown[][]).map((call) => (call[0] as { action: string }).action);
    expect(actions).toEqual(expect.arrayContaining(['COMMISSION_TIER_CREATED', 'COMMISSION_TIER_UPDATED', 'COMMISSION_TIER_DELETED']));
  });

  it('rejects conflicting tier thresholds and missing tier updates', async () => {
    await expect(createService({ duplicateTier: tier }).service.createTier(user, tierDto)).rejects.toBeInstanceOf(ConflictException);
    await expect(createService({ tierById: null }).service.updateTier(user, 'missing', tierDto)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns audit logs for settings and tier changes', async () => {
    const { service, prisma } = createService();
    const response = await service.auditLogs({ page: 1, limit: 20 });
    expect(response.data[0]).toMatchObject({ id: 'audit_1', action: 'PAYOUT_SETTINGS_UPDATED', actor: { id: 'admin_1', name: 'Alex Rivera' } });
    const findManyCalls = prisma.adminAuditLog.findMany.mock.calls as unknown[][];
    expect(findManyCalls[0]?.[0]).toMatchObject({ where: { action: { in: ['PAYOUT_SETTINGS_UPDATED', 'COMMISSION_TIER_CREATED', 'COMMISSION_TIER_UPDATED', 'COMMISSION_TIER_DELETED'] } } });
  });
});

describe('Admin payout settings source safety', () => {
  const controller = readFileSync(join(__dirname, '../controllers/admin-payout-settings.controller.ts'), 'utf8');
  const dto = readFileSync(join(__dirname, '../dto/admin-payout-settings.dto.ts'), 'utf8');
  const schema = readFileSync(join(__dirname, '../../../../prisma/schema.prisma'), 'utf8');
  const permissions = readFileSync(join(__dirname, '../../admin-roles/constants/permission-catalog.ts'), 'utf8');
  const main = readFileSync(join(__dirname, '../../../main.ts'), 'utf8');
  const swaggerAccess = readFileSync(join(__dirname, '../../../swagger-access.ts'), 'utf8');

  it('adds required schema, repositories, permissions, and Swagger metadata', () => {
    expect(schema).toContain('model AdminPayoutSettings');
    expect(schema).toContain('model CommissionTier');
    expect(permissions).toContain("module: 'payoutSettings'");
    expect(permissions).toContain("key: 'read'");
    expect(permissions).toContain("key: 'update'");
    expect(controller).toContain("@ApiTags('02 Admin - Commission & Payout Settings')");
    expect(main).toContain("'02 Admin - Commission & Payout Settings'");
    expect(swaggerAccess).toContain('GET /api/v1/admin/payout-settings');
  });

  it('exposes required routes with read/update permissions and strict validation', () => {
    for (const route of ["@Get()", "@Patch()", "@Get('commission-tiers')", "@Post('commission-tiers')", "@Patch('commission-tiers/:id')", "@Delete('commission-tiers/:id')", "@Get('audit-logs')"]) expect(controller).toContain(route);
    expect(controller.match(/@Permissions\('payoutSettings\.read'\)/g)).toHaveLength(3);
    expect(controller.match(/@Permissions\('payoutSettings\.update'\)/g)).toHaveLength(4);
    expect(dto).toContain('@Min(0) @Max(100) platformRatePercent');
    expect(dto).toContain('@Min(0) @Max(100) commissionRatePercent');
    expect(dto).toContain('@IsEnum(AdminPayoutSchedule) payoutSchedule');
    expect(dto).toContain('@Matches(/^([01]\\d|2[0-3]):[0-5]\\d$/) payoutTimeUtc');
  });
});
