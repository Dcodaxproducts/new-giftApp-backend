import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthUserContext, CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { ApplyCouponDto, CancelSubscriptionDto, ConfirmSubscriptionDto, ListCustomerSubscriptionPlansDto, ListSubscriptionInvoicesDto, SubscriptionCheckoutDto } from '../dto/customer-subscriptions.dto';
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
  @ApiOperation({ summary: 'Create Stripe subscription checkout', description: 'REGISTERED_USER only. Backend calculates price from admin-created SubscriptionPlan and optional coupon. Uses Stripe subscription flow with payment_behavior=default_incomplete.' })
  @ApiBody({ type: SubscriptionCheckoutDto })
  checkout(@CurrentUser() user: AuthUserContext, @Body() dto: SubscriptionCheckoutDto) { return this.subscriptions.checkout(user, dto); }

  @Post('confirm')
  @ApiOperation({ summary: 'Confirm Stripe subscription activation', description: 'REGISTERED_USER only. Fetches Stripe subscription server-side and activates local entitlement when active/trialing.' })
  confirm(@CurrentUser() user: AuthUserContext, @Body() dto: ConfirmSubscriptionDto) { return this.subscriptions.confirm(user, dto); }

  @Post('cancel')
  @ApiOperation({ summary: 'Cancel own subscription', description: 'REGISTERED_USER only. Supports immediate cancellation or cancel_at_period_end in Stripe. Does not delete local subscription record.' })
  cancel(@CurrentUser() user: AuthUserContext, @Body() dto: CancelSubscriptionDto) { return this.subscriptions.cancel(user, dto); }

  @Post('reactivate')
  @ApiOperation({ summary: 'Reactivate scheduled cancellation', description: 'REGISTERED_USER only. Works only when own subscription has cancelAtPeriodEnd=true.' })
  reactivate(@CurrentUser() user: AuthUserContext) { return this.subscriptions.reactivate(user); }

  @Get('invoices')
  @ApiOperation({ summary: 'List own subscription invoices', description: 'REGISTERED_USER only. Returns invoices synced from Stripe subscription webhooks.' })
  invoices(@CurrentUser() user: AuthUserContext, @Query() query: ListSubscriptionInvoicesDto) { return this.subscriptions.invoices(user, query); }

  @Get('invoices/:id')
  @ApiOperation({ summary: 'Fetch own subscription invoice details', description: 'REGISTERED_USER only.' })
  invoiceDetails(@CurrentUser() user: AuthUserContext, @Param('id') id: string) { return this.subscriptions.invoiceDetails(user, id); }

  @Post('apply-coupon')
  @ApiOperation({ summary: 'Preview subscription coupon', description: 'REGISTERED_USER only. Validates coupon against active coupon rules and plan restrictions; frontend discount amounts are ignored.' })
  applyCoupon(@CurrentUser() user: AuthUserContext, @Body() dto: ApplyCouponDto) { return this.subscriptions.applyCoupon(user, dto); }
}
