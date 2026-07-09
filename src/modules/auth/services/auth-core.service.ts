import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
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
  CustomerProfile,
  StaffRole,
  Prisma,
  ProviderProfile,
  StaffProfile,
  User,
  UserRole,
  UserStatus,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { AuthUserContext } from '../../../common/decorators/current-user.decorator';
import { AuthPasswordRepository } from '../repositories/auth-password.repository';
import { AuthRepository } from '../repositories/auth.repository';
import { AuthSessionsRepository } from '../repositories/auth-sessions.repository';
import { EmailNotVerifiedException } from '../exceptions/email-not-verified.exception';
import { AuthResendVerificationRateLimiterService } from './auth-resend-verification-rate-limiter.service';
import { MailerService } from '../../mailer/mailer.service';
import { CustomerReferralsService } from '../../customer-referrals/services/customer-referrals.service';
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

type AuthUserWithStaff = User & {
  staffProfile?: (StaffProfile & { staffRole: StaffRole | null }) | null;
  providerProfile?: ProviderProfile | null;
  customerProfile?: CustomerProfile | null;
};

const PASSWORD_RESET_SENT_MESSAGE = 'Reset instructions have been sent to the email address you provided.';
const PASSWORD_RESET_SEND_FAILED_MESSAGE = 'We could not send the reset instructions right now. Please try again later.';
const VERIFICATION_EMAIL_SENT_MESSAGE = 'A verification email has been sent to the email address you provided.';
const VERIFICATION_EMAIL_SEND_FAILED_MESSAGE = 'We could not send the verification email right now. Please try again later.';
const AUTHENTICATED_VERIFICATION_OTP_SENT_MESSAGE = 'A verification OTP has been sent to your email address.';
const TEST_OTP = '123456';
const LOGIN_RATE_LIMIT_MAX_FAILED_ATTEMPTS = 5;
const LOGIN_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

@Injectable()
export class AuthCoreService implements OnModuleInit {
  private readonly loginFailures = new Map<string, { count: number; resetAt: number }>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
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
    const user = await this.createUser({
      email: dto.email,
      password: dto.password,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      role: UserRole.REGISTERED_USER,
      status: UserStatus.PENDING,
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
    const user = await this.createUser({
      email: dto.email,
      password: dto.password,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      role: UserRole.PROVIDER,
      status: UserStatus.PENDING,
      providerProfile: {
        businessName: dto.businessName.trim(),
        businessCategoryId: dto.businessCategoryId,
        taxId: dto.taxId?.trim(),
        businessAddress: dto.businessAddress.trim(),
        fulfillmentMethods: dto.fulfillmentMethods,
        lat: dto.location?.lat,
        lng: dto.location?.lng,
      },
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

  async login(dto: LoginDto, ipAddress?: string, userAgent?: string | string[]) {
    this.assertLoginAllowed(dto.email);

    const user = await this.authRepository.findUserByEmail(this.normalizeEmail(dto.email));

    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      this.recordFailedLogin(dto.email);
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== UserStatus.APPROVED && user.status !== UserStatus.PENDING) {
      this.recordFailedLogin(dto.email);
      throw new UnauthorizedException('Account is inactive');
    }

    if (user.status === UserStatus.PENDING) {
      this.recordFailedLogin(dto.email);
      throw new EmailNotVerifiedException(0);
    }

    if (user.role === UserRole.PROVIDER && user.status !== UserStatus.APPROVED) {
      this.recordFailedLogin(dto.email);
      throw new ForbiddenException('Provider account is pending Super Admin approval');
    }

    if (user.role === UserRole.STAFF && user.status !== UserStatus.APPROVED) {
      this.recordFailedLogin(dto.email);
      throw new ForbiddenException('Admin account is not approved');
    }

    if (
      user.role === UserRole.STAFF &&
      (!user.staffProfile?.staffRoleId || !user.staffProfile.staffRole)
    ) {
      this.recordFailedLogin(dto.email);
      throw new ForbiddenException('Staff role is missing');
    }

    const tokens = await this.issueTokens(user, undefined, ipAddress, this.normalizeUserAgent(userAgent));
    await this.authRepository.updateLastLoginAt(user.id);
    this.clearLoginFailures(dto.email);

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
    if (!user?.refreshTokenHash || (user.status !== UserStatus.APPROVED && user.status !== UserStatus.PENDING)) {
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

    if (dbUser.status !== UserStatus.PENDING) {
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

    if (dbUser.status !== UserStatus.PENDING) {
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

    if (user && user.status === UserStatus.PENDING) {
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
        delivery: 'EMAIL',
        nextStep: 'Check your inbox for a 6-digit verification code.',
      },
      message: VERIFICATION_EMAIL_SENT_MESSAGE,
    };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.authPasswordRepository.findUserByEmail(this.normalizeEmail(dto.email));

    if (!user) {
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

    if (!user) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    if (user.status === UserStatus.PENDING) {
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
      data: { purpose: 'PASSWORD_RESET', emailVerified: true },
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
    if (user.role === UserRole.SUPER_ADMIN || user.role === UserRole.STAFF) {
      throw new ForbiddenException('Administrative accounts must be managed by Super Admin');
    }

    await this.authRepository.deleteAccountCascade(user.uid);

    return { data: null, message: 'Account deleted successfully' };
  }

  private async createUser(input: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role: UserRole;
    status?: UserStatus;
    mustChangePassword?: boolean;
    providerProfile?: {
      businessName?: string;
      businessCategoryId?: string;
      taxId?: string;
      businessAddress?: string;
      fulfillmentMethods?: string[];
      companyLogoUrl?: string;
      coverImageUrl?: string;
      businessBio?: string;
      lat?: number;
      lng?: number;
    };
    avatarUrl?: string;
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
        status: input.status ?? UserStatus.PENDING,
        mustChangePassword: input.mustChangePassword ?? false,
        providerProfile: input.providerProfile
          ? {
              create: {
                businessName: input.providerProfile.businessName,
                businessCategoryId: input.providerProfile.businessCategoryId,
                taxId: input.providerProfile.taxId,
                businessAddress: input.providerProfile.businessAddress,
                fulfillmentMethods: input.providerProfile.fulfillmentMethods ?? undefined,
                companyLogoUrl: input.providerProfile.companyLogoUrl ?? '',
                coverImageUrl: input.providerProfile.coverImageUrl ?? '',
                businessBio: input.providerProfile.businessBio,
                lat: input.providerProfile.lat,
                lng: input.providerProfile.lng,
              },
            }
          : undefined,
        customerProfile: input.role === UserRole.REGISTERED_USER
          ? {
              create: {},
            }
          : undefined,
        verificationOtp: otp,
        verificationOtpExpiresAt: this.generateOtpExpiry(),
      });
  }

  private async getActiveUser(userId: string): Promise<User> {
    const user = await this.authRepository.findActiveUserById(userId);

    if (!user || (user.status !== UserStatus.APPROVED && user.status !== UserStatus.PENDING)) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  private async issueTokens(user: AuthUserWithStaff, existingSessionId?: string, ipAddress?: string, userAgent?: string) {
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
      permissions: user.role === UserRole.STAFF ? user.staffProfile?.staffRole?.permissions ?? undefined : undefined,
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

  private async toAuthUser(user: AuthUserWithStaff) {
    const baseUser = {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      fullName: `${user.firstName} ${user.lastName}`.trim(),
      status: user.status,
      mustChangePassword: user.mustChangePassword,
    };

    if (user.role === UserRole.SUPER_ADMIN) {
      return baseUser;
    }

    if (user.role === UserRole.STAFF) {
      return {
        ...baseUser,
        admin: {
          roleId: user.staffProfile?.staffRoleId ?? null,
          permissions: user.staffProfile?.staffRole?.permissions ?? {},
        },
      };
    }

    if (user.role === UserRole.PROVIDER) {
      const profile = user.providerProfile;
      const businessCategory = profile?.businessCategoryId
        ? await this.authRepository.findProviderBusinessCategory(profile.businessCategoryId)
        : null;
      return {
        ...baseUser,
        provider: {
          id: user.id,
          businessName: profile?.businessName ?? null,
          businessCategory: businessCategory
            ? { id: businessCategory.id, name: businessCategory.name }
            : null,
          taxId: profile?.taxId ?? null,
          businessAddress: profile?.businessAddress ?? null,
          companyLogoUrl: profile?.companyLogoUrl ?? null,
          coverImageUrl: profile?.coverImageUrl ?? null,
          businessBio: profile?.businessBio ?? null,
          lat: profile?.lat ?? null,
          lng: profile?.lng ?? null,
          fulfillmentMethods: this.stringArray(profile?.fulfillmentMethods),
          status: user.status,
          memberSince: user.createdAt,
        },
      };
    }

    return { ...baseUser, subscription: await this.customerSubscriptionSummary(user.id) };
  }

  private async customerSubscriptionSummary(userId: string) {
    const subscription = await this.authRepository.findCustomerSubscriptionSummary(userId);
    if (!subscription) return { isPremium: false, status: 'FREE', planId: null, planName: null, billingCycle: null };
    return { isPremium: subscription.isPremium, status: subscription.status, planId: subscription.planId, planName: subscription.plan.name, billingCycle: subscription.billingCycle };
  }

  private stringArray(value: Prisma.JsonValue | null | undefined): string[] {
    return Array.isArray(value)
      ? value.filter((item): item is string => typeof item === 'string')
      : [];
  }

  private async userFromResetOtp(dto: ResetPasswordDto): Promise<User> {
    const user = await this.authPasswordRepository.findUserByEmail(this.normalizeEmail(dto.email));

    if (!user) {
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

  private assertLoginAllowed(email: string): void {
    const normalizedEmail = this.normalizeEmail(email);
    const entry = this.loginFailures.get(normalizedEmail);

    if (!entry) {
      return;
    }

    if (entry.resetAt <= Date.now()) {
      this.loginFailures.delete(normalizedEmail);
      return;
    }

    if (entry.count >= LOGIN_RATE_LIMIT_MAX_FAILED_ATTEMPTS) {
      throw new HttpException('Too many failed login attempts. Please try again later', HttpStatus.TOO_MANY_REQUESTS);
    }
  }

  private recordFailedLogin(email: string): void {
    const normalizedEmail = this.normalizeEmail(email);
    const now = Date.now();
    const current = this.loginFailures.get(normalizedEmail);

    if (!current || current.resetAt <= now) {
      this.loginFailures.set(normalizedEmail, {
        count: 1,
        resetAt: now + LOGIN_RATE_LIMIT_WINDOW_MS,
      });
      return;
    }

    current.count += 1;
  }

  private clearLoginFailures(email: string): void {
    this.loginFailures.delete(this.normalizeEmail(email));
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
    const email = this.normalizeEmail('giftapp.superadmin@yopmail.com');
    const password = 'Admin@123456';
    const emailOwner = await this.authRepository.findExistingUserByEmail(email);

    const canonicalSuperAdmin = emailOwner
      ? await this.authRepository.updateCanonicalSuperAdmin(emailOwner.id, {
          role: UserRole.SUPER_ADMIN,
          firstName: 'Gift App',
          lastName: 'Super Admin',
          status: UserStatus.APPROVED,
        })
      : await this.authRepository.createAuthUser({
          email,
          password: await bcrypt.hash(password, 10),
          role: UserRole.SUPER_ADMIN,
          firstName: 'Gift App',
          lastName: 'Super Admin',
          status: UserStatus.APPROVED,
        });

    await this.authRepository.demoteOtherSuperAdmins(canonicalSuperAdmin.id);
  }

  private generateOtp(): string {
    // return randomInt(100000, 1000000).toString();
    return TEST_OTP;
  }

  private generateOtpExpiry(): Date {
    return new Date(Date.now() + 10 * 60 * 1000);
  }
}
