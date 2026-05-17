import { Body, Controller, Get, Param, Post, Query, StreamableFile, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthUserContext, CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { ApproveProviderPayoutDto, BulkApproveProviderPayoutsDto, ExportAdminProviderPayoutsDto, HoldProviderPayoutDto, ListAdminProviderPayoutsDto, RejectProviderPayoutDto } from '../dto/admin-provider-payouts.dto';
import { AdminProviderPayoutsService } from '../services/admin-provider-payouts.service';

@ApiTags('02 Admin - Provider Payouts', '02 Admin - Provider Payout Approvals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
@Controller('admin/provider-payouts')
export class AdminProviderPayoutsController {
  constructor(private readonly payouts: AdminProviderPayoutsService) {}

  @Get('stats')
  @Permissions('providerPayouts.read')
  @ApiOperation({ summary: 'Fetch provider payout dashboard stats', description: 'SUPER_ADMIN or ADMIN with providerPayouts.read. Aggregates from provider payout records only; no frontend totals are trusted.' })
  @ApiResponse({ status: 200, schema: { example: { success: true, data: { totalPayoutsThisMonth: 128430, totalPayoutsDeltaPercent: 12.5, pendingPayouts: 12250, pendingPayoutsDeltaPercent: -2.4, completedPayouts: 116180, completedPayoutsDeltaPercent: 14.2, platformRevenue: 19264.5, platformRevenueDeltaPercent: 8.1, currency: 'USD' }, message: 'Provider payout stats fetched successfully.' } } })
  stats() { return this.payouts.stats(); }

  @Get('trends')
  @Permissions('providerPayouts.read')
  @ApiOperation({ summary: 'Fetch monthly provider payout trend', description: 'SUPER_ADMIN or ADMIN with providerPayouts.read. Returns last 12 months from provider payout records.' })
  @ApiResponse({ status: 200, schema: { example: { success: true, data: { range: 'LAST_12_MONTHS', labels: ['Jan', 'Feb', 'Mar'], values: [12000, 28000, 16000], currency: 'USD' }, message: 'Provider payout trends fetched successfully.' } } })
  trends() { return this.payouts.trends(); }

  @Get('earning-distribution')
  @Permissions('providerPayouts.read')
  @ApiOperation({ summary: 'Fetch earning distribution by provider tier', description: 'SUPER_ADMIN or ADMIN with providerPayouts.read. Uses provider earnings ledger totals and active commission tier thresholds.' })
  @ApiResponse({ status: 200, schema: { example: { success: true, data: [{ tierId: 'tier_silver', tierName: 'Silver Partner', providerCount: 18, totalEarnings: 450230, currency: 'USD' }], message: 'Provider earning distribution fetched successfully.' } } })
  earningDistribution() { return this.payouts.earningDistribution(); }

  @Get('export')
  @Permissions('providerPayouts.export')
  @ApiOperation({ summary: 'Export provider payouts', description: 'SUPER_ADMIN or ADMIN with providerPayouts.export. Applies the same filters as list and never exports full bank account numbers.' })
  async export(@Query() query: ExportAdminProviderPayoutsDto): Promise<StreamableFile> { const file = await this.payouts.export(query); return new StreamableFile(Buffer.from(file.content), { disposition: `attachment; filename="${file.filename}"`, type: file.contentType }); }

  @Post('bulk-approve')
  @Permissions('providerPayouts.approve')
  @ApiOperation({ summary: 'Bulk approve provider payouts', description: 'SUPER_ADMIN or ADMIN with providerPayouts.approve. Idempotent per payout: already PROCESSING/COMPLETED payouts are returned as successful idempotent items and are not processed twice.' })
  @ApiBody({ type: BulkApproveProviderPayoutsDto, examples: { approve: { value: { payoutIds: ['payout_id_1', 'payout_id_2'], comment: 'Bulk approved after verification.', notifyProvider: true } } } })
  @ApiResponse({ status: 201, schema: { example: { success: true, data: [{ payoutId: 'payout_id_1', status: 'PROCESSING', success: true, idempotent: false }, { payoutId: 'payout_id_2', status: 'PROCESSING', success: true, idempotent: true }], message: 'Bulk payout approval processed.' } } })
  bulkApprove(@CurrentUser() user: AuthUserContext, @Body() dto: BulkApproveProviderPayoutsDto) { return this.payouts.bulkApprove(user, dto); }

  @Get()
  @Permissions('providerPayouts.read')
  @ApiOperation({ summary: 'List provider payouts', description: 'SUPER_ADMIN or ADMIN with providerPayouts.read. Supports status/provider/date/search filters and sorting. Bank account data is masked only.' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ['ALL', 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'ON_HOLD', 'REJECTED'] })
  @ApiQuery({ name: 'providerId', required: false })
  @ApiQuery({ name: 'fromDate', required: false })
  @ApiQuery({ name: 'toDate', required: false })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['createdAt', 'amount', 'status', 'nextPayoutDate'] })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
  @ApiResponse({ status: 200, schema: { example: { success: true, data: [{ id: 'payout_id', provider: { id: 'provider_id', businessName: 'TechSolutions Inc.', providerCode: 'PRV-90210', avatarUrl: 'https://cdn.example.com/provider.png' }, pendingAmount: 3420, currency: 'USD', lastPayoutDate: '2023-10-12T00:00:00.000Z', nextPayoutDate: '2023-11-12T00:00:00.000Z', status: 'COMPLETED' }], meta: { page: 1, limit: 20, total: 1, totalPages: 1 }, message: 'Provider payouts fetched successfully.' } } })
  list(@Query() query: ListAdminProviderPayoutsDto) { return this.payouts.list(query); }

  @Get(':id/breakdown')
  @Permissions('providerPayouts.read')
  @ApiOperation({ summary: 'Fetch pending payout transaction breakdown', description: 'SUPER_ADMIN or ADMIN with providerPayouts.read. Shows gross amount, platform fee, processing fee, net payout, and recent ledger transactions without full bank details.' })
  @ApiResponse({ status: 200, schema: { example: { success: true, data: { payoutId: 'payout_id', provider: { id: 'provider_id', businessName: 'CloudTech Solutions', merchantId: 'MER-29401-2023' }, grossAmount: 4200, platformFee: 420, platformFeePercent: 10, processingFee: 12.5, netPayout: 3767.5, currency: 'USD', recentTransactions: [{ orderNumber: '88392', description: 'Subscription - Professional Plan', amount: 199 }] }, message: 'Payout breakdown fetched successfully.' } } })
  breakdown(@Param('id') id: string) { return this.payouts.breakdown(id); }

  @Post(':id/approve')
  @Permissions('providerPayouts.approve')
  @ApiOperation({ summary: 'Approve provider payout', description: 'SUPER_ADMIN or ADMIN with providerPayouts.approve. Only PENDING or ON_HOLD payouts can be approved. Approved payouts move to PROCESSING for payout processor completion.' })
  @ApiBody({ type: ApproveProviderPayoutDto, examples: { approve: { value: { comment: 'Approved after verification.', notifyProvider: true } } } })
  @ApiResponse({ status: 201, schema: { example: { success: true, data: { id: 'payout_id', status: 'PROCESSING' }, message: 'Payout approved successfully.' } } })
  approve(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Body() dto: ApproveProviderPayoutDto) { return this.payouts.approve(user, id, dto); }

  @Post(':id/hold')
  @Permissions('providerPayouts.hold')
  @ApiOperation({ summary: 'Hold provider payout', description: 'SUPER_ADMIN or ADMIN with providerPayouts.hold. Holds a PENDING payout without releasing locked PAYOUT_PENDING ledger balance.' })
  @ApiBody({ type: HoldProviderPayoutDto, examples: { hold: { value: { reason: 'BANK_VERIFICATION_PENDING', comment: 'Bank verification required.', notifyProvider: true } } } })
  @ApiResponse({ status: 201, schema: { example: { success: true, data: { id: 'payout_id', status: 'ON_HOLD' }, message: 'Payout held successfully.' } } })
  hold(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Body() dto: HoldProviderPayoutDto) { return this.payouts.hold(user, id, dto); }

  @Post(':id/reject')
  @Permissions('providerPayouts.reject')
  @ApiOperation({ summary: 'Reject provider payout', description: 'SUPER_ADMIN or ADMIN with providerPayouts.reject. Rejects PENDING or ON_HOLD payout and releases locked PAYOUT_PENDING ledger balance back to AVAILABLE.' })
  @ApiBody({ type: RejectProviderPayoutDto, examples: { reject: { value: { reason: 'INVALID_BANK_ACCOUNT', comment: 'Bank details are invalid.', notifyProvider: true } } } })
  @ApiResponse({ status: 201, schema: { example: { success: true, data: { id: 'payout_id', status: 'REJECTED', ledgerReleased: true }, message: 'Payout rejected successfully.' } } })
  reject(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Body() dto: RejectProviderPayoutDto) { return this.payouts.reject(user, id, dto); }

  @Get(':id')
  @Permissions('providerPayouts.read')
  @ApiOperation({ summary: 'Fetch provider payout details', description: 'SUPER_ADMIN or ADMIN with providerPayouts.read. Returns payout details, provider display data, and masked payout destination only.' })
  @ApiResponse({ status: 200, schema: { example: { success: true, data: { id: 'payout_id', provider: { id: 'provider_id', businessName: 'TechSolutions Inc.', providerCode: 'PRV-90210', avatarUrl: 'https://cdn.example.com/provider.png' }, pendingAmount: 3420, amount: 3420, processingFee: 42, totalToReceive: 3378, currency: 'USD', status: 'COMPLETED', destination: { id: 'method_id', bankName: 'Chase Bank', maskedAccount: '****1234', last4: '1234', verificationStatus: 'VERIFIED' }, createdAt: '2023-10-12T00:00:00.000Z' }, message: 'Provider payout details fetched successfully.' } } })
  details(@Param('id') id: string) { return this.payouts.details(id); }
}
