import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  CartStatus,
  CustomerAddress,
  CustomerDeliveryOption,
  CustomerReminder,
  GiftStatus,
  NotificationRecipientType,
  OrderStatus,
  ProviderOrderStatus,
  PaymentMethod,
  PaymentStatus,
  Prisma,
  PromotionalOfferApprovalStatus,
  PromotionalOfferDiscountType,
  UserRole,
  ProviderApprovalStatus,
} from '@prisma/client';
import { AuthUserContext } from '../../../common/decorators/current-user.decorator';
import { CustomerCartRepository } from '../repositories/customer-cart.repository';
import { CUSTOMER_ORDER_INCLUDE, CustomerOrdersRepository } from '../repositories/customer-orders.repository';
import { CustomerMarketplaceRepository } from '../repositories/customer-marketplace.repository';
import {
  AddCartItemDto,
  CreateCustomerAddressDto,
  CreateCustomerReminderDto,
  CreateOrderDto,
  CustomerGiftListDto,
  CustomerGiftSortBy,
  ListCustomerOrdersDto,
  OrderHistoryType,
  UpdateCartItemDto,
  UpdateCustomerAddressDto,
  UpdateCustomerReminderDto,
} from '../dto/customer-marketplace.dto';

type CategoryView = { id: string; name: string; slug: string; color: string | null; backgroundColor: string | null; imageUrl: string | null };
type ProviderView = { id: string; providerBusinessName: string | null; firstName: string; lastName: string; providerFulfillmentMethods: Prisma.JsonValue };
type OfferView = { id: string; title: string; discountType: PromotionalOfferDiscountType; discountValue: Prisma.Decimal; startDate: Date; endDate: Date | null };
type GiftVariantView = { id: string; name: string; price: Prisma.Decimal; originalPrice: Prisma.Decimal | null; stockQuantity: number; sku: string | null; isPopular: boolean; isDefault: boolean; sortOrder: number; isActive: boolean; deletedAt?: Date | null };
type GiftView = {
  id: string; name: string; description: string | null; shortDescription: string | null; price: Prisma.Decimal; currency: string; imageUrls: Prisma.JsonValue;
  ratingPlaceholder: Prisma.Decimal; stockQuantity: number; sku: string | null; category: CategoryView; provider: ProviderView; promotionalOffers: OfferView[]; variants: GiftVariantView[]; createdAt: Date;
};
type CartItemView = {
  id: string; giftId: string; providerId: string; quantity: number; unitPriceSnapshot: Prisma.Decimal; discountAmountSnapshot: Prisma.Decimal; finalUnitPriceSnapshot: Prisma.Decimal;
  promotionalOfferId: string | null; deliveryOption: CustomerDeliveryOption; variantId: string | null; recipientContactId: string | null; recipientName: string; recipientPhone: string; recipientAddressId: string; eventId: string | null; giftMessage: string | null; messageMediaUrlsJson: Prisma.JsonValue; scheduledDeliveryAt: Date | null; createdAt: Date; updatedAt: Date;
  gift: { id: string; name: string; imageUrls: Prisma.JsonValue; currency: string };
  variant: { id: string; name: string } | null;
};

type CartView = { id: string; userId: string; status: CartStatus; items: CartItemView[]; createdAt: Date; updatedAt: Date };
type OrderView = Prisma.OrderGetPayload<{ include: typeof CUSTOMER_ORDER_INCLUDE }>;

@Injectable()
export class CustomerMarketplaceService {
  constructor(
    private readonly customerCartRepository: CustomerCartRepository,
    private readonly customerOrdersRepository: CustomerOrdersRepository,
    private readonly customerMarketplaceRepository: CustomerMarketplaceRepository,
  ) {}

  async home(user: AuthUserContext) {
    const [defaultAddress, upcomingReminder, categories, discounted] = await this.customerMarketplaceRepository.findCustomerHomeData({ userId: user.uid, giftWhere: this.availableGiftWhere(), activeOfferWhere: this.activeOfferWhere(), giftInclude: this.giftInclude() });
    const wishlist = await this.wishlistGiftIds(user.uid, discounted.map((gift) => gift.id));
    return { data: { greeting: 'Welcome back', defaultAddress: defaultAddress ? this.toAddress(defaultAddress) : null, upcomingReminder: upcomingReminder ? this.toReminder(upcomingReminder) : null, categories: categories.map((category) => this.toCategory(category)), discountedGifts: discounted.map((gift) => this.toGiftCard(gift, wishlist)) }, message: 'Customer home fetched successfully' };
  }

  async categories() {
    const categories = await this.customerMarketplaceRepository.findMarketplaceCategories(this.availableGiftWhere());
    return { data: categories.map((category) => ({ ...this.toCategory(category), totalGifts: category._count.gifts })), message: 'Customer categories fetched successfully' };
  }

  async gifts(user: AuthUserContext, query: CustomerGiftListDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = this.customerGiftWhere(query);
    const [items, total] = await this.customerMarketplaceRepository.findMarketplaceGiftsAndCount({ where, include: this.giftInclude(), orderBy: this.giftOrderBy(query.sortBy), skip: (page - 1) * limit, take: limit });
    const wishlist = await this.wishlistGiftIds(user.uid, items.map((gift) => gift.id));
    const data = items.map((gift) => this.toGiftListItem(gift, wishlist));
    if (query.sortBy === CustomerGiftSortBy.DISCOUNT) data.sort((a, b) => (b.activeOffer?.discountAmount ?? 0) - (a.activeOffer?.discountAmount ?? 0));
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) }, message: 'Customer gifts fetched successfully' };
  }

  discountedGifts(user: AuthUserContext, query: CustomerGiftListDto) { return this.gifts(user, { ...query, offerOnly: true }); }

  async giftDetails(user: AuthUserContext, id: string) {
    const gift = await this.customerMarketplaceRepository.findGiftDetailsForCustomer(id, { where: this.availableGiftWhere(), include: this.giftInclude() });
    if (!gift) throw new NotFoundException('Gift not found');
    const wishlist = await this.wishlistGiftIds(user.uid, [gift.id]);
    return { data: this.toGiftDetail(gift, wishlist), message: 'Gift details fetched successfully' };
  }

  async filterOptions() {
    const [categories, price, providers] = await this.customerMarketplaceRepository.findGiftFilterOptions({ giftWhere: this.availableGiftWhere(), approvedProviderWhere: this.approvedProviderWhere() });
    return { data: { sortOptions: Object.values(CustomerGiftSortBy), categories: categories.map((category) => this.toCategory(category)), priceRange: { min: Number(price._min.price ?? 0), max: Number(price._max.price ?? 0) }, ratingOptions: [4.5, 4.0, 3.5], brands: providers.map((provider) => this.providerName(provider)).filter(Boolean), deliveryOptions: Object.values(CustomerDeliveryOption) }, message: 'Gift filter options fetched successfully' };
  }

  async wishlist(user: AuthUserContext) {
    const rows = await this.customerMarketplaceRepository.findCustomerWishlistRows(user.uid);
    const gifts = await this.customerMarketplaceRepository.findWishlistGifts({ giftIds: rows.map((row) => row.giftId), where: this.availableGiftWhere(), include: this.giftInclude() });
    const wishlist = new Set(rows.map((row) => row.giftId));
    return { data: gifts.map((gift) => this.toGiftListItem(gift, wishlist)), message: 'Wishlist fetched successfully' };
  }

  async addWishlist(user: AuthUserContext, giftId: string) {
    await this.getAvailableGift(giftId);
    await this.customerMarketplaceRepository.addCustomerWishlistGift(user.uid, giftId);
    return { data: { giftId }, message: 'Gift added to wishlist successfully' };
  }

  async removeWishlist(user: AuthUserContext, giftId: string) {
    await this.customerMarketplaceRepository.removeCustomerWishlistGift(user.uid, giftId);
    return { data: null, message: 'Gift removed from wishlist successfully' };
  }

  async addresses(user: AuthUserContext) {
    const items = await this.customerMarketplaceRepository.findCustomerAddresses(user.uid);
    return { data: items.map((item) => this.toAddress(item)), message: 'Addresses fetched successfully' };
  }

  async createAddress(user: AuthUserContext, dto: CreateCustomerAddressDto) {
    const address = await this.customerMarketplaceRepository.createCustomerAddress({ userId: user.uid, isDefault: dto.isDefault, data: { userId: user.uid, label: dto.label.trim(), fullName: dto.fullName.trim(), phone: dto.phone.trim(), line1: dto.line1.trim(), line2: dto.line2?.trim(), city: dto.city.trim(), state: dto.state?.trim(), country: dto.country.trim(), postalCode: dto.postalCode?.trim(), latitude: dto.latitude === undefined ? undefined : new Prisma.Decimal(dto.latitude), longitude: dto.longitude === undefined ? undefined : new Prisma.Decimal(dto.longitude), deliveryInstructions: dto.deliveryInstructions?.trim() } });
    return { data: this.toAddress(address), message: 'Address created successfully' };
  }

  async addressDetails(user: AuthUserContext, id: string) { return { data: this.toAddress(await this.getAddress(user.uid, id)), message: 'Address fetched successfully' }; }

  async updateAddress(user: AuthUserContext, id: string, dto: UpdateCustomerAddressDto) {
    await this.getAddress(user.uid, id);
    const address = await this.customerMarketplaceRepository.updateCustomerAddress({ userId: user.uid, id, isDefault: dto.isDefault, data: this.addressData(dto) });
    return { data: this.toAddress(address), message: 'Address updated successfully' };
  }

  async deleteAddress(user: AuthUserContext, id: string) {
    await this.getAddress(user.uid, id);
    await this.customerMarketplaceRepository.deleteCustomerAddress(id);
    return { data: null, message: 'Address deleted successfully' };
  }

  async setDefaultAddress(user: AuthUserContext, id: string) {
    await this.getAddress(user.uid, id);
    const address = await this.customerMarketplaceRepository.setDefaultCustomerAddress(user.uid, id);
    return { data: this.toAddress(address), message: 'Default address updated successfully' };
  }

  async reminders(user: AuthUserContext) {
    const items = await this.customerMarketplaceRepository.findCustomerReminders(user.uid);
    return { data: items.map((item) => this.toReminder(item)), message: 'Reminders fetched successfully' };
  }

  async createReminder(user: AuthUserContext, dto: CreateCustomerReminderDto) {
    const reminder = await this.customerMarketplaceRepository.createCustomerReminder({ userId: user.uid, title: dto.title.trim(), recipientName: dto.recipientName.trim(), eventType: dto.eventType, reminderDate: new Date(dto.reminderDate), notes: dto.notes?.trim(), isActive: dto.isActive ?? true });
    return { data: this.toReminder(reminder), message: 'Reminder created successfully' };
  }

  async reminderDetails(user: AuthUserContext, id: string) { return { data: this.toReminder(await this.getReminder(user.uid, id)), message: 'Reminder fetched successfully' }; }

  async updateReminder(user: AuthUserContext, id: string, dto: UpdateCustomerReminderDto) {
    await this.getReminder(user.uid, id);
    const reminder = await this.customerMarketplaceRepository.updateCustomerReminder(id, { title: dto.title?.trim(), recipientName: dto.recipientName?.trim(), eventType: dto.eventType, reminderDate: dto.reminderDate ? new Date(dto.reminderDate) : undefined, notes: dto.notes?.trim(), isActive: dto.isActive });
    return { data: this.toReminder(reminder), message: 'Reminder updated successfully' };
  }

  async deleteReminder(user: AuthUserContext, id: string) {
    await this.getReminder(user.uid, id);
    await this.customerMarketplaceRepository.deleteCustomerReminder(id);
    return { data: null, message: 'Reminder deleted successfully' };
  }

  async cart(user: AuthUserContext) { return { data: this.toCart(await this.getActiveCart(user.uid)), message: 'Cart fetched successfully' }; }

  async addCartItem(user: AuthUserContext, dto: AddCartItemDto) {
    const [gift, address, cart] = await Promise.all([this.getAvailableGift(dto.giftId), this.getCartAddress(user.uid, dto.recipientAddressId), this.getOrCreateActiveCart(user.uid)]);
    const variant = this.resolveVariant(gift, dto.variantId);
    if (dto.recipientContactId) await this.assertCartContact(user.uid, dto.recipientContactId);
    if (dto.eventId) await this.assertCartEvent(user.uid, dto.eventId);
    this.assertStock(gift, variant, dto.quantity);
    const offer = this.activeOffer(gift);
    const pricing = this.priceSnapshot(gift, offer, variant);
    const item = await this.customerCartRepository.createCartItem({ cartId: cart.id, giftId: gift.id, variantId: variant?.id, providerId: gift.provider.id, quantity: dto.quantity, unitPriceSnapshot: pricing.unitPrice, discountAmountSnapshot: pricing.discountAmount, finalUnitPriceSnapshot: pricing.finalUnitPrice, promotionalOfferId: offer?.id, deliveryOption: dto.deliveryOption, recipientContactId: dto.recipientContactId, recipientName: dto.recipientName.trim(), recipientPhone: dto.recipientPhone.trim(), recipientAddressId: address.id, eventId: dto.eventId, giftMessage: dto.giftMessage?.trim(), messageMediaUrlsJson: dto.messageMediaUrls ?? [], scheduledDeliveryAt: dto.scheduledDeliveryAt ? new Date(dto.scheduledDeliveryAt) : null });
    return { data: this.toCartItem(item), message: 'Cart item added successfully' };
  }

  async updateCartItem(user: AuthUserContext, id: string, dto: UpdateCartItemDto) {
    const cart = await this.getActiveCart(user.uid);
    const item = cart.items.find((candidate) => candidate.id === id);
    if (!item) throw new NotFoundException('Cart item not found');
    if (dto.recipientAddressId) await this.getCartAddress(user.uid, dto.recipientAddressId);
    if (dto.recipientContactId) await this.assertCartContact(user.uid, dto.recipientContactId);
    if (dto.eventId) await this.assertCartEvent(user.uid, dto.eventId);
    const gift = await this.getAvailableGift(item.giftId);
    const variant = this.resolveVariant(gift, dto.variantId ?? item.variantId ?? undefined);
    const quantity = dto.quantity ?? item.quantity;
    this.assertStock(gift, variant, quantity);
    const offer = this.activeOffer(gift);
    const pricing = this.priceSnapshot(gift, offer, variant);
    const updated = await this.customerCartRepository.updateCartItem(id, { variantId: variant?.id, quantity: dto.quantity, unitPriceSnapshot: pricing.unitPrice, discountAmountSnapshot: pricing.discountAmount, finalUnitPriceSnapshot: pricing.finalUnitPrice, promotionalOfferId: offer?.id, deliveryOption: dto.deliveryOption, recipientContactId: dto.recipientContactId, recipientName: dto.recipientName?.trim(), recipientPhone: dto.recipientPhone?.trim(), recipientAddressId: dto.recipientAddressId, eventId: dto.eventId, giftMessage: dto.giftMessage?.trim(), messageMediaUrlsJson: dto.messageMediaUrls, scheduledDeliveryAt: dto.scheduledDeliveryAt ? new Date(dto.scheduledDeliveryAt) : undefined });
    return { data: this.toCartItem(updated), message: 'Cart item updated successfully' };
  }

  async deleteCartItem(user: AuthUserContext, id: string) {
    const cart = await this.getActiveCart(user.uid);
    if (!cart.items.some((item) => item.id === id)) throw new NotFoundException('Cart item not found');
    await this.customerCartRepository.deleteCartItem(id);
    return { data: null, message: 'Cart item deleted successfully' };
  }

  async clearCart(user: AuthUserContext) {
    const cart = await this.getActiveCart(user.uid);
    await this.customerCartRepository.clearActiveCart(cart.id);
    return { data: null, message: 'Cart cleared successfully.' };
  }

  async createOrder(user: AuthUserContext, dto: CreateOrderDto) {
    const cart = await this.getCheckoutCart(user.uid, dto.cartId);
    if (cart.items.length === 0) throw new BadRequestException('Cart is empty');
    const address = await this.getCheckoutDeliveryAddress(user.uid, dto.deliveryAddressId);
    const gifts = await this.customerOrdersRepository.findGiftsForCheckout({ giftIds: cart.items.map((item) => item.giftId), where: this.availableGiftWhere(), include: this.giftInclude() });
    const giftById = new Map(gifts.map((gift) => [gift.id, gift]));
    for (const item of cart.items) {
      const gift = giftById.get(item.giftId);
      if (!gift) throw new BadRequestException('One or more cart items are unavailable');
      const variant = this.resolveVariant(gift, item.variantId ?? undefined);
      this.assertStock(gift, variant, item.quantity);
    }
    const summary = this.cartSummary(cart.items);
    const payment = dto.paymentId ? await this.customerOrdersRepository.findPaymentForUser(user.uid, dto.paymentId) : null;
    const paymentMethod = payment?.paymentMethod ?? dto.paymentMethod ?? PaymentMethod.COD;
    if (paymentMethod === PaymentMethod.STRIPE_CARD && payment?.status !== PaymentStatus.SUCCEEDED) throw new BadRequestException('Successful payment is required before creating this order');
    if (payment && (Number(payment.amount) !== summary.total || payment.currency !== summary.currency)) throw new BadRequestException('Payment amount does not match cart total');
    const providerIds = [...new Set(cart.items.map((item) => item.providerId))];
    const order = await this.customerOrdersRepository.runCheckoutTransaction(async (tx) => {
      const created = await this.customerOrdersRepository.createOrderWithItems(tx, { userId: user.uid, orderNumber: this.nextOrderNumber(), status: paymentMethod === PaymentMethod.STRIPE_CARD ? OrderStatus.CONFIRMED : OrderStatus.PENDING, paymentStatus: payment?.status ?? PaymentStatus.PENDING, paymentMethod, paymentId: payment?.id, subtotal: new Prisma.Decimal(summary.subtotal), discountTotal: new Prisma.Decimal(summary.discountTotal), deliveryFee: new Prisma.Decimal(summary.deliveryFee), tax: new Prisma.Decimal(summary.tax), total: new Prisma.Decimal(summary.total), currency: summary.currency, deliveryAddressId: address.id, recipientName: address.fullName, recipientPhone: address.phone, giftMessage: cart.items[0]?.giftMessage, scheduledDeliveryAt: cart.items[0]?.scheduledDeliveryAt ?? null });
      for (const item of cart.items) {
        if (item.variantId) await this.customerOrdersRepository.decrementVariantStock(tx, item.variantId, item.quantity);
        else await this.customerOrdersRepository.decrementGiftStock(tx, item.giftId, item.quantity);
        await this.customerOrdersRepository.createOrderItem(tx, { orderId: created.id, giftId: item.giftId, variantId: item.variantId, providerId: item.providerId, quantity: item.quantity, unitPrice: item.unitPriceSnapshot, discountAmount: item.discountAmountSnapshot, finalUnitPrice: item.finalUnitPriceSnapshot, total: new Prisma.Decimal(Number(item.finalUnitPriceSnapshot) * item.quantity), promotionalOfferId: item.promotionalOfferId, status: OrderStatus.PENDING });
      }
      for (const providerId of providerIds) {
        const providerItems = cart.items.filter((item) => item.providerId === providerId);
        const providerSubtotal = providerItems.reduce((sum, item) => sum + Number(item.unitPriceSnapshot) * item.quantity, 0);
        const providerDiscount = providerItems.reduce((sum, item) => sum + Number(item.discountAmountSnapshot) * item.quantity, 0);
        const providerOrder = await this.customerOrdersRepository.createProviderSubOrder(tx, { orderId: created.id, providerId, orderNumber: created.orderNumber, status: ProviderOrderStatus.PENDING, subtotal: new Prisma.Decimal(providerSubtotal), discountTotal: new Prisma.Decimal(providerDiscount), deliveryFee: new Prisma.Decimal(0), tax: new Prisma.Decimal(0), platformFee: new Prisma.Decimal(0), totalPayout: new Prisma.Decimal(providerSubtotal - providerDiscount), total: new Prisma.Decimal(providerSubtotal - providerDiscount), currency: summary.currency });
        const orderItems = await this.customerOrdersRepository.findProviderOrderItems(tx, created.id, providerId);
        for (const orderItem of orderItems) await this.customerOrdersRepository.createProviderOrderItem(tx, { providerOrderId: providerOrder.id, orderItemId: orderItem.id, giftId: orderItem.giftId, variantId: orderItem.variantId, nameSnapshot: orderItem.gift.name, variantNameSnapshot: orderItem.variant?.name, quantity: orderItem.quantity, unitPrice: orderItem.finalUnitPrice, total: orderItem.total, imageUrl: this.firstImage(orderItem.gift.imageUrls) });
      }
      await this.customerOrdersRepository.markCartCheckedOut(tx, cart.id);
      if (payment) await this.customerOrdersRepository.linkPaymentToOrder(tx, payment.id, created.id);
      await this.customerOrdersRepository.createOrderNotification(tx, { recipientId: user.uid, recipientType: NotificationRecipientType.REGISTERED_USER, title: 'Gift order created', message: 'Your gift order has been created successfully.', orderId: created.id });
      for (const providerId of providerIds) await this.customerOrdersRepository.createOrderNotification(tx, { recipientId: providerId, recipientType: NotificationRecipientType.PROVIDER, title: 'New order received', message: 'You received a new gift order.', orderId: created.id });
      return created;
    });
    return this.orderDetails(user, order.id);
  }

  async orders(user: AuthUserContext, query: ListCustomerOrdersDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.OrderWhereInput = { userId: user.uid, status: query.status, createdAt: query.fromDate || query.toDate ? { ...(query.fromDate ? { gte: new Date(query.fromDate) } : {}), ...(query.toDate ? { lte: new Date(query.toDate) } : {}) } : undefined };
    const [orders, total] = await this.customerOrdersRepository.findManyAndCountForCustomerOrders({ where, skip: (page - 1) * limit, take: limit });
    const data = orders.map((order) => this.toOrderListItem(order, query.type));
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) }, message: 'Orders fetched successfully' };
  }

  async orderDetails(user: AuthUserContext, id: string) {
    const order = await this.customerOrdersRepository.findOwnedOrderById(user.uid, id);
    if (!order) throw new NotFoundException('Order not found');
    return { data: this.toOrder(order), message: 'Order fetched successfully' };
  }

  private customerGiftWhere(query: CustomerGiftListDto): Prisma.GiftWhereInput {
    return {
      ...this.availableGiftWhere(),
      categoryId: query.categoryId,
      category: query.categorySlug ? { slug: query.categorySlug } : undefined,
      providerId: query.providerId,
      price: query.minPrice === undefined && query.maxPrice === undefined ? undefined : { ...(query.minPrice === undefined ? {} : { gte: new Prisma.Decimal(query.minPrice) }), ...(query.maxPrice === undefined ? {} : { lte: new Prisma.Decimal(query.maxPrice) }) },
      ratingPlaceholder: query.minRating === undefined ? undefined : { gte: new Prisma.Decimal(query.minRating) },
      provider: query.brand ? { ...this.approvedProviderWhere(), providerBusinessName: { contains: query.brand, mode: 'insensitive' } } : this.approvedProviderWhere(),
      promotionalOffers: query.offerOnly ? { some: this.activeOfferWhere() } : undefined,
      ...(query.search ? { OR: [{ name: { contains: query.search, mode: 'insensitive' } }, { shortDescription: { contains: query.search, mode: 'insensitive' } }, { description: { contains: query.search, mode: 'insensitive' } }] } : {}),
    };
  }

  private availableGiftWhere(): Prisma.GiftWhereInput { return { status: GiftStatus.ACTIVE, isPublished: true, deletedAt: null, OR: [{ variants: { some: { isActive: true, deletedAt: null, stockQuantity: { gt: 0 } } } }, { AND: [{ variants: { none: { deletedAt: null } } }, { stockQuantity: { gt: 0 } }] }], provider: this.approvedProviderWhere() }; }
  private approvedProviderWhere(): Prisma.UserWhereInput { return { role: UserRole.PROVIDER, isActive: true, providerApprovalStatus: ProviderApprovalStatus.APPROVED, suspendedAt: null, deletedAt: null }; }
  private activeOfferWhere(): Prisma.PromotionalOfferWhereInput { const now = new Date(); return { approvalStatus: PromotionalOfferApprovalStatus.APPROVED, isActive: true, deletedAt: null, startDate: { lte: now }, OR: [{ endDate: null }, { endDate: { gte: now } }], item: this.availableGiftWhere() }; }
  private giftInclude() { return Prisma.validator<Prisma.GiftInclude>()({ category: { select: { id: true, name: true, slug: true, color: true, backgroundColor: true, imageUrl: true } }, provider: { select: { id: true, providerBusinessName: true, firstName: true, lastName: true, providerFulfillmentMethods: true } }, variants: { where: { isActive: true, deletedAt: null }, orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }], select: { id: true, name: true, price: true, originalPrice: true, stockQuantity: true, sku: true, isPopular: true, isDefault: true, sortOrder: true, isActive: true, deletedAt: true } }, promotionalOffers: { where: this.activeOfferWhere(), orderBy: { discountValue: 'desc' }, select: { id: true, title: true, discountType: true, discountValue: true, startDate: true, endDate: true } } }); }
  private cartItemInclude() { return Prisma.validator<Prisma.CartItemInclude>()({ gift: { select: { id: true, name: true, imageUrls: true, currency: true } }, variant: { select: { id: true, name: true } } }); }
  private giftOrderBy(sortBy?: CustomerGiftSortBy): Prisma.GiftOrderByWithRelationInput { if (sortBy === CustomerGiftSortBy.PRICE_LOW_TO_HIGH) return { price: 'asc' }; if (sortBy === CustomerGiftSortBy.PRICE_HIGH_TO_LOW) return { price: 'desc' }; if (sortBy === CustomerGiftSortBy.RATING) return { ratingPlaceholder: 'desc' }; return { createdAt: 'desc' }; }

  private async getAvailableGift(id: string): Promise<GiftView> { const gift = await this.customerMarketplaceRepository.findAvailableGift(id, { where: this.availableGiftWhere(), include: this.giftInclude() }); if (!gift) throw new NotFoundException('Gift not found or unavailable'); return gift; }
  private async getAddress(userId: string, id: string): Promise<CustomerAddress> { const address = await this.customerMarketplaceRepository.findCustomerAddressById(userId, id); if (!address) throw new NotFoundException('Address not found'); return address; }
  private async getCartAddress(userId: string, id: string): Promise<CustomerAddress> { const address = await this.customerCartRepository.findAddressForUser(userId, id); if (!address) throw new NotFoundException('Address not found'); return address; }
  private async getReminder(userId: string, id: string): Promise<CustomerReminder> { const reminder = await this.customerMarketplaceRepository.findCustomerReminderById(userId, id); if (!reminder) throw new NotFoundException('Reminder not found'); return reminder; }
  private async getOrCreateActiveCart(userId: string) { return this.customerCartRepository.findOrCreateActiveCart(userId); }
  private async getActiveCart(userId: string): Promise<CartView> { const cart = await this.getOrCreateActiveCart(userId); return this.customerCartRepository.findCartWithItemsById(cart.id); }
  private async getActiveCartById(userId: string, cartId: string): Promise<CartView> { const cart = await this.customerOrdersRepository.findActiveCartForCheckout(userId, cartId); if (!cart) throw new NotFoundException('Active cart not found'); return cart; }
  private async getCheckoutCart(userId: string, cartId?: string): Promise<CartView> { const cart = await this.customerOrdersRepository.findActiveCartForCheckout(userId, cartId); if (!cart) { if (cartId) throw new NotFoundException('Active cart not found'); return this.getActiveCart(userId); } return cart; }
  private async getCheckoutDeliveryAddress(userId: string, addressId: string): Promise<CustomerAddress> { const address = await this.customerOrdersRepository.findDeliveryAddressForUser(userId, addressId); if (!address) throw new NotFoundException('Address not found'); return address; }
  private async wishlistGiftIds(userId: string, giftIds: string[]): Promise<Set<string>> { if (giftIds.length === 0) return new Set(); const rows = await this.customerMarketplaceRepository.findCustomerWishlistGiftIds(userId, giftIds); return new Set(rows.map((row) => row.giftId)); }

  private async assertContact(userId: string, id: string): Promise<void> { const contact = await this.customerMarketplaceRepository.findCustomerContactById(userId, id); if (!contact) throw new NotFoundException('Contact not found'); }
  private async assertCartContact(userId: string, id: string): Promise<void> { const contact = await this.customerCartRepository.findContactForUser(userId, id); if (!contact) throw new NotFoundException('Contact not found'); }
  private async assertEvent(userId: string, id: string): Promise<void> { const event = await this.customerMarketplaceRepository.findCustomerEventById(userId, id); if (!event) throw new NotFoundException('Event not found'); }
  private async assertCartEvent(userId: string, id: string): Promise<void> { const event = await this.customerCartRepository.findEventForUser(userId, id); if (!event) throw new NotFoundException('Event not found'); }
  private resolveVariant(gift: GiftView, variantId?: string): GiftVariantView | null { if (gift.variants.length === 0) return null; if (!variantId) return gift.variants.find((candidate) => candidate.isDefault) ?? null; const variant = gift.variants.find((candidate) => candidate.id === variantId); if (!variant) throw new BadRequestException('Variant does not belong to gift'); return variant; }
  private assertStock(gift: GiftView, variant: GiftVariantView | null, quantity: number): void { const stock = variant?.stockQuantity ?? gift.stockQuantity; if (stock < quantity) throw new BadRequestException('Requested quantity exceeds available stock'); }

  private toCategory(category: CategoryView) { return { id: category.id, name: category.name, slug: category.slug, backgroundColor: category.backgroundColor ?? category.color ?? '#F3E8FF', imageUrl: category.imageUrl }; }
  private toGiftCard(gift: GiftView, wishlist: Set<string>) { const offer = this.activeOffer(gift); return { id: gift.id, name: gift.name, price: Number(gift.price), currency: gift.currency, imageUrl: this.firstImage(gift.imageUrls), rating: Number(gift.ratingPlaceholder), isWishlisted: wishlist.has(gift.id), activeOffer: this.toOffer(offer, Number(gift.price)) }; }
  private toGiftListItem(gift: GiftView, wishlist: Set<string>) { return { ...this.toGiftCard(gift, wishlist), shortDescription: gift.shortDescription, reviewCount: 0, stockQuantity: gift.stockQuantity, category: this.toCategory(gift.category), provider: { id: gift.provider.id, businessName: this.providerName(gift.provider) }, deliveryOptions: Object.values(CustomerDeliveryOption), popularity: 0 }; }
  private toGiftDetail(gift: GiftView, wishlist: Set<string>) { const offer = this.activeOffer(gift); return { ...this.toGiftListItem(gift, wishlist), description: gift.description, originalPrice: Number(gift.price), imageUrls: this.stringArray(gift.imageUrls), sku: gift.sku, badges: this.giftBadges(gift), provider: { id: gift.provider.id, businessName: this.providerName(gift.provider), rating: Number(gift.ratingPlaceholder), reviewCount: 0, fulfillmentMethods: this.stringArray(gift.provider.providerFulfillmentMethods) }, variants: gift.variants.map((variant) => ({ id: variant.id, name: variant.name, price: Number(variant.price), originalPrice: Number(variant.originalPrice ?? variant.price), stockQuantity: variant.stockQuantity, sku: variant.sku, isPopular: variant.isPopular, isDefault: variant.isDefault })), deliveryOptions: Object.values(CustomerDeliveryOption), activeOffer: this.toOffer(offer, Number(gift.price)) }; }
  private activeOffer(gift: GiftView): OfferView | null { return gift.promotionalOffers[0] ?? null; }
  private toOffer(offer: OfferView | null, price: number) { if (!offer) return null; const value = Number(offer.discountValue); const discountAmount = offer.discountType === PromotionalOfferDiscountType.PERCENTAGE ? Math.min(price, price * (value / 100)) : Math.min(price, value); return { id: offer.id, title: offer.title, discountType: offer.discountType, discountValue: value, discountAmount, finalPrice: price - discountAmount, startDate: offer.startDate, endDate: offer.endDate }; }
  private priceSnapshot(gift: GiftView, offer: OfferView | null, variant: GiftVariantView | null) { const unitPrice = Number(variant?.price ?? gift.price); const activeOffer = this.toOffer(offer, unitPrice); const discountAmount = activeOffer?.discountAmount ?? 0; return { unitPrice: new Prisma.Decimal(unitPrice), discountAmount: new Prisma.Decimal(discountAmount), finalUnitPrice: new Prisma.Decimal(unitPrice - discountAmount) }; }
  private giftBadges(gift: GiftView): string[] { const badges = ['AUTHENTIC']; if (gift.promotionalOffers.length > 0) badges.push('EXPRESS'); const methods = this.stringArray(gift.provider.providerFulfillmentMethods); if (methods.includes('DELIVERY')) badges.push('FREE_SHIPPING'); return badges; }
  private firstImage(value: Prisma.JsonValue): string | null { return this.stringArray(value)[0] ?? null; }
  private stringArray(value: Prisma.JsonValue): string[] { return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []; }
  private providerName(provider: Pick<ProviderView, 'providerBusinessName' | 'firstName' | 'lastName'>): string { return provider.providerBusinessName ?? `${provider.firstName} ${provider.lastName}`.trim(); }
  private addressData(dto: CreateCustomerAddressDto | UpdateCustomerAddressDto) { return { label: dto.label?.trim(), fullName: dto.fullName?.trim(), phone: dto.phone?.trim(), line1: dto.line1?.trim(), line2: dto.line2?.trim(), city: dto.city?.trim(), state: dto.state?.trim(), country: dto.country?.trim(), postalCode: dto.postalCode?.trim(), latitude: dto.latitude === undefined ? undefined : new Prisma.Decimal(dto.latitude), longitude: dto.longitude === undefined ? undefined : new Prisma.Decimal(dto.longitude), deliveryInstructions: dto.deliveryInstructions?.trim(), isDefault: dto.isDefault }; }
  private toAddress(address: CustomerAddress) { return { id: address.id, label: address.label, fullName: address.fullName, phone: address.phone, line1: address.line1, line2: address.line2, city: address.city, state: address.state, country: address.country, postalCode: address.postalCode, latitude: address.latitude === null ? null : Number(address.latitude), longitude: address.longitude === null ? null : Number(address.longitude), deliveryInstructions: address.deliveryInstructions, isDefault: address.isDefault, createdAt: address.createdAt, updatedAt: address.updatedAt }; }
  private toReminder(reminder: CustomerReminder) { return { id: reminder.id, title: reminder.title, recipientName: reminder.recipientName, eventType: reminder.eventType, reminderDate: reminder.reminderDate, notes: reminder.notes, isActive: reminder.isActive, createdAt: reminder.createdAt, updatedAt: reminder.updatedAt }; }
  private toCart(cart: CartView) { const items = cart.items.map((item) => this.toCartItem(item)); return { id: cart.id, status: cart.status, items, summary: this.cartSummary(cart.items), createdAt: cart.createdAt, updatedAt: cart.updatedAt }; }
  private toCartItem(item: CartItemView) { return { id: item.id, giftId: item.giftId, variantId: item.variantId, providerId: item.providerId, name: item.gift.name, variantName: item.variant?.name ?? null, quantity: item.quantity, unitPrice: Number(item.unitPriceSnapshot), discountAmount: Number(item.discountAmountSnapshot), finalUnitPrice: Number(item.finalUnitPriceSnapshot), lineTotal: Number(item.finalUnitPriceSnapshot) * item.quantity, imageUrl: this.firstImage(item.gift.imageUrls), promotionalOfferId: item.promotionalOfferId, deliveryOption: item.deliveryOption, recipient: { contactId: item.recipientContactId, name: item.recipientName, phone: item.recipientPhone, addressId: item.recipientAddressId }, eventId: item.eventId, giftMessage: item.giftMessage, messageMediaUrls: this.stringArray(item.messageMediaUrlsJson), scheduledDeliveryAt: item.scheduledDeliveryAt, createdAt: item.createdAt, updatedAt: item.updatedAt }; }
  private cartSummary(items: CartItemView[]) { const subtotal = items.reduce((sum, item) => sum + Number(item.unitPriceSnapshot) * item.quantity, 0); const discountTotal = items.reduce((sum, item) => sum + Number(item.discountAmountSnapshot) * item.quantity, 0); const deliveryFee = 0; const taxableTotal = Math.max(0, subtotal - discountTotal + deliveryFee); const tax = 0; const total = this.money(taxableTotal + tax); return { subtotal: this.money(subtotal), discountTotal: this.money(discountTotal), deliveryFee, tax, total, currency: process.env.STRIPE_CURRENCY ?? 'PKR' }; }
  private money(value: number): number { return Number(value.toFixed(2)); }
  private toOrderListItem(order: OrderView, type?: OrderHistoryType) { return { id: order.id, orderNumber: order.orderNumber, type: type === OrderHistoryType.PAYMENTS_SENT ? OrderHistoryType.PAYMENTS_SENT : OrderHistoryType.GIFTS_SENT, recipientName: order.recipientName, occasion: null, status: order.status, paymentStatus: order.paymentStatus, total: Number(order.total), currency: order.currency, createdAt: order.createdAt }; }
  private toOrder(order: OrderView) { return { id: order.id, orderNumber: order.orderNumber, status: order.status, paymentStatus: order.paymentStatus, paymentMethod: order.paymentMethod, recipient: { name: order.recipientName, email: null, phone: order.recipientPhone, avatarUrl: null }, deliveryDate: order.scheduledDeliveryAt, occasion: null, giftMessage: order.giftMessage, items: order.items.map((item) => ({ giftId: item.giftId, name: item.gift.name, variantName: item.variant?.name ?? null, quantity: item.quantity, imageUrl: this.firstImage(item.gift.imageUrls), total: Number(item.total) })), summary: { subtotal: Number(order.subtotal), deliveryFee: Number(order.deliveryFee), tax: Number(order.tax), discountTotal: Number(order.discountTotal), total: Number(order.total), currency: order.currency }, deliveryAddressId: order.deliveryAddressId, providerOrders: order.providerOrders.map((providerOrder) => ({ ...providerOrder, subtotal: Number(providerOrder.subtotal), discountTotal: Number(providerOrder.discountTotal), deliveryFee: Number(providerOrder.deliveryFee), tax: Number(providerOrder.tax), total: Number(providerOrder.total) })), createdAt: order.createdAt, updatedAt: order.updatedAt }; }
  private nextOrderNumber(): string { return `ORD-${Date.now()}`; }
}
