/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { readFileSync } from 'fs';
import { AuditLogWriterService } from './audit-log.service';

describe('AuditLogWriterService', () => {
  it('redacts sensitive audit payloads before writing', async () => {
    const prisma = { adminAuditLog: { create: jest.fn().mockResolvedValue({ id: 'audit_1' }) } };
    const service = new AuditLogWriterService(prisma as never);

    await service.write({
      actorId: 'admin_1',
      targetId: 'user_1',
      targetType: 'USER',
      action: 'USER_UPDATE',
      beforeJson: { password: 'secret', nested: { refreshToken: 'token', safe: 'ok' } },
      metadataJson: { apiKey: 'key', normal: 'value' },
    });

    expect(prisma.adminAuditLog.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        beforeJson: { password: '[REDACTED]', nested: { refreshToken: '[REDACTED]', safe: 'ok' } },
        requestPayloadJson: { password: '[REDACTED]', nested: { refreshToken: '[REDACTED]', safe: 'ok' } },
        metadataJson: { apiKey: '[REDACTED]', normal: 'value' },
      }),
    }));
  });

  it('keeps direct Prisma as documented shared infrastructure exception', () => {
    const source = readFileSync('src/common/services/audit-log.service.ts', 'utf8');
    expect(source).toContain('Intentional shared-infrastructure exception');
    expect(source).toContain('this.prisma.adminAuditLog.create');
  });
});
