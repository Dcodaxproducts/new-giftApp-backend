import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthUserContext, CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AcceptProviderOrderDto, ListProviderOrdersDto, MessageBuyerDto, ProviderOrderHistoryDto, ProviderOrderStatusFilter, ProviderOrdersExportDto, ProviderOrdersSummaryDto, ProviderPerformanceDto, ProviderRecentOrdersDto, ProviderRevenueAnalyticsDto, RejectProviderOrderDto, UpdateProviderOrderChecklistDto, UpdateProviderOrderStatusDto } from './dto/provider-orders.dto';
import { ProviderOrdersService } from './provider-orders.service';

@ApiTags('Provider Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.PROVIDER)
@Controller('provider/orders')
export class ProviderOrdersController {
  constructor(private readonly providerOrders: ProviderOrdersService) {}

  @Get()
  @ApiOperation({ summary: 'List own assigned provider orders', description: 'PROVIDER only. Returns only orders assigned to the authenticated providerId. Default status filter is PENDING.' })
  @ApiQuery({ name: 'status', enum: ProviderOrderStatusFilter, required: false })
  @ApiResponse({ status: 200, schema: { example: { success: true, data: [{ id: 'provider_order_id', orderId: 'order_id', orderNumber: 'ORD-10293', status: 'PENDING', paymentStatus: 'SUCCEEDED', customer: { name: 'Sarah Jenkins', phone: '+15551234567' }, itemPreview: [{ name: 'Premium Sneakers', imageUrl: 'https://cdn.yourdomain.com/gifts/sneaker.png' }], itemCount: 3, totalPayout: 142, currency: 'PKR', createdAt: '2026-10-24T10:45:00.000Z', receivedAgoText: '5m ago' }], message: 'Provider orders fetched successfully.' } } })
  list(@CurrentUser() user: AuthUserContext, @Query() query: ListProviderOrdersDto) { return this.providerOrders.list(user, query); }


  @Get('history')
  @ApiOperation({ summary: 'List own provider order history', description: 'PROVIDER only. Uses ProviderOrder records scoped to the authenticated provider. Status tabs map to provider order statuses.' })
  history(@CurrentUser() user: AuthUserContext, @Query() query: ProviderOrderHistoryDto) { return this.providerOrders.history(user, query); }

  @Get('performance')
  @ApiOperation({ summary: 'Fetch own provider order performance', description: 'PROVIDER only. Completion rate uses completed / non-cancelled own provider orders.' })
  performance(@CurrentUser() user: AuthUserContext, @Query() query: ProviderPerformanceDto) { return this.providerOrders.performance(user, query); }

  @Get('analytics/revenue')
  @ApiOperation({ summary: 'Fetch own provider revenue analytics', description: 'PROVIDER only. Revenue uses provider totalPayout for paid active/completed provider orders.' })
  revenueAnalytics(@CurrentUser() user: AuthUserContext, @Query() query: ProviderRevenueAnalyticsDto) { return this.providerOrders.revenueAnalytics(user, query); }

  @Get('analytics/ratings')
  @ApiOperation({ summary: 'Fetch own provider ratings analytics', description: 'PROVIDER only. Returns stable zero values until reviews module is available.' })
  ratingsAnalytics() { return this.providerOrders.ratingsAnalytics(); }

  @Get('recent')
  @ApiOperation({ summary: 'List recent own provider orders', description: 'PROVIDER only. Defaults to 5 latest orders.' })
  recent(@CurrentUser() user: AuthUserContext, @Query() query: ProviderRecentOrdersDto) { return this.providerOrders.recent(user, query); }

  @Get('export')
  @ApiOperation({ summary: 'Export own provider orders as CSV', description: 'PROVIDER only. Export is scoped to logged-in provider orders.' })
  export(@CurrentUser() user: AuthUserContext, @Query() query: ProviderOrdersExportDto) { return this.providerOrders.export(user, query); }

  @Get('summary')
  @ApiOperation({ summary: 'Fetch own provider order summary', description: 'Route intentionally declared before :id. PROVIDER only.' })
  summary(@CurrentUser() user: AuthUserContext, @Query() query: ProviderOrdersSummaryDto) { return this.providerOrders.summary(user, query); }

  @Get('reject-reasons')
  @ApiOperation({ summary: 'List provider order reject reasons', description: 'Route intentionally declared before :id.' })
  rejectReasons() { return this.providerOrders.rejectReasons(); }


  @Patch(':id/status')
  @ApiOperation({ summary: 'Update own provider order fulfillment status', description: 'PROVIDER only. Enforces ownership, valid transitions, paid-order fulfillment checks, timeline entries, and customer notifications.' })
  updateStatus(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Body() dto: UpdateProviderOrderStatusDto) { return this.providerOrders.updateStatus(user, id, dto); }

  @Get(':id/timeline')
  @ApiOperation({ summary: 'Fetch own provider order timeline', description: 'PROVIDER only. Timeline is scoped to the authenticated provider order.' })
  timeline(@CurrentUser() user: AuthUserContext, @Param('id') id: string) { return this.providerOrders.timeline(user, id); }

  @Get(':id/checklist')
  @ApiOperation({ summary: 'Fetch own provider order checklist', description: 'PROVIDER only. Checklist is operational and does not change status automatically.' })
  checklist(@CurrentUser() user: AuthUserContext, @Param('id') id: string) { return this.providerOrders.checklist(user, id); }

  @Patch(':id/checklist')
  @ApiOperation({ summary: 'Update own provider order checklist', description: 'PROVIDER only. Checklist updates do not directly change order status.' })
  updateChecklist(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Body() dto: UpdateProviderOrderChecklistDto) { return this.providerOrders.updateChecklist(user, id, dto); }

  @Post(':id/message-buyer')
  @ApiOperation({ summary: 'Message buyer for own provider order', description: 'PROVIDER only. Creates an order message and customer notification; SMS is placeholder only.' })
  messageBuyer(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Body() dto: MessageBuyerDto) { return this.providerOrders.messageBuyer(user, id, dto); }

  @Get(':id')
  @ApiOperation({ summary: 'Fetch own provider order details', description: 'PROVIDER only. Does not expose customer card/payment secrets or admin-only order fields.' })
  details(@CurrentUser() user: AuthUserContext, @Param('id') id: string) { return this.providerOrders.details(user, id); }

  @Post(':id/accept')
  @ApiOperation({ summary: 'Accept own pending provider order', description: 'Allowed transition: PENDING -> ACCEPTED. Creates timeline entry and customer notification.' })
  accept(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Body() dto: AcceptProviderOrderDto) { return this.providerOrders.accept(user, id, dto); }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject own pending provider order', description: 'Allowed transition: PENDING -> REJECTED. Does not refund automatically; flags order for review/cancellation based on provider split count.' })
  reject(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Body() dto: RejectProviderOrderDto) { return this.providerOrders.reject(user, id, dto); }
}
