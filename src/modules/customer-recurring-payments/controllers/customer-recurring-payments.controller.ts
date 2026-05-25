import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthUserContext, CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { CustomerRecurringPaymentsService } from '../services/customer-recurring-payments.service';
import { CreateRecurringPaymentDto, ListRecurringPaymentsDto, RecurringPaymentActionDto, RecurringPaymentHistoryDto, UpdateRecurringPaymentDto } from '../dto/customer-recurring-payments.dto';

@ApiTags('05 Customer - Recurring Payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.REGISTERED_USER)
@Controller('customer/recurring-payments')
export class CustomerRecurringPaymentsController {
  constructor(private readonly service: CustomerRecurringPaymentsService) {}

  @Get()
  @ApiOperation({ summary: 'List own recurring payments', description: 'REGISTERED_USER only. Returns recurring money/gift payment subscriptions owned by the logged-in customer.' })
  @ApiResponse({ status: 200, schema: { example: { success: true, data: [{ id: 'recurring_payment_id', title: "Sarah's Birthday", recipient: { id: 'contact_id', name: 'Sarah Johnson', email: 'sarah.j@example.com', avatarUrl: 'https://cdn.yourdomain.com/customer-contact-avatars/sarah.png' }, amount: 50, currency: 'PKR', frequency: 'MONTHLY', nextBillingAt: '2026-03-15T09:00:00.000Z', status: 'ACTIVE', message: 'Monthly flowers', createdAt: '2026-05-09T10:00:00.000Z' }], meta: { page: 1, limit: 20, total: 1, totalPages: 1 }, message: 'Recurring payments fetched successfully.' } } })
  list(@CurrentUser() user: AuthUserContext, @Query() query: ListRecurringPaymentsDto) { return this.service.list(user, query); }

  @Post()
  @ApiOperation({ summary: 'Create recurring payment', description: 'REGISTERED_USER only. Recipient contact and saved Stripe payment method must both belong to the logged-in customer. Stripe card recurring payments require a saved payment method.' })
  @ApiBody({ type: CreateRecurringPaymentDto, examples: { weeklyStripe: { value: { amount: 100, currency: 'PKR', frequency: 'WEEKLY', schedule: { dayOfWeek: 'MONDAY', dayOfMonth: null, monthOfYear: null, time: '09:00', timezone: 'Asia/Karachi' }, recipientContactId: 'contact_id', message: 'Hope you love this special surprise!', messageMediaUrls: ['https://cdn.yourdomain.com/gift-message-media/photo.png'], paymentMethod: 'STRIPE_CARD', stripePaymentMethodId: 'pm_xxx', startDate: '2026-05-10T00:00:00.000Z', endDate: null, autoSend: true } } } })
  @ApiResponse({ status: 201, schema: { example: { success: true, data: { id: 'recurring_payment_id', amount: 100, currency: 'PKR', frequency: 'WEEKLY', nextBillingAt: '2026-05-12T09:00:00.000Z', status: 'ACTIVE' }, message: 'Recurring payment created successfully.' } } })
  create(@CurrentUser() user: AuthUserContext, @Body() dto: CreateRecurringPaymentDto) { return this.service.create(user, dto); }

  @Get('summary')
  @ApiOperation({ summary: 'Fetch recurring payment summary counts', description: 'Must stay before /customer/recurring-payments/:id route.' })
  @ApiResponse({ status: 200, schema: { example: { success: true, data: { total: 5, active: 3, paused: 1, cancelled: 1, failed: 0 }, message: 'Recurring payment summary fetched successfully.' } } })
  summary(@CurrentUser() user: AuthUserContext) { return this.service.summary(user); }

  @Get(':id')
  @ApiOperation({ summary: 'Fetch own recurring payment details', description: 'REGISTERED_USER only. Customer cannot access another user’s recurring payment.' })
  @ApiResponse({ status: 200, schema: { example: { success: true, data: { id: 'recurring_payment_id', title: 'Monthly Flowers', recipient: { id: 'contact_id', name: 'Sarah Johnson', email: 'sarah.j@example.com', avatarUrl: 'https://cdn.yourdomain.com/customer-contact-avatars/sarah.png' }, amount: 50, currency: 'PKR', frequency: 'MONTHLY', nextBillingAt: '2026-03-15T09:00:00.000Z', status: 'ACTIVE', message: 'Fresh seasonal bouquet delivered to her doorstep every month', messageMediaUrls: [], paymentMethod: { type: 'STRIPE_CARD', brand: 'visa', last4: '4242', expiryMonth: 12, expiryYear: 2026 }, schedule: { frequency: 'MONTHLY', dayOfMonth: 15, time: '09:00', timezone: 'Asia/Karachi' }, createdAt: '2026-05-09T10:00:00.000Z' }, message: 'Recurring payment fetched successfully.' } } })
  details(@CurrentUser() user: AuthUserContext, @Param('id') id: string) { return this.service.details(user, id); }

  @Patch(':id')
  @ApiOperation({ summary: 'Update own recurring payment', description: 'Cannot edit CANCELLED recurring payments. Changes apply from the next billing cycle and nextBillingAt is recalculated.' })
  @ApiBody({ type: UpdateRecurringPaymentDto, examples: { monthly: { value: { amount: 50, frequency: 'MONTHLY', schedule: { dayOfMonth: 15, time: '09:00', timezone: 'Asia/Karachi' }, message: 'Fresh flowers every month.', messageMediaUrls: [], stripePaymentMethodId: 'pm_xxx' } } } })
  @ApiResponse({ status: 200, schema: { example: { success: true, data: { id: 'recurring_payment_id', status: 'ACTIVE', nextBillingAt: '2026-03-15T09:00:00.000Z' }, message: 'Recurring payment updated successfully. Changes will apply from the next billing cycle.' } } })
  update(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Body() dto: UpdateRecurringPaymentDto) { return this.service.update(user, id, dto); }

  @Post(':id/action')
  @ApiOperation({ summary: 'Run own recurring payment action', description: 'PAUSE is allowed only from ACTIVE and moves the recurring payment to PAUSED. RESUME is allowed only from PAUSED and moves it back to ACTIVE. CANCEL is allowed from ACTIVE or PAUSED, supports cancelAtPeriodEnd, and preserves billing history.' })
  @ApiBody({ type: RecurringPaymentActionDto, examples: { pause: { value: { action: 'PAUSE', reason: 'USER_REQUEST', comment: 'User paused payment temporarily.' } }, resume: { value: { action: 'RESUME', reason: 'USER_REQUEST', comment: 'User resumed recurring payment.' } }, cancelImmediate: { value: { action: 'CANCEL', reason: 'USER_REQUEST', cancelAtPeriodEnd: false, comment: 'User no longer needs this recurring payment.' } }, cancelAtPeriodEnd: { value: { action: 'CANCEL', reason: 'USER_REQUEST', cancelAtPeriodEnd: true, comment: 'User wants to finish the current billing cycle.' } } } })
  @ApiResponse({ status: 200, schema: { example: { success: true, data: { id: 'recurring_payment_id', status: 'PAUSED', action: 'PAUSE' }, message: 'Recurring payment paused successfully.' } } })
  action(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Body() dto: RecurringPaymentActionDto) { return this.service.action(user, id, dto); }

  @Get(':id/history')
  @ApiOperation({ summary: 'List own recurring payment billing history' })
  @ApiResponse({ status: 200, schema: { example: { success: true, data: [{ id: 'history_id', paymentId: 'payment_id', amount: 50, currency: 'PKR', status: 'SUCCESS', billingDate: '2026-02-15T09:00:00.000Z', transactionId: 'GFT-8829-XPL', failureReason: null }], meta: { page: 1, limit: 20, total: 1, totalPages: 1 }, message: 'Recurring payment history fetched successfully.' } } })
  history(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Query() query: RecurringPaymentHistoryDto) { return this.service.history(user, id, query); }
}

