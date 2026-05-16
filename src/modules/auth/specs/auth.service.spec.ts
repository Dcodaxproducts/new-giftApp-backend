import { BadRequestException, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { readFileSync } from 'fs';
import { resetPasswordTemplate } from '../../../mail/templates/reset-password.template';
import { AuthPasswordRepository } from '../repositories/auth-password.repository';
import { AuthRepository } from '../repositories/auth.repository';
import { ProviderFulfillmentMethodDto } from '../dto/auth.dto';
import { AuthCoreService } from '../services/auth-core.service';
import { AuthSessionsRepository } from '../repositories/auth-sessions.repository';

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
  const authRepository = new AuthRepository(prisma as unknown as ConstructorParameters<typeof AuthRepository>[0]);
  const authSessionsRepository = new AuthSessionsRepository(prisma as unknown as ConstructorParameters<typeof AuthSessionsRepository>[0]);
  const authPasswordRepository = new AuthPasswordRepository(prisma as unknown as ConstructorParameters<typeof AuthPasswordRepository>[0]);
  const service = new AuthCoreService(
    {} as unknown as ConstructorParameters<typeof AuthCoreService>[0],
    { get: jest.fn() } as unknown as ConstructorParameters<typeof AuthCoreService>[1],
    {} as unknown as ConstructorParameters<typeof AuthCoreService>[2],
    mailer as unknown as ConstructorParameters<typeof AuthCoreService>[3],
    authRepository,
    authSessionsRepository,
    authPasswordRepository,
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

describe('AuthService bounded-context boundary', () => {
  it('does not expose legacy admin staff, provider/user management, audit, or RBAC methods', () => {
    const source = readFileSync('src/modules/auth/services/auth.service.ts', 'utf8');

    expect(source).not.toContain('async createAdmin(');
    expect(source).not.toContain('async listAdmins(');
    expect(source).not.toContain('async adminDetails(');
    expect(source).not.toContain('async updateAdmin(');
    expect(source).not.toContain('async resetAdminPassword(');
    expect(source).not.toContain('async permanentlyDeleteAdmin(');
    expect(source).not.toContain('async createAdminRole(');
    expect(source).not.toContain('async updateRolePermissions(');
    expect(source).not.toContain('permissionCatalog()');
    expect(source).not.toContain('async listAuditLogs(');
    expect(source).not.toContain('async approveProvider(');
    expect(source).not.toContain('async rejectProvider(');
    expect(source).not.toContain('async updateUserActiveStatus(');
  });

  it('auth DTO folder contains only auth-owned DTOs', () => {
    const authDto = readFileSync('src/modules/auth/dto/auth.dto.ts', 'utf8');

    expect(authDto).toContain('export class GuestSessionDto');
    expect(authDto).not.toContain('export class CreateAdminDto');
    expect(authDto).not.toContain('export class RejectProviderDto');
    expect(authDto).not.toContain('export class UpdateUserActiveStatusDto');
  });

  it('AuthService delegates to focused auth services', () => {
    const source = readFileSync('src/modules/auth/services/auth.service.ts', 'utf8');
    const moduleSource = readFileSync('src/modules/auth/auth.module.ts', 'utf8');

    for (const dependency of ['AuthRegistrationService', 'AuthLoginService', 'AuthPasswordService', 'AuthSessionService', 'AuthProfileService']) {
      expect(source).toContain(dependency);
      expect(moduleSource).toContain(dependency);
    }
    expect(source).toContain('return this.registration.registerUser(dto)');
    expect(source).toContain('return this.loginFlow.login(dto, ipAddress, userAgent)');
    expect(source).not.toContain('this.authRepository');
  });
});

function authUser(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'user_1',
    email: 'user@example.com',
    password: bcrypt.hashSync('Password@123', 10),
    role: UserRole.REGISTERED_USER,
    firstName: 'Test',
    lastName: 'User',
    phone: '+15550000001',
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
    providerBusinessCategoryId: null,
    providerTaxId: null,
    providerBusinessAddress: null,
    providerServiceArea: null,
    providerFulfillmentMethods: null,
    providerAutoAcceptOrders: false,
    providerDocuments: null,
    providerApprovalStatus: null,
    providerApprovedAt: null,
    providerApprovedBy: null,
    providerRejectedAt: null,
    providerRejectedBy: null,
    providerRejectionReason: null,
    providerRejectionComment: null,
    verificationOtp: '123456',
    verificationOtpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
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
    ...overrides,
  };
}

function createSensitiveAuthService(options?: {
  user?: ReturnType<typeof authUser> | null;
  session?: { id: string; refreshTokenHash: string; revokedAt: Date | null; lastActiveAt: Date; deviceName?: string | null; location?: string | null; ipAddress?: string | null } | null;
}) {
  const prisma = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    authSession: {
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      create: jest.fn(),
    },
    providerBusinessCategory: {
      findUnique: jest.fn().mockResolvedValue({ id: 'cat_1', name: 'Bakery', isActive: true }),
    },
    customerSubscription: {
      findFirst: jest.fn().mockResolvedValue(null),
    },
    adminAuditLog: { create: jest.fn() },
    $transaction: jest.fn(async (operations: Array<Promise<unknown>>) => Promise.all(operations)),
  };

  if (options?.user !== undefined) {
    prisma.user.findUnique.mockResolvedValue(options.user);
    prisma.user.create.mockResolvedValue(options.user);
    prisma.user.update.mockResolvedValue(options.user);
  }

  if (options?.session !== undefined) {
    prisma.authSession.findFirst.mockResolvedValue(options.session);
    prisma.authSession.update.mockResolvedValue(options.session);
    prisma.authSession.create.mockResolvedValue(options.session);
  } else {
    prisma.authSession.update.mockResolvedValue({ id: 'session_1', refreshTokenHash: 'pending' });
    prisma.authSession.create.mockResolvedValue({ id: 'session_1', refreshTokenHash: 'pending' });
    prisma.authSession.updateMany.mockResolvedValue({ count: 1 });
  }

  const jwtService = {
    signAsync: jest.fn()
      .mockResolvedValueOnce('access_token_1')
      .mockResolvedValueOnce('refresh_token_1'),
    verifyAsync: jest.fn(),
  };
  const configService = { get: jest.fn((key: string, fallback?: string) => {
    if (key === 'JWT_ACCESS_SECRET') return 'access_secret';
    if (key === 'JWT_REFRESH_SECRET') return 'refresh_secret';
    if (key === 'JWT_ACCESS_EXPIRES_IN') return '15m';
    if (key === 'JWT_REFRESH_EXPIRES_IN') return '30d';
    if (key === 'APP_FRONTEND_URL') return 'https://app.giftapp.com';
    return fallback;
  }) };
  const loginAttemptsService = {
    assertLoginAllowed: jest.fn().mockResolvedValue(undefined),
    record: jest.fn().mockResolvedValue(undefined),
  };
  const mailerService = {
    sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
  };
  const referrals = {
    assertValidReferralCode: jest.fn().mockResolvedValue(undefined),
    captureSignupReferral: jest.fn().mockResolvedValue(undefined),
  };

  const authRepository = new AuthRepository(prisma as unknown as ConstructorParameters<typeof AuthRepository>[0]);
  const authSessionsRepository = new AuthSessionsRepository(prisma as unknown as ConstructorParameters<typeof AuthSessionsRepository>[0]);
  const authPasswordRepository = new AuthPasswordRepository(prisma as unknown as ConstructorParameters<typeof AuthPasswordRepository>[0]);
  const service = new AuthCoreService(
    jwtService as unknown as ConstructorParameters<typeof AuthCoreService>[0],
    configService as unknown as ConstructorParameters<typeof AuthCoreService>[1],
    loginAttemptsService as unknown as ConstructorParameters<typeof AuthCoreService>[2],
    mailerService as unknown as ConstructorParameters<typeof AuthCoreService>[3],
    authRepository,
    authSessionsRepository,
    authPasswordRepository,
    referrals as never,
  );

  return { service, prisma, jwtService, loginAttemptsService, mailerService, referrals };
}

describe('AuthService sensitive auth behavior', () => {
  it('login success unchanged', async () => {
    const user = authUser();
    const { service, loginAttemptsService, jwtService, prisma } = createSensitiveAuthService({ user });

    const result = await service.login({ email: 'user@example.com', password: 'Password@123' }, '127.0.0.1', 'jest');

    expect(result.message).toBe('Login successful');
    expect(result.data).toEqual(expect.objectContaining({ accessToken: 'access_token_1', refreshToken: 'refresh_token_1' }));
    expect(loginAttemptsService.record).toHaveBeenCalledWith(expect.objectContaining({ status: 'SUCCESS', userId: 'user_1' }));
    const loginUpdateCalls = prisma.user.update.mock.calls as Array<[{ where: { id: string }; data: Record<string, unknown> }]>;
    const loginUpdateCall = loginUpdateCalls.find((call) => 'lastLoginAt' in call[0].data);
    expect(loginUpdateCall?.[0].where.id).toBe('user_1');
    expect(loginUpdateCall?.[0].data.lastLoginAt).toBeInstanceOf(Date);
    expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
  });

  it('login failure unchanged and attempts still recorded', async () => {
    const user = authUser();
    const { service, loginAttemptsService } = createSensitiveAuthService({ user });

    await expect(service.login({ email: 'user@example.com', password: 'WrongPass@123' }, '127.0.0.1', 'jest')).rejects.toThrow(UnauthorizedException);
    expect(loginAttemptsService.record).toHaveBeenCalledWith(expect.objectContaining({ status: 'FAILED', reason: 'INVALID_CREDENTIALS', userId: 'user_1' }));
  });

  it('refresh behavior unchanged', async () => {
    const refreshToken = 'refresh_token_existing';
    const refreshTokenHash = bcrypt.hashSync(refreshToken, 10);
    const user = authUser({ refreshTokenHash });
    const session = { id: 'session_1', refreshTokenHash, revokedAt: null, lastActiveAt: new Date(), deviceName: 'Current device', location: null, ipAddress: null };
    const { service, jwtService } = createSensitiveAuthService({ user, session });
    jwtService.verifyAsync.mockResolvedValue({ uid: 'user_1', role: UserRole.REGISTERED_USER, type: 'refresh', sessionId: 'session_1' });
    jwtService.signAsync.mockReset().mockResolvedValueOnce('access_token_2').mockResolvedValueOnce('refresh_token_2');

    const result = await service.refresh({ refreshToken });

    expect(result).toEqual({ data: { accessToken: 'access_token_2', refreshToken: 'refresh_token_2' }, message: 'Token refreshed' });
  });

  it('logout behavior unchanged', async () => {
    const { service, prisma } = createSensitiveAuthService();

    await expect(service.logout({ uid: 'user_1', role: UserRole.REGISTERED_USER, sessionId: 'session_1' })).resolves.toEqual({ data: null, message: 'Logout successful' });
    const logoutUserCalls = prisma.user.update.mock.calls as Array<[{ where: { id: string }; data: Record<string, unknown> }]>;
    const logoutUserCall = logoutUserCalls.find((call) => call[0].data.refreshTokenHash === null);
    expect(logoutUserCall?.[0]).toEqual({ where: { id: 'user_1' }, data: { refreshTokenHash: null } });
    const logoutSessionCall = prisma.authSession.updateMany.mock.calls[0] as [{ where: { id: string; userId: string; revokedAt: null }; data: { revokedAt: Date } }];
    expect(logoutSessionCall[0].where).toEqual({ id: 'session_1', userId: 'user_1', revokedAt: null });
    expect(logoutSessionCall[0].data.revokedAt).toBeInstanceOf(Date);
  });

  it('user registration unchanged', async () => {
    const user = authUser({ verificationOtp: '123456', refreshTokenHash: null });
    const { service, mailerService, referrals, prisma } = createSensitiveAuthService({ user });
    prisma.user.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce(user);

    const result = await service.registerUser({ email: 'user@example.com', password: 'Password@123', firstName: 'Test', lastName: 'User', phone: '+15550000001', referralCode: 'REF123' });

    expect(result.message).toBe('Registered user account created. Verify email with OTP.');
    expect(mailerService.sendVerificationEmail).toHaveBeenCalledWith('user@example.com', '123456');
    expect(referrals.assertValidReferralCode).toHaveBeenCalledWith('REF123');
    expect(referrals.captureSignupReferral).toHaveBeenCalledWith('user_1', 'REF123');
    const registerUserCall = prisma.user.create.mock.calls[0] as [{ data: { role: UserRole; isApproved: boolean; providerApprovalStatus: null } }];
    expect(registerUserCall[0].data.role).toBe(UserRole.REGISTERED_USER);
    expect(registerUserCall[0].data.isApproved).toBe(true);
    expect(registerUserCall[0].data.providerApprovalStatus).toBeNull();
  });

  it('provider registration unchanged', async () => {
    const user = authUser({ email: 'provider@example.com', role: UserRole.PROVIDER, isApproved: false, providerApprovalStatus: 'PENDING', verificationOtp: '123456', providerBusinessName: 'Cake Shop' });
    const { service, mailerService, prisma } = createSensitiveAuthService({ user });
    prisma.user.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce(user);

    const result = await service.registerProvider({ email: 'provider@example.com', password: 'Password@123', firstName: 'Cake', lastName: 'Owner', phone: '+15550000002', businessName: 'Cake Shop', businessCategoryId: 'cat_1', taxId: 'TAX-1', businessAddress: 'Main Street', fulfillmentMethods: [ProviderFulfillmentMethodDto.DELIVERY], autoAcceptOrders: false });

    expect(result.message).toBe('Provider application submitted for Super Admin approval.');
    expect(mailerService.sendVerificationEmail).toHaveBeenCalledWith('provider@example.com', '123456');
    const registerProviderCall = prisma.user.create.mock.calls[0] as [{ data: { role: UserRole; isApproved: boolean; providerApprovalStatus: string | null; providerBusinessName: string | null; providerBusinessCategoryId: string | null } }];
    expect(registerProviderCall[0].data.role).toBe(UserRole.PROVIDER);
    expect(registerProviderCall[0].data.isApproved).toBe(false);
    expect(registerProviderCall[0].data.providerApprovalStatus).toBe('PENDING');
    expect(registerProviderCall[0].data.providerBusinessName).toBe('Cake Shop');
    expect(registerProviderCall[0].data.providerBusinessCategoryId).toBe('cat_1');
  });

  it('guest session unchanged', () => {
    const { service } = createSensitiveAuthService();
    expect(service.createGuestSession({})).toEqual({ data: { role: 'GUEST_USER', capabilities: ['VIEW_ONBOARDING', 'EXPLORE_FEATURES'] }, message: 'Guest session initialized' });
  });

  it('auth core service no longer imports PrismaService or uses this.prisma', () => {
    const source = readFileSync('src/modules/auth/services/auth-core.service.ts', 'utf8');
    const authRepositorySource = readFileSync('src/modules/auth/repositories/auth.repository.ts', 'utf8');
    expect(source).not.toContain('PrismaService');
    expect(source).not.toContain('this.prisma');
    expect(source).toContain('authRepository.findUserByEmail');
    expect(source).toContain('authRepository.findUserById');
    expect(source).toContain('authSessionsRepository.findRefreshSession');
    expect(source).toContain('authSessionsRepository.createRefreshSession');
    expect(source).toContain('authSessionsRepository.storeRefreshTokenHash');
    expect(source).toContain('authRepository.createAuthUser');
    expect(authRepositorySource).toContain('constructor(private readonly prisma: PrismaService)');
  });
});
