import { readFileSync } from 'fs';
import { join } from 'path';

describe('Provider order fulfillment source safety', () => {
  const service = readFileSync(join(__dirname, '../services/provider-orders.service.ts'), 'utf8');
  const controller = readFileSync(join(__dirname, '../controllers/provider-orders.controller.ts'), 'utf8');
  const dto = readFileSync(join(__dirname, '../dto/provider-orders.dto.ts'), 'utf8');
  const schema = readFileSync(join(__dirname, '../../../../prisma/schema.prisma'), 'utf8');
  const repository = readFileSync(join(__dirname, '../repositories/provider-orders.repository.ts'), 'utf8');

  it('adds provider fulfillment APIs under Provider Orders', () => {
    expect(controller).toContain("@Patch(':id/status')");
    expect(controller).toContain("@Get(':id/timeline')");
    expect(controller).toContain("@Get(':id/checklist')");
    expect(controller).toContain("@Patch(':id/checklist')");
    expect(controller).toContain("@Post(':id/message-buyer')");
    expect(controller).toContain("@Post(':id/fulfill')");
    expect(controller).toContain('@Roles(UserRole.PROVIDER)');
  });

  it('adds fulfillment models and tracking fields', () => {
    expect(schema).toContain('model ProviderOrderChecklist');
    expect(schema).toContain('model OrderMessage');
    expect(schema).toContain('trackingNumber');
    expect(schema).toContain('dispatchAt');
    expect(schema).toContain('fulfilledAt');
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

  it('dedicated fulfill action validates ownership/payment, stores dispatch fields, and ships', () => {
    expect(dto).toContain('class FulfillProviderOrderDto');
    expect(dto).toContain('dispatchAt!: string');
    expect(dto).toContain('carrier!: string');
    expect(dto).toContain('trackingNumber!: string');
    expect(service).toContain('async fulfill(user: AuthUserContext, id: string');
    expect(service).toContain('getOwnedProviderOrder(user.uid, id)');
    expect(service).toContain('assertCanFulfill(order)');
    expect(service).toContain('Cannot fulfill unpaid order');
    expect(repository).toContain('status: ProviderOrderStatus.SHIPPED');
    expect(service).toContain('dispatchAt');
    expect(repository).toContain('fulfilledAt');
  });

  it('fulfill action creates timeline, notification, and parent order sync', () => {
    expect(service).toContain("title: 'Order fulfilled'");
    expect(service).toContain("type: 'ORDER_SHIPPED'");
    expect(service).toContain('Tracking number');
    expect(service).toContain('syncParentOrder(tx, order.orderId)');
    expect(service).toContain('OrderStatus.SHIPPED');
  });

  it('status updates create timeline and notifications', () => {
    expect(repository).toContain('providerOrderTimeline.create');
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
    expect(repository).toContain('orderMessage.create');
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
