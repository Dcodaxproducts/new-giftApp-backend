import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthUserContext, CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AcceptProviderOrderDto, ListProviderOrdersDto, ProviderOrderStatusFilter, ProviderOrdersSummaryDto, RejectProviderOrderDto } from './dto/provider-orders.dto';
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

  @Get('summary')
  @ApiOperation({ summary: 'Fetch own provider order summary', description: 'Route intentionally declared before :id. PROVIDER only.' })
  summary(@CurrentUser() user: AuthUserContext, @Query() query: ProviderOrdersSummaryDto) { return this.providerOrders.summary(user, query); }

  @Get('reject-reasons')
  @ApiOperation({ summary: 'List provider order reject reasons', description: 'Route intentionally declared before :id.' })
  rejectReasons() { return this.providerOrders.rejectReasons(); }

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
