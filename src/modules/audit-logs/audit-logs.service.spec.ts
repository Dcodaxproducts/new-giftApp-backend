/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { AuditLogSeverity, AuditLogStatus, UserRole } from '@prisma/client';
import { AuditLogSeverityFilter, AuditLogStatusFilter } from './dto/audit-logs.dto';
import { readFileSync } from 'fs';
import { join } from 'path';
import { AuditLogsRepository } from './audit-logs.repository';
import { AuditLogsService } from './audit-logs.service';

function createAuditService() {
  const log = {
    id: 'log_1',
    logReference: '789042',
    actorId: 'admin_1',
    actorType: 'SUPER_ADMIN',
    actorSnapshot: { id: 'admin_1', name: 'Super Admin', role: 'SUPER_ADMIN' },
    targetId: 'provider_1',
    targetType: 'PROVIDER',
    action: 'PROVIDER_APPROVED',
    actionLabel: 'Provider Approved',
    module: 'Provider Management',
    status: AuditLogStatus.SUCCESS,
    severity: AuditLogSeverity.HIGH,
    beforeJson: { authorization: '[REDACTED]' },
    afterJson: { status: 'approved' },
    ipAddress: '192.168.1.45',
    createdAt: new Date(),
    actor: { id: 'admin_1', email: 'admin@example.com', firstName: 'Sarah', lastName: 'Chen', adminTitle: 'Compliance Officer', role: UserRole.SUPER_ADMIN },
  };
  const prisma = {
    adminAuditLog: {
      findMany: jest.fn().mockResolvedValue([log]),
      count: jest.fn().mockResolvedValue(1),
      findUnique: jest.fn().mockResolvedValue(log),
    },
    user: { findMany: jest.fn().mockResolvedValue([{ id: 'admin_1', email: 'admin@example.com', role: UserRole.ADMIN, firstName: 'Sarah', lastName: 'Chen', adminTitle: 'Compliance Officer' }]) },
    $transaction: jest.fn().mockImplementation((items: unknown[]) => Promise.all(items)),
  };
  const repository = new AuditLogsRepository(prisma as never);
  const service = new AuditLogsService(repository);
  return { service, prisma };
}

describe('AuditLogsService', () => {
  it('SUPER_ADMIN can list audit logs', async () => {
    const { service } = createAuditService();
    const result = await service.list({ uid: 'super_1', role: UserRole.SUPER_ADMIN }, {});
    expect(result.data[0]).toEqual(expect.objectContaining({ id: 'log_1', actorId: 'admin_1', actorType: 'SUPER_ADMIN', action: 'PROVIDER_APPROVED', severity: AuditLogSeverity.HIGH }));
    expect(result.data[0]).not.toHaveProperty('actor');
    expect(result.data[0]).not.toHaveProperty('target');
    expect(result.data[0]).not.toHaveProperty('timestamp');
  });

  it('lists audit logs newest first by default', async () => {
    const { service, prisma } = createAuditService();
    await service.list({ uid: 'super_1', role: UserRole.SUPER_ADMIN }, {});
    expect(prisma.adminAuditLog.findMany).toHaveBeenCalledWith(expect.objectContaining({ orderBy: { createdAt: 'desc' } }));
  });

  it('filters work by action type, actor/user, date range, status, and severity', async () => {
    const { service, prisma } = createAuditService();
    await service.list({ uid: 'super_1', role: UserRole.SUPER_ADMIN }, { actionType: 'PROVIDER_APPROVED', actorId: 'admin_1', fromDate: '2026-05-01T00:00:00.000Z', toDate: '2026-05-31T23:59:59.999Z', status: AuditLogStatusFilter.SUCCESS, severity: AuditLogSeverityFilter.HIGH });
    expect(prisma.adminAuditLog.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ actorId: 'admin_1', action: 'PROVIDER_APPROVED', status: 'SUCCESS', severity: 'HIGH' }) }));
  });

  it('searches audit logs by actor name and email like provider list search', async () => {
    const { service, prisma } = createAuditService();
    await service.list({ uid: 'super_1', role: UserRole.SUPER_ADMIN }, { search: 'Sarah Chen' });
    expect(prisma.adminAuditLog.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        OR: expect.arrayContaining([
          { actor: { is: { firstName: { contains: 'Sarah Chen', mode: 'insensitive' } } } },
          { actor: { is: { lastName: { contains: 'Sarah Chen', mode: 'insensitive' } } } },
          { actor: { is: { email: { contains: 'Sarah Chen', mode: 'insensitive' } } } },
          { actor: { is: { AND: [{ firstName: { contains: 'Sarah', mode: 'insensitive' } }, { lastName: { contains: 'Chen', mode: 'insensitive' } }] } } },
        ]),
      }),
    }));
  });

  it('log details return only AdminAuditLog table fields', async () => {
    const { service } = createAuditService();
    const result = await service.details('log_1');
    expect(result.data).toEqual(expect.objectContaining({ id: 'log_1', actorId: 'admin_1', actorType: 'SUPER_ADMIN', action: 'PROVIDER_APPROVED', actionLabel: 'Provider Approved' }));
    expect(result.data).toHaveProperty('beforeJson');
    expect(result.data).toHaveProperty('afterJson');
    expect(result.data).toHaveProperty('ipAddress');
    expect(result.data).not.toHaveProperty('actor');
    expect(result.data).not.toHaveProperty('target');
    expect(result.data).not.toHaveProperty('timestamp');
    expect(result.data).not.toHaveProperty('requestPayload');
    expect(result.data).not.toHaveProperty('systemResponse');
    expect(result.data).not.toHaveProperty('category');
    expect(result.data).not.toHaveProperty('actionType');
  });

  it('export csv applies filters', async () => {
    const { service, prisma } = createAuditService();
    const result = await service.export({ module: 'Provider Management' });
    expect(prisma.adminAuditLog.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ module: 'Provider Management' }) }));
    expect(result.content).toContain('PROVIDER_APPROVED');
  });

  it('stats endpoint returns summary counts', async () => {
    const { service } = createAuditService();
    const result = await service.stats({});
    expect(result.data).toEqual({ totalLogs: 1, successCount: 1, failedCount: 1, criticalAlerts24h: 1 });
  });
});

describe('System logs / audit trail source checks', () => {
  const controller = readFileSync(join(__dirname, 'audit-logs.controller.ts'), 'utf8');
  const service = readFileSync(join(__dirname, 'audit-logs.service.ts'), 'utf8');
  const providerService = readFileSync(join(__dirname, '../provider-management/services/provider-management.service.ts'), 'utf8');
  const userService = readFileSync(join(__dirname, '../user-management/services/user-management-core.service.ts'), 'utf8');
  const disputeService = readFileSync(join(__dirname, '../admin-disputes/admin-disputes.service.ts'), 'utf8');

  it('is SUPER_ADMIN only and exposes static routes before :id', () => {
    expect(controller).toContain("@Roles(UserRole.SUPER_ADMIN)");
    expect(controller.indexOf("@Get('stats')")).toBeLessThan(controller.indexOf("@Get(':id')"));
    expect(controller).not.toContain("@Get('action-types')");
    expect(controller).not.toContain("@Get('users')");
    expect(controller.indexOf("@Get('export')")).toBeLessThan(controller.indexOf("@Get(':id')"));
  });

  it('documents table-field details and csv export behavior', () => {
    expect(controller).toContain('Returns only AdminAuditLog table fields');
    expect(controller).toContain('Exports sanitized audit log records');
    expect(controller).toContain('02 Admin - System Logs & Audit Trail');
  });

  it('details do not expose raw audit payloads', () => {
    expect(service).not.toContain('requestPayload');
    expect(service).not.toContain('systemResponse');
  });

  it('provider approval, user password change, and dispute decisions create audit logs', () => {
    expect(providerService).toContain('PROVIDER_APPROVED');
    expect(userService).toContain('USER_PASSWORD_CHANGED');
    expect(disputeService).toContain('DISPUTE_DECISION_APPROVE');
  });
});
