import { Controller, Get, Param, Query, StreamableFile, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthUserContext, CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CustomerTransactionsService } from './customer-transactions.service';
import { CustomerTransactionExportFormat, CustomerTransactionPaymentMethod, CustomerTransactionSortBy, CustomerTransactionSortOrder, CustomerTransactionStatus, CustomerTransactionSummaryDto, CustomerTransactionType, ExportCustomerTransactionsDto, ListCustomerTransactionsDto } from './dto/customer-transactions.dto';

@ApiTags('Customer Transactions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.REGISTERED_USER)
@Controller('customer/transactions')
export class CustomerTransactionsController {
  constructor(private readonly transactions: CustomerTransactionsService) {}

  @Get()
  @ApiOperation({ summary: 'List own customer transactions', description: 'REGISTERED_USER only. Normalizes backend Payment, Order, MoneyGift, and RecurringPayment occurrence records owned by the logged-in customer.' })
  @ApiQuery({ name: 'type', enum: CustomerTransactionType, required: false })
  @ApiQuery({ name: 'status', enum: CustomerTransactionStatus, required: false })
  @ApiQuery({ name: 'paymentMethod', enum: CustomerTransactionPaymentMethod, required: false })
  @ApiQuery({ name: 'sortBy', enum: CustomerTransactionSortBy, required: false })
  @ApiQuery({ name: 'sortOrder', enum: CustomerTransactionSortOrder, required: false })
  @ApiResponse({ status: 200, schema: { example: { success: true, data: [{ id: 'payment_id', transactionId: 'TXN-2026-001234', title: 'Monthly Flowers', description: 'Recurring payment', recipient: { id: 'contact_id', name: 'Sarah Johnson', avatarUrl: 'https://cdn.yourdomain.com/customer-contact-avatars/sarah.png' }, amount: 50, currency: 'PKR', type: 'RECURRING_PAYMENT', status: 'SUCCESS', paymentMethod: 'STRIPE_CARD', createdAt: '2026-03-01T14:34:00.000Z' }], meta: { page: 1, limit: 20, total: 1, totalPages: 1 }, message: 'Transactions fetched successfully.' } } })
  list(@CurrentUser() user: AuthUserContext, @Query() query: ListCustomerTransactionsDto) { return this.transactions.list(user, query); }

  @Get('summary')
  @ApiOperation({ summary: 'Fetch own transaction summary', description: 'Defaults to current month when no date range is provided. Uses backend-calculated payment records only.' })
  @ApiResponse({ status: 200, schema: { example: { success: true, data: { totalSpentThisMonth: 255, currency: 'PKR', successfulCount: 9, failedCount: 1, pendingCount: 0, refundedCount: 0 }, message: 'Transaction summary fetched successfully.' } } })
  summary(@CurrentUser() user: AuthUserContext, @Query() query: CustomerTransactionSummaryDto) { return this.transactions.summary(user, query); }

  @Get('export')
  @ApiOperation({ summary: 'Export own transactions', description: 'CSV is supported and returned as a file. Export is scoped to the logged-in customer only.' })
  @ApiQuery({ name: 'format', enum: CustomerTransactionExportFormat, required: false })
  @ApiResponse({ status: 200, description: 'Transaction export file.' })
  export(@CurrentUser() user: AuthUserContext, @Query() query: ExportCustomerTransactionsDto): Promise<StreamableFile> { return this.transactions.export(user, query); }

  @Get(':id')
  @ApiOperation({ summary: 'Fetch own transaction details', description: 'Includes order, money gift, recurring payment, and payment gateway references when available. Billing address returns null until available.' })
  @ApiResponse({ status: 200, schema: { example: { success: true, data: { id: 'payment_id', transactionId: 'TXN-2026-001234-ABC-XYZ', status: 'SUCCESS', amount: 50, currency: 'PKR', createdAt: '2026-03-01T14:34:00.000Z', type: 'RECURRING_PAYMENT', giftInformation: { giftName: 'Monthly Flowers Subscription', deliveryType: 'Money', recipient: { id: 'contact_id', name: 'Sarah Johnson', avatarUrl: 'https://cdn.yourdomain.com/customer-contact-avatars/sarah.png' }, orderReference: null, recurringPaymentId: 'recurring_payment_id' }, paymentInformation: { paymentMethod: 'Stripe card', gatewayReference: 'pi_3MmlLrLkdIwHu7ix0fhBHWqt', billingAddress: null } }, message: 'Transaction details fetched successfully.' } } })
  details(@CurrentUser() user: AuthUserContext, @Param('id') id: string) { return this.transactions.details(user, id); }

  @Get(':id/receipt')
  @ApiOperation({ summary: 'Download own transaction receipt', description: 'Receipt is generated only for the transaction owner and never exposes Stripe secret data.' })
  @ApiResponse({ status: 200, description: 'Receipt PDF file for the authenticated transaction owner. Includes app name, transaction ID, customer, recipient, references, totals, currency, status, and support email.' })
  receipt(@CurrentUser() user: AuthUserContext, @Param('id') id: string): Promise<StreamableFile> { return this.transactions.receipt(user, id); }
}
