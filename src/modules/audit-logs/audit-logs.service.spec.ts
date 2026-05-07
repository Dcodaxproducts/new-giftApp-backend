/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { AuditLogsService } from './audit-logs.service';

function createService() {
  const log = { id: 'log_1', actorId: 'admin_1', targetId: 'target_1', targetType: 'GIFT', action: 'GIFT_CREATED', beforeJson: null, afterJson: null, ipAddress: null, userAgent: null, createdAt: new Date(), actor: { email: 'admin@example.com' } };
  const prisma = { adminAuditLog: { findMany: jest.fn().mockResolvedValue([log]), count: jest.fn().mockResolvedValue(1), findUnique: jest.fn().mockResolvedValue(log) }, $transaction: jest.fn().mockImplementation((items: unknown[]) => Promise.all(items)) };
  const service = new AuditLogsService(prisma as unknown as ConstructorParameters<typeof AuditLogsService>[0]);
  return { service, prisma };
}

describe('AuditLogsService', () => {
  it('fetches audit log details', async () => {
    const { service } = createService();
    const result = await service.details('log_1');
    expect(result.data.id).toBe('log_1');
  });

  it('exports audit logs as csv with filters', async () => {
    const { service, prisma } = createService();
    const result = await service.export({ targetType: 'GIFT' });
    expect(prisma.adminAuditLog.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ targetType: 'GIFT' }) }));
    expect(result.content).toContain('GIFT_CREATED');
  });
});
