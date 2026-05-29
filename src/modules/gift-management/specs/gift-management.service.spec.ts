/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { GiftModerationStatus, GiftStatus, UserRole } from '@prisma/client';
import { GiftFlagReason, GiftModerationAction, GiftRejectReason } from '../dto/gift-management.dto';
import { GiftManagementRepository } from '../repositories/gift-management.repository';
import { GiftManagementService } from '../services/gift-management.service';

const now = new Date();
const gift = {
  id: 'gift_1', name: 'Gift', slug: 'gift', description: null, shortDescription: null, categoryId: 'cat_1', providerId: 'provider_1', price: { toString: () => '10' }, currency: 'USD', imageUrls: [], tags: [], status: GiftStatus.ACTIVE, moderationStatus: GiftModerationStatus.NOT_REQUIRED, isPublished: true, requiresManualReview: false, manualReviewReason: null, hiddenByModeration: false, moderationResolvedAt: null, isFeatured: false, ratingPlaceholder: { toString: () => '0' }, approvedAt: null, approvedBy: null, rejectedAt: null, rejectedBy: null, rejectionReason: null, rejectionComment: null, flaggedAt: null, flaggedById: null, flagReason: null, flagComment: null, createdAt: now, updatedAt: now, deletedAt: null, category: { id: 'cat_1', name: 'Digital', isActive: true, deletedAt: null }, provider: { id: 'provider_1', email: 'p@example.com', providerBusinessName: 'Provider', firstName: 'P', lastName: 'One', isActive: true, isApproved: true, providerApprovalStatus: 'APPROVED', suspendedAt: null, deletedAt: null }, variants: [],
};

function createService() {
  const prisma = {
    $transaction: jest.fn().mockImplementation((input: unknown) => typeof input === 'function' ? (input as (tx: unknown) => unknown)(prisma) : Promise.all(input as unknown[])),
    $queryRaw: jest.fn().mockResolvedValue([{ name: 'Flowers', totalQuantity: BigInt(4), totalSales: { toString: () => '120' } }]),
    giftCategory: {
      findFirst: jest.fn().mockResolvedValue({ id: 'cat_1', name: 'Digital', slug: 'digital', description: null, iconKey: null, color: null, sortOrder: 0, isActive: true, createdAt: now, updatedAt: now, deletedAt: null }),
      count: jest.fn().mockResolvedValue(0),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      update: jest.fn(),
    },
    gift: {
      findFirst: jest.fn().mockResolvedValue(null),
      findUniqueOrThrow: jest.fn().mockResolvedValue(gift),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn().mockResolvedValue(gift),
      update: jest.fn().mockResolvedValue(gift),
    },
    giftVariant: {
      updateMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    review: { groupBy: jest.fn().mockResolvedValue([]) },
    user: { findFirst: jest.fn().mockResolvedValue({ id: 'provider_1', role: UserRole.PROVIDER, deletedAt: null }) },
    notification: { create: jest.fn().mockResolvedValue({ id: 'notification_1' }) },
    adminAuditLog: { create: jest.fn() },
  };
  const audit = { write: jest.fn().mockResolvedValue(undefined) };
  const notificationDispatch = { createAndEmit: jest.fn(), emitExisting: jest.fn() };
  const repository = new GiftManagementRepository(prisma as unknown as ConstructorParameters<typeof GiftManagementRepository>[0], notificationDispatch as never);
  const service = new GiftManagementService(repository, audit as unknown as ConstructorParameters<typeof GiftManagementService>[1]);
  return { service, prisma, audit, repository, notificationDispatch };
}

describe('GiftManagementService', () => {
  it('lists gifts with deleted records excluded', async () => {
    const { service, prisma } = createService();
    await service.listGifts({});
    expect(prisma.gift.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ deletedAt: null }) }));
  });

  it('uses logged-in provider id and optional moderation defaults when provider creates a gift', async () => {
    const { service, prisma } = createService();
    await service.createGift({ uid: 'provider_1', role: UserRole.PROVIDER }, { name: 'Gift', categoryId: 'cat_1', providerId: 'other_provider', price: 10 });
    expect(prisma.gift.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ providerId: 'provider_1', moderationStatus: GiftModerationStatus.NOT_REQUIRED, requiresManualReview: false, hiddenByModeration: false, isPublished: true }) }));
  });

  it('does not require or write stock and SKU fields when super admin creates a gift', async () => {
    const { service, prisma } = createService();
    await service.createGift({ uid: 'admin_1', role: UserRole.SUPER_ADMIN }, { name: 'Gift', categoryId: 'cat_1', providerId: 'provider_1', price: 10, isPublished: true, variants: [{ name: '30ml', price: 89.99 }, { name: '50ml', price: 129.99, isDefault: true }] });
    const createMock = prisma.gift.create;
    const firstCall = createMock.mock.calls.at(0) as [{ data: { variants?: { create: Record<string, unknown>[] } } }] | undefined;
    const data = firstCall?.[0].data as { variants?: { create: Record<string, unknown>[] } };
    expect(data).not.toHaveProperty('stockQuantity');
    expect(data).not.toHaveProperty('sku');
    expect(data.variants?.create[0]).not.toHaveProperty('stockQuantity');
    expect(data.variants?.create[0]).not.toHaveProperty('sku');
  });

  it('returns all image urls and real provider review summary in admin gift list', async () => {
    const { service, prisma } = createService();
    prisma.gift.findMany.mockResolvedValue([{ ...gift, imageUrls: ['one.png', 'two.png'] }]);
    prisma.gift.count.mockResolvedValue(1);
    prisma.review.groupBy.mockResolvedValue([{ providerId: 'provider_1', _avg: { rating: 4.25 }, _count: { _all: 2 } }]);

    const result = await service.listGifts({});

    expect(result.data[0]).toMatchObject({ imageUrl: 'one.png', imageUrls: ['one.png', 'two.png'], rating: 4.3, reviewCount: 2 });
    expect(result.data[0]).not.toHaveProperty('stockQuantity');
    expect(result.data[0]).not.toHaveProperty('sku');
  });

  it('writes audit log when creating gift', async () => {
    const { service, audit } = createService();
    await service.createGift({ uid: 'admin_1', role: UserRole.ADMIN, permissions: { gifts: ['create'] } }, { name: 'Gift', categoryId: 'cat_1', providerId: 'provider_1', price: 10 });
    expect(audit.write).toHaveBeenCalledWith(expect.objectContaining({ action: 'GIFT_CREATED', targetType: 'GIFT' }));
  });

  it('PATCH /gifts/:id updates normal gift fields through the unified endpoint', async () => {
    const { service, prisma, audit } = createService();
    prisma.gift.findFirst.mockResolvedValue(gift);
    prisma.gift.update.mockResolvedValue({ ...gift, shortDescription: 'Updated short copy.' });
    prisma.gift.findUniqueOrThrow.mockResolvedValue({ ...gift, shortDescription: 'Updated short copy.' });

    const result = await service.updateGift({ uid: 'admin_1', role: UserRole.ADMIN, permissions: { gifts: ['update'] } }, 'gift_1', { shortDescription: 'Updated short copy.' });

    expect(result.data.shortDescription).toBe('Updated short copy.');
    expect(prisma.gift.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ shortDescription: 'Updated short copy.' }) }));
    expect(audit.write).toHaveBeenCalledWith(expect.objectContaining({ action: 'GIFT_UPDATED' }));
  });

  it('PATCH /gifts/:id updates operational status and audits the reason', async () => {
    const { service, prisma, audit } = createService();
    prisma.gift.findFirst.mockResolvedValue({ ...gift, status: GiftStatus.INACTIVE, isPublished: false });
    prisma.gift.update.mockResolvedValue({ ...gift, status: GiftStatus.ACTIVE, isPublished: true });
    prisma.gift.findUniqueOrThrow.mockResolvedValue({ ...gift, status: GiftStatus.ACTIVE, isPublished: true });

    const result = await service.updateGift({ uid: 'admin_1', role: UserRole.ADMIN, permissions: { gifts: ['status.update'] } }, 'gift_1', { status: GiftStatus.ACTIVE, reason: 'Back in stock and approved by admin.' });

    expect(result.data.status).toBe(GiftStatus.ACTIVE);
    expect(prisma.gift.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: GiftStatus.ACTIVE, isPublished: true }) }));
    expect(audit.write).toHaveBeenCalledWith(expect.objectContaining({ action: 'GIFT_STATUS_CHANGED', beforeJson: expect.objectContaining({ reason: 'Back in stock and approved by admin.' }), afterJson: expect.objectContaining({ status: GiftStatus.ACTIVE, reason: 'Back in stock and approved by admin.' }) }));
  });

  it('uses order sales aggregates for the most popular category stat', async () => {
    const { service, prisma } = createService();

    const result = await service.categoryStats();

    expect(prisma.$queryRaw).toHaveBeenCalled();
    expect(result.data.mostPopularCategory).toBe('Flowers');
  });

  it('returns null for the most popular category when there are no completed sales', async () => {
    const { service, prisma } = createService();
    prisma.$queryRaw.mockResolvedValueOnce([]);

    const result = await service.categoryStats();

    expect(result.data.mostPopularCategory).toBeNull();
  });

  it('default moderation queue excludes normal NOT_REQUIRED inventory', async () => {
    const { service, prisma } = createService();
    await service.moderationQueue({});
    expect(prisma.gift.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ OR: [{ moderationStatus: { in: [GiftModerationStatus.PENDING, GiftModerationStatus.FLAGGED, GiftModerationStatus.REJECTED] } }, { requiresManualReview: true }] }) }));
  });

  it('approved gifts appear only when explicitly filtered or resolved rows are included', async () => {
    const { service, prisma } = createService();
    await service.moderationQueue({ status: GiftModerationStatus.APPROVED });
    expect(prisma.gift.findMany).toHaveBeenLastCalledWith(expect.objectContaining({ where: expect.objectContaining({ moderationStatus: GiftModerationStatus.APPROVED }) }));
    await service.moderationQueue({ includeResolved: true });
    expect(prisma.gift.findMany).toHaveBeenLastCalledWith(expect.objectContaining({ where: expect.objectContaining({ deletedAt: null }) }));
  });

  it('flag with hideFromMarketplace hides gift from customer marketplace', async () => {
    const { service, prisma, notificationDispatch } = createService();
    prisma.gift.findFirst.mockResolvedValue(gift);
    await service.moderationAction({ uid: 'admin_1', role: UserRole.SUPER_ADMIN }, 'gift_1', { action: GiftModerationAction.FLAG, reason: GiftFlagReason.NEEDS_MANUAL_REVIEW, comment: 'Suspicious image.', hideFromMarketplace: true, notifyProvider: true });
    expect(prisma.gift.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ moderationStatus: GiftModerationStatus.FLAGGED, requiresManualReview: true, hiddenByModeration: true, isPublished: false }) }));
    expect(notificationDispatch.createAndEmit).toHaveBeenCalled();
  });

  it('flag without hideFromMarketplace leaves visibility unchanged but appears in moderation queue', async () => {
    const { service, prisma } = createService();
    prisma.gift.findFirst.mockResolvedValue(gift);
    await service.moderationAction({ uid: 'admin_1', role: UserRole.SUPER_ADMIN }, 'gift_1', { action: GiftModerationAction.FLAG, reason: GiftFlagReason.NEEDS_MANUAL_REVIEW, hideFromMarketplace: false });
    expect(prisma.gift.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ moderationStatus: GiftModerationStatus.FLAGGED, requiresManualReview: true, hiddenByModeration: false, isPublished: true }) }));
  });

  it('approve clears review block', async () => {
    const { service, prisma } = createService();
    prisma.gift.findFirst.mockResolvedValue({ ...gift, requiresManualReview: true, hiddenByModeration: true, moderationStatus: GiftModerationStatus.FLAGGED, isPublished: false });
    await service.moderationAction({ uid: 'admin_1', role: UserRole.SUPER_ADMIN }, 'gift_1', { action: GiftModerationAction.APPROVE });
    expect(prisma.gift.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ moderationStatus: GiftModerationStatus.APPROVED, requiresManualReview: false, hiddenByModeration: false, manualReviewReason: null, isPublished: true }) }));
  });

  it('reject hides gift', async () => {
    const { service, prisma, notificationDispatch } = createService();
    prisma.gift.findFirst.mockResolvedValue(gift);
    await service.moderationAction({ uid: 'admin_1', role: UserRole.SUPER_ADMIN }, 'gift_1', { action: GiftModerationAction.REJECT, reason: GiftRejectReason.POLICY_VIOLATION, notifyProvider: true });
    expect(prisma.gift.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ moderationStatus: GiftModerationStatus.REJECTED, requiresManualReview: false, hiddenByModeration: true, isPublished: false, status: GiftStatus.INACTIVE }) }));
    expect(notificationDispatch.createAndEmit).toHaveBeenCalled();
  });

  it('action-specific gift moderation permissions are enforced', async () => {
    const { service, prisma } = createService();
    prisma.gift.findFirst.mockResolvedValue(gift);

    await expect(service.moderationAction({ uid: 'admin_1', role: UserRole.ADMIN, permissions: { giftModeration: ['flag'] } }, 'gift_1', { action: GiftModerationAction.APPROVE })).rejects.toThrow('Your role does not have the required permission');
    await expect(service.moderationAction({ uid: 'admin_1', role: UserRole.ADMIN, permissions: { giftModeration: ['approve'] } }, 'gift_1', { action: GiftModerationAction.REJECT, reason: GiftRejectReason.POLICY_VIOLATION })).rejects.toThrow('Your role does not have the required permission');
    await expect(service.moderationAction({ uid: 'admin_1', role: UserRole.ADMIN, permissions: { giftModeration: ['reject'] } }, 'gift_1', { action: GiftModerationAction.FLAG, reason: GiftFlagReason.NEEDS_MANUAL_REVIEW })).rejects.toThrow('Your role does not have the required permission');
  });

  it('admin permissions allow matching gift moderation actions', async () => {
    const { service, prisma, audit } = createService();
    prisma.gift.findFirst
      .mockResolvedValueOnce({ ...gift, requiresManualReview: true, hiddenByModeration: true, moderationStatus: GiftModerationStatus.FLAGGED, isPublished: false })
      .mockResolvedValueOnce(gift)
      .mockResolvedValueOnce(gift);
    const admin = { uid: 'admin_1', role: UserRole.ADMIN, permissions: { giftModeration: ['approve', 'reject', 'flag'] } };

    await service.moderationAction(admin, 'gift_1', { action: GiftModerationAction.APPROVE });
    await service.moderationAction(admin, 'gift_1', { action: GiftModerationAction.REJECT, reason: GiftRejectReason.POLICY_VIOLATION });
    await service.moderationAction(admin, 'gift_1', { action: GiftModerationAction.FLAG, reason: GiftFlagReason.POLICY_REVIEW });

    expect(audit.write).toHaveBeenCalledWith(expect.objectContaining({ action: 'GIFT_APPROVED' }));
    expect(audit.write).toHaveBeenCalledWith(expect.objectContaining({ action: 'GIFT_REJECTED' }));
    expect(audit.write).toHaveBeenCalledWith(expect.objectContaining({ action: 'GIFT_FLAGGED' }));
  });

});
