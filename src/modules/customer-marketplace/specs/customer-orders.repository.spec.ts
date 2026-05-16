import { OrderHistoryType } from '../dto/customer-marketplace.dto';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Customer orders repository cleanup', () => {
  const service = readFileSync(join(__dirname, '../services/customer-marketplace.service.ts'), 'utf8');
  const repository = readFileSync(join(__dirname, '../repositories/customer-orders.repository.ts'), 'utf8');
  const controller = readFileSync(join(__dirname, '../controllers/customer-marketplace.controller.ts'), 'utf8');
  const createOrderSource = service.slice(service.indexOf('async createOrder'), service.indexOf('async orders'));
  const toOrderSource = service.slice(service.indexOf('private toOrder(order'), service.indexOf('private nextOrderNumber'));

  it('keeps customer order API routes stable', () => {
    expect(controller).toContain("@Post('orders')");
    expect(controller).toContain('createOrder(@CurrentUser() user: AuthUserContext, @Body() dto: CreateOrderDto)');
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

  it('repository owns order creation DB writes inside one checkout transaction', () => {
    expect(repository).toContain('runCheckoutTransaction');
    expect(repository).toContain('this.prisma.$transaction(callback)');
    expect(repository).toContain('findActiveCartForCheckout');
    expect(repository).toContain('findPaymentForUser');
    expect(repository).toContain('findDeliveryAddressForUser');
    expect(repository).toContain('findGiftsForCheckout');
    expect(repository).toContain('createOrderWithItems');
    expect(repository).toContain('tx.order.create');
    expect(repository).toContain('decrementGiftStock');
    expect(repository).toContain('tx.gift.update');
    expect(repository).toContain('decrementVariantStock');
    expect(repository).toContain('tx.giftVariant.update');
    expect(repository).toContain('createOrderItem');
    expect(repository).toContain('tx.orderItem.create');
    expect(repository).toContain('createProviderSubOrder');
    expect(repository).toContain('tx.providerOrder.create');
    expect(repository).toContain('createProviderOrderItem');
    expect(repository).toContain('tx.providerOrderItem.create');
    expect(repository).toContain('markCartCheckedOut');
    expect(repository).toContain('tx.cartItem.deleteMany');
    expect(repository).toContain('tx.cart.update');
    expect(repository).toContain('linkPaymentToOrder');
    expect(repository).toContain('tx.payment.update');
    expect(repository).toContain('createOrderNotification');
    expect(repository).toContain('tx.notification.create');
  });

  it('service scopes list, details, and checkout to JWT customer id', () => {
    expect(service).toContain('userId: user.uid');
    expect(service).toContain('findOwnedOrderById(user.uid, id)');
    expect(createOrderSource).toContain('getCheckoutCart(user.uid, dto.cartId)');
    expect(createOrderSource).toContain('getCheckoutDeliveryAddress(user.uid, dto.deliveryAddressId)');
    expect(createOrderSource).toContain('findPaymentForUser(user.uid, dto.paymentId)');
    expect(repository).toContain('where: { ...(cartId ? { id: cartId } : {}), userId, status: CartStatus.ACTIVE }');
    expect(service).not.toContain('query.userId');
    expect(service).not.toContain('dto.userId');
  });

  it('customer can create order from own active cart and cannot create from another user cart', () => {
    expect(service).toContain('private async getCheckoutCart(userId: string, cartId?: string): Promise<CartView>');
    expect(service).toContain("throw new NotFoundException('Active cart not found')");
    expect(repository).toContain('findActiveCartForCheckout(userId: string, cartId?: string)');
    expect(repository).toContain('userId, status: CartStatus.ACTIVE');
  });

  it('STRIPE_CARD requires owned successful payment and amount validation uses backend summary', () => {
    expect(createOrderSource).toContain('payment?.paymentMethod ?? dto.paymentMethod ?? PaymentMethod.COD');
    expect(createOrderSource).toContain('paymentMethod === PaymentMethod.STRIPE_CARD');
    expect(createOrderSource).toContain('PaymentStatus.SUCCEEDED');
    expect(createOrderSource).toContain("throw new BadRequestException('Successful payment is required before creating this order')");
    expect(createOrderSource).toContain('Number(payment.amount) !== summary.total');
    expect(createOrderSource).toContain('payment.currency !== summary.currency');
    expect(createOrderSource).toContain("throw new BadRequestException('Payment amount does not match cart total')");
  });

  it('frontend amount is not trusted for order creation', () => {
    expect(createOrderSource).toContain('const summary = this.cartSummary(cart.items)');
    expect(createOrderSource).toContain('subtotal: new Prisma.Decimal(summary.subtotal)');
    expect(createOrderSource).toContain('discountTotal: new Prisma.Decimal(summary.discountTotal)');
    expect(createOrderSource).toContain('total: new Prisma.Decimal(summary.total)');
    expect(createOrderSource).not.toContain('dto.amount');
    expect(createOrderSource).not.toContain('dto.total');
    expect(createOrderSource).not.toContain('dto.subtotal');
  });

  it('provider sub-orders are created as before by service decision and repository writes', () => {
    expect(createOrderSource).toContain('const providerIds = [...new Set(cart.items.map((item) => item.providerId))]');
    expect(createOrderSource).toContain('const providerItems = cart.items.filter((item) => item.providerId === providerId)');
    expect(createOrderSource).toContain('providerSubtotal');
    expect(createOrderSource).toContain('providerDiscount');
    expect(createOrderSource).toContain('ProviderOrderStatus.PENDING');
    expect(createOrderSource).toContain('createProviderSubOrder');
    expect(createOrderSource).toContain('createProviderOrderItem');
  });

  it('stock behavior remains unchanged', () => {
    expect(createOrderSource).toContain('this.assertStock(gift, variant, item.quantity)');
    expect(createOrderSource).toContain('if (item.variantId) await this.customerOrdersRepository.decrementVariantStock');
    expect(createOrderSource).toContain('else await this.customerOrdersRepository.decrementGiftStock');
    expect(repository).toContain('stockQuantity: { decrement: quantity }');
  });

  it('cart is marked checked out as before', () => {
    expect(createOrderSource).toContain('markCartCheckedOut(tx, cart.id)');
    expect(repository).toContain('tx.cartItem.deleteMany({ where: { cartId } })');
    expect(repository).toContain('tx.cart.update({ where: { id: cartId }, data: { status: CartStatus.CHECKED_OUT } })');
  });

  it('COD and placeholder payment method behavior remain unchanged', () => {
    expect(createOrderSource).toContain('payment?.paymentMethod ?? dto.paymentMethod ?? PaymentMethod.COD');
    expect(createOrderSource).toContain('paymentMethod === PaymentMethod.STRIPE_CARD ? OrderStatus.CONFIRMED : OrderStatus.PENDING');
    expect(createOrderSource).toContain('payment?.status ?? PaymentStatus.PENDING');
    expect(createOrderSource).not.toContain('PaymentMethod.PLACEHOLDER');
  });

  it('service keeps order filter normalization and response mapping', () => {
    expect(service).toContain('status: query.status');
    expect(service).toContain('query.fromDate || query.toDate');
    expect(service).toContain('toOrderListItem(order, query.type)');
    expect(service).toContain('toOrder(order)');
    expect(service).toContain(OrderHistoryType.PAYMENTS_SENT);
  });

  it('payment/card secrets are not exposed and provider sub-order formatting remains', () => {
    expect(toOrderSource).toContain('providerOrders: order.providerOrders.map');
    expect(toOrderSource).toContain('subtotal: Number(providerOrder.subtotal)');
    expect(toOrderSource).toContain('total: Number(providerOrder.total)');
    expect(toOrderSource).not.toContain('providerPaymentIntentId');
    expect(toOrderSource).not.toContain('clientSecret');
    expect(toOrderSource).not.toContain('stripe');
  });
});
