import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthUserContext, CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateCouponDto, ListCouponsDto, UpdateCouponDto, UpdateCouponStatusDto } from './dto/subscription-plans.dto';
import { SubscriptionPlansService } from './subscription-plans.service';

@ApiTags('07 Plans & Coupons')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
@Controller('coupons')
export class CouponsController {
  constructor(private readonly service: SubscriptionPlansService) {}

  @Get() @Permissions('coupons.read') list(@Query() query: ListCouponsDto) { return this.service.listCoupons(query); }
  @Post() @Permissions('coupons.create') create(@CurrentUser() user: AuthUserContext, @Body() dto: CreateCouponDto) { return this.service.createCoupon(user, dto); }
  @Get(':id') @Permissions('coupons.read') details(@Param('id') id: string) { return this.service.couponDetails(id); }
  @Patch(':id') @Permissions('coupons.update') update(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Body() dto: UpdateCouponDto) { return this.service.updateCoupon(user, id, dto); }
  @Patch(':id/status') @Permissions('coupons.status.update') status(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Body() dto: UpdateCouponStatusDto) { return this.service.updateCouponStatus(user, id, dto); }
  @Delete(':id') @Permissions('coupons.delete') delete(@CurrentUser() user: AuthUserContext, @Param('id') id: string) { return this.service.deleteCoupon(user, id); }
}
