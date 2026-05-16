import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthUserContext, CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { EarningsChartQueryDto, EarningsLedgerQueryDto, EarningsSummaryQueryDto } from '../dto/provider-earnings-payouts.dto';
import { ProviderEarningsPayoutsService } from '../services/provider-earnings-payouts.service';
@ApiTags('03 Provider - Earnings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.PROVIDER)
@Controller('provider/earnings')
export class ProviderEarningsController { constructor(private readonly service: ProviderEarningsPayoutsService) {} @Get('summary') @ApiOperation({ summary: 'Fetch own provider earnings summary', description: 'PROVIDER only. providerId is derived from JWT.' }) summary(@CurrentUser() user: AuthUserContext, @Query() query: EarningsSummaryQueryDto) { return this.service.earningsSummary(user, query); } @Get('chart') @ApiOperation({ summary: 'Fetch own provider earnings chart', description: 'PROVIDER only. Uses provider earnings ledger.' }) chart(@CurrentUser() user: AuthUserContext, @Query() query: EarningsChartQueryDto) { return this.service.earningsChart(user, query); } @Get('ledger') @ApiOperation({ summary: 'List own provider earnings ledger', description: 'PROVIDER only. Does not accept providerId query/body.' }) ledger(@CurrentUser() user: AuthUserContext, @Query() query: EarningsLedgerQueryDto) { return this.service.earningsLedger(user, query); } }
