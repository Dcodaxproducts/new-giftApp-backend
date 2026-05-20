import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthUserContext, CurrentUser } from '../../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { AuthService } from '../services/auth.service';
import {
  ChangePasswordDto,
  CreateGuestSessionDto,
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

  @Post('guest/session')
  @ApiOperation({
    summary: 'Create guest browsing session',
    description: 'PUBLIC. Request body is optional metadata only. Guest capabilities are server-issued from Admin Guest Access Settings. Client-provided capabilities are ignored and will be removed in a future version. Guest sessions are for limited browsing and onboarding access only.',
  })
  @ApiBody({
    required: false,
    type: CreateGuestSessionDto,
    examples: {
      metadata: { value: { deviceId: 'optional-device-id', platform: 'WEB', appVersion: '1.0.0', locale: 'en', timezone: 'Asia/Karachi', referrer: 'landing-page' } },
      empty: { value: {} },
    },
  })
  @ApiResponse({
    status: 201,
    schema: {
      example: {
        success: true,
        data: {
          guestSessionId: 'guest_session_id',
          accessToken: 'guest_jwt',
          tokenType: 'Bearer',
          role: 'GUEST_USER',
          capabilities: ['VIEW_ONBOARDING', 'BROWSE_MARKETPLACE', 'VIEW_GIFT_DETAILS', 'VIEW_MARKETPLACE_FILTERS', 'VIEW_DISCOUNTED_GIFTS'],
          expiresAt: '2026-05-18T12:00:00.000Z',
          guestAccess: {
            allowMarketplaceBrowsing: true,
            allowMarketplaceHome: true,
            allowGiftDetails: true,
            allowDiscountedGifts: true,
            allowFilterOptions: true,
            allowWishlist: false,
            allowCart: false,
            allowCheckout: false,
          },
        },
        message: 'Guest session created successfully.',
      },
    },
  })
  guestSession(@Body() dto: CreateGuestSessionDto | undefined, @Req() request: Request) {
    return this.authService.createGuestSession(dto, request.ip, request.headers['user-agent']);
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
  verifyEmail(
    @CurrentUser() user: AuthUserContext,
    @Body() dto: VerifyEmailDto,
  ) {
    return this.authService.verifyEmail(user, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('resend-otp')
  resendRegistrationOtp(@CurrentUser() user: AuthUserContext) {
    return this.authService.resendVerification(user);
  }

  @Post('resend-verification-email')
  @ApiOperation({ summary: 'Resend verification email for unverified login', description: 'Public endpoint. Always returns the same success envelope to avoid user enumeration. Sends verification OTP only when the email exists and is not verified.' })
  @ApiResponse({ status: 201, schema: { example: { success: true, data: { delivery: 'OTP_SENT_IF_ELIGIBLE', nextStep: 'Use the 6-digit verification OTP to complete email verification.' }, message: 'If the email is registered and unverified, a 6-digit verification OTP has been sent.' } } })
  resendVerificationEmail(@Body() dto: ResendVerificationEmailDto, @Req() request: Request) {
    return this.authService.resendVerificationEmail(dto, request.ip);
  }

  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('verify-reset-otp')
  @ApiOperation({ summary: 'Verify public OTP for password reset or unverified email flow', description: 'PUBLIC. For verified accounts this validates password reset OTP. For unverified accounts this accepts the latest verification OTP and marks the email as verified.' })
  @ApiResponse({ status: 201, schema: { example: { success: true, data: { purpose: 'EMAIL_VERIFICATION', emailVerified: true }, message: 'Email verified successfully' } } })
  verifyResetOtp(@Body() dto: VerifyResetOtpDto) {
    return this.authService.verifyResetOtp(dto);
  }

  @Post('reset-password')
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

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('cancel-deletion')
  cancelDeletion(@CurrentUser() user: AuthUserContext) {
    return this.authService.cancelDeletion(user);
  }
}
