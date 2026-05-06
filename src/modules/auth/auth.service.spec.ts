import { ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { AuthService } from './auth.service';

function createAuthService(superAdminCount: number) {
  const superAdmin = {
    id: 'super_1',
    email: 'super@example.com',
    password: 'hash',
    role: UserRole.SUPER_ADMIN,
    firstName: 'Super',
    lastName: 'Admin',
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
    adminPermissions: {},
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
    refreshTokenHash: null,
    deletedAt: null,
    deleteAfter: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    adminRole: null,
  };
  const prisma = {
    user: {
      findUnique: jest.fn().mockResolvedValue(superAdmin),
      count: jest.fn().mockResolvedValue(superAdminCount),
      update: jest.fn(),
    },
    adminAuditLog: { create: jest.fn() },
  };
  const service = new AuthService(
    prisma as unknown as ConstructorParameters<typeof AuthService>[0],
    {} as unknown as ConstructorParameters<typeof AuthService>[1],
    { get: jest.fn() } as unknown as ConstructorParameters<typeof AuthService>[2],
    {} as unknown as ConstructorParameters<typeof AuthService>[3],
    {} as unknown as ConstructorParameters<typeof AuthService>[4],
  );
  return { service, prisma };
}

describe('AuthService admin safety', () => {
  it('last super admin cannot be disabled', async () => {
    const { service } = createAuthService(0);

    await expect(service.updateAdminActiveStatus(
      { uid: 'other_super', role: UserRole.SUPER_ADMIN },
      'super_1',
      { isActive: false },
    )).rejects.toThrow(ForbiddenException);
  });

  it('super admin cannot be downgraded to assigned admin role', async () => {
    const { service } = createAuthService(1);

    await expect(service.updateAdmin(
      { uid: 'other_super', role: UserRole.SUPER_ADMIN },
      'super_1',
      { roleId: 'manager_role' },
    )).rejects.toThrow(ForbiddenException);
  });
});
