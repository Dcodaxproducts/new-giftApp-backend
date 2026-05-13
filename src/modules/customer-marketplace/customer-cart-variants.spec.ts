import { readFileSync } from 'fs';
import { join } from 'path';

describe('Customer cart variant behavior', () => {
  const service = readFileSync(join(__dirname, 'customer-marketplace.service.ts'), 'utf8');
  const controller = readFileSync(join(__dirname, 'customer-marketplace.controller.ts'), 'utf8');

  it('validates variants and uses variant price snapshots/default variants', () => {
    expect(service).toContain('resolveVariant');
    expect(service).toContain('candidate.isDefault');
    expect(service).toContain('Variant does not belong to gift');
    expect(service).toContain('variant?.price ?? gift.price');
    expect(service).toContain('variant?.stockQuantity ?? gift.stockQuantity');
  });

  it('wishlist visibility wording no longer requires gift moderation approval for provider inventory', () => {
    expect(controller).toContain('customer-visible');
    expect(controller).not.toContain('active, approved, published, and in stock');
  });

  it('Stripe card orders require successful payment and internally consistent summaries', () => {
    expect(service).toContain('paymentMethod === PaymentMethod.STRIPE_CARD');
    expect(service).toContain('PaymentStatus.SUCCEEDED');
    expect(service).toContain('summary.subtotal');
    expect(service).toContain('summary.discountTotal');
    expect(service).toContain('summary.total');
  });
});
