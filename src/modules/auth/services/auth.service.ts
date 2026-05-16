import { Injectable } from '@nestjs/common';
import { AuthUserContext } from '../../../common/decorators/current-user.decorator';
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  GuestSessionDto,
  LoginDto,
  RefreshDto,
  RegisterProviderDto,
  RegisterUserDto,
  ResetPasswordDto,
  UpdateOwnProfileDto,
  VerifyEmailDto,
  VerifyResetOtpDto,
} from '../dto/auth.dto';
import { AuthLoginService } from './auth-login.service';
import { AuthPasswordService } from './auth-password.service';
import { AuthProfileService } from './auth-profile.service';
import { AuthRegistrationService } from './auth-registration.service';
import { AuthSessionService } from './auth-session.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly registration: AuthRegistrationService,
    private readonly loginFlow: AuthLoginService,
    private readonly password: AuthPasswordService,
    private readonly profile: AuthProfileService,
    private readonly session: AuthSessionService,
  ) {}

  registerUser(dto: RegisterUserDto) { return this.registration.registerUser(dto); }
  registerProvider(dto: RegisterProviderDto) { return this.registration.registerProvider(dto); }
  createGuestSession(dto: GuestSessionDto) { return this.registration.createGuestSession(dto); }
  login(dto: LoginDto, ipAddress?: string, userAgent?: string | string[]) { return this.loginFlow.login(dto, ipAddress, userAgent); }
  refresh(dto: RefreshDto) { return this.loginFlow.refresh(dto); }
  logout(user: AuthUserContext) { return this.loginFlow.logout(user); }
  verifyEmail(user: AuthUserContext, dto: VerifyEmailDto) { return this.password.verifyEmail(user, dto); }
  resendVerification(user: AuthUserContext) { return this.password.resendVerification(user); }
  forgotPassword(dto: ForgotPasswordDto) { return this.password.forgotPassword(dto); }
  verifyResetOtp(dto: VerifyResetOtpDto) { return this.password.verifyResetOtp(dto); }
  resetPassword(dto: ResetPasswordDto) { return this.password.resetPassword(dto); }
  changePassword(user: AuthUserContext, dto: ChangePasswordDto) { return this.password.changePassword(user, dto); }
  me(user: AuthUserContext) { return this.profile.me(user); }
  updateMe(user: AuthUserContext, dto: UpdateOwnProfileDto) { return this.profile.updateMe(user, dto); }
  sessions(user: AuthUserContext) { return this.session.sessions(user); }
  logoutAllSessions(user: AuthUserContext) { return this.session.logoutAllSessions(user); }
  revokeSession(user: AuthUserContext, id: string) { return this.session.revokeSession(user, id); }
  deleteAccount(user: AuthUserContext) { return this.profile.deleteAccount(user); }
  cancelDeletion(user: AuthUserContext) { return this.profile.cancelDeletion(user); }
}
