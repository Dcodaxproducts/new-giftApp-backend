import { Body, Controller, Get, Headers, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Request } from 'express';
import { AuthUserContext, CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ConfirmPaymentDto, CreateMoneyGiftDto, CreatePaymentIntentDto } from './dto/payments.dto';
import { PaymentsService } from './payments.service';

type RawBodyRequest = Request & { rawBody?: Buffer };

@ApiTags('Payments')
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

@ApiTags('Payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.REGISTERED_USER)
@Controller('customer/payment-methods')
export class CustomerPaymentMethodsController {
  constructor(private readonly payments: PaymentsService) {}

  @Get()
  @ApiOperation({ summary: 'List supported customer payment methods' })
  list() { return this.payments.paymentMethods(); }
}

@ApiTags('Payments')
@Controller('payments/stripe')
export class StripeWebhookController {
  constructor(private readonly payments: PaymentsService) {}

  @Post('webhook')
  @ApiOperation({ summary: 'Stripe webhook endpoint', description: 'Verifies Stripe-Signature using the configured webhook secret before processing events.' })
  webhook(@Req() request: RawBodyRequest, @Headers('stripe-signature') signature?: string | string[]) {
    return this.payments.handleStripeWebhook(request.rawBody, signature);
  }
}

@ApiTags('Payments')
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
