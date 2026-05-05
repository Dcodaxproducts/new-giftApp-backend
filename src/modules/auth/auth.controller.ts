import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Request } from 'express';
import { AuthUserContext, CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthService } from './auth.service';
import {
  GuestSessionDto,
  RejectProviderDto,
  UpdateUserActiveStatusDto,
} from './dto/admin-auth.dto';
import {
  CreateAdminDto,
  CreateAdminRoleDto,
  ListAdminRolesDto,
  ListAdminsDto,
  ResetAdminPasswordDto,
  UpdateAdminActiveStatusDto,
  UpdateAdminDto,
  UpdateAdminRoleDto,
  UpdateRolePermissionsDto,
} from './dto/admin-management.dto';
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

@ApiTags('Auth')
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
  guestSession(@Body() dto: GuestSessionDto) {
    return this.authService.createGuestSession(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto, @Req() request: Request) {
    return this.authService.login(dto, request.ip, request.headers['user-agent']);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @Post('admins')
  createAdmin(@CurrentUser() user: AuthUserContext, @Body() dto: CreateAdminDto) {
    return this.authService.createAdmin(user, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @Get('admins')
  listAdmins(
    @CurrentUser() user: AuthUserContext,
    @Query() query: ListAdminsDto,
  ) {
    return this.authService.listAdmins(user, query);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @Get('admins/:id')
  adminDetails(@CurrentUser() user: AuthUserContext, @Param('id') id: string) {
    return this.authService.adminDetails(user, id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @Patch('admins/:id')
  updateAdmin(
    @CurrentUser() user: AuthUserContext,
    @Param('id') id: string,
    @Body() dto: UpdateAdminDto,
  ) {
    return this.authService.updateAdmin(user, id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @Patch('admins/:id/active-status')
  updateAdminActiveStatus(
    @CurrentUser() user: AuthUserContext,
    @Param('id') id: string,
    @Body() dto: UpdateAdminActiveStatusDto,
  ) {
    return this.authService.updateAdminActiveStatus(user, id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @Patch('admins/:id/password')
  resetAdminPassword(
    @CurrentUser() user: AuthUserContext,
    @Param('id') id: string,
    @Body() dto: ResetAdminPasswordDto,
  ) {
    return this.authService.resetAdminPassword(user, id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @Get('admin-roles')
  listAdminRoles(
    @CurrentUser() user: AuthUserContext,
    @Query() query: ListAdminRolesDto,
  ) {
    return this.authService.listAdminRoles(user, query);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @Get('admin-roles/:id')
  adminRoleDetails(
    @CurrentUser() user: AuthUserContext,
    @Param('id') id: string,
  ) {
    return this.authService.adminRoleDetails(user, id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @Post('admin-roles')
  createAdminRole(
    @CurrentUser() user: AuthUserContext,
    @Body() dto: CreateAdminRoleDto,
  ) {
    return this.authService.createAdminRole(user, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @Patch('admin-roles/:id')
  updateAdminRole(
    @CurrentUser() user: AuthUserContext,
    @Param('id') id: string,
    @Body() dto: UpdateAdminRoleDto,
  ) {
    return this.authService.updateAdminRole(user, id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @Patch('admin-roles/:id/permissions')
  updateRolePermissions(
    @CurrentUser() user: AuthUserContext,
    @Param('id') id: string,
    @Body() dto: UpdateRolePermissionsDto,
  ) {
    return this.authService.updateRolePermissions(user, id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @Delete('admin-roles/:id')
  deleteAdminRole(@CurrentUser() user: AuthUserContext, @Param('id') id: string) {
    return this.authService.deleteAdminRole(user, id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @Get('permissions/catalog')
  permissionCatalog() {
    return this.authService.permissionCatalog();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @Patch('providers/:id/approve')
  approveProvider(@CurrentUser() user: AuthUserContext, @Param('id') id: string) {
    return this.authService.approveProvider(user, id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @Patch('providers/:id/reject')
  rejectProvider(
    @CurrentUser() user: AuthUserContext,
    @Param('id') id: string,
    @Body() dto: RejectProviderDto,
  ) {
    return this.authService.rejectProvider(user, id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Patch('users/:id/active-status')
  updateUserActiveStatus(
    @CurrentUser() user: AuthUserContext,
    @Param('id') id: string,
    @Body() dto: UpdateUserActiveStatusDto,
  ) {
    return this.authService.updateUserActiveStatus(user, id, dto);
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

  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
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
