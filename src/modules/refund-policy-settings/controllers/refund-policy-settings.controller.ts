import { Body, Controller, Get, Patch, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { UserRole } from '@prisma/client';
import { AuthUserContext, CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { ListRefundPolicyAuditLogsDto, UpdateRefundPolicySettingsDto } from '../dto/refund-policy-settings.dto';
import { RefundPolicySettingsService } from '../services/refund-policy-settings.service';

@ApiTags('02 Admin - Refund Policy Settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('admin/refund-policy-settings')
export class RefundPolicySettingsController {
  constructor(private readonly settings: RefundPolicySettingsService) {}

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Permissions('refundPolicies.read')
  @ApiOperation({ summary: 'Fetch refund policy settings', description: 'SUPER_ADMIN or ADMIN with refundPolicies.read. These global settings are used by refund eligibility, auto-refund, dispute decisions, and provider refund workflows. Only active gift categories are returned as eligible auto-refund categories; non-selected categories require manual review.' })
  @ApiResponse({ status: 200, schema: { example: { success: true, data: { refundWindowDays: 30, autoRefundThresholdAmount: 50, currency: 'PKR', autoApproveSmallRefunds: true, smallRefundAutoApproveAmount: 15, eligibleCategories: [{ id: 'category_electronics', name: 'Electronics' }, { id: 'category_apparel', name: 'Apparel' }, { id: 'category_home_decor', name: 'Home Decor' }], lastUpdatedAt: '2026-05-14T10:00:00.000Z', lastUpdatedBy: { id: 'admin_id', name: 'Alex Rivera' } }, message: 'Refund policy settings fetched successfully.' } } })
  get() { return this.settings.get(); }

  @Patch()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update refund policy settings', description: 'SUPER_ADMIN only. Updates global refund policy settings used by customer refund request eligibility, small auto-refunds, provider refund handling, and admin/provider dispute workflows.' })
  @ApiBody({ type: UpdateRefundPolicySettingsDto, examples: { update: { value: { refundWindowDays: 30, autoRefundThresholdAmount: 50, currency: 'PKR', autoApproveSmallRefunds: true, smallRefundAutoApproveAmount: 15, eligibleCategoryIds: ['category_electronics', 'category_apparel', 'category_home_decor'] } } } })
  @ApiResponse({ status: 200, schema: { example: { success: true, data: { refundWindowDays: 30, autoRefundThresholdAmount: 50, currency: 'PKR', autoApproveSmallRefunds: true, smallRefundAutoApproveAmount: 15, eligibleCategoryIds: ['category_electronics', 'category_apparel', 'category_home_decor'], lastUpdatedAt: '2026-05-14T10:00:00.000Z' }, message: 'Refund policy settings updated successfully.' } } })
  update(@CurrentUser() user: AuthUserContext, @Body() dto: UpdateRefundPolicySettingsDto, @Req() request: Request) { return this.settings.update(user, dto, request.ip, request.headers['user-agent']); }

  @Get('logs')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'List refund policy audit logs', description: 'SUPER_ADMIN only. Returns compliance logs for REFUND_POLICY_SETTINGS_UPDATED changes, including before/after policy JSON.' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'fromDate', required: false })
  @ApiQuery({ name: 'toDate', required: false })
  @ApiResponse({ status: 200, schema: { example: { success: true, data: [{ id: 'audit_log_id', action: 'REFUND_POLICY_SETTINGS_UPDATED', actor: { id: 'admin_id', name: 'Alex Rivera' }, before: { refundWindowDays: 14, autoRefundThresholdAmount: 25 }, after: { refundWindowDays: 30, autoRefundThresholdAmount: 50 }, createdAt: '2026-05-14T10:00:00.000Z' }], meta: { page: 1, limit: 20, total: 1, totalPages: 1 }, message: 'Refund policy audit logs fetched successfully.' } } })
  logs(@Query() query: ListRefundPolicyAuditLogsDto) { return this.settings.auditLogs(query); }
}
