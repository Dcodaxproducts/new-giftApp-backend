import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { UserRole } from '@prisma/client';
import { AuthUserContext, CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { ListPayoutSettingsAuditLogsDto, UpdateAdminPayoutSettingsDto, UpsertCommissionTierDto } from '../dto/admin-payout-settings.dto';
import { AdminPayoutSettingsService } from '../services/admin-payout-settings.service';

@ApiTags('02 Admin - Commission & Payout Settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
@Controller('admin/payout-settings')
export class AdminPayoutSettingsController {
  constructor(private readonly payoutSettings: AdminPayoutSettingsService) {}

  @Get()
  @Permissions('payoutSettings.read')
  @ApiOperation({ summary: 'Fetch commission and payout settings', description: 'SUPER_ADMIN or ADMIN with payoutSettings.read. Returns global platform commission, payout threshold/schedule, and active provider commission tiers. Settings affect future payout calculations only and do not rewrite historical payouts.' })
  @ApiResponse({ status: 200, schema: { example: { success: true, data: { platformRatePercent: 5, minimumPayoutThreshold: 100, currency: 'USD', payoutSchedule: 'MONTHLY_LAST_DAY', payoutTimeUtc: '00:00', autoPayoutEnabled: true, lastUpdatedAt: '2026-05-16T10:00:00.000Z', commissionTiers: [{ id: 'tier_standard', name: 'Standard Tier', commissionRatePercent: 15, orderVolumeThreshold: 0, sortOrder: 1, isActive: true }, { id: 'tier_silver', name: 'Silver Partner', commissionRatePercent: 12.5, orderVolumeThreshold: 5000, sortOrder: 2, isActive: true }] }, message: 'Payout settings fetched successfully.' } } })
  get() { return this.payoutSettings.get(); }

  @Patch()
  @Permissions('payoutSettings.update')
  @ApiOperation({ summary: 'Update commission and payout settings', description: 'SUPER_ADMIN or ADMIN with payoutSettings.update. Updates global settings for future payout calculations only; existing historical payouts are not rewritten or recalculated.' })
  @ApiBody({ type: UpdateAdminPayoutSettingsDto, examples: { update: { value: { platformRatePercent: 5, minimumPayoutThreshold: 100, currency: 'USD', payoutSchedule: 'MONTHLY_LAST_DAY', payoutTimeUtc: '00:00', autoPayoutEnabled: true } } } })
  @ApiResponse({ status: 200, schema: { example: { success: true, data: { platformRatePercent: 5, minimumPayoutThreshold: 100, currency: 'USD', payoutSchedule: 'MONTHLY_LAST_DAY', payoutTimeUtc: '00:00', autoPayoutEnabled: true, lastUpdatedAt: '2026-05-16T10:00:00.000Z' }, message: 'Payout settings updated successfully.' } } })
  update(@CurrentUser() user: AuthUserContext, @Body() dto: UpdateAdminPayoutSettingsDto, @Req() request: Request) { return this.payoutSettings.update(user, dto, request.ip, request.headers['user-agent']); }

  @Get('commission-tiers')
  @Permissions('payoutSettings.read')
  @ApiOperation({ summary: 'List commission tiers', description: 'SUPER_ADMIN or ADMIN with payoutSettings.read. Returns active commission tiers ordered by sort order and threshold.' })
  @ApiResponse({ status: 200, schema: { example: { success: true, data: [{ id: 'tier_standard', name: 'Standard Tier', commissionRatePercent: 15, orderVolumeThreshold: 0, sortOrder: 1, isActive: true }], message: 'Commission tiers fetched successfully.' } } })
  tiers() { return this.payoutSettings.tiers(); }

  @Post('commission-tiers')
  @Permissions('payoutSettings.update')
  @ApiOperation({ summary: 'Create commission tier', description: 'SUPER_ADMIN or ADMIN with payoutSettings.update. Creates a provider commission tier for future billing/payout cycles only. Thresholds must be unique among active tiers.' })
  @ApiBody({ type: UpsertCommissionTierDto, examples: { create: { value: { name: 'Gold Elite', commissionRatePercent: 10, orderVolumeThreshold: 15000, sortOrder: 3, isActive: true } } } })
  @ApiResponse({ status: 201, schema: { example: { success: true, data: { id: 'tier_gold', name: 'Gold Elite', commissionRatePercent: 10, orderVolumeThreshold: 15000, sortOrder: 3, isActive: true }, message: 'Commission tier created successfully.' } } })
  createTier(@CurrentUser() user: AuthUserContext, @Body() dto: UpsertCommissionTierDto, @Req() request: Request) { return this.payoutSettings.createTier(user, dto, request.ip, request.headers['user-agent']); }

  @Patch('commission-tiers/:id')
  @Permissions('payoutSettings.update')
  @ApiOperation({ summary: 'Update commission tier', description: 'SUPER_ADMIN or ADMIN with payoutSettings.update. Tier changes take effect at the start of the next billing/payout cycle and do not rewrite historical payouts.' })
  @ApiBody({ type: UpsertCommissionTierDto, examples: { update: { value: { name: 'Gold Elite', commissionRatePercent: 10, orderVolumeThreshold: 15000, sortOrder: 3, isActive: true } } } })
  @ApiResponse({ status: 200, schema: { example: { success: true, data: { id: 'tier_gold', name: 'Gold Elite', commissionRatePercent: 10, orderVolumeThreshold: 15000, sortOrder: 3, isActive: true }, message: 'Commission tier updated successfully.' } } })
  updateTier(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Body() dto: UpsertCommissionTierDto, @Req() request: Request) { return this.payoutSettings.updateTier(user, id, dto, request.ip, request.headers['user-agent']); }

  @Delete('commission-tiers/:id')
  @Permissions('payoutSettings.update')
  @ApiOperation({ summary: 'Delete commission tier', description: 'SUPER_ADMIN or ADMIN with payoutSettings.update. Soft-deletes a tier for future calculations only; historical payouts remain unchanged.' })
  @ApiResponse({ status: 200, schema: { example: { success: true, data: { id: 'tier_gold', deleted: true }, message: 'Commission tier deleted successfully.' } } })
  deleteTier(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Req() request: Request) { return this.payoutSettings.deleteTier(user, id, request.ip, request.headers['user-agent']); }

  @Get('audit-logs')
  @Permissions('payoutSettings.read')
  @ApiOperation({ summary: 'List payout settings audit logs', description: 'SUPER_ADMIN or ADMIN with payoutSettings.read. Returns audit logs for payout settings and commission tier changes, including sanitized before/after JSON.' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'fromDate', required: false })
  @ApiQuery({ name: 'toDate', required: false })
  @ApiResponse({ status: 200, schema: { example: { success: true, data: [{ id: 'audit_log_id', action: 'PAYOUT_SETTINGS_UPDATED', actor: { id: 'admin_id', name: 'Alex Rivera' }, targetType: 'PAYOUT_SETTINGS', before: { platformRatePercent: 5 }, after: { platformRatePercent: 6 }, createdAt: '2026-05-16T10:00:00.000Z' }], meta: { page: 1, limit: 20, total: 1, totalPages: 1 }, message: 'Payout settings audit logs fetched successfully.' } } })
  auditLogs(@Query() query: ListPayoutSettingsAuditLogsDto) { return this.payoutSettings.auditLogs(query); }
}
