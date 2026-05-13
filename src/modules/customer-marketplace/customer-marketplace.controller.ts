import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiExcludeEndpoint, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthUserContext, CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CustomerMarketplaceService } from './customer-marketplace.service';
import { AddCartItemDto, CreateCustomerAddressDto, CreateCustomerReminderDto, CreateOrderDto, CustomerGiftListDto, ListCustomerOrdersDto, UpdateCartItemDto, UpdateCustomerAddressDto, UpdateCustomerReminderDto } from './dto/customer-marketplace.dto';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.REGISTERED_USER)
@Controller('customer')
export class CustomerMarketplaceController {
  constructor(private readonly marketplace: CustomerMarketplaceService) {}

  @Get('home')
  @ApiTags('05 Customer - Marketplace')
  @ApiOperation({ summary: 'Fetch customer app home', description: 'REGISTERED_USER only. Returns safe marketplace categories, discounted gifts, default address, and upcoming reminder.' })
  @ApiResponse({ status: 200, description: 'Customer home fetched successfully' })
  home(@CurrentUser() user: AuthUserContext) { return this.marketplace.home(user); }

  @Get('categories')
  @ApiTags('05 Customer - Marketplace')
  @ApiOperation({ summary: 'List customer marketplace categories', description: 'REGISTERED_USER only. Returns active categories that have active, available, in-stock gifts from approved active providers.' })
  @ApiResponse({ status: 200, description: 'Customer categories fetched successfully' })
  categories() { return this.marketplace.categories(); }

  @Get('gifts/discounted')
  @ApiTags('05 Customer - Marketplace')
  @ApiOperation({ summary: 'List discounted customer gifts', description: 'REGISTERED_USER only. Reuses marketplace gift filters with offerOnly=true.' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 200, description: 'Discounted gifts fetched successfully' })
  discountedGifts(@CurrentUser() user: AuthUserContext, @Query() query: CustomerGiftListDto) { return this.marketplace.discountedGifts(user, query); }

  @Get('gifts/filter-options')
  @ApiTags('05 Customer - Marketplace')
  @ApiOperation({ summary: 'Fetch marketplace gift filter options', description: 'REGISTERED_USER only. Brands are derived from approved active provider business names.' })
  @ApiResponse({ status: 200, description: 'Gift filter options fetched successfully' })
  filterOptions() { return this.marketplace.filterOptions(); }

  @Get('gifts')
  @ApiTags('05 Customer - Marketplace')
  @ApiOperation({ summary: 'List customer marketplace gifts', description: 'REGISTERED_USER only. Returns active, available, in-stock gifts from approved active providers. Provider inventory does not require separate gift moderation approval. Active offers are calculated by the backend.' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'categorySlug', required: false })
  @ApiQuery({ name: 'providerId', required: false })
  @ApiQuery({ name: 'offerOnly', required: false })
  @ApiQuery({ name: 'minPrice', required: false })
  @ApiQuery({ name: 'maxPrice', required: false })
  @ApiQuery({ name: 'minRating', required: false })
  @ApiQuery({ name: 'brand', required: false })
  @ApiQuery({ name: 'deliveryOption', required: false })
  @ApiQuery({ name: 'sortBy', required: false })
  @ApiResponse({ status: 200, description: 'Customer gifts fetched successfully', schema: { example: { success: true, data: [{ id: 'gift_id', name: 'Luxury Perfume', price: 99.99, currency: 'PKR', imageUrl: 'https://cdn.yourdomain.com/gift-images/perfume.png', rating: 4.8, isWishlisted: false, shortDescription: 'Premium fragrance gift.', reviewCount: 0, stockQuantity: 50, category: { id: 'gift_category_id', name: 'Perfumes', slug: 'perfumes' }, provider: { id: 'provider_id', businessName: 'Dcodax Gifts' }, deliveryOptions: ['SAME_DAY', 'NEXT_DAY', 'SCHEDULED'], activeOffer: null }], meta: { page: 1, limit: 20, total: 1, totalPages: 1 }, message: 'Customer gifts fetched successfully' } } })
  gifts(@CurrentUser() user: AuthUserContext, @Query() query: CustomerGiftListDto) { return this.marketplace.gifts(user, query); }

  @Get('gifts/:id')
  @ApiTags('05 Customer - Marketplace')
  @ApiOperation({ summary: 'Fetch customer-safe gift details', description: 'REGISTERED_USER only. Hidden/admin-only gift records are never returned. Provider inventory does not require separate gift moderation approval.' })
  @ApiResponse({ status: 200, description: 'Gift details fetched successfully', schema: { example: { success: true, data: { id: 'gift_id', name: 'Luxury Perfume', description: 'Long-lasting premium fragrance.', shortDescription: 'Premium fragrance gift.', price: 99.99, originalPrice: 99.99, currency: 'PKR', imageUrls: ['https://cdn.yourdomain.com/gift-images/perfume.png'], rating: 4.8, reviewCount: 0, stockQuantity: 50, sku: 'PERFUME-001', isWishlisted: false, badges: ['AUTHENTIC'], category: { id: 'gift_category_id', name: 'Perfumes', slug: 'perfumes' }, provider: { id: 'provider_id', businessName: 'Dcodax Gifts', rating: 4.8, reviewCount: 0, fulfillmentMethods: ['DELIVERY'] }, variants: [{ id: 'variant_id', name: '50ml', price: 129.99, originalPrice: 159.99, stockQuantity: 20, sku: 'PERFUME-50ML', isPopular: true, isDefault: true }], deliveryOptions: ['SAME_DAY', 'NEXT_DAY', 'SCHEDULED'], activeOffer: null }, message: 'Gift details fetched successfully' } } })
  giftDetails(@CurrentUser() user: AuthUserContext, @Param('id') id: string) { return this.marketplace.giftDetails(user, id); }

  @Get('wishlist')
  @ApiTags('05 Customer - Wishlist')
  @ApiOperation({ summary: 'List wishlist gifts', description: 'REGISTERED_USER only. Returns customer-visible gifts: active, available, in stock, not deleted, and owned by an approved active provider. Admin-created gifts may additionally require isPublished=true.' })
  wishlist(@CurrentUser() user: AuthUserContext) { return this.marketplace.wishlist(user); }

  @Post('wishlist/:giftId')
  @ApiTags('05 Customer - Wishlist')
  @ApiOperation({ summary: 'Add gift to wishlist', description: 'REGISTERED_USER only. Gift must be customer-visible: active, available, in stock, not deleted, and owned by an approved active provider. Admin-created gifts may additionally require isPublished=true. Duplicate wishlist entries are ignored.' })
  addWishlist(@CurrentUser() user: AuthUserContext, @Param('giftId') giftId: string) { return this.marketplace.addWishlist(user, giftId); }

  @Delete('wishlist/:giftId')
  @ApiTags('05 Customer - Wishlist')
  @ApiOperation({ summary: 'Remove gift from wishlist', description: 'REGISTERED_USER only. Removes only the current customer wishlist row.' })
  removeWishlist(@CurrentUser() user: AuthUserContext, @Param('giftId') giftId: string) { return this.marketplace.removeWishlist(user, giftId); }

  @Get('addresses')
  @ApiTags('05 Customer - Addresses')
  @ApiOperation({ summary: 'List customer addresses', description: 'REGISTERED_USER only. Customers can only view their own non-deleted addresses.' })
  addresses(@CurrentUser() user: AuthUserContext) { return this.marketplace.addresses(user); }

  @Post('addresses')
  @ApiTags('05 Customer - Addresses')
  @ApiOperation({ summary: 'Create customer address', description: 'REGISTERED_USER only. Maintains one default address per customer.' })
  @ApiBody({ type: CreateCustomerAddressDto })
  createAddress(@CurrentUser() user: AuthUserContext, @Body() dto: CreateCustomerAddressDto) { return this.marketplace.createAddress(user, dto); }

  @Get('addresses/:id')
  @ApiTags('05 Customer - Addresses')
  @ApiOperation({ summary: 'Fetch customer address', description: 'REGISTERED_USER only. Address must belong to the current customer.' })
  addressDetails(@CurrentUser() user: AuthUserContext, @Param('id') id: string) { return this.marketplace.addressDetails(user, id); }

  @Patch('addresses/:id')
  @ApiTags('05 Customer - Addresses')
  @ApiOperation({ summary: 'Update customer address', description: 'REGISTERED_USER only. Maintains one default address per customer.' })
  @ApiBody({ type: UpdateCustomerAddressDto })
  updateAddress(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Body() dto: UpdateCustomerAddressDto) { return this.marketplace.updateAddress(user, id, dto); }

  @Delete('addresses/:id')
  @ApiTags('05 Customer - Addresses')
  @ApiOperation({ summary: 'Delete customer address', description: 'REGISTERED_USER only. Permanently deletes the address and removes default status.' })
  deleteAddress(@CurrentUser() user: AuthUserContext, @Param('id') id: string) { return this.marketplace.deleteAddress(user, id); }

  @Patch('addresses/:id/default')
  @ApiTags('05 Customer - Addresses')
  @ApiOperation({ summary: 'Set default customer address', description: 'REGISTERED_USER only. Clears default flag from all other customer addresses.' })
  setDefaultAddress(@CurrentUser() user: AuthUserContext, @Param('id') id: string) { return this.marketplace.setDefaultAddress(user, id); }

  @Get('reminders')
  @ApiExcludeEndpoint()
  reminders(@CurrentUser() user: AuthUserContext) { return this.marketplace.reminders(user); }

  @Post('reminders')
  @ApiExcludeEndpoint()
  createReminder(@CurrentUser() user: AuthUserContext, @Body() dto: CreateCustomerReminderDto) { return this.marketplace.createReminder(user, dto); }

  @Get('reminders/:id')
  @ApiExcludeEndpoint()
  reminderDetails(@CurrentUser() user: AuthUserContext, @Param('id') id: string) { return this.marketplace.reminderDetails(user, id); }

  @Patch('reminders/:id')
  @ApiExcludeEndpoint()
  updateReminder(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Body() dto: UpdateCustomerReminderDto) { return this.marketplace.updateReminder(user, id, dto); }

  @Delete('reminders/:id')
  @ApiExcludeEndpoint()
  deleteReminder(@CurrentUser() user: AuthUserContext, @Param('id') id: string) { return this.marketplace.deleteReminder(user, id); }

  @Get('cart')
  @ApiTags('05 Customer - Cart')
  @ApiOperation({ summary: 'Fetch active cart', description: 'REGISTERED_USER only. Totals are backend calculated from price snapshots.' })
  @ApiResponse({ status: 200, description: 'Cart fetched successfully', schema: { example: { success: true, data: { id: 'cart_id', status: 'ACTIVE', items: [{ id: 'cart_item_id', giftId: 'gift_id', variantId: 'variant_id', name: 'Luxury Perfume', variantName: '50ml', quantity: 1, unitPrice: 129.99, discountAmount: 20, finalUnitPrice: 109.99, lineTotal: 109.99, imageUrl: 'https://cdn.yourdomain.com/gift-images/perfume.png', deliveryOption: 'SAME_DAY', recipient: { contactId: 'contact_id', name: 'Sarah Khan', phone: '+923001234567', addressId: 'address_id' }, giftMessage: 'Hope you love this special surprise!', messageMediaUrls: ['https://cdn.yourdomain.com/gift-message-media/photo.png'], scheduledDeliveryAt: '2026-12-24T10:00:00.000Z' }], summary: { subtotal: 129.99, discountTotal: 20, deliveryFee: 0, tax: 0, total: 109.99, currency: 'PKR' } }, message: 'Cart fetched successfully' } } })
  cart(@CurrentUser() user: AuthUserContext) { return this.marketplace.cart(user); }

  @Post('cart/items')
  @ApiTags('05 Customer - Cart')
  @ApiOperation({ summary: 'Add item to cart', description: 'REGISTERED_USER only. Backend calculates unit price, active offer discount, final price, subtotal, delivery fee placeholder, and total.' })
  @ApiBody({ type: AddCartItemDto, examples: { sendGift: { value: { giftId: 'cmf0giftroses001', variantId: 'cmf0variant50ml001', quantity: 1, deliveryOption: 'SAME_DAY', recipientContactId: 'cmf0contactmary001', recipientName: 'Sarah Khan', recipientPhone: '+923001234567', recipientAddressId: 'cmf0addresshome001', eventId: 'cmf0eventbirthday001', giftMessage: 'Hope you love this special surprise!', messageMediaUrls: ['https://cdn.yourdomain.com/gift-message-media/photo.png'], scheduledDeliveryAt: '2026-12-24T10:00:00.000Z' } } } })
  addCartItem(@CurrentUser() user: AuthUserContext, @Body() dto: AddCartItemDto) { return this.marketplace.addCartItem(user, dto); }

  @Patch('cart/items/:id')
  @ApiTags('05 Customer - Cart')
  @ApiOperation({ summary: 'Update cart item', description: 'REGISTERED_USER only. Validates ownership through the active customer cart.' })
  @ApiBody({ type: UpdateCartItemDto, examples: { updateSelection: { value: { variantId: 'cmf0variant100ml001', quantity: 2, deliveryOption: 'SCHEDULED', recipientContactId: 'cmf0contactmary001', recipientName: 'Sarah Khan', recipientPhone: '+923001234567', recipientAddressId: 'cmf0addresshome001', eventId: 'cmf0eventbirthday001', giftMessage: 'Updated gift note.', messageMediaUrls: ['https://cdn.yourdomain.com/gift-message-media/video.mp4'], scheduledDeliveryAt: '2026-12-25T10:00:00.000Z' } } } })
  updateCartItem(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Body() dto: UpdateCartItemDto) { return this.marketplace.updateCartItem(user, id, dto); }

  @Delete('cart/items/:id')
  @ApiTags('05 Customer - Cart')
  @ApiOperation({ summary: 'Delete cart item', description: 'REGISTERED_USER only. Deletes only items in the current customer active cart.' })
  deleteCartItem(@CurrentUser() user: AuthUserContext, @Param('id') id: string) { return this.marketplace.deleteCartItem(user, id); }

  @Delete('cart')
  @ApiTags('05 Customer - Cart')
  @ApiOperation({ summary: 'Clear active cart', description: 'REGISTERED_USER only. Removes all items from active cart.' })
  clearCart(@CurrentUser() user: AuthUserContext) { return this.marketplace.clearCart(user); }

  @Post('orders')
  @ApiTags('05 Customer - Orders')
  @ApiOperation({ summary: 'Create order from active cart', description: 'REGISTERED_USER only. Prices are backend-calculated from cart/payment snapshots. STRIPE_CARD requires a successful owned paymentId; COD stays pending; PLACEHOLDER is for development only. Multiple providers are split into provider sub-orders.' })
  @ApiBody({ type: CreateOrderDto, examples: { stripeCard: { summary: 'Stripe card checkout', value: { cartId: 'cart_id', paymentId: 'payment_id', deliveryAddressId: 'address_id', paymentMethod: 'STRIPE_CARD' } }, cod: { summary: 'Cash on delivery checkout', value: { cartId: 'cart_id', deliveryAddressId: 'address_id', paymentMethod: 'COD' } } } })
  createOrder(@CurrentUser() user: AuthUserContext, @Body() dto: CreateOrderDto) { return this.marketplace.createOrder(user, dto); }

  @Get('orders')
  @ApiTags('05 Customer - Orders')
  @ApiOperation({ summary: 'List customer orders', description: 'REGISTERED_USER only. Returns orders owned by the current customer.' })
  orders(@CurrentUser() user: AuthUserContext, @Query() query: ListCustomerOrdersDto) { return this.marketplace.orders(user, query); }

  @Get('orders/:id')
  @ApiTags('05 Customer - Orders')
  @ApiOperation({ summary: 'Fetch customer order', description: 'REGISTERED_USER only. Order must belong to the current customer.' })
  @ApiResponse({ status: 200, description: 'Order fetched successfully.', schema: { example: { success: true, data: { id: 'order_id', orderNumber: 'ORD-1760000000000', status: 'CONFIRMED', paymentStatus: 'SUCCEEDED', paymentMethod: 'STRIPE_CARD', recipient: { name: 'Sarah Khan', email: null, phone: '+923001234567', avatarUrl: null }, deliveryDate: '2026-12-24T10:00:00.000Z', occasion: null, giftMessage: 'Hope you love this special surprise!', items: [{ giftId: 'gift_id', name: 'Luxury Perfume', variantName: '50ml', quantity: 1, imageUrl: 'https://cdn.yourdomain.com/gift-images/perfume.png', total: 109.99 }], summary: { subtotal: 129.99, discountTotal: 20, deliveryFee: 0, tax: 0, total: 109.99, currency: 'PKR' } }, message: 'Order fetched successfully.' } } })
  orderDetails(@CurrentUser() user: AuthUserContext, @Param('id') id: string) { return this.marketplace.orderDetails(user, id); }
}
