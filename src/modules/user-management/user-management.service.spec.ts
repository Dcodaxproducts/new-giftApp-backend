/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { UserRole } from '@prisma/client';
import { SuspensionReason } from './dto/user-management.dto';
import { UserManagementService } from './user-management.service';

function createService() {
  const prisma = {
    $transaction: jest.fn().mockImplementation((items: unknown[]) => Promise.all(items)),
    user: {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    adminAuditLog: { create: jest.fn(), findMany: jest.fn().mockResolvedValue([]) },
    loginAttempt: { findMany: jest.fn().mockResolvedValue([]) },
  };
  const service = new UserManagementService(
    prisma as unknown as ConstructorParameters<typeof UserManagementService>[0],
    { sendPasswordResetEmail: jest.fn() } as unknown as ConstructorParameters<typeof UserManagementService>[1],
    { updateStatus: jest.fn(), unsuspend: jest.fn() } as unknown as ConstructorParameters<typeof UserManagementService>[2],
  );
  return { service, prisma };
}

describe('UserManagementService', () => {
  it('GET /users excludes ADMIN and PROVIDER accounts', async () => {
    const { service, prisma } = createService();

    await service.list({});

    expect(prisma.user.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ role: UserRole.REGISTERED_USER }),
    }));
    expect(prisma.user.count).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ role: UserRole.REGISTERED_USER }),
    }));
  });

  it('delegates user suspend flow to shared account status service', async () => {
    const statusService = {
      updateStatus: jest.fn().mockResolvedValue({ id: 'user_1', status: 'SUSPENDED' }),
      unsuspend: jest.fn(),
    };
    const service = new UserManagementService(
      createService().prisma as unknown as ConstructorParameters<typeof UserManagementService>[0],
      { sendPasswordResetEmail: jest.fn() } as unknown as ConstructorParameters<typeof UserManagementService>[1],
      statusService as unknown as ConstructorParameters<typeof UserManagementService>[2],
    );

    await service.suspend({ uid: 'admin_1', role: UserRole.ADMIN }, 'user_1', {
      reason: SuspensionReason.POLICY_VIOLATION,
    });

    expect(statusService.updateStatus).toHaveBeenCalledWith(expect.objectContaining({
      accountId: 'user_1',
      targetType: 'REGISTERED_USER',
      status: 'SUSPENDED',
    }));
  });

  it('delegates user unsuspend flow to shared account status service', async () => {
    const statusService = {
      updateStatus: jest.fn(),
      unsuspend: jest.fn().mockResolvedValue({ id: 'user_1', status: 'ACTIVE' }),
    };
    const service = new UserManagementService(
      createService().prisma as unknown as ConstructorParameters<typeof UserManagementService>[0],
      { sendPasswordResetEmail: jest.fn() } as unknown as ConstructorParameters<typeof UserManagementService>[1],
      statusService as unknown as ConstructorParameters<typeof UserManagementService>[2],
    );

    await service.unsuspend({ uid: 'admin_1', role: UserRole.ADMIN }, 'user_1', {});

    expect(statusService.unsuspend).toHaveBeenCalledWith(expect.objectContaining({
      accountId: 'user_1',
      targetType: 'REGISTERED_USER',
    }));
  });
});
