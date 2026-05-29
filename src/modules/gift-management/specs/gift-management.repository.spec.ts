import { readFileSync } from 'fs';
import { join } from 'path';

describe('Gift management repository cleanup', () => {
  const service = readFileSync(join(__dirname, '../services/gift-management.service.ts'), 'utf8');
  const repository = readFileSync(join(__dirname, '../repositories/gift-management.repository.ts'), 'utf8');
  const categoriesController = readFileSync(join(__dirname, '../controllers/gift-categories.controller.ts'), 'utf8');
  const lookupController = readFileSync(join(__dirname, '../controllers/gift-categories-lookup.controller.ts'), 'utf8');
  const giftsController = readFileSync(join(__dirname, '../controllers/gifts.controller.ts'), 'utf8');
  const moderationController = readFileSync(join(__dirname, '../controllers/gift-moderation.controller.ts'), 'utf8');
  const customerMarketplaceService = readFileSync(join(__dirname, '../../customer-marketplace/services/customer-marketplace.service.ts'), 'utf8');

  it('keeps gift category API behavior stable', () => {
    for (const route of ["@Get()", "@Post()", "@Get('stats')", "@Get(':id')", "@Patch(':id')", "@Delete(':id')"]) expect(categoriesController).toContain(route);
    expect(lookupController).toContain("@Controller('gift-categories/lookup')");
    expect(lookupController).toContain('@Get()');
    expect(lookupController).not.toContain('JwtAuthGuard');
    expect(categoriesController).toContain("@Permissions('giftCategories.create')");
    expect(categoriesController).toContain("@Permissions('giftCategories.delete')");
  });

  it('keeps gift management and moderation API behavior stable', () => {
    for (const route of ["@Get()", "@Post()", "@Get('stats')", "@Get('export')", "@Get(':id')", "@Patch(':id')", "@Delete(':id')"]) expect(giftsController).toContain(route);
    expect(giftsController).not.toContain("@Patch(':id/status')");
    for (const route of ["@Get()", "@Post(':id/action')"]) expect(moderationController).toContain(route);
    for (const oldRoute of ["@Patch(':id/approve')", "@Patch(':id/reject')", "@Patch(':id/flag')"]) expect(moderationController).not.toContain(oldRoute);
    expect(giftsController).toContain("@Permissions('gifts.create')");
    expect(moderationController).toContain("'giftModeration.approve'");
    expect(moderationController).toContain("'giftModeration.reject'");
    expect(moderationController).toContain("'giftModeration.flag'");
  });

  it('repository owns gift category DB access', () => {
    for (const method of ['findGiftCategories', 'countGiftCategories', 'findGiftCategoryById', 'createGiftCategory', 'updateGiftCategory', 'deleteGiftCategory', 'countGiftsByCategory', 'findGiftCategoryLookup', 'findGiftCategoryStats']) expect(repository).toContain(method);
    expect(repository).toContain('this.prisma.giftCategory.findMany');
    expect(repository).toContain('this.prisma.giftCategory.create');
    expect(repository).toContain('this.prisma.giftCategory.update');
    expect(repository).toContain('this.prisma.giftCategory.delete');
    expect(service).toContain('Category has attached gifts and cannot be deleted');
  });

  it('repository owns admin gift and variant DB access', () => {
    for (const method of ['findGiftsForAdmin', 'countGiftsForAdmin', 'findGiftByIdWithVariants', 'createGiftWithVariants', 'updateGiftBase', 'deleteGift', 'findGiftStats', 'findGiftsForExport']) expect(repository).toContain(method);
    expect(repository).not.toContain('updateGiftStatus');
    for (const method of ['softDeleteVariantsForGift', 'clearDefaultVariantsForGift', 'findGiftVariantForGift', 'updateGiftVariant', 'createGiftVariant']) expect(repository).toContain(method);
    expect(repository).toContain('this.prisma.gift.create');
    expect(repository).toContain('tx.gift.update');
    expect(repository).toContain('tx.giftVariant.updateMany');
    expect(repository).toContain('tx.giftVariant.create');
  });

  it('service preserves slug, variant, and default variant business rules', () => {
    expect(service).toContain('uniqueCategorySlug');
    expect(service).toContain('uniqueGiftSlug');
    expect(service).not.toContain('Gift SKU already exists');
    expect(service).not.toContain('Variant SKU must be unique');
    expect(service).toContain('Only one default variant is allowed');
    expect(service).toContain('if (!normalized.some((variant) => variant.isDefault)) normalized[0].isDefault = true');
    expect(service).toContain('Variant does not belong to gift');
  });

  it('service preserves admin gift create/update/delete/status behavior', () => {
    expect(service).toContain('const providerId = user.role === UserRole.PROVIDER ? user.uid : dto.providerId');
    expect(service).toContain('statusFromPublication');
    expect(service).toContain('dto.status === GiftStatus.ACTIVE ? true : dto.isPublished');
    expect(service).toContain('Provider cannot manage another provider gift');
    expect(service).toContain('GIFT_CREATED');
    expect(service).toContain('GIFT_UPDATED');
    expect(service).toContain('GIFT_DELETED');
    expect(service).toContain('GIFT_STATUS_CHANGED');
    expect(service).toContain('assertGiftUpdatePermission');
  });

  it('old gift status route is removed from Swagger and update docs include status examples', () => {
    const openapi = JSON.parse(readFileSync(join(__dirname, '../../../../docs/generated/openapi.json'), 'utf8')) as { paths: Record<string, unknown> };
    expect(giftsController).not.toContain("@Patch(':id/status')");
    expect(openapi.paths['/api/v1/gifts/{id}/status']).toBeUndefined();
    expect(giftsController).toContain('activateGift');
    expect(giftsController).toContain('deactivateGift');
    expect(giftsController).toContain('markOutOfStock');
  });

  it('repository owns gift moderation DB access and service preserves workflow decisions', () => {
    expect(repository).toContain('findGiftModerationQueue');
    expect(repository).toContain('updateGiftModerationStatus');
    expect(repository).toContain('findGiftModerationQueue');
    expect(service).toContain('moderationQueueWhere');
    expect(service).toContain('GiftModerationStatus.NOT_REQUIRED');
    expect(service).toContain('GiftModerationStatus.APPROVED');
    expect(service).toContain('GiftModerationStatus.REJECTED');
    expect(service).toContain('GiftModerationStatus.FLAGGED');
    expect(service).toContain('GIFT_APPROVED');
    expect(service).toContain('GIFT_REJECTED');
    expect(service).toContain('GIFT_FLAGGED');
  });

  it('provider inventory no-moderation marketplace rule is not affected', () => {
    expect(customerMarketplaceService).not.toContain('moderationStatus: GiftModerationStatus.APPROVED');
    expect(customerMarketplaceService).toContain('moderationStatus: { not: GiftModerationStatus.REJECTED }');
    expect(customerMarketplaceService).toContain('hiddenByModeration: false');
    expect(customerMarketplaceService).toContain('requiresManualReview: false');
    expect(customerMarketplaceService).toContain('isPublished: true');
    expect(customerMarketplaceService).toContain('providerApprovalStatus: ProviderApprovalStatus.APPROVED');
  });

  it('service no longer injects PrismaService directly for gift-management DB access', () => {
    expect(service).not.toContain('private readonly prisma');
    expect(service).toContain('private readonly giftManagementRepository');
  });
});
