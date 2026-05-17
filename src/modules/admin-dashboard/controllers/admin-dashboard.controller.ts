import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { AdminDashboardService } from '../services/admin-dashboard.service';

@ApiTags('02 Admin - Dashboard Overview')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
@Controller('admin/dashboard')
export class AdminDashboardController {
  constructor(private readonly dashboard: AdminDashboardService) {}

  @Get('overview')
  @Permissions('dashboard.read')
  @ApiOperation({ summary: 'Fetch Super Admin dashboard overview metrics', description: 'SUPER_ADMIN or ADMIN with dashboard.read. Read-only metrics are aggregated from existing users, providers, payments, and transaction records. Missing analytics sources return zeros instead of fake data.' })
  @ApiResponse({ status: 200, schema: { example: { success: true, data: { totalUsers: 128430, totalUsersDeltaPercent: 12.5, totalProviders: 1240, totalProvidersDeltaPercent: 5.2, transactions: 45200, transactionsDeltaPercent: 18.1, totalRevenue: 1240000, totalRevenueDeltaPercent: 10.3, currency: 'USD' }, message: 'Dashboard overview fetched successfully.' } } })
  overview() { return this.dashboard.overview(); }

  @Get('revenue-trends')
  @Permissions('dashboard.read')
  @ApiOperation({ summary: 'Fetch monthly revenue trends', description: 'SUPER_ADMIN or ADMIN with dashboard.read. Uses successful payment records for the last 12 calendar months and returns zero for months with no revenue.' })
  @ApiResponse({ status: 200, schema: { example: { success: true, data: { range: 'LAST_12_MONTHS', labels: ['Jan', 'Feb', 'Mar'], values: [12000, 28000, 16000], currency: 'USD' }, message: 'Revenue trends fetched successfully.' } } })
  revenueTrends() { return this.dashboard.revenueTrends(); }

  @Get('gift-vs-payment')
  @Permissions('dashboard.read')
  @ApiOperation({ summary: 'Fetch gift vs direct payment distribution', description: 'SUPER_ADMIN or ADMIN with dashboard.read. Distribution is calculated from successful payment records; money gift payments count as gift cards and all other successful payments count as direct payments.' })
  @ApiResponse({ status: 200, schema: { example: { success: true, data: { giftCardsPercent: 65, directPaymentsPercent: 35 }, message: 'Gift vs payment distribution fetched successfully.' } } })
  giftVsPayment() { return this.dashboard.giftVsPayment(); }

  @Get('provider-performance')
  @Permissions('dashboard.read')
  @ApiOperation({ summary: 'Fetch provider performance table', description: 'SUPER_ADMIN or ADMIN with dashboard.read. Aggregates provider order success rate and fulfilled volume from existing provider order records without exposing payout or customer-sensitive data.' })
  @ApiResponse({ status: 200, schema: { example: { success: true, data: [{ providerId: 'provider_id', providerName: 'Stripe Integration', successRate: 99.2, totalVolume: 450230, currency: 'USD' }], message: 'Provider performance fetched successfully.' } } })
  providerPerformance() { return this.dashboard.providerPerformance(); }

  @Get('recent-disputes')
  @Permissions('dashboard.read')
  @ApiOperation({ summary: 'Fetch recent disputes table', description: 'SUPER_ADMIN or ADMIN with dashboard.read. Combines recent customer and provider dispute cases and returns non-sensitive case, customer display name, reason, and priority/status only.' })
  @ApiResponse({ status: 200, schema: { example: { success: true, data: [{ id: 'dispute_id', caseId: 'DISP-9021', userName: 'Marcus Wright', reason: 'Unauthorized transaction', status: 'HIGH_PRIORITY' }], message: 'Recent disputes fetched successfully.' } } })
  recentDisputes() { return this.dashboard.recentDisputes(); }
}
