import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  OnModuleInit,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  LoginAttemptStatus,
  Prisma,
  ProviderApprovalStatus,
  User,
  UserRole,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomInt } from 'crypto';
import { AuthUserContext } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../database/prisma.service';
import { LoginAttemptsService } from '../login-attempts/login-attempts.service';
import { MailerService } from '../mailer/mailer.service';
import {
  CreateAdminDto,
  GuestSessionDto,
  RejectProviderDto,
  UpdateUserActiveStatusDto,
} from './dto/admin-auth.dto';
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  LoginDto,
  RefreshDto,
  RegisterProviderDto,
  RegisterUserDto,
  ResetPasswordDto,
  VerifyEmailDto,
} from './dto/auth.dto';

interface TokenPayload {
  uid: string;
  role: UserRole;
  permissions?: Prisma.JsonValue;
  type?: 'refresh';
}

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly loginAttemptsService: LoginAttemptsService,
    private readonly mailerService: MailerService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.ensureSingleSuperAdmin();
  }

  async registerUser(dto: RegisterUserDto) {
    const user = await this.createUser({
      email: dto.email,
      password: dto.password,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      role: UserRole.REGISTERED_USER,
      isApproved: true,
      providerApprovalStatus: null,
    });
    await this.mailerService.sendVerificationEmail(
      user.email,
      this.requiredOtp(user.verificationOtp),
    );
    const tokens = await this.issueTokens(user);

    return {
      data: {
        user: this.toAuthUser(user),
        ...tokens,
      },
      message: 'Registered user account created. Verify email with OTP.',
    };
  }

  async registerProvider(dto: RegisterProviderDto) {
    const user = await this.createUser({
      email: dto.email,
      password: dto.password,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      role: UserRole.PROVIDER,
      isApproved: false,
      providerApprovalStatus: ProviderApprovalStatus.PENDING,
      providerBusinessName: dto.businessName.trim(),
      providerServiceArea: dto.serviceArea.trim(),
      providerDocuments: dto.documentUrls ?? [],
    });
    await this.mailerService.sendVerificationEmail(
      user.email,
      this.requiredOtp(user.verificationOtp),
    );
    const tokens = await this.issueTokens(user);

    return {
      data: {
        user: this.toAuthUser(user),
        ...tokens,
      },
      message: 'Provider application submitted for Super Admin approval.',
    };
  }

  createGuestSession(dto: GuestSessionDto) {
    return {
      data: {
        role: 'GUEST_USER',
        capabilities: dto.capabilities ?? [
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

    const user = await this.prisma.user.findUnique({
      where: { email: this.normalizeEmail(dto.email) },
    });

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
          user: this.toAuthUser(user),
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
      throw new ForbiddenException('Please verify your email before login');
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

    const tokens = await this.issueTokens(user);
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
        user: this.toAuthUser(user),
        ...tokens,
      },
      message: 'Login successful',
    };
  }

  async createAdmin(_user: AuthUserContext, dto: CreateAdminDto) {
    const admin = await this.createUser({
      email: dto.email,
      password: dto.password,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      role: UserRole.ADMIN,
      isApproved: true,
      isVerified: true,
      providerApprovalStatus: null,
      adminTitle: dto.title?.trim(),
      adminPermissions: (dto.permissions ?? {}) as Prisma.InputJsonObject,
    });

    return {
      data: this.toAuthUser(admin),
      message: 'Admin account created successfully',
    };
  }

  async approveProvider(_user: AuthUserContext, providerId: string) {
    const provider = await this.getProvider(providerId);
    const updated = await this.prisma.user.update({
      where: { id: provider.id },
      data: {
        isApproved: true,
        isActive: true,
        providerApprovalStatus: ProviderApprovalStatus.APPROVED,
      },
    });

    return {
      data: this.toAuthUser(updated),
      message: 'Provider approved successfully',
    };
  }

  async rejectProvider(
    _user: AuthUserContext,
    providerId: string,
    dto: RejectProviderDto,
  ) {
    const provider = await this.getProvider(providerId);
    const updated = await this.prisma.user.update({
      where: { id: provider.id },
      data: {
        isApproved: false,
        providerApprovalStatus: ProviderApprovalStatus.REJECTED,
      },
    });

    return {
      data: this.toAuthUser(updated),
      message: dto.reason
        ? `Provider rejected successfully: ${dto.reason}`
        : 'Provider rejected successfully',
    };
  }

  async updateUserActiveStatus(
    user: AuthUserContext,
    targetUserId: string,
    dto: UpdateUserActiveStatusDto,
  ) {
    const target = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!target || target.deletedAt) {
      throw new NotFoundException('User not found');
    }

    this.assertCanToggleActiveStatus(user, target);

    const updated = await this.prisma.user.update({
      where: { id: target.id },
      data: {
        isActive: dto.isActive,
        refreshTokenHash: dto.isActive ? target.refreshTokenHash : null,
      },
    });

    return {
      data: this.toAuthUser(updated),
      message: dto.isActive
        ? 'User account activated successfully'
        : 'User account deactivated successfully',
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

    const user = await this.prisma.user.findUnique({ where: { id: payload.uid } });
    if (!user?.refreshTokenHash || user.deletedAt || !user.isActive) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const isValid = await bcrypt.compare(dto.refreshToken, user.refreshTokenHash);
    if (!isValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return {
      data: await this.issueTokens(user),
      message: 'Token refreshed',
    };
  }

  async logout(user: AuthUserContext) {
    await this.prisma.user.update({
      where: { id: user.uid },
      data: { refreshTokenHash: null },
    });

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
      await this.prisma.user.update({
        where: { id: dbUser.id },
        data: { verificationOtpAttempts: { increment: 1 } },
      });
      throw new BadRequestException('Invalid or expired OTP');
    }

    await this.prisma.user.update({
      where: { id: dbUser.id },
      data: {
        isVerified: true,
        verificationOtp: null,
        verificationOtpExpiresAt: null,
        verificationOtpAttempts: 0,
      },
    });

    return { data: null, message: 'Email verified successfully' };
  }

  async resendVerification(user: AuthUserContext) {
    const dbUser = await this.getActiveUser(user.uid);

    if (dbUser.isVerified) {
      return { data: null, message: 'Email already verified' };
    }

    const otp = this.generateOtp();
    await this.prisma.user.update({
      where: { id: dbUser.id },
      data: {
        verificationOtp: otp,
        verificationOtpExpiresAt: this.generateOtpExpiry(),
        verificationOtpAttempts: 0,
      },
    });
    await this.mailerService.sendVerificationEmail(dbUser.email, otp);

    return {
      data: null,
      message: 'Verification OTP sent',
    };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: this.normalizeEmail(dto.email) },
    });
    const otp = this.generateOtp();

    if (user && !user.deletedAt) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          resetPasswordOtp: otp,
          resetPasswordOtpExpiresAt: this.generateOtpExpiry(),
          resetPasswordOtpAttempts: 0,
        },
      });
      await this.mailerService.sendPasswordResetEmail(user.email, otp);
    }

    return {
      data: null,
      message: 'If account exists, reset instructions are sent',
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: this.normalizeEmail(dto.email) },
    });

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
      await this.prisma.user.update({
        where: { id: user.id },
        data: { resetPasswordOtpAttempts: { increment: 1 } },
      });
      throw new BadRequestException('Invalid or expired OTP');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: await bcrypt.hash(dto.newPassword, 10),
        refreshTokenHash: null,
        resetPasswordOtp: null,
        resetPasswordOtpExpiresAt: null,
        resetPasswordOtpAttempts: 0,
      },
    });

    return { data: null, message: 'Password reset successful' };
  }

  async changePassword(user: AuthUserContext, dto: ChangePasswordDto) {
    const dbUser = await this.getActiveUser(user.uid);

    if (!(await bcrypt.compare(dto.currentPassword, dbUser.password))) {
      throw new UnauthorizedException('Current password is invalid');
    }

    await this.prisma.user.update({
      where: { id: dbUser.id },
      data: { password: await bcrypt.hash(dto.newPassword, 10), refreshTokenHash: null },
    });

    return { data: null, message: 'Password changed successfully' };
  }

  async me(user: AuthUserContext) {
    const dbUser = await this.getActiveUser(user.uid);
    return { data: this.toAuthUser(dbUser), message: 'Current user fetched' };
  }

  async deleteAccount(user: AuthUserContext) {
    if (user.role === UserRole.SUPER_ADMIN || user.role === UserRole.ADMIN) {
      throw new ForbiddenException('Administrative accounts must be managed by Super Admin');
    }

    await this.prisma.user.update({
      where: { id: user.uid },
      data: {
        isActive: false,
        deletedAt: new Date(),
        deleteAfter: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        refreshTokenHash: null,
      },
    });

    return { data: null, message: 'Account scheduled for deletion in 30 days' };
  }

  async cancelDeletion(user: AuthUserContext) {
    const dbUser = await this.prisma.user.findUnique({ where: { id: user.uid } });

    if (!dbUser?.deletedAt || !dbUser.deleteAfter || dbUser.deleteAfter <= new Date()) {
      throw new BadRequestException('Account is not scheduled for deletion');
    }

    await this.prisma.user.update({
      where: { id: dbUser.id },
      data: { isActive: true, deletedAt: null, deleteAfter: null },
    });

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
    providerApprovalStatus: ProviderApprovalStatus | null;
    providerBusinessName?: string;
    providerServiceArea?: string;
    providerDocuments?: string[];
    adminTitle?: string;
    adminPermissions?: Prisma.InputJsonValue;
  }): Promise<User> {
    const email = this.normalizeEmail(input.email);
    const existing = await this.prisma.user.findUnique({ where: { email } });

    if (existing) {
      throw new ConflictException('User already exists');
    }

    const otp = this.generateOtp();
    return this.prisma.user.create({
      data: {
        email,
        password: await bcrypt.hash(input.password, 10),
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        phone: input.phone?.trim(),
        role: input.role,
        isVerified: input.isVerified ?? false,
        isApproved: input.isApproved,
        providerApprovalStatus: input.providerApprovalStatus,
        providerBusinessName: input.providerBusinessName,
        providerServiceArea: input.providerServiceArea,
        providerDocuments: input.providerDocuments ?? undefined,
        adminTitle: input.adminTitle,
        adminPermissions: input.adminPermissions ?? undefined,
        verificationOtp: otp,
        verificationOtpExpiresAt: this.generateOtpExpiry(),
      },
    });
  }

  private async getProvider(providerId: string): Promise<User> {
    const provider = await this.prisma.user.findUnique({
      where: { id: providerId },
    });

    if (!provider || provider.deletedAt || provider.role !== UserRole.PROVIDER) {
      throw new NotFoundException('Provider not found');
    }

    return provider;
  }

  private async getActiveUser(userId: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user || user.deletedAt || !user.isActive) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  private assertCanToggleActiveStatus(user: AuthUserContext, target: User): void {
    if (target.role === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Super Admin active status cannot be changed');
    }

    if (user.uid === target.id) {
      throw new ForbiddenException('You cannot change your own active status');
    }

    if (user.role === UserRole.SUPER_ADMIN) {
      return;
    }

    if (
      user.role === UserRole.ADMIN &&
      (target.role === UserRole.REGISTERED_USER || target.role === UserRole.PROVIDER)
    ) {
      return;
    }

    throw new ForbiddenException('Your role cannot change this account status');
  }

  private async issueTokens(user: User) {
    const payload: TokenPayload = {
      uid: user.id,
      role: user.role,
      permissions: user.adminPermissions ?? undefined,
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

    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshTokenHash: await bcrypt.hash(refreshToken, 10) },
    });

    return { accessToken, refreshToken };
  }

  private toAuthUser(user: User) {
    const baseUser = {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      isVerified: user.isVerified,
      isActive: user.isActive,
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
          permissions: user.adminPermissions,
          isApproved: user.isApproved,
        },
      };
    }

    if (user.role === UserRole.PROVIDER) {
      return {
        ...baseUser,
        provider: {
          businessName: user.providerBusinessName,
          serviceArea: user.providerServiceArea,
          approvalStatus: user.providerApprovalStatus,
        },
      };
    }

    return baseUser;
  }

  private toDeletionState(user: User) {
    return {
      isDeleted: !!user.deletedAt,
      deletionScheduled: !!user.deleteAfter && user.deleteAfter > new Date(),
      deletedAt: user.deletedAt,
      deleteAfter: user.deleteAfter,
    };
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

  private async ensureSingleSuperAdmin(): Promise<void> {
    const email = this.normalizeEmail(
      this.configService.get<string>(
        'SUPER_ADMIN_EMAIL',
        'superadmin@giftapp.dev',
      ),
    );
    const password = this.configService.get<string>(
      'SUPER_ADMIN_PASSWORD',
      'Admin@123456',
    );
    const existingSuperAdmins = await this.prisma.user.findMany({
      where: { role: UserRole.SUPER_ADMIN },
      orderBy: { createdAt: 'asc' },
    });
    const emailOwner = await this.prisma.user.findUnique({ where: { email } });

    if (emailOwner && emailOwner.role !== UserRole.SUPER_ADMIN) {
      throw new ServiceUnavailableException(
        'Configured Super Admin email is already used by another role',
      );
    }

    if (!emailOwner) {
      await this.prisma.user.create({
        data: {
          email,
          password: await bcrypt.hash(password, 10),
          role: UserRole.SUPER_ADMIN,
          firstName: 'Super',
          lastName: 'Admin',
          isVerified: true,
          isActive: true,
          isApproved: true,
        },
      });
    } else {
      await this.prisma.user.update({
        where: { id: emailOwner.id },
        data: {
          isVerified: true,
          isActive: true,
          isApproved: true,
          deletedAt: null,
          deleteAfter: null,
        },
      });
    }

    const canonicalSuperAdmin = await this.prisma.user.findUnique({ where: { email } });
    const duplicateIds = existingSuperAdmins
      .filter((user) => user.email !== email && user.id !== canonicalSuperAdmin?.id)
      .map((user) => user.id);

    if (duplicateIds.length > 0) {
      await this.prisma.user.updateMany({
        where: { id: { in: duplicateIds } },
        data: { role: UserRole.ADMIN, isApproved: false, refreshTokenHash: null },
      });
    }
  }

  private generateOtp(): string {
    return randomInt(100000, 1000000).toString();
  }

  private generateOtpExpiry(): Date {
    return new Date(Date.now() + 10 * 60 * 1000);
  }

}
