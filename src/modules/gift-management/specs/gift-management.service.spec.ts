/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { GiftModerationStatus, GiftStatus, UserRole } from '@prisma/client';
import { GiftFlagReason, GiftRejectReason } from '../dto/gift-management.dto';
import { GiftManagementRepository } from '../repositories/gift-management.repository';
import { GiftManagementService } from '../services/gift-management.service';

const now = new Date();
const gift = {
  id: 'gift_1', name: 'Gift', slug: 'gift', description: null, shortDescription: null, categoryId: 'cat_1', providerId: 'provider_1', price: { toString: () => '10' }, currency: 'USD', stockQuantity: 5, sku: null, imageUrls: [], tags: [], status: GiftStatus.ACTIVE, moderationStatus: GiftModerationStatus.NOT_REQUIRED, isPublished: true, requiresManualReview: false, manualReviewReason: null, hiddenByModeration: false, moderationResolvedAt: null, isFeatured: false, ratingPlaceholder: { toString: () => '4.8' }, approvedAt: null, approvedBy: null, rejectedAt: null, rejectedBy: null, rejectionReason: null, rejectionComment: null, flaggedAt: null, flaggedById: null, flagReason: null, flagComment: null, createdAt: now, updatedAt: now, deletedAt: null, category: { id: 'cat_1', name: 'Digital', isActive: true, deletedAt: null }, provider: { id: 'provider_1', email: 'p@example.com', providerBusinessName: 'Provider', firstName: 'P', lastName: 'One', isActive: true, isApproved: true, providerApprovalStatus: 'APPROVED', suspendedAt: null, deletedAt: null }, variants: [],
};

function createService() {
  const prisma = {
    $transaction: jest.fn().mockImplementation((items: unknown[]) => Promise.all(items)),
    giftCategory: {
      findFirst: jest.fn().mockResolvedValue({ id: 'cat_1', name: 'Digital', slug: 'digital', description: null, iconKey: null, color: null, sortOrder: 0, isActive: true, createdAt: now, updatedAt: now, deletedAt: null }),
      count: jest.fn().mockResolvedValue(0),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      update: jest.fn(),
    },
    gift: {
      findFirst: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn().mockResolvedValue(gift),
      update: jest.fn().mockResolvedValue(gift),
    },
    user: { findFirst: jest.fn().mockResolvedValue({ id: 'provider_1', role: UserRole.PROVIDER, deletedAt: null }) },
    notification: { create: jest.fn().mockResolvedValue({ id: 'notification_1' }) },
    adminAuditLog: { create: jest.fn() },
  };
  const audit = { write: jest.fn().mockResolvedValue(undefined) };
  const repository = new GiftManagementRepository(prisma as unknown as ConstructorParameters<typeof GiftManagementRepository>[0]);
  const service = new GiftManagementService(repository, audit as unknown as ConstructorParameters<typeof GiftManagementService>[1]);
  return { service, prisma, audit, repository };
}

describe('GiftManagementService', () => {
  it('lists gifts with deleted records excluded', async () => {
    const { service, prisma } = createService();
    await service.listGifts({});
    expect(prisma.gift.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ deletedAt: null }) }));
  });

  it('uses logged-in provider id and optional moderation defaults when provider creates a gift', async () => {
    const { service, prisma } = createService();
    await service.createGift({ uid: 'provider_1', role: UserRole.PROVIDER }, { name: 'Gift', categoryId: 'cat_1', providerId: 'other_provider', price: 10, stockQuantity: 5 });
    expect(prisma.gift.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ providerId: 'provider_1', moderationStatus: GiftModerationStatus.NOT_REQUIRED, requiresManualReview: false, hiddenByModeration: false, isPublished: true }) }));
  });

  it('writes audit log when creating gift', async () => {
    const { service, audit } = createService();
    await service.createGift({ uid: 'admin_1', role: UserRole.ADMIN }, { name: 'Gift', categoryId: 'cat_1', providerId: 'provider_1', price: 10 });
    expect(audit.write).toHaveBeenCalledWith(expect.objectContaining({ action: 'GIFT_CREATED', targetType: 'GIFT' }));
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
    const { service, prisma } = createService();
    prisma.gift.findFirst.mockResolvedValue(gift);
    await service.flagGift({ uid: 'admin_1', role: UserRole.SUPER_ADMIN }, 'gift_1', { reason: GiftFlagReason.NEEDS_MANUAL_REVIEW, comment: 'Suspicious image.', hideFromMarketplace: true, notifyProvider: true });
    expect(prisma.gift.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ moderationStatus: GiftModerationStatus.FLAGGED, requiresManualReview: true, hiddenByModeration: true, isPublished: false }) }));
    expect(prisma.notification.create).toHaveBeenCalled();
  });

  it('flag without hideFromMarketplace leaves visibility unchanged but appears in moderation queue', async () => {
    const { service, prisma } = createService();
    prisma.gift.findFirst.mockResolvedValue(gift);
    await service.flagGift({ uid: 'admin_1', role: UserRole.SUPER_ADMIN }, 'gift_1', { reason: GiftFlagReason.NEEDS_MANUAL_REVIEW, hideFromMarketplace: false });
    expect(prisma.gift.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ moderationStatus: GiftModerationStatus.FLAGGED, requiresManualReview: true, hiddenByModeration: false, isPublished: true }) }));
  });

  it('approve clears review block', async () => {
    const { service, prisma } = createService();
    prisma.gift.findFirst.mockResolvedValue({ ...gift, requiresManualReview: true, hiddenByModeration: true, moderationStatus: GiftModerationStatus.FLAGGED, isPublished: false });
    await service.approveGift({ uid: 'admin_1', role: UserRole.SUPER_ADMIN }, 'gift_1', { publishNow: true });
    expect(prisma.gift.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ moderationStatus: GiftModerationStatus.APPROVED, requiresManualReview: false, hiddenByModeration: false, manualReviewReason: null, isPublished: true }) }));
  });

  it('reject hides gift', async () => {
    const { service, prisma } = createService();
    prisma.gift.findFirst.mockResolvedValue(gift);
    await service.rejectGift({ uid: 'admin_1', role: UserRole.SUPER_ADMIN }, 'gift_1', { reason: GiftRejectReason.POLICY_VIOLATION, notifyProvider: true });
    expect(prisma.gift.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ moderationStatus: GiftModerationStatus.REJECTED, requiresManualReview: false, hiddenByModeration: true, isPublished: false, status: GiftStatus.INACTIVE }) }));
    expect(prisma.notification.create).toHaveBeenCalled();
  });
});
