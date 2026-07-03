import { readFileSync } from 'fs';
import { join } from 'path';

describe('Provider order fulfillment source safety', () => {
  const service = readFileSync(join(__dirname, '../provider-orders.service.ts'), 'utf8');
  const controller = readFileSync(join(__dirname, '../provider-orders.controller.ts'), 'utf8');
  const dto = readFileSync(join(__dirname, '../dto/provider-orders.dto.ts'), 'utf8');
  const schema = readFileSync(join(__dirname, '../../../../prisma/schema.prisma'), 'utf8');
  const repository = readFileSync(join(__dirname, '../provider-orders.repository.ts'), 'utf8');

  it('adds provider fulfillment APIs under Provider Orders', () => {
    expect(controller).toContain("@Post(':id/action')");
    expect(controller).not.toContain("@Patch(':id/status')");
    expect(controller).toContain("@Get(':id/timeline')");
    expect(controller).not.toContain("@Get(':id/checklist')");
    expect(controller).not.toContain("@Patch(':id/checklist')");
    expect(controller).not.toContain("@Post(':id/message-buyer')");
    expect(controller).not.toContain("@Post(':id/fulfill')");
    expect(controller).toContain('@Roles(UserRole.PROVIDER)');
  });

  it('keeps fulfillment timeline and tracking fields without checklist/message tables', () => {
    expect(schema).not.toContain('model ProviderOrderChecklist');
    expect(schema).not.toContain('model OrderMessage');
    expect(schema).toContain('trackingNumber');
    expect(schema).toContain('dispatchAt');
    expect(schema).toContain('fulfilledAt');
    expect(schema).toContain('estimatedDeliveryAt');
    expect(schema).toContain('metadataJson');
    expect(schema).toContain('createdById');
  });

  it('provider status updates enforce ownership, payment, and transitions', () => {
    expect(service).toContain('dto.action === ProviderOrderAction.UPDATE_STATUS');
    expect(service).toContain('Status is required when updating order status');
    expect(service).toContain('getOwnedProviderOrder(user.uid, id)');
    expect(service).toContain('assertTransition(order.status, dto.status)');
    expect(service).toContain('Cannot update a closed provider order');
    expect(service).toContain('Cannot mark unpaid order as fulfilled');
    expect(service).toContain('Invalid status transition');
  });

  it('dedicated fulfill action validates ownership/payment, stores dispatch fields, and ships', () => {
    expect(dto).toContain('ProviderOrderAction');
    expect(dto).toContain('dispatchAt?: string');
    expect(dto).toContain('carrier?: string');
    expect(dto).toContain('trackingNumber?: string');
    expect(service).toContain('dispatchAt, carrier, and trackingNumber are required when fulfilling an order');
    expect(service).toContain('getOwnedProviderOrder(user.uid, id)');
    expect(service).toContain('assertCanFulfill(order)');
    expect(service).toContain('dispatchAt, carrier, and trackingNumber are required when fulfilling an order');
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

  it('timeline is scoped to own provider order', () => {
    expect(service).toContain('async timeline(user: AuthUserContext, id: string)');
    expect(service).not.toContain('async checklist(user: AuthUserContext, id: string)');
    expect(service).not.toContain('async updateChecklist(user: AuthUserContext, id: string');
    expect(service).not.toContain('getOrCreateChecklist(order.id)');
    expect(service).toContain('providerOrderId: order.id');
  });

  it('buyer messaging is replaced by unified chats endpoints', () => {
    const chatsController = readFileSync(join(__dirname, '../../chats/controllers/chats.controller.ts'), 'utf8');
    expect(controller).not.toContain("@Post(':id/message-buyer')");
    expect(service).not.toContain('async messageBuyer');
    expect(chatsController).toContain("@Post('threads')");
    expect(chatsController).toContain("@Post('threads/:threadId/messages')");
  });

  it('completed provider orders sync parent order status', () => {
    expect(service).toContain('syncParentOrder(tx, order.orderId)');
    expect(service).toContain('OrderStatus.COMPLETED');
    expect(service).toContain('OrderStatus.PARTIALLY_SHIPPED');
    expect(service).toContain('OrderStatus.PARTIALLY_COMPLETED');
  });
});
