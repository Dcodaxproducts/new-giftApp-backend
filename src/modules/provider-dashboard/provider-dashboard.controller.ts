import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthUserContext, CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ProviderDashboardService } from './provider-dashboard.service';

@ApiTags('03 Provider - Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.PROVIDER)
@Controller('provider/dashboard')
export class ProviderDashboardController {
  constructor(private readonly dashboard: ProviderDashboardService) {}

  @Get()
  @ApiOperation({
    summary: 'Fetch mobile provider dashboard',
    description: 'PROVIDER only. providerId is derived from JWT. Pending, rejected, inactive, or suspended providers cannot access the dashboard.',
  })
  @ApiResponse({
    status: 200,
    schema: {
      example: {
        success: true,
        data: {
          provider: { id: 'provider_id', businessName: 'Global Logistics Solutions', avatarUrl: 'https://cdn.yourdomain.com/provider-avatars/provider.png', approvalStatus: 'APPROVED', status: 'ACTIVE' },
          operationalSummary: { todayOrders: 24, pendingOrders: 12, activeOffers: 5, totalItems: 128 },
          performance: { range: 'WEEKLY', labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], values: [120, 180, 150, 110, 190, 260, 220], currency: 'PKR' },
          recentOrders: [{ id: 'provider_order_id', orderNumber: 'ORD-8821', itemName: 'Nike Air Max 270', imageUrl: 'https://cdn.yourdomain.com/gifts/shoe.png', amount: 120, currency: 'PKR', status: 'PAID', createdAgoText: '2m ago' }],
        },
        message: 'Provider dashboard fetched successfully.',
      },
    },
  })
  get(@CurrentUser() user: AuthUserContext) {
    return this.dashboard.get(user);
  }
}
