import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiExcludeEndpoint, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthUserContext, CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { CustomerMarketplaceService } from '../services/customer-marketplace.service';
import { AddCartItemDto, CreateCustomerAddressDto, CreateCustomerReminderDto, CreateOrderDto, CustomerGiftListDto, ListCustomerOrdersDto, UpdateCartItemDto, UpdateCustomerAddressDto, UpdateCustomerReminderDto } from '../dto/customer-marketplace.dto';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.REGISTERED_USER)
@Controller('customer')
export class CustomerMarketplaceController {
  constructor(private readonly marketplace: CustomerMarketplaceService) {}

  @Get('home')
  @ApiTags('05 Customer - Marketplace')
  @ApiOperation({ summary: 'Fetch customer app home', description: 'REGISTERED_USER only. Returns personalized marketplace fields such as wishlist state, default address, and upcoming reminders where applicable.' })
  @ApiResponse({ status: 200, description: 'Customer home fetched successfully' })
  home(@CurrentUser() user: AuthUserContext) { return this.marketplace.home(user); }

  @Get('categories')
  @ApiTags('05 Customer - Marketplace')
  @ApiOperation({ summary: 'List customer marketplace categories', description: 'REGISTERED_USER only. Lists customer-visible marketplace categories.' })
  @ApiResponse({ status: 200, description: 'Customer categories fetched successfully' })
  categories(@CurrentUser() user: AuthUserContext) { return this.marketplace.categories(user); }

  @Get('gifts/discounted')
  @ApiTags('05 Customer - Marketplace')
  @ApiOperation({ summary: 'List discounted customer gifts', description: 'REGISTERED_USER only. Discounted gift cards include customer wishlist state.' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 200, description: 'Discounted gifts fetched successfully' })
  discountedGifts(@CurrentUser() user: AuthUserContext, @Query() query: CustomerGiftListDto) { return this.marketplace.discountedGifts(user, query); }

  @Get('gifts/filter-options')
  @ApiTags('05 Customer - Marketplace')
  @ApiOperation({ summary: 'Fetch marketplace gift filter options', description: 'REGISTERED_USER only. Returns available marketplace filters.' })
  @ApiResponse({ status: 200, description: 'Gift filter options fetched successfully' })
  filterOptions(@CurrentUser() user: AuthUserContext) { return this.marketplace.filterOptions(user); }

  @Get('gifts')
  @ApiTags('05 Customer - Marketplace')
  @ApiOperation({ summary: 'List customer marketplace gifts', description: 'REGISTERED_USER only. Gift cards include customer wishlist state.' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'categorySlug', required: false })
  @ApiQuery({ name: 'providerId', required: false })
  @ApiQuery({ name: 'offerOnly', required: false })
  @ApiQuery({ name: 'minPrice', required: false })
  @ApiQuery({ name: 'maxPrice', required: false })
  @ApiQuery({ name: 'minRating', required: false })
  @ApiQuery({ name: 'brand', required: false })
  @ApiQuery({ name: 'sortBy', required: false })
  @ApiResponse({ status: 200, description: 'Customer gifts fetched successfully', schema: { example: { success: true, data: [{ id: 'gift_id', name: 'Luxury Perfume', price: 99.99, currency: 'USD', imageUrl: 'https://cdn.yourdomain.com/gift-images/perfume.png', rating: 4.6, isWishlisted: false, reviewCount: 24, category: { id: 'gift_category_id', name: 'Perfumes', slug: 'perfumes' }, provider: { id: 'provider_id', businessName: 'Dcodax Gifts' }, activeOffer: null }], meta: { page: 1, limit: 10, total: 1, totalPages: 1 }, message: 'Customer gifts fetched successfully' } } })
  gifts(@CurrentUser() user: AuthUserContext, @Query() query: CustomerGiftListDto) { return this.marketplace.gifts(user, query); }

  @Get('gifts/:id')
  @ApiTags('05 Customer - Marketplace')
  @ApiOperation({ summary: 'Fetch customer-safe gift details', description: 'REGISTERED_USER only. Gift details include customer wishlist state.' })
  @ApiResponse({ status: 200, description: 'Gift details fetched successfully', schema: { example: { success: true, data: { id: 'gift_id', name: 'Luxury Perfume', description: 'Long-lasting premium fragrance.', price: 99.99, originalPrice: 99.99, currency: 'USD', imageUrls: ['https://cdn.yourdomain.com/gift-images/perfume.png'], rating: 4.6, reviewCount: 24, isWishlisted: false, badges: ['AUTHENTIC'], category: { id: 'gift_category_id', name: 'Perfumes', slug: 'perfumes' }, provider: { id: 'provider_id', businessName: 'Dcodax Gifts', rating: 4.6, reviewCount: 24, fulfillmentMethods: ['DELIVERY'] }, variants: [{ id: 'variant_id', name: '50ml', price: 129.99 }], activeOffer: null }, message: 'Gift details fetched successfully' } } })
  giftDetails(@CurrentUser() user: AuthUserContext, @Param('id') id: string) { return this.marketplace.giftDetails(user, id); }

  @Roles(UserRole.REGISTERED_USER)
  @Get('wishlist')
  @ApiTags('05 Customer - Wishlist')
  @ApiOperation({ summary: 'List wishlist gifts', description: 'REGISTERED_USER only. Returns customer-visible ACTIVE gifts owned by an approved active provider.' })
  wishlist(@CurrentUser() user: AuthUserContext) { return this.marketplace.wishlist(user); }

  @Roles(UserRole.REGISTERED_USER)
  @Post('wishlist/:giftId')
  @ApiTags('05 Customer - Wishlist')
  @ApiOperation({ summary: 'Add gift to wishlist', description: 'REGISTERED_USER only. Gift must be customer-visible: ACTIVE, published, not deleted, and owned by an approved active provider. Duplicate wishlist entries are ignored.' })
  addWishlist(@CurrentUser() user: AuthUserContext, @Param('giftId') giftId: string) { return this.marketplace.addWishlist(user, giftId); }

  @Roles(UserRole.REGISTERED_USER)
  @Delete('wishlist/:giftId')
  @ApiTags('05 Customer - Wishlist')
  @ApiOperation({ summary: 'Remove gift from wishlist', description: 'REGISTERED_USER only. Removes only the current customer wishlist row.' })
  removeWishlist(@CurrentUser() user: AuthUserContext, @Param('giftId') giftId: string) { return this.marketplace.removeWishlist(user, giftId); }

  @Roles(UserRole.REGISTERED_USER)
  @Get('addresses')
  @ApiTags('05 Customer - Addresses')
  @ApiOperation({ summary: 'List customer addresses', description: 'REGISTERED_USER only. Customers can only view their own non-deleted addresses.' })
  addresses(@CurrentUser() user: AuthUserContext) { return this.marketplace.addresses(user); }

  @Roles(UserRole.REGISTERED_USER)
  @Post('addresses')
  @ApiTags('05 Customer - Addresses')
  @ApiOperation({ summary: 'Create customer address', description: 'REGISTERED_USER only. Maintains one default address per customer.' })
  @ApiBody({ type: CreateCustomerAddressDto })
  createAddress(@CurrentUser() user: AuthUserContext, @Body() dto: CreateCustomerAddressDto) { return this.marketplace.createAddress(user, dto); }

  @Roles(UserRole.REGISTERED_USER)
  @Get('addresses/:id')
  @ApiTags('05 Customer - Addresses')
  @ApiOperation({ summary: 'Fetch customer address', description: 'REGISTERED_USER only. Address must belong to the current customer.' })
  addressDetails(@CurrentUser() user: AuthUserContext, @Param('id') id: string) { return this.marketplace.addressDetails(user, id); }

  @Roles(UserRole.REGISTERED_USER)
  @Patch('addresses/:id')
  @ApiTags('05 Customer - Addresses')
  @ApiOperation({ summary: 'Update customer address', description: 'REGISTERED_USER only. Maintains one default address per customer.' })
  @ApiBody({ type: UpdateCustomerAddressDto })
  updateAddress(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Body() dto: UpdateCustomerAddressDto) { return this.marketplace.updateAddress(user, id, dto); }

  @Roles(UserRole.REGISTERED_USER)
  @Delete('addresses/:id')
  @ApiTags('05 Customer - Addresses')
  @ApiOperation({ summary: 'Delete customer address', description: 'REGISTERED_USER only. Permanently deletes the address and removes default status.' })
  deleteAddress(@CurrentUser() user: AuthUserContext, @Param('id') id: string) { return this.marketplace.deleteAddress(user, id); }

  @Roles(UserRole.REGISTERED_USER)
  @Patch('addresses/:id/default')
  @ApiTags('05 Customer - Addresses')
  @ApiOperation({ summary: 'Set default customer address', description: 'REGISTERED_USER only. Clears default flag from all other customer addresses.' })
  setDefaultAddress(@CurrentUser() user: AuthUserContext, @Param('id') id: string) { return this.marketplace.setDefaultAddress(user, id); }

  @Roles(UserRole.REGISTERED_USER)
  @Get('reminders')
  @ApiExcludeEndpoint()
  reminders(@CurrentUser() user: AuthUserContext) { return this.marketplace.reminders(user); }

  @Roles(UserRole.REGISTERED_USER)
  @Post('reminders')
  @ApiExcludeEndpoint()
  createReminder(@CurrentUser() user: AuthUserContext, @Body() dto: CreateCustomerReminderDto) { return this.marketplace.createReminder(user, dto); }

  @Roles(UserRole.REGISTERED_USER)
  @Get('reminders/:id')
  @ApiExcludeEndpoint()
  reminderDetails(@CurrentUser() user: AuthUserContext, @Param('id') id: string) { return this.marketplace.reminderDetails(user, id); }

  @Roles(UserRole.REGISTERED_USER)
  @Patch('reminders/:id')
  @ApiExcludeEndpoint()
  updateReminder(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Body() dto: UpdateCustomerReminderDto) { return this.marketplace.updateReminder(user, id, dto); }

  @Roles(UserRole.REGISTERED_USER)
  @Delete('reminders/:id')
  @ApiExcludeEndpoint()
  deleteReminder(@CurrentUser() user: AuthUserContext, @Param('id') id: string) { return this.marketplace.deleteReminder(user, id); }

  @Roles(UserRole.REGISTERED_USER)
  @Get('cart')
  @ApiTags('05 Customer - Cart')
  @ApiOperation({ summary: 'Fetch active cart', description: 'REGISTERED_USER only. Returns cart items with gift info.' })
  @ApiResponse({ status: 200, description: 'Cart fetched successfully', schema: { example: { success: true, data: { id: 'cart_id', items: [{ id: 'cart_item_id', giftId: 'gift_id', name: 'Luxury Perfume', quantity: 1, imageUrl: 'https://cdn.yourdomain.com/gift-images/perfume.png', createdAt: '2026-06-01T12:00:00.000Z', updatedAt: '2026-06-01T12:00:00.000Z' }], itemCount: 1 }, message: 'Cart fetched successfully' } } })
  cart(@CurrentUser() user: AuthUserContext) { return this.marketplace.cart(user); }

  @Roles(UserRole.REGISTERED_USER)
  @Post('cart/items')
  @ApiTags('05 Customer - Cart')
  @ApiOperation({ summary: 'Add item to cart', description: 'REGISTERED_USER only. All cart items must belong to the same provider.' })
  @ApiBody({ type: AddCartItemDto, examples: { withoutVariant: { summary: 'Add gift without variant', value: { giftId: 'cmf0giftroses001', quantity: 1 } }, withVariant: { summary: 'Add gift with variant', value: { giftId: 'cmf0giftroses001', variantId: 'variant_50ml', quantity: 1 } } } })
  addCartItem(@CurrentUser() user: AuthUserContext, @Body() dto: AddCartItemDto) { return this.marketplace.addCartItem(user, dto); }

  @Roles(UserRole.REGISTERED_USER)
  @Patch('cart/items/:id')
  @ApiTags('05 Customer - Cart')
  @ApiOperation({ summary: 'Update cart item', description: 'REGISTERED_USER only. Validates ownership through the active customer cart.' })
  @ApiBody({ type: UpdateCartItemDto, examples: { updateQuantity: { value: { quantity: 2 } } } })
  updateCartItem(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Body() dto: UpdateCartItemDto) { return this.marketplace.updateCartItem(user, id, dto); }

  @Roles(UserRole.REGISTERED_USER)
  @Delete('cart/items/:id')
  @ApiTags('05 Customer - Cart')
  @ApiOperation({ summary: 'Delete cart item', description: 'REGISTERED_USER only. Deletes only items in the current customer active cart.' })
  deleteCartItem(@CurrentUser() user: AuthUserContext, @Param('id') id: string) { return this.marketplace.deleteCartItem(user, id); }

  @Roles(UserRole.REGISTERED_USER)
  @Delete('cart')
  @ApiTags('05 Customer - Cart')
  @ApiOperation({ summary: 'Clear active cart', description: 'REGISTERED_USER only. Removes all items from active cart.' })
  clearCart(@CurrentUser() user: AuthUserContext) { return this.marketplace.clearCart(user); }

  @Roles(UserRole.REGISTERED_USER)
  @Post('orders')
  @ApiTags('05 Customer - Orders')
  @ApiOperation({ summary: 'Create order from active cart', description: 'REGISTERED_USER only. Creates an order from cart items. All items must be from the same provider. Platform fee is calculated automatically.' })
  @ApiBody({ type: CreateOrderDto, examples: { checkout: { summary: 'Standard checkout', value: { recipientName: 'Sarah Khan', recipientPhone: '+923001234567', recipientAddress: 'House 12, Street 4, F-8/2, Islamabad', giftMessage: 'Hope you love this special surprise!', mediaAttachments: ['https://cdn.yourdomain.com/gift-message-media/photo.png'] } } } })
  createOrder(@CurrentUser() user: AuthUserContext, @Body() dto: CreateOrderDto) { return this.marketplace.createOrder(user, dto); }

  @Roles(UserRole.REGISTERED_USER)
  @Get('orders')
  @ApiTags('05 Customer - Orders')
  @ApiOperation({ summary: 'List customer orders', description: 'REGISTERED_USER only. Returns orders owned by the current customer.' })
  orders(@CurrentUser() user: AuthUserContext, @Query() query: ListCustomerOrdersDto) { return this.marketplace.orders(user, query); }

  @Roles(UserRole.REGISTERED_USER)
  @Post('orders/:id/cancel')
  @ApiTags('05 Customer - Orders')
  @ApiOperation({ summary: 'Cancel order', description: 'REGISTERED_USER only. Order can be cancelled when status is ACCEPTED or PROCESSING. Cancellation deduction percentage is applied per admin policy.' })
  cancelOrder(@CurrentUser() user: AuthUserContext, @Param('id') id: string) { return this.marketplace.cancelOrder(user, id); }

  @Get('orders/:id')
  @ApiTags('05 Customer - Orders')
  @ApiOperation({ summary: 'Fetch customer order', description: 'REGISTERED_USER only. Order must belong to the current customer.' })
  @ApiResponse({ status: 200, description: 'Order fetched successfully.', schema: { example: { success: true, data: { id: 'order_id', orderNumber: 'ORD-1760000000000', status: 'PENDING', recipient: { name: 'Sarah Khan', phone: '+923001234567', address: 'House 12, Street 4, F-8/2, Islamabad' }, occasion: null, giftMessage: 'Hope you love this special surprise!', mediaAttachments: ['https://cdn.yourdomain.com/gift-message-media/photo.png'], items: [{ giftId: 'gift_id', name: 'Luxury Perfume', quantity: 1, imageUrl: 'https://cdn.yourdomain.com/gift-images/perfume.png', unitPrice: 99.99 }], summary: { subtotal: 99.99, platformFee: 5, total: 104.99 }, isGroupGift: false }, message: 'Order fetched successfully.' } } })
  orderDetails(@CurrentUser() user: AuthUserContext, @Param('id') id: string) { return this.marketplace.orderDetails(user, id); }
}
