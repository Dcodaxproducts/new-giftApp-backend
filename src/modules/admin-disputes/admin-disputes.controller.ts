import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthUserContext, CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AdminDisputesService } from './admin-disputes.service';
import { ListDisputesDto, ReviewDisputeDto } from './dto/admin-disputes.dto';

@ApiBearerAuth()
@ApiTags('02 Admin - Disputes')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.STAFF)
@Controller('admin/disputes')
export class AdminDisputesController {
  constructor(private readonly disputes: AdminDisputesService) {}

  @Get('stats')
  @Permissions('disputes.read')
  @ApiOperation({ summary: 'Fetch dispute stats' })
  stats(@Query() query: ListDisputesDto) { return this.disputes.stats(query); }

  @Get()
  @Permissions('disputes.read')
  @ApiOperation({ summary: 'List disputes' })
  list(@Query() query: ListDisputesDto) { return this.disputes.list(query); }

  @Get(':id')
  @Permissions('disputes.read')
  @ApiOperation({ summary: 'Fetch dispute details' })
  details(@Param('id') id: string) { return this.disputes.details(id); }

  @Post(':id/decision')
  @Permissions('disputes.review')
  @ApiOperation({ summary: 'Submit final dispute decision' })
  @ApiBody({ type: ReviewDisputeDto })
  decision(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Body() dto: ReviewDisputeDto) { return this.disputes.review(user, id, dto); }
}
