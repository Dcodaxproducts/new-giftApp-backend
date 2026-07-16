import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthUserContext, CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { ConfirmSubscriptionDto, CustomerSubscriptionActionDto, ListCustomerSubscriptionPlansDto, ListSubscriptionInvoicesDto, SubscriptionCheckoutDto } from '../dto/customer-subscriptions.dto';
import { CustomerSubscriptionsService } from '../services/customer-subscriptions.service';

@ApiTags('05 Customer - Subscriptions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.REGISTERED_USER)
@Controller('customer/subscription')
export class CustomerSubscriptionsController {
  constructor(private readonly subscriptions: CustomerSubscriptionsService) {}

  @Get('plans')
  @ApiOperation({ summary: 'List public active subscription plans', description: 'REGISTERED_USER only. Uses admin-created active/public Subscription Plans. Customer cannot create/update/delete plans.' })
  @ApiResponse({ status: 200, schema: { example: { success: true, data: [{ id: 'plan_premium', name: 'Premium', monthlyPrice: 4.99, yearlyPrice: 39.99, currency: 'USD', isPopular: true, yearlySavingsPercent: 30, features: [{ key: 'ai_gift_recommendations', label: 'Ai Gift Recommendations', enabled: true }], limits: { unlimitedCredits: true } }], message: 'Subscription plans fetched successfully.' } } })
  plans(@Query() query: ListCustomerSubscriptionPlansDto) { return this.subscriptions.plans(query); }

  @Get('current')
  @ApiOperation({ summary: 'Fetch own current subscription', description: 'REGISTERED_USER only. Returns FREE state when no active premium subscription exists.' })
  current(@CurrentUser() user: AuthUserContext) { return this.subscriptions.current(user); }

  @Post('checkout')
  @ApiOperation({ summary: 'Create Stripe subscription checkout', description: 'REGISTERED_USER only. Backend calculates price from admin-created SubscriptionPlan. Uses Stripe subscription flow with payment_behavior=default_incomplete.' })
  @ApiBody({ type: SubscriptionCheckoutDto })
  @ApiResponse({ status: 201, schema: { example: { success: true, data: { customerSubscriptionId: 'subscription_id', stripeSubscriptionId: 'sub_xxx', paymentIntent: 'pi_xxx', clientSecret: 'pi_xxx_secret_xxx', publishableKey: 'pk_test_xxx', amount: 499, currency: 'USD', billingCycle: 'MONTHLY', status: 'INCOMPLETE' }, message: 'Subscription checkout created successfully.' } } })
  checkout(@CurrentUser() user: AuthUserContext, @Body() dto: SubscriptionCheckoutDto) { return this.subscriptions.checkout(user, dto); }

  @Post('confirm')
  @ApiOperation({ summary: 'Confirm Stripe subscription activation', description: 'REGISTERED_USER only. Fetches Stripe subscription server-side and activates local entitlement when active/trialing.' })
  confirm(@CurrentUser() user: AuthUserContext, @Body() dto: ConfirmSubscriptionDto) { return this.subscriptions.confirm(user, dto); }

  @Post('action')
  @ApiOperation({ summary: 'Run own subscription lifecycle action', description: 'REGISTERED_USER only. CANCEL cancels the current customer subscription and supports cancelAtPeriodEnd. REACTIVATE only works when the own subscription is scheduled for cancellation.' })
  @ApiBody({ type: CustomerSubscriptionActionDto, examples: { cancel: { value: { action: 'CANCEL', cancelAtPeriodEnd: true, reason: 'USER_REQUEST', comment: 'User requested cancellation.' } }, reactivate: { value: { action: 'REACTIVATE', reason: 'USER_REQUEST', comment: 'User changed their mind.' } } } })
  action(@CurrentUser() user: AuthUserContext, @Body() dto: CustomerSubscriptionActionDto) { return this.subscriptions.action(user, dto); }

  @Get('invoices')
  @ApiOperation({ summary: 'List own subscription invoices', description: 'REGISTERED_USER only. Returns invoices synced from Stripe subscription webhooks.' })
  invoices(@CurrentUser() user: AuthUserContext, @Query() query: ListSubscriptionInvoicesDto) { return this.subscriptions.invoices(user, query); }

  @Get('invoices/:id')
  @ApiOperation({ summary: 'Fetch own subscription invoice details', description: 'REGISTERED_USER only.' })
  invoiceDetails(@CurrentUser() user: AuthUserContext, @Param('id') id: string) { return this.subscriptions.invoiceDetails(user, id); }

}
