import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  CustomerAddress,
  CustomerReminder,
  GiftStatus,
  NotificationRecipientType,
  OrderStatus,
  Prisma,
  PromotionalOfferApprovalStatus,
  PromotionalOfferDiscountType,
  UserRole,
  UserStatus,
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
import { getPagination } from '../../../common/pagination/pagination.util';

type CategoryView = { id: string; name: string; slug: string; imageUrl: string | null };
type ProviderView = { id: string; providerProfile: { businessName: string | null; fulfillmentMethods: Prisma.JsonValue } | null; firstName: string; lastName: string };
type OfferView = { id: string; title: string; discountType: PromotionalOfferDiscountType; discountValue: Prisma.Decimal; startDate: Date; endDate: Date | null };
type GiftVariantView = { id: string; name: string; price: Prisma.Decimal };
type GiftView = {
  id: string; name: string; description: string | null; price: Prisma.Decimal; currency: string; imageUrls: Prisma.JsonValue;
  ratingPlaceholder: Prisma.Decimal; category: CategoryView; provider: ProviderView; promotionalOffers: OfferView[]; variants: GiftVariantView[]; createdAt: Date;
};
type RatingSummary = { rating: number; reviewCount: number };
type CartItemView = {
  id: string; giftId: string; quantity: number; createdAt: Date; updatedAt: Date;
  gift: { id: string; name: string; imageUrls: Prisma.JsonValue };
};

type CartView = { id: string; userId: string; items: CartItemView[]; createdAt: Date; updatedAt: Date };
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
    const ratings = await this.ratingSummaries(discounted);
    return { data: { greeting: 'Welcome back', defaultAddress: defaultAddress ? this.toAddress(defaultAddress) : null, upcomingReminder: upcomingReminder ? this.toReminder(upcomingReminder) : null, categories: categories.map((category) => this.toCategory(category)), discountedGifts: discounted.map((gift) => this.toGiftCard(gift, wishlist, ratings.get(gift.provider.id) ?? this.emptyRatingSummary(), user)) }, message: 'Customer home fetched successfully' };
  }

  async categories(user?: AuthUserContext) {
    const categories = await this.customerMarketplaceRepository.findMarketplaceCategories(this.availableGiftWhere());
    return { data: categories.map((category) => ({ ...this.toCategory(category), totalGifts: category._count.gifts })), message: 'Customer categories fetched successfully' };
  }

  async gifts(user: AuthUserContext, query: CustomerGiftListDto) {
    const { page, limit, skip, take } = getPagination(query);
    const where = this.customerGiftWhere(query);
    const [items, total] = await this.customerMarketplaceRepository.findMarketplaceGiftsAndCount({ where, include: this.giftInclude(), orderBy: this.giftOrderBy(query.sortBy), skip, take });
    const wishlist = await this.wishlistGiftIds(user.uid, items.map((gift) => gift.id));
    const ratings = await this.ratingSummaries(items);
    const data = items.map((gift) => this.toGiftListItem(gift, wishlist, ratings.get(gift.provider.id) ?? this.emptyRatingSummary(), user));
    if (query.sortBy === CustomerGiftSortBy.DISCOUNT) data.sort((a, b) => (b.activeOffer?.discountAmount ?? 0) - (a.activeOffer?.discountAmount ?? 0));
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) }, message: 'Customer gifts fetched successfully' };
  }

  discountedGifts(user: AuthUserContext, query: CustomerGiftListDto) { return this.gifts(user, { ...query, offerOnly: true }); }

  async giftDetails(user: AuthUserContext, id: string) {
    const gift = await this.customerMarketplaceRepository.findGiftDetailsForCustomer(id, { where: this.availableGiftWhere(), include: this.giftInclude() });
    if (!gift) throw new NotFoundException('Gift not found');
    const wishlist = await this.wishlistGiftIds(user.uid, [gift.id]);
    return { data: await this.toGiftDetail(gift, wishlist, await this.ratingSummary(gift.provider.id), user), message: 'Gift details fetched successfully' };
  }

  async filterOptions(user?: AuthUserContext) {
    const [categories, price, providers] = await this.customerMarketplaceRepository.findGiftFilterOptions({ giftWhere: this.availableGiftWhere(), approvedProviderWhere: this.approvedProviderWhere() });
    return { data: { sortOptions: Object.values(CustomerGiftSortBy), categories: categories.map((category) => this.toCategory(category)), priceRange: { min: Number(price._min.price ?? 0), max: Number(price._max.price ?? 0) }, ratingOptions: [4.5, 4.0, 3.5], brands: providers.map((provider) => this.providerName(provider)).filter(Boolean) }, message: 'Gift filter options fetched successfully' };
  }

  async wishlist(user: AuthUserContext) {
    const rows = await this.customerMarketplaceRepository.findCustomerWishlistRows(user.uid);
    const gifts = await this.customerMarketplaceRepository.findWishlistGifts({ giftIds: rows.map((row) => row.giftId), where: this.availableGiftWhere(), include: this.giftInclude() });
    const wishlist = new Set(rows.map((row) => row.giftId));
    const ratings = await this.ratingSummaries(gifts);
    return { data: gifts.map((gift) => this.toGiftListItem(gift, wishlist, ratings.get(gift.provider.id) ?? this.emptyRatingSummary(), user)), message: 'Wishlist fetched successfully' };
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
    const [gift, cart] = await Promise.all([this.getAvailableGift(dto.giftId), this.getActiveCart(user.uid)]);
    if (cart.items.length > 0) {
      const existingGiftIds = cart.items.map((item) => item.giftId);
      const existingGifts = await this.customerOrdersRepository.findGiftsForCheckout({ giftIds: existingGiftIds, where: this.availableGiftWhere(), include: { provider: { select: { id: true } } } });
      const existingProviderIds = new Set(existingGifts.map((g) => g.provider.id));
      if (existingProviderIds.size > 0 && !existingProviderIds.has(gift.provider.id)) throw new BadRequestException('Cart can only contain gifts from one provider');
    }
    const item = await this.customerCartRepository.createCartItem({ cartId: cart.id, giftId: gift.id, quantity: dto.quantity });
    return { data: this.toCartItem(item), message: 'Cart item added successfully' };
  }

  async updateCartItem(user: AuthUserContext, id: string, dto: UpdateCartItemDto) {
    const cart = await this.getActiveCart(user.uid);
    const item = cart.items.find((candidate) => candidate.id === id);
    if (!item) throw new NotFoundException('Cart item not found');
    const updated = await this.customerCartRepository.updateCartItem(id, { quantity: dto.quantity });
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
    const gifts = await this.customerOrdersRepository.findGiftsForCheckout({ giftIds: cart.items.map((item) => item.giftId), where: this.availableGiftWhere(), include: this.giftInclude() });
    const giftById = new Map(gifts.map((gift) => [gift.id, gift]));
    for (const item of cart.items) {
      if (!giftById.get(item.giftId)) throw new BadRequestException('One or more cart items are unavailable');
    }
    const providerIds = [...new Set(gifts.map((gift) => gift.provider.id))];
    if (providerIds.length !== 1) throw new BadRequestException('Cart can only contain gifts from one provider');
    const providerId = providerIds[0];
    const subtotal = this.money(cart.items.reduce((sum, item) => {
      const gift = giftById.get(item.giftId)!;
      return sum + Number(gift.price) * item.quantity;
    }, 0));
    const order = await this.customerOrdersRepository.runCheckoutTransaction(async (tx) => {
      const payout = await this.providerPayoutCalculation(tx, providerId, subtotal);
      const total = this.money(subtotal + payout.platformFee);
      const created = await this.customerOrdersRepository.createOrderWithItems(tx, { userId: user.uid, providerId, orderNumber: this.nextOrderNumber(), status: OrderStatus.PENDING, subtotal: new Prisma.Decimal(subtotal), platformFee: new Prisma.Decimal(payout.platformFee), total: new Prisma.Decimal(total), recipientName: dto.recipientName.trim(), recipientPhone: dto.recipientPhone.trim(), recipientAddress: dto.recipientAddress.trim(), giftMessage: dto.giftMessage?.trim(), mediaAttachments: dto.mediaAttachments ?? undefined });
      for (const item of cart.items) {
        const gift = giftById.get(item.giftId)!;
        await this.customerOrdersRepository.createOrderItem(tx, { orderId: created.id, giftId: item.giftId, quantity: item.quantity, unitPrice: gift.price });
      }
      await this.customerOrdersRepository.markCartCheckedOut(tx, cart.id);
      await this.customerOrdersRepository.createOrderNotification(tx, { recipientId: user.uid, recipientType: NotificationRecipientType.REGISTERED_USER, title: 'Gift order created', message: 'Your gift order has been created successfully.', orderId: created.id });
      await this.customerOrdersRepository.createOrderNotification(tx, { recipientId: providerId, recipientType: NotificationRecipientType.PROVIDER, title: 'New order received', message: 'You received a new gift order.', orderId: created.id });
      return created;
    });
    return this.orderDetails(user, order.id);
  }

  async orders(user: AuthUserContext, query: ListCustomerOrdersDto) {
    const { page, limit, skip, take } = getPagination(query);
    const where: Prisma.OrderWhereInput = { userId: user.uid, status: query.status, createdAt: query.fromDate || query.toDate ? { ...(query.fromDate ? { gte: new Date(query.fromDate) } : {}), ...(query.toDate ? { lte: new Date(query.toDate) } : {}) } : undefined };
    const [orders, total] = await this.customerOrdersRepository.findManyAndCountForCustomerOrders({ where, skip, take });
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
      provider: query.brand ? { ...this.approvedProviderWhere(), providerProfile: { is: { businessName: { contains: query.brand, mode: 'insensitive' } } } } : this.approvedProviderWhere(),
      promotionalOffers: query.offerOnly ? { some: this.activeOfferWhere() } : undefined,
      ...(query.search ? { OR: [{ name: { contains: query.search, mode: 'insensitive' } }, { description: { contains: query.search, mode: 'insensitive' } }] } : {}),
    };
  }

  private availableGiftWhere(): Prisma.GiftWhereInput { return { status: GiftStatus.ACTIVE, provider: this.approvedProviderWhere() }; }
  private approvedProviderWhere(): Prisma.UserWhereInput { return { role: UserRole.PROVIDER, status: UserStatus.APPROVED }; }
  private activeOfferWhere(): Prisma.PromotionalOfferWhereInput { const now = new Date(); return { approvalStatus: PromotionalOfferApprovalStatus.APPROVED, isActive: true, deletedAt: null, startDate: { lte: now }, OR: [{ endDate: null }, { endDate: { gte: now } }], item: this.availableGiftWhere() }; }
  private giftInclude() { return Prisma.validator<Prisma.GiftInclude>()({ category: { select: { id: true, name: true, slug: true, imageUrl: true } }, provider: { select: { id: true, providerProfile: { select: { businessName: true, fulfillmentMethods: true } }, firstName: true, lastName: true } }, variants: { orderBy: { name: 'asc' }, select: { id: true, name: true, price: true } }, promotionalOffers: { where: this.activeOfferWhere(), orderBy: { discountValue: 'desc' }, select: { id: true, title: true, discountType: true, discountValue: true, startDate: true, endDate: true } } }); }
  private giftOrderBy(sortBy?: CustomerGiftSortBy): Prisma.GiftOrderByWithRelationInput { if (sortBy === CustomerGiftSortBy.PRICE_LOW_TO_HIGH) return { price: 'asc' }; if (sortBy === CustomerGiftSortBy.PRICE_HIGH_TO_LOW) return { price: 'desc' }; if (sortBy === CustomerGiftSortBy.RATING) return { ratingPlaceholder: 'desc' }; return { createdAt: 'desc' }; }

  private async getAvailableGift(id: string): Promise<GiftView> { const gift = await this.customerMarketplaceRepository.findAvailableGift(id, { where: this.availableGiftWhere(), include: this.giftInclude() }); if (!gift) throw new NotFoundException('Gift not found or unavailable'); return gift; }
  private async getAddress(userId: string, id: string): Promise<CustomerAddress> { const address = await this.customerMarketplaceRepository.findCustomerAddressById(userId, id); if (!address) throw new NotFoundException('Address not found'); return address; }
  private async getReminder(userId: string, id: string): Promise<CustomerReminder> { const reminder = await this.customerMarketplaceRepository.findCustomerReminderById(userId, id); if (!reminder) throw new NotFoundException('Reminder not found'); return reminder; }
  private async getOrCreateActiveCart(userId: string) { return this.customerCartRepository.findOrCreateActiveCart(userId); }
  private async getActiveCart(userId: string): Promise<CartView> { const cart = await this.getOrCreateActiveCart(userId); return this.customerCartRepository.findCartWithItemsById(cart.id); }
  private async getCheckoutCart(userId: string, cartId?: string): Promise<CartView> { const cart = await this.customerOrdersRepository.findActiveCartForCheckout(userId, cartId); if (!cart) { if (cartId) throw new NotFoundException('Active cart not found'); return this.getActiveCart(userId); } return cart; }
  private async wishlistGiftIds(userId: string, giftIds: string[]): Promise<Set<string>> { if (giftIds.length === 0) return new Set(); const rows = await this.customerMarketplaceRepository.findCustomerWishlistGiftIds(userId, giftIds); return new Set(rows.map((row) => row.giftId)); }

  private toCategory(category: CategoryView) { return { id: category.id, name: category.name, slug: category.slug, imageUrl: category.imageUrl }; }
  private toGiftCard(gift: GiftView, wishlist: Set<string>, ratingSummary: RatingSummary, _user?: AuthUserContext) { const offer = this.activeOffer(gift); return { id: gift.id, name: gift.name, price: Number(gift.price), currency: gift.currency, imageUrl: this.firstImage(gift.imageUrls), rating: ratingSummary.rating, isWishlisted: wishlist.has(gift.id), activeOffer: this.toOffer(offer, Number(gift.price)) }; }
  private toGiftListItem(gift: GiftView, wishlist: Set<string>, ratingSummary: RatingSummary, user?: AuthUserContext) { return { ...this.toGiftCard(gift, wishlist, ratingSummary, user), reviewCount: ratingSummary.reviewCount, category: this.toCategory(gift.category), provider: { id: gift.provider.id, businessName: this.providerName(gift.provider), rating: ratingSummary.rating, reviewCount: ratingSummary.reviewCount }, popularity: 0 }; }
  private async toGiftDetail(gift: GiftView, wishlist: Set<string>, ratingSummary: RatingSummary, user: AuthUserContext) { return { ...this.toGiftListItem(gift, wishlist, ratingSummary, user), description: gift.description, originalPrice: Number(gift.price), imageUrls: this.stringArray(gift.imageUrls), badges: this.giftBadges(gift), provider: { id: gift.provider.id, businessName: this.providerName(gift.provider), rating: ratingSummary.rating, reviewCount: ratingSummary.reviewCount, fulfillmentMethods: this.stringArray(gift.provider.providerProfile?.fulfillmentMethods ?? null) }, variants: gift.variants.map((variant) => ({ id: variant.id, name: variant.name, price: Number(variant.price) })), activeOffer: this.toOffer(this.activeOffer(gift), Number(gift.price)) }; }
  private activeOffer(gift: GiftView): OfferView | null { return gift.promotionalOffers[0] ?? null; }
  private toOffer(offer: OfferView | null, price: number) { if (!offer) return null; const value = Number(offer.discountValue); const discountAmount = offer.discountType === PromotionalOfferDiscountType.PERCENTAGE ? Math.min(price, price * (value / 100)) : Math.min(price, value); return { id: offer.id, title: offer.title, discountType: offer.discountType, discountValue: value, discountAmount, finalPrice: price - discountAmount, startDate: offer.startDate, endDate: offer.endDate }; }
  private giftBadges(gift: GiftView): string[] { const badges = ['AUTHENTIC']; if (gift.promotionalOffers.length > 0) badges.push('EXPRESS'); const methods = this.stringArray(gift.provider.providerProfile?.fulfillmentMethods ?? null); if (methods.includes('DELIVERY')) badges.push('FREE_SHIPPING'); return badges; }
  private firstImage(value: Prisma.JsonValue): string | null { return this.stringArray(value)[0] ?? null; }
  private stringArray(value: Prisma.JsonValue): string[] { return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []; }
  private providerName(provider: { providerProfile: { businessName: string | null } | null; firstName: string; lastName: string }): string { return provider.providerProfile?.businessName ?? `${provider.firstName} ${provider.lastName}`.trim(); }
  private emptyRatingSummary(): RatingSummary { return { rating: 0, reviewCount: 0 }; }
  private async ratingSummary(providerId: string): Promise<RatingSummary> { return (await this.ratingSummaries([{ provider: { id: providerId } }])).get(providerId) ?? this.emptyRatingSummary(); }
  private async ratingSummaries(gifts: { provider: { id: string } }[]): Promise<Map<string, RatingSummary>> {
    const providerIds = [...new Set(gifts.map((gift) => gift.provider.id))];
    if (providerIds.length === 0) return new Map();
    const rows = await this.customerMarketplaceRepository.findProviderReviewSummaries(providerIds);
    return new Map(rows.map((row) => [row.providerId, { rating: this.round(Number(row._avg.rating ?? 0)), reviewCount: this.groupCount(row._count) }]));
  }
  private round(value: number): number { return Number(value.toFixed(1)); }
  private groupCount(count: true | { _all?: number }): number { return typeof count === 'object' ? count._all ?? 0 : 0; }
  private addressData(dto: CreateCustomerAddressDto | UpdateCustomerAddressDto) { return { label: dto.label?.trim(), fullName: dto.fullName?.trim(), phone: dto.phone?.trim(), line1: dto.line1?.trim(), line2: dto.line2?.trim(), city: dto.city?.trim(), state: dto.state?.trim(), country: dto.country?.trim(), postalCode: dto.postalCode?.trim(), latitude: dto.latitude === undefined ? undefined : new Prisma.Decimal(dto.latitude), longitude: dto.longitude === undefined ? undefined : new Prisma.Decimal(dto.longitude), deliveryInstructions: dto.deliveryInstructions?.trim(), isDefault: dto.isDefault }; }
  private toAddress(address: CustomerAddress) { return { id: address.id, label: address.label, fullName: address.fullName, phone: address.phone, line1: address.line1, line2: address.line2, city: address.city, state: address.state, country: address.country, postalCode: address.postalCode, latitude: address.latitude === null ? null : Number(address.latitude), longitude: address.longitude === null ? null : Number(address.longitude), deliveryInstructions: address.deliveryInstructions, isDefault: address.isDefault, createdAt: address.createdAt, updatedAt: address.updatedAt }; }
  private toReminder(reminder: CustomerReminder) { return { id: reminder.id, title: reminder.title, recipientName: reminder.recipientName, eventType: reminder.eventType, reminderDate: reminder.reminderDate, notes: reminder.notes, isActive: reminder.isActive, createdAt: reminder.createdAt, updatedAt: reminder.updatedAt }; }
  private toCart(cart: CartView) { const items = cart.items.map((item) => this.toCartItem(item)); return { id: cart.id, items, itemCount: items.length, createdAt: cart.createdAt, updatedAt: cart.updatedAt }; }
  private toCartItem(item: CartItemView) { return { id: item.id, giftId: item.giftId, name: item.gift.name, quantity: item.quantity, imageUrl: this.firstImage(item.gift.imageUrls), createdAt: item.createdAt, updatedAt: item.updatedAt }; }
  private async providerPayoutCalculation(tx: Prisma.TransactionClient, providerId: string, grossAmount: number): Promise<{ platformFee: number; totalPayout: number }> {
    const [settings, tiers, providerEarnings] = await Promise.all([
      this.customerOrdersRepository.findActivePayoutSettings(tx),
      this.customerOrdersRepository.findActiveCommissionTiers(tx),
      this.customerOrdersRepository.sumProviderOrderEarnings(tx, providerId),
    ]);
    const tier = tiers.find((item) => providerEarnings >= Number(item.orderVolumeThreshold));
    const rate = Number(tier?.commissionRatePercent ?? settings?.platformRatePercent ?? 0);
    const platformFee = this.money((grossAmount * rate) / 100);
    return { platformFee, totalPayout: this.money(Math.max(grossAmount - platformFee, 0)) };
  }

  private money(value: number): number { return Number(value.toFixed(2)); }
  private toOrderListItem(order: OrderView, type?: OrderHistoryType) { return { id: order.id, orderNumber: order.orderNumber, type: type === OrderHistoryType.PAYMENTS_SENT ? OrderHistoryType.PAYMENTS_SENT : OrderHistoryType.GIFTS_SENT, recipientName: order.recipientName, occasion: null, status: order.status, total: Number(order.total), createdAt: order.createdAt }; }
  private toOrder(order: OrderView) { return { id: order.id, orderNumber: order.orderNumber, status: order.status, recipient: { name: order.recipientName, phone: order.recipientPhone, address: order.recipientAddress }, occasion: null, giftMessage: order.giftMessage, mediaAttachments: order.mediaAttachments, items: order.items.map((item) => ({ giftId: item.giftId, name: item.gift.name, quantity: item.quantity, imageUrl: this.firstImage(item.gift.imageUrls), unitPrice: Number(item.unitPrice) })), summary: { subtotal: Number(order.subtotal), platformFee: Number(order.platformFee), total: Number(order.total) }, isGroupGift: order.isGroupGift, createdAt: order.createdAt, updatedAt: order.updatedAt }; }
  private nextOrderNumber(): string { return `ORD-${Date.now()}`; }
}
