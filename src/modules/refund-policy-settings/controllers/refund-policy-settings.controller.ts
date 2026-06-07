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

const refundPolicySettingsResponseExample = {
  success: true,
  data: {
    allowRefund: true,
    noteText: 'Refunds are processed according to cancellation policy.',
    refundWindowDays: 30,
    autoRefundThresholdAmount: 50,
    cancellationTiers: [{ id: 'tier_id', daysBeforeCheckIn: 5, deductionPercent: 10, label: 'Early' }],
    lastUpdatedAt: '2026-05-25T10:00:00.000Z',
    lastUpdatedBy: { id: 'admin_id', name: 'Super Admin' },
  },
  message: 'Refund policy settings fetched successfully.',
};

const refundPolicyPatchExamples = {
  enableRefunds: {
    value: {
      allowRefund: true,
      noteText: 'Refunds are processed according to cancellation policy.',
      refundWindowDays: 30,
      autoRefundThresholdAmount: 50,
      cancellationTiers: [{ daysBeforeCheckIn: 5, deductionPercent: 10, label: 'Early' }],
    },
  },
  disableRefunds: {
    value: {
      allowRefund: false,
      noteText: 'Refunds are temporarily disabled.',
    },
  },
  updateCancellationTiers: {
    value: {
      cancellationTiers: [
        { daysBeforeCheckIn: 5, deductionPercent: 10, label: 'Early' },
        { daysBeforeCheckIn: 2, deductionPercent: 25, label: 'Late' },
      ],
    },
  },
} as const;

@ApiTags('02 Admin - Refund Policy Settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('admin/refund-policy-settings')
export class RefundPolicySettingsController {
  constructor(private readonly settings: RefundPolicySettingsService) {}

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Permissions('refundPolicies.read')
  @ApiOperation({ summary: 'Fetch refund policy settings', description: 'SUPER_ADMIN or ADMIN with refundPolicies.read. These global settings are used by refund eligibility, cancellation deduction tiers, dispute decisions, and provider refund workflows.' })
  @ApiResponse({ status: 200, schema: { example: refundPolicySettingsResponseExample } })
  get() { return this.settings.get(); }

  @Patch()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update refund policy settings', description: 'SUPER_ADMIN only. Updates global refund policy settings used by customer refund request eligibility, provider refund handling, cancellation deduction tiers, and admin/provider dispute workflows.' })
  @ApiBody({ type: UpdateRefundPolicySettingsDto, examples: refundPolicyPatchExamples })
  @ApiResponse({ status: 200, schema: { example: { ...refundPolicySettingsResponseExample, message: 'Refund policy settings updated successfully.' } } })
  update(@CurrentUser() user: AuthUserContext, @Body() dto: UpdateRefundPolicySettingsDto, @Req() request: Request) { return this.settings.update(user, dto, request.ip, request.headers['user-agent']); }

  @Get('logs')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'List refund policy audit logs', description: 'SUPER_ADMIN only. Returns compliance logs for REFUND_POLICY_SETTINGS_UPDATED changes, including before/after policy JSON.' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'fromDate', required: false })
  @ApiQuery({ name: 'toDate', required: false })
  @ApiResponse({ status: 200, schema: { example: { success: true, data: [{ id: 'audit_log_id', action: 'REFUND_POLICY_SETTINGS_UPDATED', actor: { id: 'admin_id', name: 'Alex Rivera' }, before: { allowRefund: true, noteText: 'Refunds are processed according to cancellation policy.', refundWindowDays: 30, autoRefundThresholdAmount: 50, cancellationTiers: [] }, after: { allowRefund: false, noteText: 'Refunds are temporarily disabled.', refundWindowDays: 30, autoRefundThresholdAmount: 50, cancellationTiers: [] }, createdAt: '2026-05-14T10:00:00.000Z' }], meta: { page: 1, limit: 10, total: 1, totalPages: 1 }, message: 'Refund policy audit logs fetched successfully.' } } })
  logs(@Query() query: ListRefundPolicyAuditLogsDto) { return this.settings.auditLogs(query); }
}
