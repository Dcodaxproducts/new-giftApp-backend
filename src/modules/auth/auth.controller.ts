import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthUserContext, CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthService } from './services/auth.service';
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
} from './dto/auth.dto';

@ApiTags('01 Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('users/register')
  registerUser(@Body() dto: RegisterUserDto) {
    return this.authService.registerUser(dto);
  }

  @Post('providers/register')
  registerProvider(@Body() dto: RegisterProviderDto) {
    return this.authService.registerProvider(dto);
  }

  @Post('login')
  @ApiResponse({ status: 403, description: 'Email exists and password is valid, but email verification is still required.', schema: { example: { success: false, error: { code: 'EMAIL_NOT_VERIFIED', message: 'Please verify your email before login', user_verified: 0 }, meta: { statusCode: 403, timestamp: '2026-05-18T11:04:05.524Z' } } } })
  login(@Body() dto: LoginDto, @Req() request: Request) {
    return this.authService.login(dto, request.ip, request.headers['user-agent']);
  }

  @Post('refresh')
  refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout(@CurrentUser() user: AuthUserContext) {
    return this.authService.logout(user);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('verify-email')
  @ApiOperation({ summary: 'Verify authenticated account email', description: 'Verify the authenticated account email with the latest verification OTP.' })
  @ApiResponse({ status: 201, schema: { example: { success: true, data: { id: 'user_id', email: 'user@example.com', status: 'APPROVED' }, message: 'Email verified successfully' } } })
  verifyEmail(
    @CurrentUser() user: AuthUserContext,
    @Body() dto: VerifyEmailDto,
  ) {
    return this.authService.verifyEmail(user, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('resend-otp')
  @ApiOperation({ summary: 'Resend authenticated email verification OTP', description: 'Send a new verification OTP for the authenticated account when it is still unverified.' })
  @ApiResponse({ status: 201, schema: { example: { success: true, data: null, message: 'A verification OTP has been sent to your email address.' } } })
  resendRegistrationOtp(@CurrentUser() user: AuthUserContext) {
    return this.authService.resendVerification(user);
  }

  @Post('resend-verification-email')
  @ApiOperation({ summary: 'Resend verification email', description: 'Public endpoint. Returns the same success envelope for ineligible or missing accounts to avoid account enumeration. Reports delivery failure only when the mail provider fails for an eligible account.' })
  @ApiResponse({ status: 201, schema: { example: { success: true, data: { delivery: 'EMAIL', nextStep: 'Check your inbox for a 6-digit verification code.' }, message: 'A verification email has been sent to the email address you provided.' } } })
  @ApiResponse({ status: 503, schema: { example: { success: false, error: { code: 'SERVICE_UNAVAILABLE', message: 'We could not send the verification email right now. Please try again later.' }, meta: {} } } })
  resendVerificationEmail(@Body() dto: ResendVerificationEmailDto, @Req() request: Request) {
    return this.authService.resendVerificationEmail(dto, request.ip);
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Request password reset instructions', description: 'Public endpoint. Returns the same success envelope for missing accounts to avoid account enumeration. Reports delivery failure only when the mail provider fails for an eligible account.' })
  @ApiResponse({ status: 201, schema: { example: { success: true, message: 'Reset instructions have been sent to the email address you provided.' } } })
  @ApiResponse({ status: 503, schema: { example: { success: false, error: { code: 'SERVICE_UNAVAILABLE', message: 'We could not send the reset instructions right now. Please try again later.' }, meta: {} } } })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('verify-reset-otp')
  @ApiOperation({ summary: 'Verify reset or verification OTP', description: 'Verify OTP for password reset or unverified email flow.' })
  @ApiResponse({ status: 201, schema: { example: { success: true, data: { purpose: 'EMAIL_VERIFICATION', emailVerified: true }, message: 'Email verified successfully' } } })
  verifyResetOtp(@Body() dto: VerifyResetOtpDto) {
    return this.authService.verifyResetOtp(dto);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset account password with OTP', description: 'Public endpoint. Resets the password only when the supplied email and OTP are valid, without exposing whether the account exists.' })
  @ApiResponse({ status: 201, schema: { example: { success: true, message: 'Password has been reset successfully.' } } })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch('change-password')
  changePassword(
    @CurrentUser() user: AuthUserContext,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(user, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() user: AuthUserContext) {
    return this.authService.me(user);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch('me')
  updateMe(@CurrentUser() user: AuthUserContext, @Body() dto: UpdateOwnProfileDto) {
    return this.authService.updateMe(user, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('sessions')
  sessions(@CurrentUser() user: AuthUserContext) {
    return this.authService.sessions(user);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('sessions/logout-all')
  logoutAllSessions(@CurrentUser() user: AuthUserContext) {
    return this.authService.logoutAllSessions(user);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete('sessions/:id')
  revokeSession(@CurrentUser() user: AuthUserContext, @Param('id') id: string) {
    return this.authService.revokeSession(user, id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete('account')
  deleteAccount(@CurrentUser() user: AuthUserContext) {
    return this.authService.deleteAccount(user);
  }

}
