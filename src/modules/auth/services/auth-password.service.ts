import { Injectable } from '@nestjs/common';
import { AuthUserContext } from '../../../common/decorators/current-user.decorator';
import { ChangePasswordDto, ForgotPasswordDto, ResetPasswordDto, VerifyEmailDto, VerifyResetOtpDto } from '../dto/auth.dto';
import { AuthCoreService } from './auth-core.service';

@Injectable()
export class AuthPasswordService {
  constructor(private readonly core: AuthCoreService) {}

  verifyEmail(user: AuthUserContext, dto: VerifyEmailDto) { return this.core.verifyEmail(user, dto); }
  resendVerification(user: AuthUserContext) { return this.core.resendVerification(user); }
  forgotPassword(dto: ForgotPasswordDto) { return this.core.forgotPassword(dto); }
  verifyResetOtp(dto: VerifyResetOtpDto) { return this.core.verifyResetOtp(dto); }
  resetPassword(dto: ResetPasswordDto) { return this.core.resetPassword(dto); }
  changePassword(user: AuthUserContext, dto: ChangePasswordDto) { return this.core.changePassword(user, dto); }
}
