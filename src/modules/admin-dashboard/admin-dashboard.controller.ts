import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AdminDashboardQueryDto } from './dto/admin-dashboard-query.dto';
import { AdminDashboardService } from './admin-dashboard.service';

@ApiTags('02 Admin - Dashboard Overview')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.STAFF)
@Controller('admin/dashboard')
export class AdminDashboardController {
  constructor(private readonly dashboard: AdminDashboardService) {}

  @Get()
  @Permissions('dashboard.read')
  @ApiOperation({ summary: 'Fetch Super Admin dashboard data', description: 'SUPER_ADMIN or ADMIN with dashboard.read. Returns overview metrics, revenue trends, gift/payment distribution, provider performance, and recent disputes from real records only. Payment secrets, card data, provider bank data, dispute evidence, and private internal notes are never selected or returned.' })
  @ApiResponse({ status: 200, schema: { example: { success: true, data: { overview: { totalUsers: 128430, totalUsersDeltaPercent: 12.5, totalProviders: 1240, totalProvidersDeltaPercent: 5.2, transactions: 45200, transactionsDeltaPercent: 18.1, totalRevenue: 1240000, totalRevenueDeltaPercent: 10.3 }, revenueTrends: { range: 'LAST_12_MONTHS', labels: ['Jan', 'Feb', 'Mar'], values: [12000, 28000, 16000] }, giftVsPayment: { giftCardsPercent: 65, directPaymentsPercent: 35 }, providerPerformance: [{ providerId: 'provider_id', providerName: 'Gift Provider', successRate: 99.2, totalVolume: 450230 }], recentDisputes: [{ id: 'dispute_id', caseId: 'DISP-9021', userName: 'Marcus Wright', reason: 'Unauthorized transaction', status: 'HIGH_PRIORITY' }] }, message: 'Dashboard data fetched successfully.' } } })
  get(@Query() query: AdminDashboardQueryDto) {
    return this.dashboard.get(query);
  }
}
