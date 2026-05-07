import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthUserContext, CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreatePlanFeatureDto, ListPlanFeaturesDto, UpdatePlanFeatureDto } from './dto/subscription-plans.dto';
import { SubscriptionPlansService } from './subscription-plans.service';

@ApiTags('Subscription Plans')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
@Controller('plan-features')
export class PlanFeaturesController {
  constructor(private readonly service: SubscriptionPlansService) {}

  @Get('catalog') @Permissions('planFeatures.read') catalog() { return this.service.featureCatalog(); }
  @Get() @Permissions('planFeatures.read') list(@Query() query: ListPlanFeaturesDto) { return this.service.listFeatures(query); }
  @Post() @Permissions('planFeatures.create') create(@CurrentUser() user: AuthUserContext, @Body() dto: CreatePlanFeatureDto) { return this.service.createFeature(user, dto); }
  @Get(':id') @Permissions('planFeatures.read') details(@Param('id') id: string) { return this.service.featureDetails(id); }
  @Patch(':id') @Permissions('planFeatures.update') update(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Body() dto: UpdatePlanFeatureDto) { return this.service.updateFeature(user, id, dto); }
  @Delete(':id') @Permissions('planFeatures.delete') delete(@CurrentUser() user: AuthUserContext, @Param('id') id: string) { return this.service.deleteFeature(user, id); }
}
