import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthUserContext, CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { CreateCouponDto, ListCouponsDto, UpdateCouponDto } from '../dto/subscription-plans.dto';
import { SubscriptionPlansService } from '../services/subscription-plans.service';

@ApiTags('07 Plans & Coupons')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
@Controller('coupons')
export class CouponsController {
  constructor(private readonly service: SubscriptionPlansService) {}

  @Get() @Permissions('coupons.read') @ApiOperation({ summary: 'List coupons', description: 'By default returns all non-deleted coupons. Use status to filter ACTIVE, INACTIVE, or EXPIRED coupons.' }) list(@Query() query: ListCouponsDto) { return this.service.listCoupons(query); }
  @Post() @Permissions('coupons.create') create(@CurrentUser() user: AuthUserContext, @Body() dto: CreateCouponDto) { return this.service.createCoupon(user, dto); }
  @Get(':id') @Permissions('coupons.read') details(@Param('id') id: string) { return this.service.couponDetails(id); }
  @Patch(':id')
  @ApiOperation({ summary: 'Update coupon details or lifecycle status', description: "SUPER_ADMIN or ADMIN with coupon-specific permissions. Standard coupon fields require 'coupons.update'; status or isActive changes require 'coupons.status.update'; mixed payloads require both permissions." })
  @ApiBody({ type: UpdateCouponDto, examples: { updateCoupon: { value: { code: 'SUMMER20', description: 'Seasonal 20% off campaign.', discountType: 'PERCENTAGE', discountValue: 20, maxRedemptions: 500 } }, activateCoupon: { value: { isActive: true, status: 'ACTIVE', reason: 'Campaign enabled.' } }, deactivateCoupon: { value: { isActive: false, status: 'INACTIVE', reason: 'Campaign paused after budget review.' } } } })
  @ApiResponse({ status: 200, description: 'Coupon updated successfully', schema: { example: { success: true, data: { id: 'coupon_id', code: 'SUMMER20', isActive: true, status: 'ACTIVE', discountType: 'PERCENTAGE', discountValue: 20 }, message: 'Coupon updated successfully' } } })
  update(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Body() dto: UpdateCouponDto) { return this.service.updateCoupon(user, id, dto); }
  @Delete(':id') @Permissions('coupons.delete') delete(@CurrentUser() user: AuthUserContext, @Param('id') id: string) { return this.service.deleteCoupon(user, id); }
}
