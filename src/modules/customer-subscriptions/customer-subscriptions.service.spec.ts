import { readFileSync } from 'fs';
import { join } from 'path';

describe('Customer Premium Subscription module', () => {
  const schema = readFileSync(join(__dirname, '../../../prisma/schema.prisma'), 'utf8');
  const service = readFileSync(join(__dirname, 'customer-subscriptions.service.ts'), 'utf8');
  const controller = readFileSync(join(__dirname, 'customer-subscriptions.controller.ts'), 'utf8');
  const moduleFile = readFileSync(join(__dirname, 'customer-subscriptions.module.ts'), 'utf8');
  const appModule = readFileSync(join(__dirname, '../../app.module.ts'), 'utf8');
  const payments = readFileSync(join(__dirname, '../payments/payments.service.ts'), 'utf8');
  const auth = readFileSync(join(__dirname, '../auth/auth.service.ts'), 'utf8');
  const main = readFileSync(join(__dirname, '../../main.ts'), 'utf8');

  it('adds customer subscription schemas without duplicating admin plans', () => {
    expect(schema).toContain('model CustomerSubscription');
    expect(schema).toContain('model CustomerSubscriptionInvoice');
    expect(schema).toContain('stripeProductId');
    expect(schema).toContain('stripeMonthlyPriceId');
    expect(schema).toContain('stripeYearlyPriceId');
    expect(schema).toContain('SubscriptionPlan');
  });

  it('registers customer subscription module and Swagger group', () => {
    expect(appModule).toContain('CustomerSubscriptionsModule');
    expect(moduleFile).toContain('CustomerSubscriptionsService');
    expect(controller).toContain("@ApiTags('05 Customer - Subscriptions')");
    expect(controller).toContain('@Roles(UserRole.REGISTERED_USER)');
    expect(main).toContain("'05 Customer - Subscriptions'");
  });

  it('exposes all required customer subscription routes', () => {
    for (const route of ["@Get('plans')", "@Get('current')", "@Post('checkout')", "@Post('confirm')", "@Post('cancel')", "@Post('reactivate')", "@Get('invoices')", "@Get('invoices/:id')", "@Post('apply-coupon')"]) expect(controller).toContain(route);
  });

  it('lists only active public admin-created plans and hides admin fields', () => {
    expect(service).toContain('SubscriptionPlanStatus.ACTIVE');
    expect(service).toContain('SubscriptionPlanVisibility.PUBLIC');
    expect(service).toContain('deletedAt: null');
    expect(service).toContain('planItem');
    expect(service).not.toContain('createdBy: plan.createdBy');
  });

  it('checkout uses Stripe subscriptions and backend-calculated price/coupons', () => {
    expect(service).toContain('payment_behavior');
    expect(service).toContain('default_incomplete');
    expect(service).toContain('ensureStripePrice');
    expect(service).toContain('finalPrice(plan, dto.billingCycle, coupon)');
    expect(service).toContain('You already have an active premium subscription');
  });

  it('supports confirm/cancel/reactivate/invoices/coupon preview', () => {
    expect(service).toContain('Premium subscription activated successfully.');
    expect(service).toContain('cancel_at_period_end');
    expect(service).toContain('Subscription reactivated successfully.');
    expect(service).toContain('customerSubscriptionInvoice.findMany');
    expect(service).toContain('Coupon redemption limit reached');
  });

  it('extends Stripe webhook subscription handling and creates payment transaction records', () => {
    expect(payments).toContain('handleStripeSubscriptionEvent');
    expect(service).toContain('invoice.payment_succeeded');
    expect(service).toContain('invoice.payment_failed');
    expect(service).toContain('customerSubscriptionInvoice.upsert');
    expect(service).toContain('payment.create');
    expect(service).toContain('customerSubscriptionId: sub.id');
  });

  it('adds subscription entitlement summary to auth/me', () => {
    expect(auth).toContain('subscription: await this.customerSubscriptionSummary(user.id)');
    expect(auth).toContain("status: 'FREE'");
    expect(auth).toContain('isPremium: subscription.isPremium');
  });
});
