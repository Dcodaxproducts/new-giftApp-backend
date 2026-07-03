import { Body, Controller, Get, Patch, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { UserRole } from '@prisma/client';
import { AuthUserContext, CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ListReferralSettingsAuditLogsDto, UpdateReferralSettingsDto } from './dto/referral-settings.dto';
import { ReferralSettingsService } from './referral-settings.service';

@ApiTags('02 Admin - Referral Settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('referral-settings')
export class ReferralSettingsController {
  constructor(private readonly settings: ReferralSettingsService) {}

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.STAFF)
  @Permissions('referralSettings.read')
  @ApiOperation({ summary: 'Fetch referral settings', description: 'SUPER_ADMIN or ADMIN with referralSettings.read. Customer referral APIs consume these settings. Pending referrals use the settings snapshot stored at referral creation.' })
  @ApiResponse({ status: 200, schema: { example: { success: true, data: { isActive: true, referrerRewardAmount: 25, newUserRewardAmount: 10, rewardCurrency: 'USD', minimumTransactionAmount: 50, referralExpirationValue: 30, referralExpirationUnit: 'DAYS', allowSelfReferrals: false, qualificationRule: 'FIRST_SUCCESSFUL_PURCHASE', updatedAt: '2026-05-09T10:00:00.000Z' }, message: 'Referral settings fetched successfully.' } } })
  get() { return this.settings.get(); }

  @Patch()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update referral settings or status', description: 'SUPER_ADMIN only. Changes apply to future referral snapshots and do not recalculate already-earned rewards. Use isActive/statusReason on this same endpoint to activate or deactivate the referral program.' })
  @ApiBody({ type: UpdateReferralSettingsDto, examples: { update: { value: { referrerRewardAmount: 25, newUserRewardAmount: 10, rewardCurrency: 'USD', minimumTransactionAmount: 50, referralExpirationValue: 30, referralExpirationUnit: 'DAYS', allowSelfReferrals: false, qualificationRule: 'FIRST_SUCCESSFUL_PURCHASE' } }, activate: { value: { isActive: true, statusReason: 'Seasonal referral campaign enabled.' } }, deactivate: { value: { isActive: false, statusReason: 'Referral campaign paused for budget review.' } } } })
  @ApiResponse({ status: 200, description: 'Referral settings updated successfully', schema: { example: { success: true, data: { isActive: true, referrerRewardAmount: 25, newUserRewardAmount: 10, rewardCurrency: 'USD', minimumTransactionAmount: 50, referralExpirationValue: 30, referralExpirationUnit: 'DAYS', allowSelfReferrals: false }, message: 'Referral settings updated successfully.' } } })
  update(@CurrentUser() user: AuthUserContext, @Body() dto: UpdateReferralSettingsDto, @Req() request: Request) { return this.settings.update(user, dto, request.ip, request.headers['user-agent']); }

  @Get('stats')
  @Roles(UserRole.SUPER_ADMIN, UserRole.STAFF)
  @Permissions('referralSettings.read')
  @ApiOperation({ summary: 'Fetch referral stats', description: 'SUPER_ADMIN or ADMIN with referralSettings.read.' })
  stats() { return this.settings.stats(); }

  @Get('audit-logs')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'List referral settings audit logs', description: 'SUPER_ADMIN only.' })
  @ApiQuery({ name: 'fromDate', required: false })
  @ApiQuery({ name: 'toDate', required: false })
  auditLogs(@Query() query: ListReferralSettingsAuditLogsDto) { return this.settings.auditLogs(query); }
}
