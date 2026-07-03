import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { UserRole } from '@prisma/client';
import { AuthUserContext, CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UpdateRefundPolicySettingsDto } from './dto/refund-policy-settings.dto';
import { RefundPolicySettingsService } from './refund-policy-settings.service';

const refundPolicySettingsResponseExample = {
  success: true,
  data: {
    allowRefund: true,
    cancellationTiers: [{ daysBeforeDelivery: 30, deductionPercent: 50, label: 'Early Cancellation' }],
    lastUpdatedAt: '2026-05-25T10:00:00.000Z',
  },
  message: 'Refund policy settings fetched successfully.',
};

const refundPolicyPatchExamples = {
  updateRefundPolicy: {
    value: {
      allowRefund: true,
      cancellationTiers: [{ daysBeforeDelivery: 30, deductionPercent: 50, label: 'Early Cancellation' }],
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
  @Roles(UserRole.SUPER_ADMIN, UserRole.STAFF)
  @Permissions('refundPolicies.read')
  @ApiOperation({ summary: 'Fetch refund policy settings', description: 'SUPER_ADMIN or ADMIN with refundPolicies.read. Returns refund enablement status and cancellation deduction tiers used by refund policy settings.' })
  @ApiResponse({ status: 200, schema: { example: refundPolicySettingsResponseExample } })
  get() { return this.settings.get(); }

  @Patch()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update refund policy settings', description: 'SUPER_ADMIN only. Updates refund enablement status and cancellation deduction tiers used by refund policy settings.' })
  @ApiBody({ type: UpdateRefundPolicySettingsDto, examples: refundPolicyPatchExamples })
  @ApiResponse({ status: 200, schema: { example: { ...refundPolicySettingsResponseExample, message: 'Refund policy settings updated successfully.' } } })
  update(@CurrentUser() user: AuthUserContext, @Body() dto: UpdateRefundPolicySettingsDto, @Req() request: Request) { return this.settings.update(user, dto, request.ip, request.headers['user-agent']); }
}
