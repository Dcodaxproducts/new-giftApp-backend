import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';
import { MoneyGiftsRepository } from '../repositories/money-gifts.repository';
import { PaymentsRepository } from '../repositories/payments.repository';
import { PaymentsService } from '../services/payments.service';
import { StripeWebhookEventsRepository } from '../repositories/stripe-webhook-events.repository';

const savedMethod = { id: 'saved_1', userId: 'customer_1', stripeCustomerId: 'cus_1', stripePaymentMethodId: 'pm_card_visa', type: 'CARD', brand: 'visa', last4: '4242', expiryMonth: 9, expiryYear: 2028, isDefault: true, deletedAt: null, createdAt: new Date(), updatedAt: new Date() };
const dbUser = { id: 'customer_1', email: 'customer@example.com', firstName: 'Jane', lastName: 'Doe' };

function createService(overrides: Partial<{ method: unknown; activeRecurring: number; savedMethods: unknown[]; user: unknown }> = {}) {
  const prisma = {
    user: { findUnique: jest.fn().mockResolvedValue(Object.prototype.hasOwnProperty.call(overrides, 'user') ? overrides.user : dbUser) },
    customerPaymentMethod: {
      findFirst: jest.fn().mockImplementation((args: { where?: { OR?: unknown } }) => {
        if (args.where?.OR) return Promise.resolve(Object.prototype.hasOwnProperty.call(overrides, 'method') ? overrides.method : savedMethod);
        return Promise.resolve(savedMethod);
      }),
      findMany: jest.fn().mockResolvedValue(overrides.savedMethods ?? [savedMethod]),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      update: jest.fn().mockResolvedValue({ ...savedMethod, isDefault: true }),
      delete: jest.fn().mockResolvedValue(savedMethod),
      upsert: jest.fn().mockResolvedValue(savedMethod),
    },
    customerRecurringPayment: { count: jest.fn().mockResolvedValue(overrides.activeRecurring ?? 0) },
    notification: { create: jest.fn().mockResolvedValue({ id: 'n1' }) },
    $transaction: jest.fn().mockImplementation((items: Promise<unknown>[]) => Promise.all(items)),
  };
  const repository = new PaymentsRepository(prisma as unknown as ConstructorParameters<typeof PaymentsRepository>[0]);
  const moneyGiftsRepository = new MoneyGiftsRepository(prisma as unknown as ConstructorParameters<typeof MoneyGiftsRepository>[0]);
  const stripeWebhookEventsRepository = new StripeWebhookEventsRepository(prisma as unknown as ConstructorParameters<typeof StripeWebhookEventsRepository>[0]);
  const referrals = { awardReferralForFirstEligiblePurchase: jest.fn() };
  const wallet = { creditWalletTopUp: jest.fn(), failWalletTopUp: jest.fn() };
  const subscriptions = { handleStripeSubscriptionEvent: jest.fn() };
  return { service: new PaymentsService(referrals as never, wallet as never, subscriptions as never, repository, moneyGiftsRepository, stripeWebhookEventsRepository), prisma };
}

describe('Payments source safety', () => {
  const serviceSource = readFileSync(join(__dirname, '../services/payments.service.ts'), 'utf8');
  const repositorySource = readFileSync(join(__dirname, '../repositories/payments.repository.ts'), 'utf8');
  const moneyGiftsRepositorySource = readFileSync(join(__dirname, '../repositories/money-gifts.repository.ts'), 'utf8');
  const stripeWebhookEventsRepositorySource = readFileSync(join(__dirname, '../repositories/stripe-webhook-events.repository.ts'), 'utf8');
  const controllerSource = readFileSync(join(__dirname, '../controllers/payments.controller.ts'), 'utf8');
  const schemaSource = readFileSync(join(__dirname, '../../../../prisma/schema.prisma'), 'utf8');

  it('create payment intent calculates amount from cart and does not accept frontend amount', () => {
    const createIntentSource = serviceSource.slice(serviceSource.indexOf('async createIntent'), serviceSource.indexOf('async confirm'));
    expect(createIntentSource).toContain('cartSummary(cart.items)');
    expect(createIntentSource).toContain('toSmallestUnit(summary.total, summary.currency)');
    expect(createIntentSource).not.toContain('dto.amount');
  });

  it('Stripe webhook verifies signature and handles success/failure/cancel events', () => {
    expect(serviceSource).toContain('webhooks.constructEvent(rawBody, signature, secret)');
    expect(stripeWebhookEventsRepositorySource).toContain('findPaymentByProviderIntentId');
    expect(serviceSource).toContain('payment_intent.succeeded');
    expect(serviceSource).toContain('payment_intent.payment_failed');
    expect(serviceSource).toContain('payment_intent.canceled');
    expect(serviceSource).toContain('setup_intent.succeeded');
    expect(serviceSource).toContain('PaymentStatus.SUCCEEDED');
    expect(serviceSource).toContain('PaymentStatus.FAILED');
  });

  it('money gift creates Stripe payment intent and requires own recipient contact', () => {
    expect(serviceSource).toContain('createMoneyGift');
    expect(serviceSource).toContain('recipientContactId: contact.id');
    expect(moneyGiftsRepositorySource).toContain('findOwnedRecipientContact');
    expect(moneyGiftsRepositorySource).toContain('userId, deletedAt: null');
    expect(serviceSource).toContain('moneyGiftId: moneyGift.id');
  });

  it('order and payment schema supports checkout snapshots and provider splits', () => {
    expect(schemaSource).toContain('model Payment');
    expect(schemaSource).toContain('model MoneyGift');
    expect(schemaSource).toContain('paymentId');
    expect(schemaSource).toContain('tax');
    expect(schemaSource).toContain('currency');
  });

  it('setup intent webhook stores saved Stripe cards for recurring payments through repository', () => {
    expect(serviceSource).toContain('saveSetupIntentPaymentMethod');
    expect(repositorySource).toContain('upsertSavedPaymentMethod');
    expect(repositorySource).toContain('stripePaymentMethodId: params.stripePaymentMethodId');
  });

  it('payment method APIs keep routes and repository extraction stable', () => {
    expect(controllerSource).toContain("@Controller('customer/payment-methods')");
    expect(controllerSource).toContain('@Get()');
    expect(controllerSource).toContain("@Get('saved')");
    expect(controllerSource).toContain("@Post('setup-intent')");
    expect(controllerSource).toContain("@Delete(':id')");
    expect(controllerSource).toContain("@Patch(':id/default')");
    expect(repositorySource).toContain('findSavedPaymentMethodsByUserId');
    expect(repositorySource).toContain('findOwnedActiveCartWithItems');
    expect(repositorySource).toContain('createPayment');
    expect(repositorySource).toContain('findSavedPaymentMethodForUser');
    expect(repositorySource).toContain('findActiveRecurringUsageByPaymentMethod');
    expect(repositorySource).toContain('deleteSavedPaymentMethod');
    expect(repositorySource).toContain('setDefaultPaymentMethodForUser');
  });

  it('secrets are read from process.env and not hardcoded', () => {
    expect(serviceSource).toContain('process.env.STRIPE_SECRET_KEY');
    expect(serviceSource).toContain('process.env.STRIPE_WEBHOOK_SECRET');
    expect(serviceSource).not.toContain('sk_test_');
    expect(serviceSource).not.toContain('whsec_');
  });
});

describe('Customer payment methods service behavior', () => {
  it('customer can list own saved payment methods', async () => {
    const { service, prisma } = createService();
    const result = await service.savedPaymentMethods({ uid: 'customer_1', role: UserRole.REGISTERED_USER });
    expect(result.message).toBe('Saved payment methods fetched successfully.');
    expect(result.data[0]).toEqual(expect.objectContaining({ id: 'pm_card_visa', brand: 'visa', last4: '4242' }));
    expect(prisma.customerPaymentMethod.findMany).toHaveBeenCalledWith({ where: { userId: 'customer_1', deletedAt: null }, orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }] });
  });

  it('customer can set own default payment method', async () => {
    const { service, prisma } = createService();
    const result = await service.setDefaultPaymentMethod({ uid: 'customer_1', role: UserRole.REGISTERED_USER }, 'pm_card_visa');
    expect(result.data).toEqual({ id: 'pm_card_visa', isDefault: true });
    expect(prisma.customerPaymentMethod.findFirst).toHaveBeenCalledWith({ where: { userId: 'customer_1', deletedAt: null, OR: [{ id: 'pm_card_visa' }, { stripePaymentMethodId: 'pm_card_visa' }] } });
    expect(prisma.customerPaymentMethod.updateMany).toHaveBeenCalledWith({ where: { userId: 'customer_1', isDefault: true }, data: { isDefault: false } });
  });

  it('customer cannot delete saved method used by active recurring payment', async () => {
    const { service } = createService({ activeRecurring: 1 });
    await expect(service.deletePaymentMethod({ uid: 'customer_1', role: UserRole.REGISTERED_USER }, 'pm_card_visa')).rejects.toThrow(BadRequestException);
  });

  it('customer cannot delete another user payment method', async () => {
    const { service } = createService({ method: null });
    await expect(service.deletePaymentMethod({ uid: 'customer_1', role: UserRole.REGISTERED_USER }, 'pm_other')).rejects.toThrow(NotFoundException);
  });

  it('SetupIntent still works as before', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_mock';
    process.env.STRIPE_PUBLISHABLE_KEY = 'pk_test_mock';
    const { service, prisma } = createService();
    const setupCreate = jest.fn().mockResolvedValue({ id: 'seti_1', client_secret: 'seti_secret' });
    Object.defineProperty(service, 'stripeClient', { value: { customers: { create: jest.fn() }, setupIntents: { create: setupCreate } }, configurable: true });
    const result = await service.createSetupIntent({ uid: 'customer_1', role: UserRole.REGISTERED_USER });
    expect(result.data).toEqual({ setupIntentId: 'seti_1', clientSecret: 'seti_secret', publishableKey: 'pk_test_mock' });
    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: 'customer_1' } });
    expect(setupCreate).toHaveBeenCalledWith({ customer: 'cus_1', payment_method_types: ['card'], metadata: { userId: 'customer_1' } });
  });
});
