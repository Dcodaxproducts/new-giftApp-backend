import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthUserContext, CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { CreateSubscriptionPlanDto, ListSubscriptionPlansDto, UpdatePlanStatusDto, UpdatePlanVisibilityDto, UpdateSubscriptionPlanDto } from '../dto/subscription-plans.dto';
import { SubscriptionPlansService } from '../services/subscription-plans.service';

@ApiTags('07 Plans & Coupons')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
@Controller('subscription-plans')
export class SubscriptionPlansController {
  constructor(private readonly service: SubscriptionPlansService) {}
  @Get() @Permissions('subscriptionPlans.read') list(@Query() query: ListSubscriptionPlansDto) { return this.service.listPlans(query); }
  @Get('stats') @Permissions('subscriptionPlans.analytics.read') stats() { return this.service.stats(); }
  @Post() @Permissions('subscriptionPlans.create') create(@CurrentUser() user: AuthUserContext, @Body() dto: CreateSubscriptionPlanDto) { return this.service.createPlan(user, dto); }
  @Get(':id') @Permissions('subscriptionPlans.read') details(@Param('id') id: string) { return this.service.planDetails(id); }
  @Patch(':id') @Permissions('subscriptionPlans.update') update(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Body() dto: UpdateSubscriptionPlanDto) { return this.service.updatePlan(user, id, dto); }
  @Patch(':id/status') @Permissions('subscriptionPlans.status.update') status(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Body() dto: UpdatePlanStatusDto) { return this.service.updateStatus(user, id, dto); }
  @Patch(':id/visibility') @Permissions('subscriptionPlans.visibility.update') visibility(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Body() dto: UpdatePlanVisibilityDto) { return this.service.updateVisibility(user, id, dto); }
  @Delete(':id') @Permissions('subscriptionPlans.delete') delete(@CurrentUser() user: AuthUserContext, @Param('id') id: string) { return this.service.deletePlan(user, id); }
  @Get(':id/analytics') @Permissions('subscriptionPlans.analytics.read') analytics(@CurrentUser() user: AuthUserContext, @Param('id') id: string) { return this.service.analytics(user, id); }
}
