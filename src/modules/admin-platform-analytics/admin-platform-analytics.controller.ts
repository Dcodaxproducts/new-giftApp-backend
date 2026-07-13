import { Controller, Get, Query, StreamableFile, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthUserContext, CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AdminPlatformAnalyticsService } from './admin-platform-analytics.service';
import { PlatformAnalyticsReportQueryDto, PlatformAnalyticsSummaryQueryDto, PlatformAnalyticsTransactionsQueryDto } from './dto/platform-analytics-query.dto';

@ApiTags('02 Admin - Platform Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.STAFF)
@Controller('admin/platform-analytics')
export class AdminPlatformAnalyticsController {
  constructor(private readonly analytics: AdminPlatformAnalyticsService) {}

  @Get('stats')
  @Permissions('analytics.read')
  @ApiOperation({ summary: 'Fetch platform analytics summary', description: 'SUPER_ADMIN or ADMIN with analytics.read. Calculates revenue from successful payments only and compares the selected range with the previous equivalent period.' })
  @ApiResponse({ status: 200, schema: { example: { success: true, data: { totalRevenue: { value: 154320, changePercent: 8.1 }, newSubscriptions: { value: 215, changePercent: 5.3 }, churnRate: { value: 2.9, changePercent: 0.1 }, activeUsers: { value: 5120, changePercent: -2.1 } }, message: 'Platform analytics summary fetched successfully.' } } })
  stats(@Query() query: PlatformAnalyticsSummaryQueryDto) {
    return this.analytics.summary(query);
  }

  @Get('revenue-transactions')
  @Permissions('analytics.read')
  @ApiOperation({ summary: 'List recent revenue transactions', description: 'SUPER_ADMIN or ADMIN with analytics.read. Uses real payment, order, provider order, gift, category, provider, and subscription records. Card/payment secrets are never selected or returned.' })
  @ApiResponse({ status: 200, schema: { example: { success: true, data: [{ id: 'transaction_id', date: '2023-09-17T00:00:00.000Z', userEmail: 'alex.rivera@gmail.com', amount: 150, currency: 'USD', provider: { id: 'provider_id', businessName: 'Gift Provider' }, category: { id: 'category_id', name: 'Flowers' } }], meta: { page: 1, limit: 10, total: 1, totalPages: 1 }, message: 'Revenue transactions fetched successfully.' } } })
  revenueTransactions(@Query() query: PlatformAnalyticsTransactionsQueryDto) {
    return this.analytics.revenueTransactions(query);
  }

  @Get('report')
  @Permissions('analytics.export')
  @ApiOperation({ summary: 'Generate platform analytics report', description: 'SUPER_ADMIN or ADMIN with analytics.export. Streams a CSV report using the same transaction filters and excludes card numbers, CVV, Stripe secrets, payment client secrets, and bank details.' })
  async report(@CurrentUser() user: AuthUserContext, @Query() query: PlatformAnalyticsReportQueryDto): Promise<StreamableFile> {
    const file = await this.analytics.report(user, query);
    return new StreamableFile(Buffer.from(file.content), { disposition: `attachment; filename="${file.filename}"`, type: file.contentType });
  }
}
