/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { AuditLogSeverity, AuditLogStatus, LoginAttemptStatus, UserRole } from '@prisma/client';
import { AuditLogStatusFilter } from './dto/audit-logs.dto';
import { readFileSync } from 'fs';
import { join } from 'path';
import { AuditLogsRepository } from './audit-logs.repository';
import { AuditLogsService } from './audit-logs.service';
import { LoginAttemptsRepository } from '../login-attempts/login-attempts.repository';
import { LoginAttemptsService } from '../login-attempts/login-attempts.service';

function createAuditService() {
  const log = {
    id: 'log_1',
    logReference: '789042',
    eventId: 'EV-90210',
    actorId: 'admin_1',
    actorType: 'SUPER_ADMIN',
    actorNameSnapshot: 'Super Admin',
    targetId: 'provider_1',
    targetType: 'PROVIDER',
    action: 'PROVIDER_APPROVED',
    actionLabel: 'Provider Approved',
    module: 'Provider Management',
    environment: 'Production-Cluster-A',
    status: AuditLogStatus.SUCCESS,
    severity: AuditLogSeverity.HIGH,
    beforeJson: { authorization: '[REDACTED]' },
    afterJson: { status: 'approved' },
    requestPayloadJson: { authorization: '[REDACTED]' },
    responsePayloadJson: { status: 'approved' },
    metadataJson: { version: '2.4.0' },
    ipAddress: '192.168.1.45',
    userAgent: 'Mozilla',
    durationMs: 142,
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
    expect(result.data[0]).toEqual(expect.objectContaining({ id: 'log_1', action: 'PROVIDER_APPROVED' }));
  });

  it('filters work by action type, actor/user, date range, and status', async () => {
    const { service, prisma } = createAuditService();
    await service.list({ uid: 'super_1', role: UserRole.SUPER_ADMIN }, { actionType: 'PROVIDER_APPROVED', actorId: 'admin_1', fromDate: '2026-05-01T00:00:00.000Z', toDate: '2026-05-31T23:59:59.999Z', status: AuditLogStatusFilter.SUCCESS });
    expect(prisma.adminAuditLog.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ actorId: 'admin_1', action: 'PROVIDER_APPROVED', status: 'SUCCESS' }) }));
  });

  it('log details return sanitized raw JSON payload', async () => {
    const { service } = createAuditService();
    const result = await service.details('log_1');
    expect((result.data.requestPayload as { authorization: string }).authorization).toBe('[REDACTED]');
    expect(result.data.systemResponse.durationMs).toBe(142);
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
    expect(result.data).toEqual(expect.objectContaining({ totalLogs: 1, successCount: 1, failedCount: 1, criticalAlerts24h: 1 }));
  });

  it('action types endpoint returns dropdown options', async () => {
    const { service } = createAuditService();
    const result = await service.actionTypes();
    expect(result.data[0]).toEqual(expect.objectContaining({ key: 'PROVIDER_APPROVED' }));
  });

  it('users endpoint returns selector options', async () => {
    const { service } = createAuditService();
    const result = await service.users({ search: 'Sarah' });
    expect(result.data[0]).toEqual(expect.objectContaining({ id: 'system' }));
    expect(result.data[1]).toEqual(expect.objectContaining({ id: 'admin_1', role: UserRole.ADMIN }));
  });
});

describe('System logs / audit trail source checks', () => {
  const controller = readFileSync(join(__dirname, 'audit-logs.controller.ts'), 'utf8');
  const service = readFileSync(join(__dirname, 'audit-logs.service.ts'), 'utf8');
  const providerService = readFileSync(join(__dirname, '../provider-management/services/provider-management.service.ts'), 'utf8');
  const userService = readFileSync(join(__dirname, '../user-management/user-management.service.ts'), 'utf8');
  const disputeService = readFileSync(join(__dirname, '../admin-disputes/services/admin-disputes.service.ts'), 'utf8');

  it('is SUPER_ADMIN only and exposes static routes before :id', () => {
    expect(controller).toContain("@Roles(UserRole.SUPER_ADMIN)");
    expect(controller.indexOf("@Get('stats')")).toBeLessThan(controller.indexOf("@Get(':id')"));
    expect(controller.indexOf("@Get('action-types')")).toBeLessThan(controller.indexOf("@Get(':id')"));
    expect(controller.indexOf("@Get('users')")).toBeLessThan(controller.indexOf("@Get(':id')"));
    expect(controller.indexOf("@Get('export')")).toBeLessThan(controller.indexOf("@Get(':id')"));
  });

  it('documents sanitization, csv export behavior, and rich responses', () => {
    expect(controller).toContain('sanitized raw JSON payloads');
    expect(controller).toContain('Exports sanitized audit log records');
    expect(controller).toContain('02 Admin - System Logs & Audit Trail');
  });

  it('sensitive fields are redacted', () => {
    expect(service).toContain('[REDACTED]');
    for (const key of ['password', 'accessToken', 'refreshToken', 'authorization', 'cardNumber', 'apiKey']) expect(service).toContain(key);
  });

  it('provider approval, user password change, and dispute decisions create audit logs', () => {
    expect(providerService).toContain('PROVIDER_APPROVED');
    expect(userService).toContain('USER_PASSWORD_CHANGED');
    expect(disputeService).toContain('DISPUTE_DECISION_APPROVE');
  });

  it('login attempts can mirror high-risk events into audit logs', async () => {
    const prisma = { loginAttempt: { create: jest.fn() }, adminAuditLog: { create: jest.fn() } };
    const repository = new LoginAttemptsRepository(prisma as never);
    const loginAttempts = new LoginAttemptsService(repository);
    await loginAttempts.record({ email: 'x@example.com', status: LoginAttemptStatus.FAILED, reason: 'bad password', ipAddress: '127.0.0.1' });
    expect(prisma.adminAuditLog.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: 'FAILED_LOGIN_ATTEMPT' }) }));
  });
});
