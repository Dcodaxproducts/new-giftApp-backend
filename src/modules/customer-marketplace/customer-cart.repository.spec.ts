import { readFileSync } from 'fs';
import { join } from 'path';

describe('Customer cart repository cleanup', () => {
  const service = readFileSync(join(__dirname, 'customer-marketplace.service.ts'), 'utf8');
  const repository = readFileSync(join(__dirname, 'customer-cart.repository.ts'), 'utf8');
  const controller = readFileSync(join(__dirname, 'customer-marketplace.controller.ts'), 'utf8');

  it('keeps customer cart API route stable', () => {
    expect(controller).toContain("@Get('cart')");
    expect(controller).toContain("@ApiTags('05 Customer - Cart')");
    expect(controller).toContain('cart(@CurrentUser() user: AuthUserContext)');
    expect(controller).toContain("@Post('cart/items')");
    expect(controller).toContain("@Patch('cart/items/:id')");
    expect(controller).toContain("@Delete('cart/items/:id')");
    expect(controller).toContain("@Delete('cart')");
  });

  it('repository owns active cart read queries', () => {
    expect(repository).toContain('findActiveCartForUser');
    expect(repository).toContain('findCartItemsForCart');
    expect(repository).toContain('findCartWithItemsForUser');
    expect(repository).toContain('findCartWithItemsById');
    expect(repository).toContain('status: CartStatus.ACTIVE');
    expect(repository).toContain('CUSTOMER_CART_WITH_ITEMS_INCLUDE');
  });

  it('customer can fetch only own active cart through JWT scoping', () => {
    expect(service).toContain('getActiveCart(user.uid)');
    expect(service).toContain('findActiveCartForUser(userId)');
    expect(service).not.toContain('query.userId');
    expect(service).not.toContain('dto.userId');
  });

  it('cart totals remain backend calculated from price snapshots', () => {
    expect(service).toContain('cartSummary(cart.items)');
    expect(service).toContain('unitPriceSnapshot');
    expect(service).toContain('discountAmountSnapshot');
    expect(service).toContain('finalUnitPriceSnapshot');
    expect(service).toContain('lineTotal: Number(item.finalUnitPriceSnapshot) * item.quantity');
  });

  it('variant display, delivery option, and message media mapping remain unchanged', () => {
    const toCartItemSource = service.slice(service.indexOf('private toCartItem'), service.indexOf('private cartSummary'));
    expect(toCartItemSource).toContain('variantName: item.variant?.name ?? null');
    expect(toCartItemSource).toContain('deliveryOption: item.deliveryOption');
    expect(toCartItemSource).toContain('messageMediaUrls: this.stringArray(item.messageMediaUrlsJson)');
    expect(toCartItemSource).toContain('recipient: { contactId: item.recipientContactId');
  });

  it('cart read extraction does not expose provider or admin-only data', () => {
    const toCartItemSource = service.slice(service.indexOf('private toCartItem'), service.indexOf('private cartSummary'));
    expect(toCartItemSource).toContain('providerId: item.providerId');
    expect(toCartItemSource).not.toContain('providerBusinessName');
    expect(toCartItemSource).not.toContain('admin');
    expect(toCartItemSource).not.toContain('costPrice');
  });
});
