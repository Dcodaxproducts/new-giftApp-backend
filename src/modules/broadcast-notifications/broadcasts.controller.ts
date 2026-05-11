import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthUserContext, CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { BroadcastsService } from './broadcasts.service';
import { BroadcastTargetingDto, CancelBroadcastDto, CreateBroadcastDto, EstimateReachDto, ListBroadcastsDto, ListRecipientsDto, ScheduleBroadcastDto, UpdateBroadcastDto } from './dto/broadcast-notifications.dto';

@ApiTags('06 Broadcast Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
@Controller('broadcasts')
export class BroadcastsController {
  constructor(private readonly broadcasts: BroadcastsService) {}

  @Post() @Permissions('broadcasts.create') create(@CurrentUser() user: AuthUserContext, @Body() dto: CreateBroadcastDto) { return this.broadcasts.create(user, dto); }
  @Get() @Permissions('broadcasts.read') list(@Query() query: ListBroadcastsDto) { return this.broadcasts.list(query); }
  @Get(':id') @Permissions('broadcasts.read') details(@Param('id') id: string) { return this.broadcasts.details(id); }
  @Patch(':id') @Permissions('broadcasts.update') update(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Body() dto: UpdateBroadcastDto) { return this.broadcasts.update(user, id, dto); }
  @Patch(':id/targeting') @Permissions('broadcasts.update') targeting(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Body() dto: BroadcastTargetingDto) { return this.broadcasts.updateTargeting(user, id, dto); }
  @Post('estimate-reach') @Permissions('broadcasts.read') estimate(@Body() dto: EstimateReachDto) { return this.broadcasts.estimateReach(dto); }
  @Patch(':id/schedule') @Permissions('broadcasts.send', 'broadcasts.schedule') schedule(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Body() dto: ScheduleBroadcastDto) { return this.broadcasts.schedule(user, id, dto); }
  @Post(':id/cancel') @Permissions('broadcasts.cancel') cancel(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Body() dto: CancelBroadcastDto) { return this.broadcasts.cancel(user, id, dto); }
  @Get(':id/report') @Permissions('broadcasts.report.read') report(@CurrentUser() user: AuthUserContext, @Param('id') id: string) { return this.broadcasts.report(user, id); }
  @Get(':id/recipients') @Permissions('broadcasts.report.read') recipients(@Param('id') id: string, @Query() query: ListRecipientsDto) { return this.broadcasts.recipients(id, query); }
}
