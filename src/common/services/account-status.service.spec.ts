/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { BadRequestException } from '@nestjs/common';
import { readFileSync } from 'fs';
import { AccountType, UserRole } from '@prisma/client';
import { AccountStatusRepository } from '../repositories/account-status.repository';
import { AccountStatusService } from './account-status.service';

const baseUser = {
  id: 'user_1',
  email: 'user@example.com',
  password: 'hash',
  role: UserRole.REGISTERED_USER,
  firstName: 'Test',
  lastName: 'User',
  phone: null,
  avatarUrl: null,
  location: null,
  adminRoleId: null,
  isVerified: true,
  isActive: true,
  isApproved: true,
  mustChangePassword: false,
  lastLoginAt: null,
  adminTitle: null,
  adminPermissions: null,
  providerBusinessName: null,
  providerServiceArea: null,
  providerDocuments: null,
  providerApprovalStatus: null,
  providerApprovedAt: null,
  providerApprovedBy: null,
  providerRejectedAt: null,
  providerRejectedBy: null,
  providerRejectionReason: null,
  providerRejectionComment: null,
  verificationOtp: null,
  verificationOtpExpiresAt: null,
  verificationOtpAttempts: 0,
  resetPasswordOtp: null,
  resetPasswordOtpExpiresAt: null,
  resetPasswordOtpAttempts: 0,
  suspensionReason: null,
  suspensionComment: null,
  suspendedAt: null,
  suspendedBy: null,
  refreshTokenHash: 'refresh',
  deletedAt: null,
  deleteAfter: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

function createService() {
  const prisma = {
    user: {
      findFirst: jest.fn().mockResolvedValue(baseUser),
      update: jest.fn().mockImplementation(({ data }) => Promise.resolve({ ...baseUser, ...data })),
    },
    accountSuspension: {
      create: jest.fn().mockResolvedValue({ id: 'suspension_1' }),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
  };
  const auditLog = { write: jest.fn().mockResolvedValue(undefined) };
  const mailer = { sendAccountStatusEmail: jest.fn().mockResolvedValue(undefined) };
  const repository = new AccountStatusRepository(prisma as unknown as ConstructorParameters<typeof AccountStatusRepository>[0]);
  const service = new AccountStatusService(
    repository,
    auditLog as unknown as ConstructorParameters<typeof AccountStatusService>[1],
    mailer as unknown as ConstructorParameters<typeof AccountStatusService>[2],
  );
  return { service, repository, prisma, auditLog, mailer };
}

describe('AccountStatusService', () => {
  it('uses repository for account status persistence', () => {
    const serviceSource = readFileSync('src/common/services/account-status.service.ts', 'utf8');
    const repositorySource = readFileSync('src/common/repositories/account-status.repository.ts', 'utf8');
    expect(serviceSource).not.toContain('PrismaService');
    expect(serviceSource).not.toContain('this.prisma');
    expect(repositorySource).toContain('constructor(private readonly prisma: PrismaService)');
    expect(repositorySource).toContain('createAccountSuspension');
  });

  it('creates suspension history and disables account on suspend', async () => {
    const { service, prisma, auditLog } = createService();

    const response = await service.updateStatus({
      actorId: 'admin_1',
      accountId: 'user_1',
      accountType: AccountType.REGISTERED_USER,
      status: 'SUSPENDED',
      reason: 'POLICY_VIOLATION',
      comment: 'Bad behavior',
      activeStatuses: ['ACTIVE'],
      suspendedStatus: 'SUSPENDED',
      actionPrefix: 'REGISTERED_USER',
      targetType: 'REGISTERED_USER',
    });

    expect(prisma.accountSuspension.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ reason: 'POLICY_VIOLATION', isActive: true }),
    }));
    expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ isActive: false, suspensionReason: 'POLICY_VIOLATION' }),
    }));
    expect(auditLog.write).toHaveBeenCalledWith(expect.objectContaining({ action: 'REGISTERED_USER_SUSPENDED' }));
    expect(response.status).toBe('SUSPENDED');
  });

  it('unsuspends active suspension history and restores account', async () => {
    const { service, prisma, auditLog } = createService();

    const response = await service.unsuspend({
      actorId: 'admin_1',
      accountId: 'user_1',
      accountType: AccountType.REGISTERED_USER,
      comment: 'Reviewed',
      activeStatuses: ['ACTIVE'],
      suspendedStatus: 'SUSPENDED',
      actionPrefix: 'REGISTERED_USER',
      targetType: 'REGISTERED_USER',
    });

    expect(prisma.accountSuspension.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ isActive: false, unsuspendedBy: 'admin_1' }),
    }));
    expect(auditLog.write).toHaveBeenCalledWith(expect.objectContaining({ action: 'REGISTERED_USER_UNSUSPENDED' }));
    expect(response.status).toBe('ACTIVE');
  });

  it('rejects suspend without reason', async () => {
    const { service } = createService();

    await expect(service.updateStatus({
      actorId: 'admin_1',
      accountId: 'user_1',
      accountType: AccountType.PROVIDER,
      status: 'SUSPENDED',
      activeStatuses: ['ACTIVE'],
      suspendedStatus: 'SUSPENDED',
      actionPrefix: 'PROVIDER',
      targetType: 'PROVIDER',
    })).rejects.toThrow(BadRequestException);
  });
});
