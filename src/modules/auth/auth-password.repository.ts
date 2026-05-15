import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AuthPasswordRepository {
  constructor(private readonly prisma: PrismaService) {}

  incrementVerificationOtpAttempts(userId: string) {
    return this.prisma.user.update({ where: { id: userId }, data: { verificationOtpAttempts: { increment: 1 } } });
  }

  markEmailVerified(userId: string) {
    return this.prisma.user.update({ where: { id: userId }, data: { isVerified: true, verificationOtp: null, verificationOtpExpiresAt: null, verificationOtpAttempts: 0 } });
  }

  storeVerificationOtp(userId: string, otp: string, expiresAt: Date) {
    return this.prisma.user.update({ where: { id: userId }, data: { verificationOtp: otp, verificationOtpExpiresAt: expiresAt, verificationOtpAttempts: 0 } });
  }

  findUserByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  storeResetPasswordOtp(userId: string, otp: string, expiresAt: Date) {
    return this.prisma.user.update({ where: { id: userId }, data: { resetPasswordOtp: otp, resetPasswordOtpExpiresAt: expiresAt, resetPasswordOtpAttempts: 0 } });
  }

  clearResetPasswordOtp(userId: string) {
    return this.prisma.user.update({ where: { id: userId }, data: { resetPasswordOtp: null, resetPasswordOtpExpiresAt: null, resetPasswordOtpAttempts: 0 } });
  }

  incrementResetPasswordOtpAttempts(userId: string) {
    return this.prisma.user.update({ where: { id: userId }, data: { resetPasswordOtpAttempts: { increment: 1 } } });
  }

  resetPassword(userId: string, passwordHash: string) {
    return this.prisma.user.update({ where: { id: userId }, data: { password: passwordHash, refreshTokenHash: null, resetPasswordOtp: null, resetPasswordOtpExpiresAt: null, resetPasswordOtpAttempts: 0 } });
  }

  changePassword(userId: string, passwordHash: string) {
    return this.prisma.user.update({ where: { id: userId }, data: { password: passwordHash, refreshTokenHash: null } });
  }
}
