import { OrderHistoryType } from './dto/customer-marketplace.dto';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Customer orders repository cleanup', () => {
  const service = readFileSync(join(__dirname, 'customer-marketplace.service.ts'), 'utf8');
  const repository = readFileSync(join(__dirname, 'customer-orders.repository.ts'), 'utf8');
  const controller = readFileSync(join(__dirname, 'customer-marketplace.controller.ts'), 'utf8');

  it('keeps customer order API routes stable', () => {
    expect(controller).toContain("@Post('orders')");
    expect(controller).toContain("@Get('orders')");
    expect(controller).toContain("@Get('orders/:id')");
    expect(controller).toContain("@ApiTags('05 Customer - Orders')");
  });

  it('repository owns customer order read queries', () => {
    expect(repository).toContain('findManyForCustomerOrders');
    expect(repository).toContain('countForCustomerOrders');
    expect(repository).toContain('findManyAndCountForCustomerOrders');
    expect(repository).toContain('findOwnedOrderById');
    expect(repository).toContain('findOwnedOrderWithItems');
    expect(repository).toContain('where: { id, userId }');
    expect(repository).toContain('CUSTOMER_ORDER_INCLUDE');
  });

  it('service scopes list and details to JWT customer id', () => {
    expect(service).toContain('userId: user.uid');
    expect(service).toContain('findOwnedOrderById(user.uid, id)');
    expect(service).not.toContain('query.userId');
    expect(service).not.toContain('dto.userId');
  });

  it('service keeps order filter normalization and response mapping', () => {
    expect(service).toContain('status: query.status');
    expect(service).toContain('query.fromDate || query.toDate');
    expect(service).toContain('toOrderListItem(order, query.type)');
    expect(service).toContain('toOrder(order)');
    expect(service).toContain(OrderHistoryType.PAYMENTS_SENT);
  });

  it('order details do not expose payment secrets and keep provider sub-order formatting', () => {
    const toOrderSource = service.slice(service.indexOf('private toOrder(order'), service.indexOf('private nextOrderNumber'));
    expect(toOrderSource).toContain('providerOrders: order.providerOrders.map');
    expect(toOrderSource).toContain('subtotal: Number(providerOrder.subtotal)');
    expect(toOrderSource).toContain('total: Number(providerOrder.total)');
    expect(toOrderSource).not.toContain('providerPaymentIntentId');
    expect(toOrderSource).not.toContain('clientSecret');
    expect(toOrderSource).not.toContain('stripe');
  });
});
