import { readFileSync } from 'fs';
import { join } from 'path';

describe('Customer marketplace repository cleanup', () => {
  const service = readFileSync(join(__dirname, 'customer-marketplace.service.ts'), 'utf8');
  const repository = readFileSync(join(__dirname, 'customer-marketplace.repository.ts'), 'utf8');
  const controller = readFileSync(join(__dirname, 'customer-marketplace.controller.ts'), 'utf8');
  const availableGiftWhere = service.slice(service.indexOf('private availableGiftWhere'), service.indexOf('private approvedProviderWhere'));
  const approvedProviderWhere = service.slice(service.indexOf('private approvedProviderWhere'), service.indexOf('private activeOfferWhere'));

  it('keeps marketplace API routes stable', () => {
    expect(controller).toContain("@Get('home')");
    expect(controller).toContain("@Get('categories')");
    expect(controller).toContain("@Get('gifts')");
    expect(controller).toContain("@Get('gifts/discounted')");
    expect(controller).toContain("@Get('gifts/filter-options')");
    expect(controller).toContain("@Get('gifts/:id')");
    expect(controller).toContain("@ApiTags('05 Customer - Marketplace')");
  });

  it('repository owns marketplace read queries', () => {
    expect(repository).toContain('findCustomerHomeData');
    expect(repository).toContain('findMarketplaceCategories');
    expect(repository).toContain('findMarketplaceGifts');
    expect(repository).toContain('countMarketplaceGifts');
    expect(repository).toContain('findMarketplaceGiftsAndCount');
    expect(repository).toContain('findDiscountedGifts');
    expect(repository).toContain('findGiftDetailsForCustomer');
    expect(repository).toContain('findGiftFilterOptions');
    expect(repository).toContain('findCustomerWishlistGiftIds');
    expect(repository).toContain('findDefaultAddressForUser');
    expect(repository).toContain('findUpcomingReminderForUser');
  });

  it('customer home uses customer-scoped data', () => {
    expect(repository).toContain('findDefaultAddressForUser(params.userId)');
    expect(repository).toContain('findUpcomingReminderForUser(params.userId)');
    expect(repository).toContain('where: { userId, isDefault: true, deletedAt: null }');
    expect(repository).toContain('where: { userId, isActive: true, deletedAt: null, reminderDate: { gte: new Date() } }');
    expect(service).toContain('findCustomerHomeData({ userId: user.uid');
  });

  it('categories return active categories with visible gifts', () => {
    expect(repository).toContain('findMarketplaceCategories');
    expect(repository).toContain('isActive: true, deletedAt: null, gifts: { some: giftWhere }');
    expect(repository).toContain('_count: { select: { gifts: { where: giftWhere } } }');
    expect(service).toContain('totalGifts: category._count.gifts');
  });

  it('gift list excludes inactive providers', () => {
    expect(approvedProviderWhere).toContain('role: UserRole.PROVIDER');
    expect(approvedProviderWhere).toContain('isActive: true');
    expect(approvedProviderWhere).toContain('providerApprovalStatus: ProviderApprovalStatus.APPROVED');
    expect(approvedProviderWhere).toContain('suspendedAt: null');
    expect(approvedProviderWhere).toContain('deletedAt: null');
    expect(availableGiftWhere).toContain('provider: this.approvedProviderWhere()');
  });

  it('gift list excludes unavailable, out-of-stock, and deleted gifts', () => {
    expect(availableGiftWhere).toContain('status: GiftStatus.ACTIVE');
    expect(availableGiftWhere).toContain('isPublished: true');
    expect(availableGiftWhere).toContain('deletedAt: null');
    expect(availableGiftWhere).toContain('variants: { some: { isActive: true, deletedAt: null, stockQuantity: { gt: 0 } } }');
    expect(availableGiftWhere).toContain('stockQuantity: { gt: 0 }');
  });

  it('gift list does not require provider inventory moderation approval', () => {
    expect(availableGiftWhere).not.toContain('GiftModerationStatus.APPROVED');
    expect(service).not.toContain('GiftModerationStatus,');
    expect(controller).toContain('Provider inventory does not require separate gift moderation approval');
  });

  it('gift details require a customer-visible gift', () => {
    expect(service).toContain('findGiftDetailsForCustomer(id, { where: this.availableGiftWhere(), include: this.giftInclude() })');
    expect(service).toContain("throw new NotFoundException('Gift not found')");
    expect(repository).toContain('where: { id, ...params.where }');
  });

  it('discounted gifts use active offers only', () => {
    expect(service).toContain('discountedGifts(user: AuthUserContext, query: CustomerGiftListDto) { return this.gifts(user, { ...query, offerOnly: true }); }');
    expect(service).toContain('promotionalOffers: query.offerOnly ? { some: this.activeOfferWhere() } : undefined');
    expect(repository).toContain('promotionalOffers: { some: params.activeOfferWhere }');
    expect(service).toContain('approvalStatus: PromotionalOfferApprovalStatus.APPROVED');
    expect(service).toContain('startDate: { lte: now }');
    expect(service).toContain('endDate: { gte: now }');
  });

  it('isWishlisted remains customer-specific', () => {
    expect(service).toContain('wishlistGiftIds(user.uid');
    expect(repository).toContain('findCustomerWishlistGiftIds(userId: string, giftIds: string[])');
    expect(repository).toContain('where: { userId, giftId: { in: giftIds } }');
    expect(service).toContain('isWishlisted: wishlist.has(gift.id)');
  });

  it('service keeps filter normalization, active offer calculation, rating placeholders, and response mapping', () => {
    expect(service).toContain('private customerGiftWhere');
    expect(service).toContain('query.categoryId');
    expect(service).toContain('query.minPrice');
    expect(service).toContain('query.search');
    expect(service).toContain('private activeOffer(gift: GiftView)');
    expect(service).toContain('this.toOffer(offer, Number(gift.price))');
    expect(service).toContain('rating: Number(gift.ratingPlaceholder)');
    expect(service).toContain('ratingOptions: [4.5, 4.0, 3.5]');
  });

  it('marketplace responses do not expose admin-only gift or provider data', () => {
    const giftMappingSource = service.slice(service.indexOf('private toGiftListItem'), service.indexOf('private activeOffer(gift'))
    expect(giftMappingSource).toContain('businessName: this.providerName(gift.provider)');
    expect(giftMappingSource).not.toContain('admin');
    expect(giftMappingSource).not.toContain('costPrice');
    expect(giftMappingSource).not.toContain('providerPaymentIntentId');
    expect(giftMappingSource).not.toContain('clientSecret');
  });
});
