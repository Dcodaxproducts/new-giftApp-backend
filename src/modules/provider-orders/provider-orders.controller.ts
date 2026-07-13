import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthUserContext, CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ListProviderOrdersDto, ProviderOrderHistoryDto, ProviderOrderStatusFilter, ProviderOrdersExportDto, ProviderOrdersSummaryDto, ProviderPerformanceDto, ProviderRecentOrdersDto, ProviderRevenueAnalyticsDto, UpdateProviderOrderStatusDto } from './dto/provider-orders.dto';
import { ProviderOrdersService } from './provider-orders.service';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.PROVIDER)
@Controller('provider/orders')
export class ProviderOrdersController {
  constructor(private readonly providerOrders: ProviderOrdersService) {}

  @Get()
  @ApiTags('03 Provider - Orders')
  @ApiOperation({ summary: 'List own assigned provider orders', description: 'PROVIDER only. Returns only orders assigned to the authenticated providerId. Default status filter is PENDING.' })
  @ApiQuery({ name: 'status', enum: ProviderOrderStatusFilter, required: false })
  @ApiResponse({ status: 200, schema: { example: { success: true, data: [{ id: 'order_id', orderId: 'order_id', orderNumber: 'ORD-10293', status: 'PENDING', customer: { name: 'Sarah Jenkins', phone: '+15551234567' }, itemPreview: [{ name: 'Premium Sneakers', imageUrl: 'https://cdn.yourdomain.com/gifts/sneaker.png' }], itemCount: 3, total: 142, currency: 'USD', createdAt: '2026-10-24T10:45:00.000Z', receivedAgoText: '5m ago' }], message: 'Provider orders fetched successfully.' } } })
  list(@CurrentUser() user: AuthUserContext, @Query() query: ListProviderOrdersDto) { return this.providerOrders.list(user, query); }


  @Get('history')
  @ApiTags('03 Provider - Orders')
  @ApiOperation({ summary: 'List own provider order history', description: 'PROVIDER only. Uses Order records scoped to the authenticated provider. Status tabs map to order statuses.' })
  history(@CurrentUser() user: AuthUserContext, @Query() query: ProviderOrderHistoryDto) { return this.providerOrders.history(user, query); }

  @Get('performance')
  @ApiTags('03 Provider - Order Analytics')
  @ApiOperation({ summary: 'Fetch own provider order performance', description: 'PROVIDER only. Completion rate uses completed / non-cancelled own provider orders.' })
  performance(@CurrentUser() user: AuthUserContext, @Query() query: ProviderPerformanceDto) { return this.providerOrders.performance(user, query); }

  @Get('analytics/revenue')
  @ApiTags('03 Provider - Order Analytics')
  @ApiOperation({ summary: 'Fetch own provider revenue analytics', description: 'PROVIDER only. Revenue uses order total for active/completed orders.' })
  revenueAnalytics(@CurrentUser() user: AuthUserContext, @Query() query: ProviderRevenueAnalyticsDto) { return this.providerOrders.revenueAnalytics(user, query); }

  @Get('analytics/ratings')
  @ApiTags('03 Provider - Order Analytics')
  @ApiOperation({ summary: 'Fetch own provider ratings analytics', description: 'PROVIDER only. Returns stable zero values until reviews module is available.' })
  ratingsAnalytics() { return this.providerOrders.ratingsAnalytics(); }

  @Get('recent')
  @ApiTags('03 Provider - Order Analytics')
  @ApiOperation({ summary: 'List recent own provider orders', description: 'PROVIDER only. Defaults to 5 latest orders.' })
  recent(@CurrentUser() user: AuthUserContext, @Query() query: ProviderRecentOrdersDto) { return this.providerOrders.recent(user, query); }

  @Get('export')
  @ApiTags('03 Provider - Order Analytics')
  @ApiOperation({ summary: 'Export own provider orders as CSV', description: 'PROVIDER only. Export is scoped to logged-in provider orders.' })
  export(@CurrentUser() user: AuthUserContext, @Query() query: ProviderOrdersExportDto) { return this.providerOrders.export(user, query); }

  @Get('summary')
  @ApiTags('03 Provider - Orders')
  @ApiOperation({ summary: 'Fetch own provider order summary', description: 'Route intentionally declared before :id. PROVIDER only.' })
  summary(@CurrentUser() user: AuthUserContext, @Query() query: ProviderOrdersSummaryDto) { return this.providerOrders.summary(user, query); }

  @Get('reject-reasons')
  @ApiTags('03 Provider - Orders')
  @ApiOperation({ summary: 'List provider order reject reasons', description: 'Route intentionally declared before :id.' })
  rejectReasons() { return this.providerOrders.rejectReasons(); }


  @Post(':id/status')
  @ApiTags('03 Provider - Orders')
  @ApiOperation({ summary: 'Update provider order status', description: 'PROVIDER only. Enforces order state machine transitions. Reason is required when rejecting.' })
  @ApiBody({ type: UpdateProviderOrderStatusDto, examples: { accept: { summary: 'Accept order', value: { status: 'ACCEPTED' } }, reject: { summary: 'Reject order', value: { status: 'REJECTED', reason: 'Out of stock' } }, processing: { summary: 'Start processing', value: { status: 'PROCESSING' } }, shipped: { summary: 'Mark shipped', value: { status: 'SHIPPED' } }, delivered: { summary: 'Mark delivered', value: { status: 'DELIVERED' } } } })
  @ApiResponse({ status: 200, description: 'Order status updated successfully', schema: { example: { success: true, data: { id: 'order_id', orderNumber: 'ORD-10293', status: 'ACCEPTED' }, message: 'Order status updated successfully.' } } })
  updateStatus(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Body() dto: UpdateProviderOrderStatusDto) { return this.providerOrders.updateOrderStatus(user, id, dto); }

  @Get(':id/timeline')
  @ApiTags('03 Provider - Orders')
  @ApiOperation({ summary: 'Fetch own provider order timeline', description: 'PROVIDER only. Timeline is scoped to the authenticated provider order.' })
  timeline(@CurrentUser() user: AuthUserContext, @Param('id') id: string) { return this.providerOrders.timeline(user, id); }

  @Get(':id')
  @ApiTags('03 Provider - Orders')
  @ApiOperation({ summary: 'Fetch own provider order details', description: 'PROVIDER only. Does not expose customer card/payment secrets or admin-only order fields.' })
  details(@CurrentUser() user: AuthUserContext, @Param('id') id: string) { return this.providerOrders.details(user, id); }

}
