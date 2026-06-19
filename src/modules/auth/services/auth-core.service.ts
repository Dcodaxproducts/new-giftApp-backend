import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Optional,
  OnModuleInit,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  LoginAttemptStatus,
  AdminRole,
  Prisma,
  ProviderApprovalStatus,
  User,
  UserRole,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomInt } from 'crypto';
import { AuthUserContext } from '../../../common/decorators/current-user.decorator';
import { AuthPasswordRepository } from '../repositories/auth-password.repository';
import { AuthRepository } from '../repositories/auth.repository';
import { AuthSessionsRepository } from '../repositories/auth-sessions.repository';
import { EmailNotVerifiedException } from '../exceptions/email-not-verified.exception';
import { AuthResendVerificationRateLimiterService } from './auth-resend-verification-rate-limiter.service';
import { LoginAttemptsService } from '../../login-attempts/login-attempts.service';
import { MailerService } from '../../mailer/mailer.service';
import { CustomerReferralsService } from '../../customer-referrals/services/customer-referrals.service';
import { SUPER_ADMIN_PERMISSIONS } from '../../admin-roles/constants/permission-catalog';
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  LoginDto,
  RefreshDto,
  RegisterProviderDto,
  RegisterUserDto,
  ResendVerificationEmailDto,
  ResetPasswordDto,
  UpdateOwnProfileDto,
  VerifyEmailDto,
  VerifyResetOtpDto,
} from '../dto/auth.dto';

interface TokenPayload {
  uid: string;
  role: UserRole;
  permissions?: Prisma.JsonValue;
  type?: 'refresh';
  sessionId?: string;
}

const PASSWORD_RESET_SENT_MESSAGE = 'Reset instructions have been sent to the email address you provided.';
const PASSWORD_RESET_SEND_FAILED_MESSAGE = 'We could not send the reset instructions right now. Please try again later.';
const VERIFICATION_EMAIL_SENT_MESSAGE = 'A verification email has been sent to the email address you provided.';
const VERIFICATION_EMAIL_SEND_FAILED_MESSAGE = 'We could not send the verification email right now. Please try again later.';
const AUTHENTICATED_VERIFICATION_OTP_SENT_MESSAGE = 'A verification OTP has been sent to your email address.';

@Injectable()
export class AuthCoreService implements OnModuleInit {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly loginAttemptsService: LoginAttemptsService,
    private readonly mailerService: MailerService,
    private readonly authRepository: AuthRepository,
    private readonly authSessionsRepository: AuthSessionsRepository,
    private readonly authPasswordRepository: AuthPasswordRepository,
    private readonly resendVerificationRateLimiter: AuthResendVerificationRateLimiterService,
    @Optional() private readonly customerReferralsService?: CustomerReferralsService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.ensureSingleSuperAdmin();
  }

  async registerUser(dto: RegisterUserDto) {
    await this.customerReferralsService?.assertValidReferralCode(dto.referralCode);
    const name = this.nameParts(dto);
    const user = await this.createUser({
      email: dto.email,
      password: dto.password,
      firstName: name.firstName,
      lastName: name.lastName,
      phone: dto.phone,
      role: UserRole.REGISTERED_USER,
      isApproved: true,
      providerApprovalStatus: null,
    });
    await this.customerReferralsService?.captureSignupReferral(user.id, dto.referralCode);
    await this.mailerService.sendVerificationEmail(
      user.email,
      this.requiredOtp(user.verificationOtp),
    );
    const tokens = await this.issueTokens(user);

    return {
      data: {
        user: await this.toAuthUser(user),
        ...tokens,
      },
      message: 'Registered user account created. Verify email with OTP.',
    };
  }

  async registerProvider(dto: RegisterProviderDto) {
    await this.getProviderBusinessCategory(dto.businessCategoryId);
    const name = this.nameParts(dto);
    const user = await this.createUser({
      email: dto.email,
      password: dto.password,
      firstName: name.firstName,
      lastName: name.lastName,
      phone: dto.phone,
      role: UserRole.PROVIDER,
      isApproved: false,
      providerApprovalStatus: ProviderApprovalStatus.PENDING,
      providerBusinessName: dto.businessName.trim(),
      providerBusinessCategoryId: dto.businessCategoryId,
      providerTaxId: dto.taxId?.trim(),
      providerBusinessAddress: dto.businessAddress.trim(),
      location: dto.location ? `${dto.location.lat},${dto.location.lng}` : undefined,
      providerStoreAddress: dto.location ? { lat: dto.location.lat, lng: dto.location.lng } : undefined,
      providerFulfillmentMethods: dto.fulfillmentMethods,
      providerAutoAcceptOrders: dto.autoAcceptOrders ?? false,
    });
    await this.mailerService.sendVerificationEmail(
      user.email,
      this.requiredOtp(user.verificationOtp),
    );
    const tokens = await this.issueTokens(user);

    return {
      data: {
        user: await this.toAuthUser(user),
        ...tokens,
      },
      message: 'Provider application submitted for Super Admin approval.',
    };
  }

  createGuestSession() {
    return {
      data: {
        role: 'GUEST_USER',
        capabilities: [
          'VIEW_ONBOARDING',
          'EXPLORE_FEATURES',
        ],
      },
      message: 'Guest session initialized',
    };
  }

  async login(dto: LoginDto, ipAddress?: string, userAgent?: string | string[]) {
    await this.loginAttemptsService.assertLoginAllowed(dto.email).catch(async (error) => {
      await this.loginAttemptsService.record({
        email: dto.email,
        status: LoginAttemptStatus.BLOCKED,
        reason: 'RATE_LIMITED',
        ipAddress,
        userAgent: this.normalizeUserAgent(userAgent),
      });
      throw error;
    });

    const user = await this.authRepository.findUserByEmail(this.normalizeEmail(dto.email));

    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      await this.loginAttemptsService.record({
        email: dto.email,
        status: LoginAttemptStatus.FAILED,
        reason: 'INVALID_CREDENTIALS',
        ipAddress,
        userAgent: this.normalizeUserAgent(userAgent),
        userId: user?.id,
        role: user?.role,
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.deletedAt && user.deleteAfter && user.deleteAfter > new Date()) {
      return {
        data: {
          user: await this.toAuthUser(user),
          deletionState: this.toDeletionState(user),
        },
        message: 'Account is scheduled for deletion. Cancel deletion to login.',
      };
    }

    if (!user.isActive || user.deletedAt) {
      await this.loginAttemptsService.record({
        email: dto.email,
        status: LoginAttemptStatus.FAILED,
        reason: 'INACTIVE_ACCOUNT',
        ipAddress,
        userAgent: this.normalizeUserAgent(userAgent),
        userId: user.id,
        role: user.role,
      });
      throw new UnauthorizedException('Account is inactive');
    }

    if (!user.isVerified) {
      await this.loginAttemptsService.record({
        email: dto.email,
        status: LoginAttemptStatus.FAILED,
        reason: 'EMAIL_NOT_VERIFIED',
        ipAddress,
        userAgent: this.normalizeUserAgent(userAgent),
        userId: user.id,
        role: user.role,
      });
      throw new EmailNotVerifiedException(0);
    }

    if (user.role === UserRole.PROVIDER && !user.isApproved) {
      await this.loginAttemptsService.record({
        email: dto.email,
        status: LoginAttemptStatus.FAILED,
        reason: 'PROVIDER_PENDING_APPROVAL',
        ipAddress,
        userAgent: this.normalizeUserAgent(userAgent),
        userId: user.id,
        role: user.role,
      });
      throw new ForbiddenException('Provider account is pending Super Admin approval');
    }

    if (user.role === UserRole.ADMIN && !user.isApproved) {
      await this.loginAttemptsService.record({
        email: dto.email,
        status: LoginAttemptStatus.FAILED,
        reason: 'ADMIN_NOT_APPROVED',
        ipAddress,
        userAgent: this.normalizeUserAgent(userAgent),
        userId: user.id,
        role: user.role,
      });
      throw new ForbiddenException('Admin account is not approved');
    }

    if (
      user.role === UserRole.ADMIN &&
      (!user.adminRoleId || !user.adminRole || user.adminRole.deletedAt || !user.adminRole.isActive)
    ) {
      await this.loginAttemptsService.record({
        email: dto.email,
        status: LoginAttemptStatus.FAILED,
        reason: 'ADMIN_ROLE_INACTIVE',
        ipAddress,
        userAgent: this.normalizeUserAgent(userAgent),
        userId: user.id,
        role: user.role,
      });
      throw new ForbiddenException('Admin role is inactive or missing');
    }

    const tokens = await this.issueTokens(user, undefined, ipAddress, this.normalizeUserAgent(userAgent));
    await this.authRepository.updateLastLoginAt(user.id);
    await this.loginAttemptsService.record({
      email: dto.email,
      status: LoginAttemptStatus.SUCCESS,
      ipAddress,
      userAgent: this.normalizeUserAgent(userAgent),
      userId: user.id,
      role: user.role,
    });

    return {
      data: {
        user: await this.toAuthUser(user),
        ...tokens,
      },
      message: 'Login successful',
    };
  }

  async refresh(dto: RefreshDto) {
    let payload: TokenPayload;

    try {
      payload = await this.jwtService.verifyAsync<TokenPayload>(
        dto.refreshToken,
        {
          secret: this.configService.get<string>(
            'JWT_REFRESH_SECRET',
            'change-me-refresh',
          ),
        },
      );
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.authRepository.findUserById(payload.uid);
    if (!user?.refreshTokenHash || user.deletedAt || !user.isActive) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const isValid = await bcrypt.compare(dto.refreshToken, user.refreshTokenHash);
    if (!isValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    if (payload.sessionId) {
      const session = await this.authSessionsRepository.findRefreshSession(payload.sessionId, user.id);
      if (!session || !(await bcrypt.compare(dto.refreshToken, session.refreshTokenHash))) {
        throw new UnauthorizedException('Invalid refresh token');
      }
    }

    return {
      data: await this.issueTokens(user, payload.sessionId),
      message: 'Token refreshed',
    };
  }

  async logout(user: AuthUserContext) {
    await this.authRepository.clearRefreshTokenHash(user.uid);
    if (user.sessionId) {
      await this.authSessionsRepository.revokeCurrentSession(user.sessionId, user.uid);
    }
    return { data: null, message: 'Logout successful' };
  }

  async verifyEmail(user: AuthUserContext, dto: VerifyEmailDto) {
    const dbUser = await this.getActiveUser(user.uid);

    if (dbUser.isVerified) {
      return { data: null, message: 'Email already verified' };
    }

    if (dbUser.verificationOtpAttempts >= 5) {
      throw new BadRequestException('Too many invalid attempts. Request a new OTP.');
    }

    const isValid =
      dbUser.verificationOtp === dto.otp &&
      !!dbUser.verificationOtpExpiresAt &&
      dbUser.verificationOtpExpiresAt.getTime() >= Date.now();

    if (!isValid) {
      await this.authPasswordRepository.incrementVerificationOtpAttempts(dbUser.id);
      throw new BadRequestException('Invalid or expired OTP');
    }

    const updated = await this.authPasswordRepository.markEmailVerified(dbUser.id);

    return { data: await this.toAuthUser(updated), message: 'Email verified successfully' };
  }

  async resendVerification(user: AuthUserContext) {
    const dbUser = await this.getActiveUser(user.uid);

    if (dbUser.isVerified) {
      return { data: null, message: 'Email already verified' };
    }

    const otp = this.generateOtp();
    await this.authPasswordRepository.storeVerificationOtp(dbUser.id, otp, this.generateOtpExpiry());
    try {
      await this.mailerService.sendVerificationEmail(dbUser.email, otp);
    } catch {
      throw new ServiceUnavailableException(VERIFICATION_EMAIL_SEND_FAILED_MESSAGE);
    }

    return {
      data: null,
      message: AUTHENTICATED_VERIFICATION_OTP_SENT_MESSAGE,
    };
  }

  async resendVerificationEmail(dto: ResendVerificationEmailDto, ipAddress?: string) {
    this.resendVerificationRateLimiter.assertAllowed(dto.email, ipAddress);
    const user = await this.authPasswordRepository.findUserByEmail(this.normalizeEmail(dto.email));

    if (user && !user.deletedAt && !user.isVerified) {
      const otp = this.generateOtp();
      await this.authPasswordRepository.storeVerificationOtp(user.id, otp, this.generateOtpExpiry());
      try {
        await this.mailerService.sendVerificationEmail(user.email, otp);
      } catch {
        throw new ServiceUnavailableException(VERIFICATION_EMAIL_SEND_FAILED_MESSAGE);
      }
    }

    return {
      data: {
        delivery: 'OTP_SENT_IF_ELIGIBLE',
        nextStep: 'Use the 6-digit verification OTP to complete email verification.',
      },
      message: VERIFICATION_EMAIL_SENT_MESSAGE,
    };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.authPasswordRepository.findUserByEmail(this.normalizeEmail(dto.email));

    if (!user || user.deletedAt) {
      return { message: PASSWORD_RESET_SENT_MESSAGE };
    }

    const otp = this.generateOtp();
    await this.authPasswordRepository.storeResetPasswordOtp(user.id, otp, this.generateOtpExpiry());

    try {
      await this.mailerService.sendPasswordResetEmail(user.email, otp);
    } catch {
      await this.authPasswordRepository.clearResetPasswordOtp(user.id);
      throw new ServiceUnavailableException(PASSWORD_RESET_SEND_FAILED_MESSAGE);
    }

    return {
      message: PASSWORD_RESET_SENT_MESSAGE,
    };
  }

  async verifyResetOtp(dto: VerifyResetOtpDto) {
    const user = await this.authPasswordRepository.findUserByEmail(this.normalizeEmail(dto.email));

    if (!user || user.deletedAt) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    if (!user.isVerified) {
      if (user.verificationOtpAttempts >= 5) {
        throw new BadRequestException('Too many invalid attempts. Request a new OTP.');
      }

      const verificationOtpValid =
        user.verificationOtp === dto.otp &&
        !!user.verificationOtpExpiresAt &&
        user.verificationOtpExpiresAt.getTime() >= Date.now();

      if (verificationOtpValid) {
        await this.authPasswordRepository.markEmailVerified(user.id);
        return {
          data: { purpose: 'EMAIL_VERIFICATION', emailVerified: true },
          message: 'Email verified successfully',
        };
      }

      await this.authPasswordRepository.incrementVerificationOtpAttempts(user.id);
      throw new BadRequestException('Invalid or expired OTP');
    }

    if (user.resetPasswordOtpAttempts >= 5) {
      throw new BadRequestException('Too many invalid attempts. Request a new OTP.');
    }

    const isValid =
      user.resetPasswordOtp === dto.otp &&
      !!user.resetPasswordOtpExpiresAt &&
      user.resetPasswordOtpExpiresAt.getTime() >= Date.now();

    if (!isValid) {
      await this.authPasswordRepository.incrementResetPasswordOtpAttempts(user.id);
      throw new BadRequestException('Invalid or expired OTP');
    }

    return {
      data: { purpose: 'PASSWORD_RESET', emailVerified: user.isVerified },
      message: 'OTP verified successfully',
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    this.assertPasswordMeetsSecurity(dto.newPassword);
    const user = await this.userFromResetOtp(dto);

    await this.authPasswordRepository.resetPassword(user.id, await bcrypt.hash(dto.newPassword, 10));

    return { message: 'Password has been reset successfully.' };
  }

  async changePassword(user: AuthUserContext, dto: ChangePasswordDto) {
    const dbUser = await this.getActiveUser(user.uid);

    if (!(await bcrypt.compare(dto.currentPassword, dbUser.password))) {
      throw new UnauthorizedException('Current password is invalid');
    }

    await this.authPasswordRepository.changePassword(dbUser.id, await bcrypt.hash(dto.newPassword, 10));

    return { data: null, message: 'Password changed successfully' };
  }

  async me(user: AuthUserContext) {
    const dbUser = await this.getActiveUser(user.uid);
    return { data: await this.toAuthUser(dbUser), message: 'Profile fetched successfully.' };
  }

  async updateMe(user: AuthUserContext, dto: UpdateOwnProfileDto) {
    const updated = await this.authRepository.updateOwnProfile(user.uid, { firstName: dto.firstName?.trim(), lastName: dto.lastName?.trim(), phone: dto.phone?.trim(), avatarUrl: dto.avatarUrl?.trim() });
    return { data: await this.toAuthUser(updated), message: 'Profile updated successfully.' };
  }

  async sessions(user: AuthUserContext) {
    const sessions = await this.authSessionsRepository.findActiveSessionsByUserId(user.uid);
    return { data: sessions.map((session) => ({ id: session.id, deviceName: session.deviceName ?? 'Unknown device', location: session.location, ipAddress: session.ipAddress, isCurrent: session.id === user.sessionId, lastActiveAt: session.lastActiveAt })), message: 'Active sessions fetched successfully.' };
  }

  async logoutAllSessions(user: AuthUserContext) {
    await this.authSessionsRepository.revokeOtherSessions(user.uid, user.sessionId);
    return { success: true, message: 'Other sessions logged out successfully.' };
  }

  async revokeSession(user: AuthUserContext, id: string) {
    const session = await this.authSessionsRepository.findActiveSessionForUser(user.uid, id);
    if (!session) throw new NotFoundException('Session not found');
    await this.authSessionsRepository.deleteSession(id);
    return { success: true, message: 'Session revoked successfully.' };
  }

  async deleteAccount(user: AuthUserContext) {
    if (user.role === UserRole.SUPER_ADMIN || user.role === UserRole.ADMIN) {
      throw new ForbiddenException('Administrative accounts must be managed by Super Admin');
    }

    await this.authRepository.deleteAccountCascade(user.uid);

    return { data: null, message: 'Account deleted successfully' };
  }

  async cancelDeletion(user: AuthUserContext) {
    const dbUser = await this.authRepository.findUserForDeletionCancel(user.uid);

    if (!dbUser?.deletedAt || !dbUser.deleteAfter || dbUser.deleteAfter <= new Date()) {
      throw new BadRequestException('Account is not scheduled for deletion');
    }

    await this.authRepository.cancelDeletion(dbUser.id);

    return { data: null, message: 'Account deletion cancelled' };
  }

  private async createUser(input: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role: UserRole;
    isApproved: boolean;
    isVerified?: boolean;
    isActive?: boolean;
    mustChangePassword?: boolean;
    adminRoleId?: string;
    providerApprovalStatus: ProviderApprovalStatus | null;
    providerBusinessName?: string;
    providerBusinessCategoryId?: string;
    providerTaxId?: string;
    providerBusinessAddress?: string;
    location?: string;
    providerStoreAddress?: Prisma.InputJsonValue;
    providerServiceArea?: string;
    providerFulfillmentMethods?: string[];
    providerAutoAcceptOrders?: boolean;
    providerDocuments?: string[];
    adminTitle?: string;
    avatarUrl?: string;
    adminPermissions?: Prisma.InputJsonValue;
  }): Promise<User> {
    const email = this.normalizeEmail(input.email);
    const existing = await this.authRepository.findExistingUserByEmail(email);

    if (existing) {
      throw new ConflictException('User already exists');
    }

    const otp = this.generateOtp();
    return this.authRepository.createAuthUser({
        email,
        password: await bcrypt.hash(input.password, 10),
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        phone: input.phone?.trim(),
        avatarUrl: input.avatarUrl,
        role: input.role,
        adminRoleId: input.adminRoleId,
        isVerified: input.isVerified ?? false,
        isActive: input.isActive ?? true,
        isApproved: input.isApproved,
        mustChangePassword: input.mustChangePassword ?? false,
        providerApprovalStatus: input.providerApprovalStatus,
        providerBusinessName: input.providerBusinessName,
        providerBusinessCategoryId: input.providerBusinessCategoryId,
        providerTaxId: input.providerTaxId,
        providerBusinessAddress: input.providerBusinessAddress,
        location: input.location,
        providerStoreAddress: input.providerStoreAddress,
        providerServiceArea: input.providerServiceArea,
        providerFulfillmentMethods: input.providerFulfillmentMethods ?? undefined,
        providerAutoAcceptOrders: input.providerAutoAcceptOrders ?? false,
        providerDocuments: input.providerDocuments ?? undefined,
        adminTitle: input.adminTitle,
        adminPermissions: input.adminPermissions ?? undefined,
        verificationOtp: otp,
        verificationOtpExpiresAt: this.generateOtpExpiry(),
      });
  }

  private nameParts(dto: { name?: string; firstName?: string; lastName?: string }): { firstName: string; lastName: string } {
    if (dto.name?.trim()) {
      const trimmed = dto.name.trim();
      const [firstName, ...rest] = trimmed.split(/\s+/);
      return { firstName, lastName: rest.join(' ') };
    }

    if (!dto.firstName?.trim()) {
      throw new BadRequestException('Name is required');
    }

    return { firstName: dto.firstName.trim(), lastName: dto.lastName?.trim() ?? '' };
  }

  private async getActiveUser(userId: string): Promise<User> {
    const user = await this.authRepository.findActiveUserById(userId);

    if (!user || user.deletedAt || !user.isActive) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  private async issueTokens(user: User, existingSessionId?: string, ipAddress?: string, userAgent?: string) {
    const session = existingSessionId
      ? await this.authSessionsRepository.touchSession(existingSessionId)
      : await this.authSessionsRepository.createRefreshSession({
          userId: user.id,
          deviceName: userAgent ? this.deviceName(userAgent) : 'Current device',
          ipAddress,
          userAgent,
        });
    const payload: TokenPayload = {
      uid: user.id,
      role: user.role,
      permissions: user.adminPermissions ?? undefined,
      sessionId: session.id,
    };
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET', 'change-me-access'),
      expiresIn: this.configService.get<string>(
        'JWT_ACCESS_EXPIRES_IN',
        '15m',
      ) as never,
    });
    const refreshToken = await this.jwtService.signAsync(
      { ...payload, type: 'refresh' },
      {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET', 'change-me-refresh'),
        expiresIn: this.configService.get<string>(
          'JWT_REFRESH_EXPIRES_IN',
          '30d',
        ) as never,
      },
    );

    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await this.authSessionsRepository.storeRefreshTokenHash(user.id, session.id, refreshTokenHash);

    return { accessToken, refreshToken };
  }

  private async toAuthUser(user: User) {
    const baseUser = {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      fullName: `${user.firstName} ${user.lastName}`.trim(),
      isVerified: user.isVerified,
      isActive: user.isActive,
      mustChangePassword: user.mustChangePassword,
      deletionState: this.toDeletionState(user),
    };

    if (user.role === UserRole.SUPER_ADMIN) {
      return baseUser;
    }

    if (user.role === UserRole.ADMIN) {
      return {
        ...baseUser,
        admin: {
          title: user.adminTitle,
          roleId: user.adminRoleId,
          permissions: user.adminPermissions,
          isApproved: user.isApproved,
        },
      };
    }

    if (user.role === UserRole.PROVIDER) {
      const businessCategory = user.providerBusinessCategoryId
        ? await this.authRepository.findProviderBusinessCategory(user.providerBusinessCategoryId)
        : null;
      return {
        ...baseUser,
        provider: {
          id: user.id,
          businessName: user.providerBusinessName,
          businessCategory: businessCategory
            ? { id: businessCategory.id, name: businessCategory.name }
            : null,
          taxId: user.providerTaxId,
          businessAddress: user.providerBusinessAddress,
          location: this.providerLocation(user),
          fulfillmentMethods: this.stringArray(user.providerFulfillmentMethods),
          autoAcceptOrders: user.providerAutoAcceptOrders,
          serviceArea: user.providerServiceArea,
          approvalStatus: user.providerApprovalStatus,
          status: user.isActive ? 'ACTIVE' : 'INACTIVE',
          isActive: user.isActive,
          memberSince: user.createdAt,
        },
      };
    }

    return { ...baseUser, subscription: await this.customerSubscriptionSummary(user.id) };
  }

  private providerLocation(user: User): { lat: number; lng: number } | null {
    const value = user.providerStoreAddress;
    if (value && !Array.isArray(value) && typeof value === 'object') {
      const lat = value.lat;
      const lng = value.lng;
      if (typeof lat === 'number' && typeof lng === 'number') {
        return { lat, lng };
      }
    }

    return null;
  }

  private async customerSubscriptionSummary(userId: string) {
    const subscription = await this.authRepository.findCustomerSubscriptionSummary(userId);
    if (!subscription) return { isPremium: false, status: 'FREE', planId: null, planName: null, billingCycle: null };
    return { isPremium: subscription.isPremium, status: subscription.status, planId: subscription.planId, planName: subscription.plan.name, billingCycle: subscription.billingCycle };
  }

  private toDeletionState(user: User) {
    return {
      isDeleted: !!user.deletedAt,
      deletionScheduled: !!user.deleteAfter && user.deleteAfter > new Date(),
      deletedAt: user.deletedAt,
      deleteAfter: user.deleteAfter,
    };
  }

  private stringArray(value: Prisma.JsonValue | null | undefined): string[] {
    return Array.isArray(value)
      ? value.filter((item): item is string => typeof item === 'string')
      : [];
  }

  private async userFromResetOtp(dto: ResetPasswordDto): Promise<User> {
    const user = await this.authPasswordRepository.findUserByEmail(this.normalizeEmail(dto.email));

    if (!user || user.deletedAt) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    if (user.resetPasswordOtpAttempts >= 5) {
      throw new BadRequestException('Too many invalid attempts. Request a new OTP.');
    }

    const isValid =
      user.resetPasswordOtp === dto.otp &&
      !!user.resetPasswordOtpExpiresAt &&
      user.resetPasswordOtpExpiresAt.getTime() >= Date.now();

    if (!isValid) {
      await this.authPasswordRepository.incrementResetPasswordOtpAttempts(user.id);
      throw new BadRequestException('Invalid or expired OTP');
    }

    return user;
  }

  private assertPasswordMeetsSecurity(password: string): void {
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(password)) {
      throw new BadRequestException('New password does not meet security requirements.');
    }
  }

  private async getProviderBusinessCategory(categoryId: string) {
    const category = await this.authRepository.findProviderBusinessCategory(categoryId);
    if (!category || !category.isActive) {
      throw new NotFoundException('Provider business category not found');
    }
    return category;
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private normalizeUserAgent(userAgent?: string | string[]): string | undefined {
    return Array.isArray(userAgent) ? userAgent.join(', ') : userAgent;
  }

  private requiredOtp(otp: string | null): string {
    if (!otp) {
      throw new ServiceUnavailableException('Verification OTP was not generated');
    }

    return otp;
  }

  private deviceName(userAgent: string) {
    if (/iphone|ipad/i.test(userAgent)) return 'iOS device';
    if (/android/i.test(userAgent)) return 'Android device';
    if (/windows/i.test(userAgent)) return 'Windows device';
    if (/macintosh|mac os/i.test(userAgent)) return 'Mac device';
    return 'Current device';
  }

  private async ensureSingleSuperAdmin(): Promise<void> {
    const superAdminRole = await this.ensureSystemRole(
      'Super Admin',
      UserRole.SUPER_ADMIN,
      'Full platform access.',
      SUPER_ADMIN_PERMISSIONS,
    );
    await this.ensureSystemRole(
      'Manager',
      'MANAGER',
      'Can oversee daily operations.',
      {
        users: ['read', 'updateStatus'],
        admins: ['read'],
        providers: ['read', 'approve', 'reject', 'updateStatus'],
        reports: ['read'],
        auditLogs: ['read'],
      },
    );
    const email = this.normalizeEmail('giftapp.superadmin@yopmail.com');
    const password = 'Admin@123456';
    const emailOwner = await this.authRepository.findExistingUserByEmail(email);

    const canonicalSuperAdmin = emailOwner
      ? await this.authRepository.updateCanonicalSuperAdmin(emailOwner.id, {
          role: UserRole.SUPER_ADMIN,
          firstName: 'Gift App',
          lastName: 'Super Admin',
          isVerified: true,
          isActive: true,
          isApproved: true,
          adminRoleId: superAdminRole.id,
          adminPermissions: SUPER_ADMIN_PERMISSIONS,
          deletedAt: null,
          deleteAfter: null,
        })
      : await this.authRepository.createAuthUser({
          email,
          password: await bcrypt.hash(password, 10),
          role: UserRole.SUPER_ADMIN,
          firstName: 'Gift App',
          lastName: 'Super Admin',
          isVerified: true,
          isActive: true,
          isApproved: true,
          adminRoleId: superAdminRole.id,
          adminPermissions: SUPER_ADMIN_PERMISSIONS,
        });

    await this.authRepository.demoteOtherSuperAdmins(canonicalSuperAdmin.id);
  }

  private generateOtp(): string {
    return randomInt(100000, 1000000).toString();
  }

  private generateOtpExpiry(): Date {
    return new Date(Date.now() + 10 * 60 * 1000);
  }

  private async ensureSystemRole(
    name: string,
    slug: string,
    description: string,
    permissions: Record<string, string[]>,
  ): Promise<AdminRole> {
    return this.authRepository.upsertSystemRole({ name, slug, description, permissions });
  }


}
