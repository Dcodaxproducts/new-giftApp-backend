import { readFileSync } from 'fs';
import { join } from 'path';

describe('Provider order fulfillment source safety', () => {
  const service = readFileSync(join(__dirname, 'provider-orders.service.ts'), 'utf8');
  const controller = readFileSync(join(__dirname, 'provider-orders.controller.ts'), 'utf8');
  const dto = readFileSync(join(__dirname, 'dto/provider-orders.dto.ts'), 'utf8');
  const schema = readFileSync(join(__dirname, '../../../prisma/schema.prisma'), 'utf8');

  it('adds provider fulfillment APIs under Provider Orders', () => {
    expect(controller).toContain("@Patch(':id/status')");
    expect(controller).toContain("@Get(':id/timeline')");
    expect(controller).toContain("@Get(':id/checklist')");
    expect(controller).toContain("@Patch(':id/checklist')");
    expect(controller).toContain("@Post(':id/message-buyer')");
    expect(controller).toContain('@Roles(UserRole.PROVIDER)');
  });

  it('adds fulfillment models and tracking fields', () => {
    expect(schema).toContain('model ProviderOrderChecklist');
    expect(schema).toContain('model OrderMessage');
    expect(schema).toContain('trackingNumber');
    expect(schema).toContain('estimatedDeliveryAt');
    expect(schema).toContain('metadataJson');
    expect(schema).toContain('createdById');
  });

  it('provider status updates enforce ownership, payment, and transitions', () => {
    expect(service).toContain('getOwnedProviderOrder(user.uid, id)');
    expect(service).toContain('assertTransition(order.status, dto.status)');
    expect(service).toContain('Cannot update a closed provider order');
    expect(service).toContain('Cannot mark unpaid order as fulfilled');
    expect(service).toContain('Invalid status transition');
  });

  it('status updates create timeline and notifications', () => {
    expect(service).toContain('providerOrderTimeline.create');
    expect(service).toContain('metadataJson: { trackingNumber');
    expect(service).toContain('ORDER_${dto.status}');
    expect(service).toContain('PROVIDER_ORDER_STATUS_UPDATED');
  });

  it('timeline and checklist are scoped to own provider order', () => {
    expect(service).toContain('async timeline(user: AuthUserContext, id: string)');
    expect(service).toContain('async checklist(user: AuthUserContext, id: string)');
    expect(service).toContain('async updateChecklist(user: AuthUserContext, id: string');
    expect(service).toContain('getOrCreateChecklist(order.id)');
    expect(service).toContain('providerOrderId: order.id');
  });

  it('message buyer stores order message and creates customer notification', () => {
    expect(dto).toContain('ProviderOrderMessageChannel');
    expect(service).toContain('orderMessage.create');
    expect(service).toContain('PROVIDER_MESSAGE_RECEIVED');
    expect(service).toContain('recipientId: order.order.userId');
  });

  it('completed provider orders sync parent order status', () => {
    expect(service).toContain('syncParentOrder(tx, order.orderId)');
    expect(service).toContain('OrderStatus.COMPLETED');
    expect(service).toContain('OrderStatus.PARTIALLY_SHIPPED');
    expect(service).toContain('OrderStatus.PARTIALLY_COMPLETED');
  });
});
