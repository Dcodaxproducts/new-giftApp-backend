import { readFileSync } from 'fs';
import { join } from 'path';

describe('Customer cart repository cleanup', () => {
  const service = readFileSync(join(__dirname, 'customer-marketplace.service.ts'), 'utf8');
  const repository = readFileSync(join(__dirname, 'customer-cart.repository.ts'), 'utf8');
  const controller = readFileSync(join(__dirname, 'customer-marketplace.controller.ts'), 'utf8');
  const addCartItemSource = service.slice(service.indexOf('async addCartItem'), service.indexOf('async updateCartItem'));
  const updateCartItemSource = service.slice(service.indexOf('async updateCartItem'), service.indexOf('async deleteCartItem'));
  const deleteCartItemSource = service.slice(service.indexOf('async deleteCartItem'), service.indexOf('async clearCart'));
  const clearCartSource = service.slice(service.indexOf('async clearCart'), service.indexOf('async createOrder'));

  it('keeps customer cart API routes stable', () => {
    expect(controller).toContain("@Get('cart')");
    expect(controller).toContain("@ApiTags('05 Customer - Cart')");
    expect(controller).toContain('cart(@CurrentUser() user: AuthUserContext)');
    expect(controller).toContain("@Post('cart/items')");
    expect(controller).toContain('addCartItem(@CurrentUser() user: AuthUserContext, @Body() dto: AddCartItemDto)');
    expect(controller).toContain("@Patch('cart/items/:id')");
    expect(controller).toContain('updateCartItem(@CurrentUser() user: AuthUserContext, @Param(\'id\') id: string, @Body() dto: UpdateCartItemDto)');
    expect(controller).toContain("@Delete('cart/items/:id')");
    expect(controller).toContain('deleteCartItem(@CurrentUser() user: AuthUserContext, @Param(\'id\') id: string)');
    expect(controller).toContain("@Delete('cart')");
    expect(controller).toContain('clearCart(@CurrentUser() user: AuthUserContext)');
  });

  it('repository owns active cart read queries', () => {
    expect(repository).toContain('findActiveCartForUser');
    expect(repository).toContain('findCartItemsForCart');
    expect(repository).toContain('findCartWithItemsForUser');
    expect(repository).toContain('findCartWithItemsById');
    expect(repository).toContain('status: CartStatus.ACTIVE');
    expect(repository).toContain('CUSTOMER_CART_WITH_ITEMS_INCLUDE');
  });

  it('repository owns cart write queries', () => {
    expect(repository).toContain('findOrCreateActiveCart');
    expect(repository).toContain('findCustomerCartItem');
    expect(repository).toContain('findAddressForUser');
    expect(repository).toContain('findContactForUser');
    expect(repository).toContain('findEventForUser');
    expect(repository).toContain('createCartItem');
    expect(repository).toContain('this.prisma.cartItem.create');
    expect(repository).toContain('updateCartItem');
    expect(repository).toContain('this.prisma.cartItem.update');
    expect(repository).toContain('deleteCartItem');
    expect(repository).toContain('this.prisma.cartItem.delete');
    expect(repository).toContain('clearActiveCart');
    expect(repository).toContain('this.prisma.cartItem.deleteMany');
  });

  it('customer can fetch and mutate only own active cart through JWT scoping', () => {
    expect(service).toContain('getActiveCart(user.uid)');
    expect(service).toContain('findOrCreateActiveCart(userId)');
    expect(repository).toContain('cart: { userId, status: CartStatus.ACTIVE }');
    expect(repository).toContain('where: { id: addressId, userId, deletedAt: null }');
    expect(repository).toContain('where: { id: contactId, userId, deletedAt: null }');
    expect(repository).toContain('where: { id: eventId, userId, deletedAt: null }');
    expect(service).not.toContain('query.userId');
    expect(service).not.toContain('dto.userId');
  });

  it('customer can add visible gift to own cart only after visibility and ownership checks', () => {
    expect(addCartItemSource).toContain('this.getAvailableGift(dto.giftId)');
    expect(addCartItemSource).toContain('this.getCartAddress(user.uid, dto.recipientAddressId)');
    expect(addCartItemSource).toContain('this.getOrCreateActiveCart(user.uid)');
    expect(addCartItemSource).toContain('this.assertCartContact(user.uid, dto.recipientContactId)');
    expect(addCartItemSource).toContain('this.assertCartEvent(user.uid, dto.eventId)');
    expect(addCartItemSource).toContain('this.customerCartRepository.createCartItem');
  });

  it('customer cannot add unavailable gift', () => {
    expect(service).toContain('private async getAvailableGift');
    expect(service).toContain('this.availableGiftWhere()');
    expect(service).toContain("throw new NotFoundException('Gift not found or unavailable')");
    expect(service).toContain('status: GiftStatus.ACTIVE');
    expect(service).toContain('isPublished: true');
  });

  it('variant must belong to gift', () => {
    expect(service).toContain('resolveVariant(gift, dto.variantId)');
    expect(updateCartItemSource).toContain('resolveVariant(gift, dto.variantId ?? item.variantId ?? undefined)');
    expect(service).toContain("throw new BadRequestException('Variant does not belong to gift')");
  });

  it('backend price snapshots are used and frontend price is not trusted', () => {
    expect(addCartItemSource).toContain('const pricing = this.priceSnapshot(gift, offer, variant)');
    expect(updateCartItemSource).toContain('const pricing = this.priceSnapshot(gift, offer, variant)');
    expect(service).toContain('variant?.price ?? gift.price');
    expect(service).toContain('unitPriceSnapshot: pricing.unitPrice');
    expect(service).toContain('discountAmountSnapshot: pricing.discountAmount');
    expect(service).toContain('finalUnitPriceSnapshot: pricing.finalUnitPrice');
    expect(service).not.toContain('dto.unitPrice');
    expect(service).not.toContain('dto.finalUnitPrice');
    expect(service).not.toContain('dto.discountAmount');
  });

  it('customer can update own cart item and cannot update another user cart item', () => {
    expect(updateCartItemSource).toContain('const cart = await this.getActiveCart(user.uid)');
    expect(updateCartItemSource).toContain('cart.items.find((candidate) => candidate.id === id)');
    expect(updateCartItemSource).toContain("throw new NotFoundException('Cart item not found')");
    expect(updateCartItemSource).toContain('this.customerCartRepository.updateCartItem(id');
  });

  it('customer can delete own cart item and cannot delete another user cart item', () => {
    expect(deleteCartItemSource).toContain('const cart = await this.getActiveCart(user.uid)');
    expect(deleteCartItemSource).toContain('cart.items.some((item) => item.id === id)');
    expect(deleteCartItemSource).toContain("throw new NotFoundException('Cart item not found')");
    expect(deleteCartItemSource).toContain('this.customerCartRepository.deleteCartItem(id)');
  });

  it('customer can clear own cart only', () => {
    expect(clearCartSource).toContain('const cart = await this.getActiveCart(user.uid)');
    expect(clearCartSource).toContain('this.customerCartRepository.clearActiveCart(cart.id)');
    expect(repository).toContain('deleteMany({ where: { cartId } })');
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
    expect(addCartItemSource).toContain('messageMediaUrlsJson: dto.messageMediaUrls ?? []');
    expect(updateCartItemSource).toContain('messageMediaUrlsJson: dto.messageMediaUrls');
    expect(toCartItemSource).toContain('recipient: { contactId: item.recipientContactId');
  });

  it('cart read/write extraction does not expose provider or admin-only data', () => {
    const toCartItemSource = service.slice(service.indexOf('private toCartItem'), service.indexOf('private cartSummary'));
    expect(toCartItemSource).toContain('providerId: item.providerId');
    expect(toCartItemSource).not.toContain('providerBusinessName');
    expect(toCartItemSource).not.toContain('admin');
    expect(toCartItemSource).not.toContain('costPrice');
  });
});
