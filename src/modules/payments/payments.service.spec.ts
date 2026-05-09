import { readFileSync } from 'fs';
import { join } from 'path';

describe('Payments source safety', () => {
  const serviceSource = readFileSync(join(__dirname, 'payments.service.ts'), 'utf8');
  const schemaSource = readFileSync(join(__dirname, '../../../prisma/schema.prisma'), 'utf8');

  it('create payment intent calculates amount from cart and does not accept frontend amount', () => {
    const createIntentSource = serviceSource.slice(serviceSource.indexOf('async createIntent'), serviceSource.indexOf('async confirm'));
    expect(createIntentSource).toContain('cartSummary(cart.items)');
    expect(createIntentSource).toContain('toSmallestUnit(summary.total, summary.currency)');
    expect(createIntentSource).not.toContain('dto.amount');
  });

  it('Stripe webhook verifies signature and handles success/failure/cancel events', () => {
    expect(serviceSource).toContain('webhooks.constructEvent(rawBody, signature, secret)');
    expect(serviceSource).toContain("payment_intent.succeeded");
    expect(serviceSource).toContain("payment_intent.payment_failed");
    expect(serviceSource).toContain("payment_intent.canceled");
    expect(serviceSource).toContain("setup_intent.succeeded");
    expect(serviceSource).toContain('PaymentStatus.SUCCEEDED');
    expect(serviceSource).toContain('PaymentStatus.FAILED');
  });

  it('money gift creates Stripe payment intent and requires own recipient contact', () => {
    expect(serviceSource).toContain('createMoneyGift');
    expect(serviceSource).toContain('recipientContactId: contact.id');
    expect(serviceSource).toContain('userId: user.uid, deletedAt: null');
    expect(serviceSource).toContain('moneyGiftId: moneyGift.id');
  });

  it('order and payment schema supports checkout snapshots and provider splits', () => {
    expect(schemaSource).toContain('model Payment');
    expect(schemaSource).toContain('model MoneyGift');
    expect(schemaSource).toContain('paymentId           String?');
    expect(schemaSource).toContain('tax                 Decimal');
    expect(schemaSource).toContain('currency            String');
  });

  it('setup intent webhook stores saved Stripe cards for recurring payments', () => {
    expect(serviceSource).toContain('saveSetupIntentPaymentMethod');
    expect(serviceSource).toContain('customerPaymentMethod.upsert');
    expect(serviceSource).toContain('stripePaymentMethodId: paymentMethodId');
  });

  it('secrets are read from process.env and not hardcoded', () => {
    expect(serviceSource).toContain('process.env.STRIPE_SECRET_KEY');
    expect(serviceSource).toContain('process.env.STRIPE_WEBHOOK_SECRET');
    expect(serviceSource).not.toContain('sk_test_');
    expect(serviceSource).not.toContain('whsec_');
  });
});
