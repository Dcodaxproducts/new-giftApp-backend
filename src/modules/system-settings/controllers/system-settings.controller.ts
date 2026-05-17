import { Body, Controller, Get, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { UserRole } from '@prisma/client';
import { AuthUserContext, CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { ListSystemSettingsAuditLogsDto, SmtpTestDto, UpdateLogoDto, UpdateSystemSettingsDto } from '../dto/system-settings.dto';
import { SystemSettingsService } from '../services/system-settings.service';

@ApiTags('02 Admin - System Settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
@Controller('admin/system-settings')
export class SystemSettingsController {
  constructor(private readonly settings: SystemSettingsService) {}
  @Get() @Permissions('systemSettings.read') @ApiOperation({ summary: 'Fetch system settings', description: 'SUPER_ADMIN or ADMIN with systemSettings.read. SMTP secrets are never returned.' }) @ApiResponse({ status: 200, schema: { example: { success: true, data: { platformInfo: { applicationName: 'Gift App', supportEmail: 'support@giftapp.com', platformLogoUrl: 'https://cdn.example.com/logo.png' }, security: { sessionTimeoutMinutes: 30, adminMfaRequired: true, passwordPolicy: { minLength: 8, requireUppercase: true, requireLowercase: true, requireNumber: true, requireSymbol: true } }, payments: { defaultCurrency: 'USD', transactionFeePercent: 2.5 }, notifications: { pushNotificationsEnabled: true, emailNotificationsEnabled: true, smtpConfigured: true } }, message: 'System settings fetched successfully.' } } }) get() { return this.settings.get(); }
  @Patch() @Permissions('systemSettings.update') @ApiOperation({ summary: 'Update system settings', description: 'SUPER_ADMIN or ADMIN with systemSettings.update. Session timeout and payment fee changes apply to future sessions/transactions only.' }) @ApiBody({ type: UpdateSystemSettingsDto }) update(@CurrentUser() user: AuthUserContext, @Body() dto: UpdateSystemSettingsDto, @Req() request: Request) { return this.settings.update(user, dto, request.ip, request.headers['user-agent']); }
  @Post('logo') @Permissions('systemSettings.update') @ApiOperation({ summary: 'Update system logo URL/reference', description: 'SUPER_ADMIN or ADMIN with systemSettings.update. Provide a completed Storage upload reference when available; only URL/reference is stored.' }) @ApiBody({ type: UpdateLogoDto }) logo(@CurrentUser() user: AuthUserContext, @Body() dto: UpdateLogoDto, @Req() request: Request) { return this.settings.updateLogo(user, dto, request.ip, request.headers['user-agent']); }
  @Post('smtp/test') @Permissions('systemSettings.update') @ApiOperation({ summary: 'Send SMTP test email', description: 'SUPER_ADMIN or ADMIN with systemSettings.update. Uses configured mailer and does not expose SMTP password or secrets.' }) @ApiBody({ type: SmtpTestDto }) smtpTest(@CurrentUser() user: AuthUserContext, @Body() dto: SmtpTestDto, @Req() request: Request) { return this.settings.testSmtp(user, dto, request.ip, request.headers['user-agent']); }
  @Get('audit-logs') @Permissions('systemSettings.read') @ApiOperation({ summary: 'List system settings audit logs', description: 'SUPER_ADMIN or ADMIN with systemSettings.read.' }) @ApiQuery({ name: 'page', required: false }) @ApiQuery({ name: 'limit', required: false }) auditLogs(@Query() query: ListSystemSettingsAuditLogsDto) { return this.settings.auditLogs(query); }
}
