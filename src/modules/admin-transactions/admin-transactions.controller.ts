import { Body, Controller, Get, Param, Post, Query, StreamableFile, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthUserContext, CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AdminTransactionsService } from './admin-transactions.service';
import { AdminTransactionActionDto, AdminTransactionStatsDto, ExportAdminTransactionsDto, ListAdminTransactionsDto } from './dto/admin-transactions.dto';

@ApiTags('02 Admin - Transaction Monitoring')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.STAFF)
@Controller('admin/transactions')
export class AdminTransactionsController {
  constructor(private readonly transactions: AdminTransactionsService) {}

  @Get('stats')
  @Permissions('transactions.read')
  @ApiOperation({ summary: 'Fetch transaction monitoring stats', description: 'SUPER_ADMIN or ADMIN with transactions.read. Stats are calculated from real payment/transaction records and return zeros when no records match.' })
  @ApiResponse({ status: 200, schema: { example: { success: true, data: { totalVolume: 124500, totalVolumeDeltaPercent: 12, successRate: 98.2, successRateDeltaPercent: 2.1, pendingReview: 14, failedToday: 3, failedTodayDeltaPercent: -5, currency: 'USD' }, message: 'Transaction stats fetched successfully.' } } })
  stats(@Query() query: AdminTransactionStatsDto) { return this.transactions.stats(query); }

  @Get('export')
  @Permissions('transactions.export')
  @ApiOperation({ summary: 'Export admin transactions', description: 'SUPER_ADMIN or ADMIN with transactions.export. Applies the same filters as the list API and excludes raw card numbers, CVV, client secrets, and Stripe secret fields.' })
  async export(@CurrentUser() user: AuthUserContext, @Query() query: ExportAdminTransactionsDto): Promise<StreamableFile> { const file = await this.transactions.export(user, query); return new StreamableFile(Buffer.from(file.content), { disposition: `attachment; filename="${file.filename}"`, type: file.contentType }); }

  @Get()
  @Permissions('transactions.read')
  @ApiOperation({ summary: 'List admin transactions', description: 'SUPER_ADMIN or ADMIN with transactions.read. Admin-side financial monitoring endpoint; customer transaction history remains under /api/v1/customer/transactions. Search supports transaction ID, order number, customer name/email, gateway reference, and provider business name.' })
  @ApiResponse({ status: 200, schema: { example: { success: true, data: [{ id: 'transaction_id', transactionId: 'TXN-882194', user: { id: 'user_id', name: 'Sarah Jenkins', avatarUrl: 'https://cdn.yourdomain.com/user-avatars/sarah.png' }, gatewayProvider: 'STRIPE', type: 'PAYMENT', amount: 1250, currency: 'USD', status: 'SUCCESS', createdAt: '2026-10-24T14:20:00.000Z' }], meta: { page: 1, limit: 10, total: 1, totalPages: 1 }, message: 'Transactions fetched successfully.' } } })
  list(@Query() query: ListAdminTransactionsDto) { return this.transactions.list(query); }

  @Get(':id/timeline')
  @Permissions('transactions.read')
  @ApiOperation({ summary: 'Fetch transaction timeline', description: 'SUPER_ADMIN or ADMIN with transactions.read. Returns ordered payment, refund, dispute, notification, and audit events without card/payment secrets.' })
  @ApiResponse({ status: 200, schema: { example: { success: true, data: [{ status: 'INITIATED', title: 'Initiated', description: 'Checkout session started by user via mobile application.', source: 'User Session', timestamp: '2026-11-24T14:30:02.000Z' }, { status: 'COMPLETED', title: 'Completed', description: 'Funds successfully transferred to the merchant escrow account.', source: 'System Auto-Update', timestamp: '2026-11-24T14:32:10.000Z' }], message: 'Transaction timeline fetched successfully.' } } })
  timeline(@Param('id') id: string) { return this.transactions.timeline(id); }

  @Get(':id/receipt')
  @Permissions('transactions.receipt.download')
  @ApiOperation({ summary: 'Download transaction receipt', description: 'SUPER_ADMIN or ADMIN with transactions.receipt.download. Returns a PDF-compatible receipt file with transaction ID, order ID, customer display info, amount breakdown, gateway provider, and masked payment method only.' })
  async receipt(@CurrentUser() user: AuthUserContext, @Param('id') id: string): Promise<StreamableFile> { const file = await this.transactions.receipt(user, id); return new StreamableFile(Buffer.from(file.content), { disposition: `attachment; filename="${file.filename}"`, type: file.contentType }); }

  @Post(':id/action')
  @ApiOperation({ summary: 'Run transaction action', description: "SUPER_ADMIN or ADMIN with action-specific transaction permission. REFUND requires 'transactions.refund' and keeps existing server-side refund validation. OPEN_DISPUTE requires 'transactions.openDispute' and keeps duplicate dispute prevention. NOTIFY_USER requires 'transactions.notifyUser' and dispatches through NotificationDispatchService. Raw card numbers, CVV, Stripe secret keys, and payment intent client secrets are never exposed." })
  @ApiBody({ type: AdminTransactionActionDto, examples: { refund: { value: { action: 'REFUND', refundType: 'FULL', refundAmount: 1281.25, reason: 'CUSTOMER_REQUEST', comment: 'Refund approved by support.', notifyUser: true } }, openDispute: { value: { action: 'OPEN_DISPUTE', reason: 'PRODUCT_NOT_RECEIVED', claimDetails: 'Dispute opened from transaction detail screen.', assignToId: 'admin_id' } }, notifyUser: { value: { action: 'NOTIFY_USER', channel: 'EMAIL', subject: 'Transaction update', message: 'Your transaction has been successfully processed.', includeReceipt: true } } } })
  @ApiResponse({ status: 200, schema: { example: { success: true, data: { transactionId: 'TRX-982341', refundId: 'RF-45678', refundAmount: 1281.25, currency: 'USD', status: 'REFUNDED' }, message: 'Transaction refunded successfully.' } } })
  action(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Body() dto: AdminTransactionActionDto) { return this.transactions.action(user, id, dto); }

  @Get(':id')
  @Permissions('transactions.read')
  @ApiOperation({ summary: 'Fetch transaction details', description: 'SUPER_ADMIN or ADMIN with transactions.read. Shows payment breakdown, gateway information, customer info, related records, and refund state. Raw card numbers, CVV, Stripe secret keys, and payment intent client secrets are never exposed.' })
  @ApiResponse({ status: 200, schema: { example: { success: true, data: { id: 'transaction_id', transactionId: 'TRX-982341', status: 'SUCCESS', type: 'PAYMENT', currency: 'USD', paymentBreakdown: { subtotal: 1250, processingFee: 31.25, processingFeePercent: 2.5, totalAmount: 1281.25 }, gatewayInformation: { provider: 'STRIPE', gatewayReference: 'REF-XP-382341', paymentMethod: 'Visa **** 4242', settlementStatus: 'CLEARED', processorAuthCode: 'AUTH-9921-X' }, customer: { id: 'user_id', name: 'Julianne Doe', email: 'julianne.doe@example.com', kycStatus: 'KYC Level 2 Verified' }, relatedRecords: { orderId: 'order_id', orderNumber: 'ORD-88421', paymentId: 'payment_id', subscriptionId: null, moneyGiftId: null, walletLedgerId: null }, refund: { isRefundable: true, refundedAmount: 0, remainingRefundableAmount: 1281.25, refundWindowEndsAt: '2026-11-24T00:00:00.000Z' }, createdAt: '2026-10-24T14:20:00.000Z' }, message: 'Transaction details fetched successfully.' } } })
  details(@Param('id') id: string) { return this.transactions.details(id); }
}
