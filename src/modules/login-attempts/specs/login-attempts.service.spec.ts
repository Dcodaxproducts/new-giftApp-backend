import { LoginAttemptStatus, UserRole } from '@prisma/client';
import { LoginAttemptsRepository } from '../repositories/login-attempts.repository';
import { LoginAttemptsService } from '../services/login-attempts.service';

function createService() {
  const attempt = { id: 'attempt_1', email: 'a@example.com', status: LoginAttemptStatus.SUCCESS, reason: null, ipAddress: '127.0.0.1', userAgent: null, userId: 'user_1', role: UserRole.ADMIN, createdAt: new Date() };
  const prisma = { loginAttempt: { count: jest.fn().mockResolvedValue(1), findMany: jest.fn().mockResolvedValue([attempt]), create: jest.fn() }, adminAuditLog: { create: jest.fn() }, $transaction: jest.fn().mockImplementation((items: unknown[]) => Promise.all(items)) };
  const repository = new LoginAttemptsRepository(prisma as unknown as ConstructorParameters<typeof LoginAttemptsRepository>[0]);
  const service = new LoginAttemptsService(repository);
  return { service, prisma };
}

describe('LoginAttemptsService', () => {
  it('returns stats for security dashboard', async () => {
    const { service } = createService();
    const result = await service.stats({});
    expect(result.data).toEqual(expect.objectContaining({ totalAttempts: 1, successCount: 1, failedCount: 1, blockedCount: 1, uniqueEmails: 1, uniqueIps: 1 }));
  });

  it('exports login attempts as csv', async () => {
    const { service } = createService();
    const result = await service.export({});
    expect(result.content).toContain('a@example.com');
  });
});
