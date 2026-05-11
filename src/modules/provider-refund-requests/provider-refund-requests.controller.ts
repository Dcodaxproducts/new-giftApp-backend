import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthUserContext, CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ApproveProviderRefundRequestDto, ListProviderRefundRequestsDto, RejectProviderRefundRequestDto } from './dto/provider-refund-requests.dto';
import { ProviderRefundRequestsService } from './provider-refund-requests.service';

@ApiTags('03 Provider - Refund Requests')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.PROVIDER)
@Controller('provider/refund-requests')
export class ProviderRefundRequestsController {
  constructor(private readonly refunds: ProviderRefundRequestsService) {}
  @Get() @ApiOperation({ summary: 'List own provider refund requests', description: 'PROVIDER only. Returns refund requests for provider orders assigned to the authenticated provider. Search supports order number, customer name, and customer email.' }) @ApiResponse({ status: 200, schema: { example: { success: true, data: [{ id: 'refund_request_id', providerOrderId: 'provider_order_id', orderNumber: '88417', customer: { name: 'Jane Cooper', email: 'jane.cooper@example.com', avatarUrl: 'https://cdn.yourdomain.com/customer-avatar.jpg' }, requestedAmount: 45, currency: 'PKR', status: 'REQUESTED', customerReason: 'Item was damaged on arrival', createdAt: '2026-10-23T18:10:00.000Z' }], message: 'Provider refund requests fetched successfully.' } } }) list(@CurrentUser() user: AuthUserContext, @Query() query: ListProviderRefundRequestsDto) { return this.refunds.list(user, query); }
  @Get('summary') @ApiOperation({ summary: 'Fetch own refund request summary', description: 'Route intentionally declared before :id. PROVIDER only.' }) summary(@CurrentUser() user: AuthUserContext) { return this.refunds.summary(user); }
  @Get('reject-reasons') @ApiOperation({ summary: 'List refund rejection reasons', description: 'Route intentionally declared before :id. PROVIDER only.' }) rejectReasons() { return this.refunds.rejectReasons(); }
  @Get(':id') @ApiOperation({ summary: 'Fetch own refund request details', description: 'PROVIDER only. Refund request must belong to the authenticated provider order and never exposes Stripe secrets or raw card data.' }) details(@CurrentUser() user: AuthUserContext, @Param('id') id: string) { return this.refunds.details(user, id); }
  @Post(':id/approve') @ApiOperation({ summary: 'Approve own requested refund', description: 'PROVIDER only. Validates ownership, REQUESTED status, requested amount, refundable amount, creates refund transaction marker, timeline entry, and customer notification.' }) @ApiBody({ type: ApproveProviderRefundRequestDto, examples: { approve: { value: { comment: 'Refund approved after reviewing evidence.', refundAmount: 45, notifyCustomer: true } } } }) approve(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Body() dto: ApproveProviderRefundRequestDto) { return this.refunds.approve(user, id, dto); }
  @Post(':id/reject') @ApiOperation({ summary: 'Reject own requested refund', description: 'PROVIDER only. Validates ownership and REQUESTED status. Creates timeline entry and optional customer notification. No Stripe refund is created.' }) @ApiBody({ type: RejectProviderRefundRequestDto, examples: { reject: { value: { reason: 'REFUND_WINDOW_EXPIRED', comment: 'The request was submitted after the allowed refund period.', notifyCustomer: true } } } }) reject(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Body() dto: RejectProviderRefundRequestDto) { return this.refunds.reject(user, id, dto); }
}
