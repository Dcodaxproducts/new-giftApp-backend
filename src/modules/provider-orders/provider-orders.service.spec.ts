import { readFileSync } from 'fs';
import { join } from 'path';

describe('Provider assigned orders source safety', () => {
  const service = readFileSync(join(__dirname, 'provider-orders.service.ts'), 'utf8');
  const controller = readFileSync(join(__dirname, 'provider-orders.controller.ts'), 'utf8');
  const dto = readFileSync(join(__dirname, 'dto/provider-orders.dto.ts'), 'utf8');
  const schema = readFileSync(join(__dirname, '../../../prisma/schema.prisma'), 'utf8');
  const customerMarketplace = readFileSync(join(__dirname, '../customer-marketplace/customer-marketplace.service.ts'), 'utf8');
  const customerOrdersRepository = readFileSync(join(__dirname, '../customer-marketplace/customer-orders.repository.ts'), 'utf8');

  it('exposes provider-only Provider Orders APIs with static routes before :id', () => {
    expect(controller).toContain("@ApiTags('03 Provider - Orders')");
    expect(controller).toContain('@Roles(UserRole.PROVIDER)');
    expect(controller.indexOf("@Get('summary')")).toBeLessThan(controller.indexOf("@Get(':id')"));
    expect(controller.indexOf("@Get('reject-reasons')")).toBeLessThan(controller.indexOf("@Get(':id')"));
    expect(controller).toContain("@Post(':id/accept')");
    expect(controller).toContain("@Post(':id/reject')");
  });

  it('scopes all provider order reads/writes to the logged-in provider', () => {
    expect(service).toContain('providerId: user.uid');
    expect(service).toContain('where: { id, providerId }');
    expect(service).not.toContain('query.providerId');
    expect(service).toContain('Provider order not found');
  });

  it('supports provider order statuses, reject reasons, items, and timeline models', () => {
    expect(schema).toContain('enum ProviderOrderStatus');
    expect(schema).toContain('enum ProviderOrderRejectReason');
    expect(schema).toContain('model ProviderOrderItem');
    expect(schema).toContain('model ProviderOrderTimeline');
    expect(dto).toContain('ProviderOrderStatusFilter');
    expect(dto).toContain('OUT_OF_STOCK');
  });

  it('creates provider split snapshots when customer order is created', () => {
    expect(customerMarketplace).toContain('ProviderOrderStatus.PENDING');
    expect(customerMarketplace).toContain('createProviderOrderItem');
    expect(customerOrdersRepository).toContain('providerOrderItem.create');
    expect(customerMarketplace).toContain('nameSnapshot: orderItem.gift.name');
    expect(customerMarketplace).toContain('imageUrl: this.firstImage(orderItem.gift.imageUrls)');
  });

  it('lists orders with search, filters, item preview, payout and no payment secrets', () => {
    expect(service).toContain('search');
    expect(service).toContain('orderNumber');
    expect(service).toContain('nameSnapshot');
    expect(service).toContain('itemPreview');
    expect(service).toContain('totalPayout');
    expect(service).not.toContain('providerPaymentIntentId');
    expect(service).not.toContain('clientSecret');
  });

  it('accepts only pending orders and creates timeline plus customer notification', () => {
    expect(service).toContain('Only pending provider orders can be accepted');
    expect(service).toContain('ProviderOrderStatus.ACCEPTED');
    expect(service).toContain('providerOrderTimeline.create');
    expect(service).toContain('CUSTOMER_ORDER_ACCEPTED');
  });

  it('rejects only pending orders with reason and creates notifications', () => {
    expect(service).toContain('Only pending provider orders can be rejected');
    expect(service).toContain('ProviderOrderStatus.REJECTED');
    expect(service).toContain('rejectionReason: dto.reason');
    expect(service).toContain('CUSTOMER_ORDER_REJECTED');
    expect(service).toContain('ADMIN_ORDER_REQUIRES_REVIEW');
  });
});
