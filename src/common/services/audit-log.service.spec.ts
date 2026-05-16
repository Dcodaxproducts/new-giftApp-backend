/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { readFileSync } from 'fs';
import { AuditLogWriterService } from './audit-log.service';

describe('AuditLogWriterService', () => {
  it('redacts sensitive audit payloads before writing and preserves audit payload shape', async () => {
    const repository = { createAdminAuditLog: jest.fn().mockResolvedValue({ id: 'audit_1' }) };
    const service = new AuditLogWriterService(repository as never);

    await service.write({
      actorId: 'admin_1',
      targetId: 'user_1',
      targetType: 'USER',
      action: 'USER_UPDATE',
      beforeJson: { password: 'secret', nested: { refreshToken: 'token', safe: 'ok' } },
      metadataJson: { apiKey: 'key', normal: 'value' },
    });

    expect(repository.createAdminAuditLog).toHaveBeenCalledWith(expect.objectContaining({
      actorId: 'admin_1',
      targetId: 'user_1',
      targetType: 'USER',
      action: 'USER_UPDATE',
      actionLabel: 'User Update',
      module: 'User Management',
      status: 'SUCCESS',
      severity: 'MEDIUM',
      beforeJson: { password: '[REDACTED]', nested: { refreshToken: '[REDACTED]', safe: 'ok' } },
      requestPayloadJson: { password: '[REDACTED]', nested: { refreshToken: '[REDACTED]', safe: 'ok' } },
      metadataJson: { apiKey: '[REDACTED]', normal: 'value' },
      logReference: expect.any(String),
      eventId: expect.stringMatching(/^EV-\d{6}$/),
    }));
  });

  it('no longer imports PrismaService or uses this.prisma and repository owns adminAuditLog.create', () => {
    const source = readFileSync('src/common/services/audit-log.service.ts', 'utf8');
    const repositorySource = readFileSync('src/common/repositories/audit-log-writer.repository.ts', 'utf8');
    expect(source).not.toContain('PrismaService');
    expect(source).not.toContain('this.prisma');
    expect(source).toContain('AuditLogWriterRepository');
    expect(source).toContain('repository.createAdminAuditLog');
    expect(repositorySource).toContain('constructor(private readonly prisma: PrismaService)');
    expect(repositorySource).toContain('this.prisma.adminAuditLog.create');
  });

  it('existing modules still write audit logs through the shared service', () => {
    const accountStatusSource = readFileSync('src/common/services/account-status.service.ts', 'utf8');
    const broadcastsSource = readFileSync('src/modules/broadcast-notifications/services/broadcasts.service.ts', 'utf8');
    expect(accountStatusSource).toContain('this.auditLog.write');
    expect(broadcastsSource).toContain('this.auditLog.write');
  });
});
