import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiExcludeEndpoint, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthUserContext, CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CustomerMarketplaceService } from './customer-marketplace.service';
import { AddCartItemDto, CreateCustomerAddressDto, CreateCustomerReminderDto, CreateOrderDto, CustomerGiftListDto, UpdateCartItemDto, UpdateCustomerAddressDto, UpdateCustomerReminderDto } from './dto/customer-marketplace.dto';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.REGISTERED_USER)
@Controller('customer')
export class CustomerMarketplaceController {
  constructor(private readonly marketplace: CustomerMarketplaceService) {}

  @Get('home')
  @ApiTags('Customer Marketplace')
  @ApiOperation({ summary: 'Fetch customer app home', description: 'REGISTERED_USER only. Returns safe marketplace categories, discounted gifts, default address, and upcoming reminder.' })
  @ApiResponse({ status: 200, description: 'Customer home fetched successfully' })
  home(@CurrentUser() user: AuthUserContext) { return this.marketplace.home(user); }

  @Get('categories')
  @ApiTags('Customer Marketplace')
  @ApiOperation({ summary: 'List customer marketplace categories', description: 'REGISTERED_USER only. Returns active categories that have available approved gifts.' })
  @ApiResponse({ status: 200, description: 'Customer categories fetched successfully' })
  categories() { return this.marketplace.categories(); }

  @Get('gifts/discounted')
  @ApiTags('Customer Marketplace')
  @ApiOperation({ summary: 'List discounted customer gifts', description: 'REGISTERED_USER only. Reuses marketplace gift filters with offerOnly=true.' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 200, description: 'Discounted gifts fetched successfully' })
  discountedGifts(@CurrentUser() user: AuthUserContext, @Query() query: CustomerGiftListDto) { return this.marketplace.discountedGifts(user, query); }

  @Get('gifts/filter-options')
  @ApiTags('Customer Marketplace')
  @ApiOperation({ summary: 'Fetch marketplace gift filter options', description: 'REGISTERED_USER only. Brands are derived from approved active provider business names.' })
  @ApiResponse({ status: 200, description: 'Gift filter options fetched successfully' })
  filterOptions() { return this.marketplace.filterOptions(); }

  @Get('gifts')
  @ApiTags('Customer Marketplace')
  @ApiOperation({ summary: 'List customer marketplace gifts', description: 'REGISTERED_USER only. Only approved, published, active, in-stock gifts from approved active providers are returned. Active offers are calculated by the backend.' })
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
  @ApiResponse({ status: 200, description: 'Customer gifts fetched successfully' })
  gifts(@CurrentUser() user: AuthUserContext, @Query() query: CustomerGiftListDto) { return this.marketplace.gifts(user, query); }

  @Get('gifts/:id')
  @ApiTags('Customer Marketplace')
  @ApiOperation({ summary: 'Fetch customer-safe gift details', description: 'REGISTERED_USER only. Hidden/admin-only gift records are never returned.' })
  @ApiResponse({ status: 200, description: 'Gift details fetched successfully' })
  giftDetails(@CurrentUser() user: AuthUserContext, @Param('id') id: string) { return this.marketplace.giftDetails(user, id); }

  @Get('wishlist')
  @ApiTags('Customer Wishlist')
  @ApiOperation({ summary: 'List wishlist gifts', description: 'REGISTERED_USER only. Returns customer-safe available gifts.' })
  wishlist(@CurrentUser() user: AuthUserContext) { return this.marketplace.wishlist(user); }

  @Post('wishlist/:giftId')
  @ApiTags('Customer Wishlist')
  @ApiOperation({ summary: 'Add gift to wishlist', description: 'REGISTERED_USER only. Gift must be active, approved, published, and in stock. Duplicate wishlist entries are ignored.' })
  addWishlist(@CurrentUser() user: AuthUserContext, @Param('giftId') giftId: string) { return this.marketplace.addWishlist(user, giftId); }

  @Delete('wishlist/:giftId')
  @ApiTags('Customer Wishlist')
  @ApiOperation({ summary: 'Remove gift from wishlist', description: 'REGISTERED_USER only. Removes only the current customer wishlist row.' })
  removeWishlist(@CurrentUser() user: AuthUserContext, @Param('giftId') giftId: string) { return this.marketplace.removeWishlist(user, giftId); }

  @Get('addresses')
  @ApiTags('Customer Addresses')
  @ApiOperation({ summary: 'List customer addresses', description: 'REGISTERED_USER only. Customers can only view their own non-deleted addresses.' })
  addresses(@CurrentUser() user: AuthUserContext) { return this.marketplace.addresses(user); }

  @Post('addresses')
  @ApiTags('Customer Addresses')
  @ApiOperation({ summary: 'Create customer address', description: 'REGISTERED_USER only. Maintains one default address per customer.' })
  @ApiBody({ type: CreateCustomerAddressDto })
  createAddress(@CurrentUser() user: AuthUserContext, @Body() dto: CreateCustomerAddressDto) { return this.marketplace.createAddress(user, dto); }

  @Get('addresses/:id')
  @ApiTags('Customer Addresses')
  @ApiOperation({ summary: 'Fetch customer address', description: 'REGISTERED_USER only. Address must belong to the current customer.' })
  addressDetails(@CurrentUser() user: AuthUserContext, @Param('id') id: string) { return this.marketplace.addressDetails(user, id); }

  @Patch('addresses/:id')
  @ApiTags('Customer Addresses')
  @ApiOperation({ summary: 'Update customer address', description: 'REGISTERED_USER only. Maintains one default address per customer.' })
  @ApiBody({ type: UpdateCustomerAddressDto })
  updateAddress(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Body() dto: UpdateCustomerAddressDto) { return this.marketplace.updateAddress(user, id, dto); }

  @Delete('addresses/:id')
  @ApiTags('Customer Addresses')
  @ApiOperation({ summary: 'Soft-delete customer address', description: 'REGISTERED_USER only. Address is soft deleted and removed from default status.' })
  deleteAddress(@CurrentUser() user: AuthUserContext, @Param('id') id: string) { return this.marketplace.deleteAddress(user, id); }

  @Patch('addresses/:id/default')
  @ApiTags('Customer Addresses')
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
  @ApiTags('Customer Cart')
  @ApiOperation({ summary: 'Fetch active cart', description: 'REGISTERED_USER only. Totals are backend calculated from price snapshots.' })
  cart(@CurrentUser() user: AuthUserContext) { return this.marketplace.cart(user); }

  @Post('cart/items')
  @ApiTags('Customer Cart')
  @ApiOperation({ summary: 'Add item to cart', description: 'REGISTERED_USER only. Backend calculates unit price, active offer discount, final price, subtotal, delivery fee placeholder, and total.' })
  @ApiBody({ type: AddCartItemDto, examples: { sendGift: { value: { giftId: 'cmf0giftroses001', variantId: 'cmf0variant50ml001', quantity: 1, deliveryOption: 'SAME_DAY', recipientContactId: 'cmf0contactmary001', recipientName: 'Sarah Khan', recipientPhone: '+923001234567', recipientAddressId: 'cmf0addresshome001', eventId: 'cmf0eventbirthday001', giftMessage: 'Hope you love this special surprise!', messageMediaUrls: ['https://cdn.yourdomain.com/gift-message-media/photo.png'], scheduledDeliveryAt: '2026-12-24T10:00:00.000Z' } } } })
  addCartItem(@CurrentUser() user: AuthUserContext, @Body() dto: AddCartItemDto) { return this.marketplace.addCartItem(user, dto); }

  @Patch('cart/items/:id')
  @ApiTags('Customer Cart')
  @ApiOperation({ summary: 'Update cart item', description: 'REGISTERED_USER only. Validates ownership through the active customer cart.' })
  @ApiBody({ type: UpdateCartItemDto, examples: { updateSelection: { value: { variantId: 'cmf0variant100ml001', quantity: 2, deliveryOption: 'SCHEDULED', recipientContactId: 'cmf0contactmary001', recipientName: 'Sarah Khan', recipientPhone: '+923001234567', recipientAddressId: 'cmf0addresshome001', eventId: 'cmf0eventbirthday001', giftMessage: 'Updated gift note.', messageMediaUrls: ['https://cdn.yourdomain.com/gift-message-media/video.mp4'], scheduledDeliveryAt: '2026-12-25T10:00:00.000Z' } } } })
  updateCartItem(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Body() dto: UpdateCartItemDto) { return this.marketplace.updateCartItem(user, id, dto); }

  @Delete('cart/items/:id')
  @ApiTags('Customer Cart')
  @ApiOperation({ summary: 'Delete cart item', description: 'REGISTERED_USER only. Deletes only items in the current customer active cart.' })
  deleteCartItem(@CurrentUser() user: AuthUserContext, @Param('id') id: string) { return this.marketplace.deleteCartItem(user, id); }

  @Delete('cart')
  @ApiTags('Customer Cart')
  @ApiOperation({ summary: 'Clear active cart', description: 'REGISTERED_USER only. Removes all items from active cart.' })
  clearCart(@CurrentUser() user: AuthUserContext) { return this.marketplace.clearCart(user); }

  @Post('orders')
  @ApiTags('Customer Orders')
  @ApiOperation({ summary: 'Create order from active cart', description: 'REGISTERED_USER only. Prices are backend-calculated from cart snapshots. Multiple providers are split into provider sub-orders. Payment is COD/placeholder until payment module is ready.' })
  @ApiBody({ type: CreateOrderDto })
  createOrder(@CurrentUser() user: AuthUserContext, @Body() dto: CreateOrderDto) { return this.marketplace.createOrder(user, dto); }

  @Get('orders')
  @ApiTags('Customer Orders')
  @ApiOperation({ summary: 'List customer orders', description: 'REGISTERED_USER only. Returns orders owned by the current customer.' })
  orders(@CurrentUser() user: AuthUserContext) { return this.marketplace.orders(user); }

  @Get('orders/:id')
  @ApiTags('Customer Orders')
  @ApiOperation({ summary: 'Fetch customer order', description: 'REGISTERED_USER only. Order must belong to the current customer.' })
  orderDetails(@CurrentUser() user: AuthUserContext, @Param('id') id: string) { return this.marketplace.orderDetails(user, id); }
}
