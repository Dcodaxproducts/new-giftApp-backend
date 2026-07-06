import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthUserContext, CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AdminDisputesService } from './admin-disputes.service';
import { ListDisputesDto, RespondDisputeDto } from './dto/admin-disputes.dto';

@ApiBearerAuth()
@ApiTags('03 Provider - Disputes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.PROVIDER)
@Controller('provider/disputes')
export class ProviderDisputesController {
  constructor(private readonly disputes: AdminDisputesService) {}

  @Get()
  @ApiOperation({ summary: 'List own provider disputes' })
  list(@CurrentUser() user: AuthUserContext, @Query() query: ListDisputesDto) {
    return this.disputes.providerList(user, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Fetch own provider dispute details' })
  details(@CurrentUser() user: AuthUserContext, @Param('id') id: string) {
    return this.disputes.providerDetails(user, id);
  }

  @Post(':id/respond')
  @ApiOperation({ summary: 'Respond to own provider dispute' })
  @ApiBody({ type: RespondDisputeDto })
  respond(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Body() dto: RespondDisputeDto) {
    return this.disputes.respondAsProvider(user, id, dto);
  }
}
