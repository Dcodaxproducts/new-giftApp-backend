/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { BillingCycle, CouponDiscountType, CustomerSubscriptionCancelMode, CustomerSubscriptionInvoiceStatus, CustomerSubscriptionStatus, PaymentMethod, SubscriptionPlanStatus, SubscriptionPlanVisibility } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';
import { CustomerSubscriptionsRepository } from '../repositories/customer-subscriptions.repository';
import { CustomerSubscriptionsService } from '../services/customer-subscriptions.service';
import { InvoiceStatusFilter } from '../dto/customer-subscriptions.dto';

const plan = { id: 'plan_premium', name: 'Premium', description: 'Premium plan', monthlyPrice: 10, yearlyPrice: 100, currency: 'USD', isPopular: true, featuresJson: { premium_support: true }, limitsJson: { unlimitedCredits: true }, status: SubscriptionPlanStatus.ACTIVE, visibility: SubscriptionPlanVisibility.PUBLIC, deletedAt: null, stripeProductId: null, stripeMonthlyPriceId: null, stripeYearlyPriceId: null };
const activeSubscription = { id: 'sub_1', userId: 'customer_1', planId: 'plan_premium', plan, billingCycle: BillingCycle.MONTHLY, status: CustomerSubscriptionStatus.ACTIVE, isPremium: true, currentPeriodStart: new Date('2026-01-01T00:00:00.000Z'), currentPeriodEnd: new Date('2026-02-01T00:00:00.000Z'), cancelAtPeriodEnd: false, cancelledAt: null, stripeCustomerId: 'cus_1', stripeSubscriptionId: 'stripe_sub_1', stripePriceId: 'price_1', couponId: null };
const coupon = { id: 'coupon_1', code: 'SAVE10', discountType: CouponDiscountType.PERCENTAGE, discountValue: 10, isActive: true, deletedAt: null, expiresAt: null, planIdsJson: [], maxRedemptions: null, redemptionCount: 0 };
const invoice = { id: 'invoice_1', userId: 'customer_1', customerSubscriptionId: 'sub_1', stripeInvoiceId: 'in_1', stripePaymentIntentId: 'pi_1', amountDue: 10, amountPaid: 10, currency: 'USD', status: CustomerSubscriptionInvoiceStatus.PAID, invoicePdfUrl: 'https://example.com/invoice.pdf', hostedInvoiceUrl: 'https://example.com/invoice', billingReason: 'subscription_cycle', createdAt: new Date('2026-01-01T00:00:00.000Z'), updatedAt: new Date() };

function createService(overrides: Partial<{ plans: unknown[]; current: unknown; invoices: unknown[]; invoice: unknown; coupon: unknown }> = {}) {
  const plans = overrides.plans ?? [plan];
  const invoices = overrides.invoices ?? [invoice];
  const prisma = {
    subscriptionPlan: {
      findMany: jest.fn().mockResolvedValue(plans),
      findFirst: jest.fn().mockImplementation((args: { where?: { id?: string } }) => Promise.resolve((plans as typeof plan[]).find((item) => item.id === args.where?.id) ?? null)),
      update: jest.fn(),
    },
    customerSubscription: {
      findFirst: jest.fn().mockImplementation((args: { where?: { status?: unknown } }) => {
        if (args.where?.status) return Promise.resolve(Object.prototype.hasOwnProperty.call(overrides, 'current') ? overrides.current : activeSubscription);
        return Promise.resolve(Object.prototype.hasOwnProperty.call(overrides, 'current') ? overrides.current : activeSubscription);
      }),
      create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ ...activeSubscription, ...data, id: 'sub_created' })),
      update: jest.fn().mockImplementation(({ data }) => Promise.resolve({ ...activeSubscription, ...data })),
      findUnique: jest.fn(),
    },
    customerSubscriptionInvoice: {
      findMany: jest.fn().mockResolvedValue(invoices),
      count: jest.fn().mockResolvedValue(invoices.length),
      findFirst: jest.fn().mockResolvedValue(Object.prototype.hasOwnProperty.call(overrides, 'invoice') ? overrides.invoice : invoice),
      upsert: jest.fn(),
    },
    coupon: { findFirst: jest.fn().mockResolvedValue(Object.prototype.hasOwnProperty.call(overrides, 'coupon') ? overrides.coupon : coupon) },
    user: { findUniqueOrThrow: jest.fn().mockResolvedValue({ id: 'customer_1', email: 'customer@example.com', firstName: 'Jane', lastName: 'Doe' }) },
    payment: { create: jest.fn() },
    notification: { create: jest.fn() },
    $transaction: jest.fn().mockImplementation((items: Promise<unknown>[]) => Promise.all(items)),
  };
  const repository = new CustomerSubscriptionsRepository(prisma as unknown as ConstructorParameters<typeof CustomerSubscriptionsRepository>[0]);
  return { service: new CustomerSubscriptionsService(repository), prisma, repository };
}

function mockStripe(service: CustomerSubscriptionsService) {
  process.env.STRIPE_SECRET_KEY = 'sk_test_mock';
  process.env.STRIPE_PUBLISHABLE_KEY = 'pk_test_mock';
  process.env.STRIPE_CURRENCY = 'USD';
  const subscriptionsCreate = jest.fn().mockResolvedValue({ id: 'stripe_sub_new', status: 'incomplete', latest_invoice: { payment_intent: { client_secret: 'client_secret_1', id: 'pi_1' } } });
  const subscriptionsRetrieve = jest.fn().mockResolvedValue({ id: 'stripe_sub_1', status: 'active', current_period_start: 1767225600, current_period_end: 1769904000, cancel_at_period_end: false });
  const subscriptionsUpdate = jest.fn().mockResolvedValue({ id: 'stripe_sub_1', status: 'active' });
  const subscriptionsCancel = jest.fn().mockResolvedValue({ id: 'stripe_sub_1', status: 'canceled' });
  const customersCreate = jest.fn().mockResolvedValue({ id: 'cus_new' });
  const productsCreate = jest.fn().mockResolvedValue({ id: 'prod_1' });
  const pricesCreate = jest.fn().mockResolvedValue({ id: 'price_new' });
  Object.defineProperty(service, 'stripeClient', { value: { subscriptions: { create: subscriptionsCreate, retrieve: subscriptionsRetrieve, update: subscriptionsUpdate, cancel: subscriptionsCancel }, customers: { create: customersCreate }, products: { create: productsCreate }, prices: { create: pricesCreate } }, configurable: true });
  return { subscriptionsCreate, subscriptionsRetrieve, subscriptionsUpdate, subscriptionsCancel, customersCreate, productsCreate, pricesCreate };
}

describe('Customer Premium Subscription module', () => {
  const schema = readFileSync(join(__dirname, '../../../../prisma/schema.prisma'), 'utf8');
  const service = readFileSync(join(__dirname, '../services/customer-subscriptions.service.ts'), 'utf8');
  const repository = readFileSync(join(__dirname, '../repositories/customer-subscriptions.repository.ts'), 'utf8');
  const controller = readFileSync(join(__dirname, '../controllers/customer-subscriptions.controller.ts'), 'utf8');
  const moduleFile = readFileSync(join(__dirname, '../customer-subscriptions.module.ts'), 'utf8');
  const appModule = readFileSync(join(__dirname, '../../../app.module.ts'), 'utf8');
  const payments = readFileSync(join(__dirname, '../../payments/services/payments.service.ts'), 'utf8');
  const auth = readFileSync(join(__dirname, '../../auth/services/auth.service.ts'), 'utf8');
  const main = readFileSync(join(__dirname, '../../../main.ts'), 'utf8');

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
    expect(moduleFile).toContain('CustomerSubscriptionsRepository');
    expect(controller).toContain("@ApiTags('05 Customer - Subscriptions')");
    expect(controller).toContain('@Roles(UserRole.REGISTERED_USER)');
    expect(main).toContain("'05 Customer - Subscriptions'");
  });

  it('exposes all required customer subscription routes', () => {
    for (const route of ["@Get('plans')", "@Get('current')", "@Post('checkout')", "@Post('confirm')", "@Post('cancel')", "@Post('reactivate')", "@Get('invoices')", "@Get('invoices/:id')", "@Post('apply-coupon')"]) expect(controller).toContain(route);
  });

  it('lists only active public admin-created plans and hides admin fields', () => {
    expect(repository).toContain('SubscriptionPlanStatus.ACTIVE');
    expect(repository).toContain('SubscriptionPlanVisibility.PUBLIC');
    expect(repository).toContain('deletedAt: null');
    expect(service).toContain('planItem');
    expect(service).not.toContain('createdBy: plan.createdBy');
  });

  it('repository owns read-only plan/current/invoice queries', () => {
    expect(repository).toContain('findPublicActivePlans');
    expect(repository).toContain('findCurrentSubscriptionForUser');
    expect(repository).toContain('findSubscriptionInvoicesForUser');
    expect(repository).toContain('countSubscriptionInvoicesForUser');
    expect(repository).toContain('findSubscriptionInvoicesAndCountForUser');
    expect(repository).toContain('findSubscriptionInvoiceForUser');
    expect(repository).toContain('findPlanById');
    expect(service).not.toContain('subscriptionPlan.findMany');
    expect(service).not.toContain('customerSubscriptionInvoice.findMany');
    expect(service).not.toContain('customerSubscriptionInvoice.count');
  });

  it('checkout uses Stripe subscriptions and backend-calculated price/coupons', () => {
    expect(service).toContain('payment_behavior');
    expect(service).toContain('default_incomplete');
    expect(service).toContain('ensureStripePrice');
    expect(service).toContain('finalPrice(plan, dto.billingCycle, coupon)');
    expect(service).toContain('You already have an active premium subscription');
  });


  it('repository owns write/action DB calls while service keeps Stripe and decisions', () => {
    expect(repository).toContain('createCustomerSubscription');
    expect(repository).toContain('updateCustomerSubscriptionStatus');
    expect(repository).toContain('markSubscriptionCancelled');
    expect(repository).toContain('reactivateSubscription');
    expect(repository).toContain('findCouponByCode');
    expect(repository).toContain('findSubscriptionForUser');
    expect(repository).toContain('findCurrentActionSubscriptionForUser');
    expect(repository).toContain('updatePlanStripeIds');
    expect(service).toContain('subscriptions.create');
    expect(service).toContain('subscriptions.retrieve');
    expect(service).toContain('finalPrice(plan, dto.billingCycle, coupon)');
  });

  it('supports confirm/cancel/reactivate/invoices/coupon preview', () => {
    expect(service).toContain('Premium subscription activated successfully.');
    expect(service).toContain('cancel_at_period_end');
    expect(service).toContain('Subscription reactivated successfully.');
    expect(repository).toContain('customerSubscriptionInvoice.findMany');
    expect(service).toContain('Coupon redemption limit reached');
  });

  it('extends Stripe webhook subscription handling and creates payment transaction records', () => {
    expect(payments).toContain('handleStripeSubscriptionEvent');
    expect(service).toContain('invoice.payment_succeeded');
    expect(service).toContain('invoice.payment_failed');
    expect(repository).toContain('customerSubscriptionInvoice.upsert');
    expect(repository).toContain('payment.create');
    expect(repository).toContain('customerSubscriptionId: params.customerSubscriptionId');
  });

  it('adds subscription entitlement summary to auth/me', () => {
    expect(auth).toContain('subscription: await this.customerSubscriptionSummary(user.id)');
    expect(auth).toContain("status: 'FREE'");
    expect(auth).toContain('isPremium: subscription.isPremium');
  });
});

describe('CustomerSubscriptionsService read APIs', () => {
  it('customer-subscriptions.service.ts no longer imports PrismaService or uses this.prisma', () => {
    const serviceSource = readFileSync(join(__dirname, '../services/customer-subscriptions.service.ts'), 'utf8');
    const repositorySource = readFileSync(join(__dirname, '../repositories/customer-subscriptions.repository.ts'), 'utf8');
    expect(serviceSource).not.toContain('PrismaService');
    expect(serviceSource).not.toContain('this.prisma');
    expect(repositorySource).toContain('constructor(private readonly prisma: PrismaService)');
    expect(repositorySource).toContain('createSubscriptionInvoice');
    expect(repositorySource).toContain('createSubscriptionTransaction');
  });

  it('customer can list public active plans', async () => {
    const { service, prisma } = createService();
    const result = await service.plans({ billingCycle: BillingCycle.MONTHLY });
    expect(result.message).toBe('Subscription plans fetched successfully.');
    expect(result.data[0]).toEqual(expect.objectContaining({ id: 'plan_premium', monthlyPrice: 10, yearlyPrice: 100, billingCycle: BillingCycle.MONTHLY }));
    expect(prisma.subscriptionPlan.findMany).toHaveBeenCalledWith({ where: { status: SubscriptionPlanStatus.ACTIVE, visibility: SubscriptionPlanVisibility.PUBLIC, deletedAt: null }, orderBy: [{ isPopular: 'desc' }, { monthlyPrice: 'asc' }] });
  });

  it('private and archived/deleted plans are excluded by repository filter', async () => {
    const { service, prisma } = createService({ plans: [] });
    const result = await service.plans({});
    expect(result.data).toEqual([]);
    expect(prisma.subscriptionPlan.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { status: SubscriptionPlanStatus.ACTIVE, visibility: SubscriptionPlanVisibility.PUBLIC, deletedAt: null } }));
  });

  it('free user returns current subscription FREE state', async () => {
    const { service } = createService({ current: null });
    const result = await service.current({ uid: 'customer_1', role: 'REGISTERED_USER' });
    expect(result.data).toEqual({ status: 'FREE', isPremium: false, plan: null, features: [] });
  });

  it('premium user returns active entitlement', async () => {
    const { service } = createService();
    const result = await service.current({ uid: 'customer_1', role: 'REGISTERED_USER' });
    expect(result.data).toEqual(expect.objectContaining({ status: CustomerSubscriptionStatus.ACTIVE, isPremium: true, plan: expect.objectContaining({ id: 'plan_premium', price: 10, currency: 'USD' }), stripeSubscriptionId: 'stripe_sub_1' }));
  });

  it('customer can list own invoices', async () => {
    const { service, prisma } = createService();
    const result = await service.invoices({ uid: 'customer_1', role: 'REGISTERED_USER' }, { status: InvoiceStatusFilter.PAID });
    expect(result.message).toBe('Subscription invoices fetched successfully.');
    expect(result.data[0]).toEqual(expect.objectContaining({ id: 'invoice_1', stripeInvoiceId: 'in_1', status: CustomerSubscriptionInvoiceStatus.PAID }));
    expect(prisma.customerSubscriptionInvoice.count).toHaveBeenCalledWith({ where: { userId: 'customer_1', status: InvoiceStatusFilter.PAID } });
  });

  it('customer cannot access another user invoice', async () => {
    const { service, prisma } = createService({ invoice: null });
    await expect(service.invoiceDetails({ uid: 'customer_1', role: 'REGISTERED_USER' }, 'invoice_other')).rejects.toThrow('Subscription invoice not found');
    expect(prisma.customerSubscriptionInvoice.findFirst).toHaveBeenCalledWith({ where: { id: 'invoice_other', userId: 'customer_1' } });
  });

  it('checkout uses backend plan price and does not trust frontend amount', async () => {
    const { service, prisma } = createService({ current: null, plans: [{ ...plan, stripeMonthlyPriceId: 'price_monthly' }] });
    const stripe = mockStripe(service);
    const result = await service.checkout({ uid: 'customer_1', role: 'REGISTERED_USER' }, { planId: 'plan_premium', billingCycle: BillingCycle.MONTHLY, paymentMethod: PaymentMethod.STRIPE_CARD });
    expect(result.message).toBe('Subscription checkout created successfully.');
    expect(result.data).toEqual(expect.objectContaining({ amount: 1000, currency: 'USD', status: CustomerSubscriptionStatus.INCOMPLETE }));
    expect(stripe.subscriptionsCreate).toHaveBeenCalledWith(expect.objectContaining({ customer: 'cus_new', items: [{ price: 'price_monthly' }], payment_behavior: 'default_incomplete', metadata: { userId: 'customer_1', planId: 'plan_premium', billingCycle: BillingCycle.MONTHLY } }));
    expect(prisma.customerSubscription.create).toHaveBeenCalledWith({ data: expect.objectContaining({ userId: 'customer_1', planId: 'plan_premium', stripePriceId: 'price_monthly' }) });
  });

  it('checkout rejects inactive/private plan through public plan lookup', async () => {
    const { service } = createService({ current: null, plans: [] });
    mockStripe(service);
    await expect(service.checkout({ uid: 'customer_1', role: 'REGISTERED_USER' }, { planId: 'private_plan', billingCycle: BillingCycle.MONTHLY, paymentMethod: PaymentMethod.STRIPE_CARD })).rejects.toThrow('Subscription plan not found');
  });

  it('confirm activates own subscription after server verification', async () => {
    const { service, prisma } = createService();
    mockStripe(service);
    const result = await service.confirm({ uid: 'customer_1', role: 'REGISTERED_USER' }, { customerSubscriptionId: 'sub_1', stripeSubscriptionId: 'stripe_sub_1' });
    expect(result.message).toBe('Premium subscription activated successfully.');
    expect(prisma.customerSubscription.findFirst).toHaveBeenCalledWith({ where: { id: 'sub_1', userId: 'customer_1' } });
    expect(prisma.customerSubscription.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'sub_1' }, data: expect.objectContaining({ status: CustomerSubscriptionStatus.ACTIVE, isPremium: true }) }));
  });

  it('cancel applies only to own subscription', async () => {
    const { service, prisma } = createService();
    const stripe = mockStripe(service);
    const result = await service.cancel({ uid: 'customer_1', role: 'REGISTERED_USER' }, { cancelMode: CustomerSubscriptionCancelMode.AFTER_CURRENT_PERIOD, reason: 'pause' });
    expect(result.message).toBe('Subscription will be cancelled at the end of the current billing period.');
    expect(stripe.subscriptionsUpdate).toHaveBeenCalledWith('stripe_sub_1', { cancel_at_period_end: true, metadata: { cancelReason: 'pause' } });
    expect(prisma.customerSubscription.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ userId: 'customer_1' }) }));
  });

  it('reactivate applies only to own subscription', async () => {
    const { service, prisma } = createService({ current: { ...activeSubscription, cancelAtPeriodEnd: true } });
    const stripe = mockStripe(service);
    const result = await service.reactivate({ uid: 'customer_1', role: 'REGISTERED_USER' });
    expect(result.message).toBe('Subscription reactivated successfully.');
    expect(stripe.subscriptionsUpdate).toHaveBeenCalledWith('stripe_sub_1', { cancel_at_period_end: false });
    expect(prisma.customerSubscription.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'sub_1' }, data: expect.objectContaining({ status: CustomerSubscriptionStatus.ACTIVE, isPremium: true, cancelAtPeriodEnd: false }) }));
  });

  it('coupon apply validates active coupon and calculates discount backend-side', async () => {
    const { service, prisma } = createService();
    const result = await service.applyCoupon({ uid: 'customer_1', role: 'REGISTERED_USER' }, { planId: 'plan_premium', billingCycle: BillingCycle.MONTHLY, couponCode: 'save10' });
    expect(result.data).toEqual(expect.objectContaining({ planPrice: 10, discountAmount: 1, finalPrice: 9, currency: 'USD', coupon: expect.objectContaining({ code: 'SAVE10' }) }));
    expect(prisma.coupon.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ code: 'SAVE10', isActive: true, deletedAt: null }) }));
  });

});
