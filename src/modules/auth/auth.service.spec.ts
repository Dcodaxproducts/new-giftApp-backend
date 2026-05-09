import { BadRequestException, ForbiddenException, ServiceUnavailableException } from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { readFileSync } from 'fs';
import { resetPasswordTemplate } from '../../mail/templates/reset-password.template';
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

const resetUser = {
  id: 'user_1',
  email: 'user@example.com',
  password: 'old_hash',
  role: UserRole.REGISTERED_USER,
  firstName: 'Test',
  lastName: 'User',
  deletedAt: null,
  resetPasswordOtp: '334018',
  resetPasswordOtpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
  resetPasswordOtpAttempts: 0,
  refreshTokenHash: 'refresh_hash',
};

type UserUpdateCall = [{
  where?: { id?: string };
  data?: { resetPasswordOtp?: string | null; refreshTokenHash?: string | null };
}];

function createResetService(user: unknown = resetUser, mailerRejects = false) {
  const prisma = {
    user: {
      findUnique: jest.fn().mockResolvedValue(user),
      update: jest.fn().mockResolvedValue(user),
    },
  };
  const mailer = {
    sendPasswordResetEmail: mailerRejects ? jest.fn().mockRejectedValue(new Error('smtp down')) : jest.fn().mockResolvedValue(undefined),
  };
  const service = new AuthService(
    prisma as unknown as ConstructorParameters<typeof AuthService>[0],
    {} as unknown as ConstructorParameters<typeof AuthService>[1],
    { get: jest.fn() } as unknown as ConstructorParameters<typeof AuthService>[2],
    {} as unknown as ConstructorParameters<typeof AuthService>[3],
    mailer as unknown as ConstructorParameters<typeof AuthService>[4],
  );
  return { service, prisma, mailer };
}

describe('AuthService forgot/reset password', () => {
  it('forgot-password returns success only when account exists and email sends', async () => {
    const { service, mailer } = createResetService();

    await expect(service.forgotPassword({ email: 'user@example.com' })).resolves.toEqual({
      message: 'Password reset OTP has been sent to your email.',
    });
    expect(mailer.sendPasswordResetEmail).toHaveBeenCalledWith('user@example.com', expect.any(String));
  });

  it('forgot-password returns clear error when account does not exist', async () => {
    const { service, mailer } = createResetService(null);

    await expect(service.forgotPassword({ email: 'missing@example.com' })).rejects.toThrow(BadRequestException);
    await expect(service.forgotPassword({ email: 'missing@example.com' })).rejects.toThrow('No account found with this email address.');
    expect(mailer.sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it('forgot-password returns clear error when email sending fails', async () => {
    const { service, prisma } = createResetService(resetUser, true);

    await expect(service.forgotPassword({ email: 'user@example.com' })).rejects.toThrow(ServiceUnavailableException);
    await expect(service.forgotPassword({ email: 'user@example.com' })).rejects.toThrow('Unable to send password reset email. Please try again later.');
    const calls = prisma.user.update.mock.calls as UserUpdateCall[];
    expect(calls.some(([call]) => call.data?.resetPasswordOtp === null)).toBe(true);
  });

  it('reset-password works with email, valid OTP, and newPassword', async () => {
    const { service, prisma } = createResetService();

    await expect(service.resetPassword({ email: 'user@example.com', otp: '334018', newPassword: 'NewPassword@123' })).resolves.toEqual({
      message: 'Password has been reset successfully.',
    });
    const calls = prisma.user.update.mock.calls as UserUpdateCall[];
    expect(calls.some(([call]) => call.where?.id === 'user_1' && call.data?.resetPasswordOtp === null && call.data.refreshTokenHash === null)).toBe(true);
  });

  it('verify-reset-otp pre-validates OTP without returning resetToken', async () => {
    const { service } = createResetService();

    await expect(service.verifyResetOtp({ email: 'user@example.com', otp: '334018' })).resolves.toEqual({
      message: 'OTP verified successfully',
    });
  });

  it('reset-password rejects invalid OTP', async () => {
    const { service } = createResetService();

    await expect(service.resetPassword({ email: 'user@example.com', otp: '000000', newPassword: 'NewPassword@123' })).rejects.toThrow('Invalid or expired OTP');
  });

  it('reset-password rejects expired OTP', async () => {
    const { service } = createResetService({ ...resetUser, resetPasswordOtpExpiresAt: new Date(Date.now() - 1000) });

    await expect(service.resetPassword({ email: 'user@example.com', otp: '334018', newPassword: 'NewPassword@123' })).rejects.toThrow('Invalid or expired OTP');
  });

  it('reset-password rejects used OTP', async () => {
    const { service } = createResetService({ ...resetUser, resetPasswordOtp: null, resetPasswordOtpExpiresAt: null });

    await expect(service.resetPassword({ email: 'user@example.com', otp: '334018', newPassword: 'NewPassword@123' })).rejects.toThrow('Invalid or expired OTP');
  });

  it('reset-password rejects unknown email', async () => {
    const { service } = createResetService(null);

    await expect(service.resetPassword({ email: 'missing@example.com', otp: '334018', newPassword: 'NewPassword@123' })).rejects.toThrow('No account found with this email address.');
  });

  it('reset-password rejects weak password with clear message', async () => {
    const { service } = createResetService();

    await expect(service.resetPassword({ email: 'user@example.com', otp: '334018', newPassword: 'password' })).rejects.toThrow('New password does not meet security requirements.');
  });

  it('reset-password DTO does not include resetToken', () => {
    const dtoSource = readFileSync('src/modules/auth/dto/auth.dto.ts', 'utf8');

    expect(dtoSource).not.toContain('resetToken');
  });
});

describe('reset password email template', () => {
  it('does not render images and centers title/subtitle', () => {
    const result = resetPasswordTemplate({ appName: 'Gift App', logoUrl: 'https://res.cloudinary.com/daflot6fo/image/upload/v1778232193/gift_bl9dgu.jpg', supportEmail: 'support@giftapp.com', title: 'Reset your password', message: 'Use this code to reset your Gift App password.', otp: '334018' });

    expect(result.html).not.toContain('<img');
    expect(result.html).toContain('align="center"');
    expect(result.html).toContain('text-align:center; margin:0; font-size:24px; color:#111827;');
    expect(result.html).toContain('text-align:center; margin:12px 0 0; color:#6B7280; font-size:15px; line-height:22px;');
  });
});

function createAdminCreationService(options?: {
  mailerRejects?: boolean;
  adminRoleActive?: boolean;
  assignedAdminCount?: number;
}) {
  const adminRole = {
    id: 'role_1',
    name: 'Gift Manager',
    slug: 'GIFT_MANAGER',
    description: 'Gift access',
    permissions: { gifts: ['read', 'create'], giftCategories: ['read'] },
    isSystem: false,
    isActive: options?.adminRoleActive ?? true,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const createdAdmin = {
    id: 'admin_1',
    email: 'staff@example.com',
    password: 'hash',
    role: UserRole.ADMIN,
    firstName: 'Operations',
    lastName: 'Staff',
    phone: '+15550000002',
    avatarUrl: 'https://cdn.yourdomain.com/admin-avatars/staff.png',
    location: null,
    adminRoleId: 'role_1',
    isVerified: true,
    isActive: true,
    isApproved: true,
    mustChangePassword: true,
    lastLoginAt: null,
    adminTitle: 'Operations Manager',
    adminPermissions: adminRole.permissions,
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
  };
  const prisma = {
    user: {
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue(createdAdmin),
      findMany: jest.fn().mockResolvedValue([createdAdmin]),
      count: jest.fn().mockResolvedValue(options?.assignedAdminCount ?? 1),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    adminRole: {
      findUnique: jest.fn().mockResolvedValue(adminRole),
      update: jest.fn().mockResolvedValue({ ...adminRole, permissions: { gifts: ['read'] } }),
    },
    adminAuditLog: { create: jest.fn() },
    $transaction: jest.fn(async (operations: Array<Promise<unknown>>) => Promise.all(operations)),
  };
  const service = new AuthService(
    prisma as unknown as ConstructorParameters<typeof AuthService>[0],
    {} as unknown as ConstructorParameters<typeof AuthService>[1],
    { get: jest.fn((key: string, fallback?: string) => (key === 'APP_FRONTEND_URL' ? 'https://app.giftapp.com' : fallback)) } as unknown as ConstructorParameters<typeof AuthService>[2],
    {} as unknown as ConstructorParameters<typeof AuthService>[3],
    {
      sendAdminInviteEmail: options?.mailerRejects ? jest.fn().mockRejectedValue(new Error('smtp down')) : jest.fn().mockResolvedValue(undefined),
    } as unknown as ConstructorParameters<typeof AuthService>[4],
  );
  return { service, prisma, adminRole, createdAdmin };
}

describe('AuthService admin staff RBAC architecture', () => {
  it('GET /admins lists only User.role = ADMIN staff, not SUPER_ADMIN accounts', async () => {
    const { service, prisma } = createAdminCreationService();

    await service.listAdmins({ uid: 'super_1', role: UserRole.SUPER_ADMIN }, {});

    const findManyCalls = prisma.user.findMany.mock.calls as Array<[{ where: Prisma.UserWhereInput }]>;
    const countCalls = prisma.user.count.mock.calls as Array<[{ where: Prisma.UserWhereInput }]>;
    expect(findManyCalls[0][0].where).toMatchObject({ role: UserRole.ADMIN, deletedAt: null });
    expect(countCalls[0][0].where).toMatchObject({ role: UserRole.ADMIN, deletedAt: null });
  });

  it('POST /admins creates User.role = ADMIN and roleId points to AdminRole.id', async () => {
    const { service, prisma } = createAdminCreationService();

    const result = await service.createAdmin(
      { uid: 'super_1', role: UserRole.SUPER_ADMIN },
      {
        email: 'staff@example.com',
        temporaryPassword: 'Temp@123456',
        generateTemporaryPassword: false,
        mustChangePassword: true,
        firstName: 'Operations',
        lastName: 'Staff',
        phone: '+15550000002',
        title: 'Operations Manager',
        roleId: 'role_1',
        avatarUrl: 'https://cdn.yourdomain.com/admin-avatars/staff.png',
        isActive: true,
      },
    );

    const createCalls = prisma.user.create.mock.calls as Array<[{ data: { role: UserRole; adminRoleId: string } }]>;
    const createCall = createCalls[0][0];
    expect(createCall.data.role).toBe(UserRole.ADMIN);
    expect(createCall.data.adminRoleId).toBe('role_1');
    expect(result.data).toEqual({ id: 'admin_1', email: 'staff@example.com', role: UserRole.ADMIN, roleId: 'role_1', inviteEmailSent: false });
  });

  it('POST /admins requires valid roleId', async () => {
    const { service, prisma } = createAdminCreationService();
    prisma.adminRole.findUnique.mockResolvedValueOnce(null);

    await expect(service.createAdmin(
      { uid: 'super_1', role: UserRole.SUPER_ADMIN },
      { email: 'staff@example.com', firstName: 'Operations', lastName: 'Staff', roleId: 'missing_role' },
    )).rejects.toThrow('Admin role not found');
  });

  it('POST /admins sends invite email when sendInviteEmail=true', async () => {
    const { service } = createAdminCreationService();

    await expect(service.createAdmin(
      { uid: 'super_1', role: UserRole.SUPER_ADMIN },
      { email: 'staff@example.com', temporaryPassword: 'Temp@123456', generateTemporaryPassword: false, firstName: 'Operations', lastName: 'Staff', roleId: 'role_1', sendInviteEmail: true },
    )).resolves.toEqual({
      data: { id: 'admin_1', email: 'staff@example.com', role: UserRole.ADMIN, roleId: 'role_1', inviteEmailSent: true },
      message: 'Admin staff user created successfully and invite email sent.',
    });
  });

  it('POST /admins returns success even if invite email fails', async () => {
    const { service } = createAdminCreationService({ mailerRejects: true });

    await expect(service.createAdmin(
      { uid: 'super_1', role: UserRole.SUPER_ADMIN },
      { email: 'staff@example.com', temporaryPassword: 'Temp@123456', generateTemporaryPassword: false, firstName: 'Operations', lastName: 'Staff', roleId: 'role_1', sendInviteEmail: true },
    )).resolves.toEqual({
      data: { id: 'admin_1', email: 'staff@example.com', role: UserRole.ADMIN, roleId: 'role_1', inviteEmailSent: false },
      message: 'Admin staff user created successfully, but invite email could not be sent.',
    });
  });

  it('custom AdminRole permissions can be patched', async () => {
    const { service, prisma } = createAdminCreationService();

    const result = await service.updateRolePermissions(
      { uid: 'super_1', role: UserRole.SUPER_ADMIN },
      'role_1',
      { permissions: { gifts: ['read'] } },
    );

    expect(prisma.user.updateMany).toHaveBeenCalledWith({ where: { adminRoleId: 'role_1' }, data: { adminPermissions: { gifts: ['read'] } } });
    expect(result.data).toEqual({ id: 'role_1', permissions: { gifts: ['read'] } });
  });

  it('custom AdminRole cannot be deleted if adminCount > 0', async () => {
    const { service } = createAdminCreationService({ assignedAdminCount: 2 });

    await expect(service.deleteAdminRole(
      { uid: 'super_1', role: UserRole.SUPER_ADMIN },
      'role_1',
    )).rejects.toThrow('Role cannot be deleted while admins are assigned to it');
  });

  it('system Super Admin role cannot be modified', async () => {
    const { service, prisma, adminRole } = createAdminCreationService();
    prisma.adminRole.findUnique.mockResolvedValueOnce({ ...adminRole, slug: UserRole.SUPER_ADMIN, isSystem: true });

    await expect(service.updateAdminRole(
      { uid: 'super_1', role: UserRole.SUPER_ADMIN },
      'role_1',
      { name: 'Updated' },
    )).rejects.toThrow('Super Admin role cannot be modified.');
  });

  it('POST /admins DTO does not accept raw permissions or User.role fields', () => {
    const dtoSource = readFileSync('src/modules/auth/dto/admin-management.dto.ts', 'utf8');
    const createAdminBlock = dtoSource.slice(
      dtoSource.indexOf('export class CreateAdminDto'),
      dtoSource.indexOf('export class UpdateAdminDto'),
    );

    expect(createAdminBlock).not.toContain('permissions?:');
    expect(createAdminBlock).not.toContain('permissions!:');
    expect(createAdminBlock).not.toContain('role!:');
  });

  it('permission catalog remains read-only', () => {
    const controllerSource = readFileSync('src/modules/admin-roles/admin-roles.controller.ts', 'utf8');

    expect(controllerSource).toContain("@Get('catalog')");
    expect(controllerSource).not.toContain("@Post('catalog')");
    expect(controllerSource).not.toContain("@Patch('catalog')");
    expect(controllerSource).not.toContain("@Delete('catalog')");
  });
});
