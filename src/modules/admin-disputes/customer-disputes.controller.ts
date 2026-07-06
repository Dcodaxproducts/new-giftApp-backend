import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthUserContext, CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AdminDisputesService } from './admin-disputes.service';
import { CreateDisputeDto, ListDisputesDto } from './dto/admin-disputes.dto';

@ApiBearerAuth()
@ApiTags('05 Customer - Disputes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.REGISTERED_USER)
@Controller('customer')
export class CustomerDisputesController {
  constructor(private readonly disputes: AdminDisputesService) {}

  @Post('orders/:orderId/disputes')
  @ApiOperation({ summary: 'Create dispute for own order' })
  @ApiBody({ type: CreateDisputeDto })
  create(@CurrentUser() user: AuthUserContext, @Param('orderId') orderId: string, @Body() dto: CreateDisputeDto) {
    return this.disputes.createForCustomer(user, orderId, { ...dto, orderId });
  }

  @Get('disputes')
  @ApiOperation({ summary: 'List own disputes' })
  list(@CurrentUser() user: AuthUserContext, @Query() query: ListDisputesDto) {
    return this.disputes.customerList(user, query);
  }

  @Get('disputes/:id')
  @ApiOperation({ summary: 'Fetch own dispute details' })
  details(@CurrentUser() user: AuthUserContext, @Param('id') id: string) {
    return this.disputes.customerDetails(user, id);
  }
}
