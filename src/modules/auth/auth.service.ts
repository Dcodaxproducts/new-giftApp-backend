import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomInt } from 'crypto';
import { AuthUserContext } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../database/prisma.service';
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  LoginDto,
  RefreshDto,
  RegisterDto,
  ResetPasswordDto,
  VerifyEmailDto,
} from './dto/auth.dto';

interface TokenPayload {
  uid: string;
  role: UserRole;
  type?: 'refresh';
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const email = this.normalizeEmail(dto.email);
    const existing = await this.prisma.user.findUnique({ where: { email } });

    if (existing) {
      throw new ConflictException('User already exists');
    }

    const otp = this.generateOtp();
    const user = await this.prisma.user.create({
      data: {
        email,
        password: await bcrypt.hash(dto.password, 10),
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        phone: dto.phone?.trim(),
        role: dto.role ?? UserRole.CUSTOMER,
        verificationOtp: otp,
        verificationOtpExpiresAt: this.generateOtpExpiry(),
      },
    });
    const tokens = await this.issueTokens(user);

    return {
      data: {
        user: this.toAuthUser(user),
        ...tokens,
        verificationOtp: this.shouldExposeOtp() ? otp : undefined,
      },
      message: 'Registration successful. Verify email with OTP.',
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: this.normalizeEmail(dto.email) },
    });

    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
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
      throw new UnauthorizedException('Account is inactive');
    }

    const tokens = await this.issueTokens(user);
    return {
      data: {
        user: this.toAuthUser(user),
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

    return {
      data: { verificationOtp: this.shouldExposeOtp() ? otp : undefined },
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
    }

    return {
      data: { resetOtp: user && this.shouldExposeOtp() ? otp : undefined },
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

  private async getActiveUser(userId: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user || user.deletedAt || !user.isActive) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  private async issueTokens(user: User) {
    const payload: TokenPayload = { uid: user.id, role: user.role };
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
    return {
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

  private generateOtp(): string {
    return randomInt(100000, 1000000).toString();
  }

  private generateOtpExpiry(): Date {
    return new Date(Date.now() + 10 * 60 * 1000);
  }

  private shouldExposeOtp(): boolean {
    return this.configService.get<string>('NODE_ENV', 'development') !== 'production';
  }
}
