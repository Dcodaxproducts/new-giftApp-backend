import { Body, Controller, Delete, Get, Headers, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Request } from 'express';
import { AuthUserContext, CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { ConfirmPaymentDto, CreateMoneyGiftDto, CreatePaymentIntentDto } from '../dto/payments.dto';
import { PaymentsService } from '../services/payments.service';

type RawBodyRequest = Request & { rawBody?: Buffer };

@ApiTags('06 Payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.REGISTERED_USER)
@Controller('customer/payments')
export class CustomerPaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Post('create-intent')
  @ApiOperation({ summary: 'Create payment intent from active cart', description: 'REGISTERED_USER only. Amount is calculated from backend cart totals; frontend amount is never accepted.' })
  @ApiBody({ type: CreatePaymentIntentDto, examples: { stripe: { value: { cartId: 'cmf0cartactive001', paymentMethod: 'STRIPE_CARD' } }, cod: { value: { cartId: 'cmf0cartactive001', paymentMethod: 'COD' } } } })
  @ApiResponse({ status: 201, description: 'Payment intent created successfully.', schema: { example: { success: true, data: { paymentId: 'payment_id', stripePaymentIntentId: 'pi_xxx', clientSecret: 'pi_xxx_secret_xxx', publishableKey: 'pk_live_or_test', amount: 10999, currency: 'PKR' }, message: 'Payment intent created successfully.' } } })
  createIntent(@CurrentUser() user: AuthUserContext, @Body() dto: CreatePaymentIntentDto) { return this.payments.createIntent(user, dto); }

  @Post('confirm')
  @ApiOperation({ summary: 'Confirm Stripe payment', description: 'REGISTERED_USER only. Retrieves Stripe PaymentIntent server-side before updating local payment status.' })
  confirm(@CurrentUser() user: AuthUserContext, @Body() dto: ConfirmPaymentDto) { return this.payments.confirm(user, dto); }

  @Get(':id')
  @ApiOperation({ summary: 'Fetch own payment details' })
  @ApiResponse({ status: 200, description: 'Payment fetched successfully.', schema: { example: { success: true, data: { paymentId: 'payment_id', provider: 'STRIPE', stripePaymentIntentId: 'pi_xxx', amount: 109.99, currency: 'PKR', status: 'SUCCEEDED', paymentMethod: 'STRIPE_CARD', failureReason: null }, message: 'Payment fetched successfully.' } } })
  details(@CurrentUser() user: AuthUserContext, @Param('id') id: string) { return this.payments.details(user, id); }
}

@ApiTags('05 Customer - Payment Methods')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.REGISTERED_USER)
@Controller('customer/payment-methods')
export class CustomerPaymentMethodsController {
  constructor(private readonly payments: PaymentsService) {}

  @Get()
  @ApiOperation({ summary: 'List supported customer payment methods' })
  @ApiResponse({ status: 200, description: 'Payment methods fetched successfully.', schema: { example: { success: true, data: [{ key: 'STRIPE_CARD', label: 'Credit/Debit Card', enabled: true }, { key: 'BANK_TRANSFER', label: 'Bank Payment', enabled: true }, { key: 'E_WALLET', label: 'E-Wallet', enabled: false }], message: 'Payment methods fetched successfully.' } } })
  list() { return this.payments.paymentMethods(); }

  @Post('setup-intent')
  @ApiOperation({ summary: 'Create Stripe SetupIntent for saving card', description: 'Frontend confirms card with Stripe SDK. Backend never accepts raw card number or CVV.' })
  @ApiResponse({ status: 201, schema: { example: { success: true, data: { setupIntentId: 'seti_xxx', clientSecret: 'seti_xxx_secret_xxx', publishableKey: 'pk_test_xxx' }, message: 'Setup intent created successfully.' } } })
  setupIntent(@CurrentUser() user: AuthUserContext) { return this.payments.createSetupIntent(user); }

  @Get('saved')
  @ApiOperation({ summary: 'List own saved payment methods', description: 'Returns masked Stripe card metadata only.' })
  @ApiResponse({ status: 200, schema: { example: { success: true, data: [{ id: 'pm_xxx', type: 'CARD', brand: 'visa', last4: '4242', expiryMonth: 9, expiryYear: 2025, isDefault: true }], message: 'Saved payment methods fetched successfully.' } } })
  saved(@CurrentUser() user: AuthUserContext) { return this.payments.savedPaymentMethods(user); }

  @Patch(':id/default')
  @ApiOperation({ summary: 'Set own default payment method' })
  setDefault(@CurrentUser() user: AuthUserContext, @Param('id') id: string) { return this.payments.setDefaultPaymentMethod(user, id); }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete own saved payment method', description: 'Rejects deletion when the method is used by an active recurring payment.' })
  delete(@CurrentUser() user: AuthUserContext, @Param('id') id: string) { return this.payments.deletePaymentMethod(user, id); }
}

@ApiTags('06 Payments')
@Controller('payments/stripe')
export class StripeWebhookController {
  constructor(private readonly payments: PaymentsService) {}

  @Post('webhook')
  @ApiOperation({ summary: 'Stripe webhook endpoint', description: 'Verifies Stripe-Signature using the configured webhook secret before processing events.' })
  webhook(@Req() request: RawBodyRequest, @Headers('stripe-signature') signature?: string | string[]) {
    return this.payments.handleStripeWebhook(request.rawBody, signature);
  }
}

@ApiTags('06 Payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.REGISTERED_USER)
@Controller('customer/money-gifts')
export class CustomerMoneyGiftsController {
  constructor(private readonly payments: PaymentsService) {}

  @Post()
  @ApiOperation({ summary: 'Send payment as gift', description: 'Creates a customer-to-recipient money gift record and Stripe PaymentIntent for STRIPE_CARD.' })
  @ApiBody({ type: CreateMoneyGiftDto, examples: { create: { value: { amount: 100, currency: 'PKR', recipientContactId: 'cmf0contactmary001', message: 'Hope this helps. Enjoy your day!', messageMediaUrls: [], deliveryDate: '2026-12-24T00:00:00.000Z', repeatAnnually: false, paymentMethod: 'STRIPE_CARD' } } } })
  create(@CurrentUser() user: AuthUserContext, @Body() dto: CreateMoneyGiftDto) { return this.payments.createMoneyGift(user, dto); }

  @Get()
  @ApiOperation({ summary: 'List own money gifts' })
  list(@CurrentUser() user: AuthUserContext) { return this.payments.moneyGifts(user); }

  @Get(':id')
  @ApiOperation({ summary: 'Fetch own money gift details' })
  details(@CurrentUser() user: AuthUserContext, @Param('id') id: string) { return this.payments.moneyGiftDetails(user, id); }
}
