import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthUserContext, CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { CancelProviderPayoutDto, PayoutHistoryQueryDto, PayoutPreviewQueryDto, RequestProviderPayoutDto } from '../dto/provider-earnings-payouts.dto';
import { ProviderEarningsPayoutsService } from '../services/provider-earnings-payouts.service';
@ApiTags('03 Provider - Payouts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.PROVIDER)
@Controller('provider/payouts')
export class ProviderPayoutsController { constructor(private readonly service: ProviderEarningsPayoutsService) {} @Get() @ApiOperation({ summary: 'List own provider payout history', description: 'PROVIDER only. providerId is derived from JWT.' }) list(@CurrentUser() user: AuthUserContext, @Query() query: PayoutHistoryQueryDto) { return this.service.payoutHistory(user, query); } @Get('summary') @ApiOperation({ summary: 'Fetch own provider payout summary', description: 'Route declared before :id. PROVIDER only.' }) summary(@CurrentUser() user: AuthUserContext) { return this.service.payoutSummary(user); } @Get('preview') @ApiOperation({ summary: 'Preview provider payout request', description: 'Route declared before :id. Validates available balance and verified payout method.' }) preview(@CurrentUser() user: AuthUserContext, @Query() query: PayoutPreviewQueryDto) { return this.service.payoutPreview(user, query); } @Post('request') @ApiOperation({ summary: 'Request provider payout', description: 'PROVIDER only. Uses idempotencyKey to block duplicate payout requests.' }) @ApiBody({ type: RequestProviderPayoutDto }) request(@CurrentUser() user: AuthUserContext, @Body() dto: RequestProviderPayoutDto) { return this.service.requestPayout(user, dto); } @Get(':id') @ApiOperation({ summary: 'Fetch own provider payout details', description: 'PROVIDER only. Scoped to authenticated provider.' }) details(@CurrentUser() user: AuthUserContext, @Param('id') id: string) { return this.service.payoutDetails(user, id); } @Post(':id/cancel') @ApiOperation({ summary: 'Cancel own pending provider payout', description: 'Can cancel only PENDING payouts and returns locked balance to AVAILABLE.' }) cancel(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Body() dto: CancelProviderPayoutDto) { return this.service.cancelPayout(user, id, dto); } }
