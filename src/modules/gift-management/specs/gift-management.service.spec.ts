/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { GiftModerationStatus, GiftStatus, UserRole } from '@prisma/client';
import { GiftManagementRepository } from '../repositories/gift-management.repository';
import { GiftManagementService } from '../services/gift-management.service';

function createService() {
  const prisma = {
    $transaction: jest.fn().mockImplementation((items: unknown[]) => Promise.all(items)),
    giftCategory: {
      findFirst: jest.fn().mockResolvedValue({ id: 'cat_1', name: 'Digital', slug: 'digital', description: null, iconKey: null, color: null, sortOrder: 0, isActive: true, createdAt: new Date(), updatedAt: new Date(), deletedAt: null }),
      count: jest.fn().mockResolvedValue(0),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      update: jest.fn(),
    },
    gift: {
      findFirst: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn().mockResolvedValue({
        id: 'gift_1', name: 'Gift', slug: 'gift', description: null, shortDescription: null, categoryId: 'cat_1', providerId: 'provider_1', price: { toString: () => '10' }, currency: 'USD', stockQuantity: 5, sku: null, imageUrls: [], tags: [], status: GiftStatus.INACTIVE, moderationStatus: GiftModerationStatus.PENDING, isPublished: false, isFeatured: false, ratingPlaceholder: { toString: () => '4.8' }, approvedAt: null, approvedBy: null, rejectedAt: null, rejectedBy: null, rejectionReason: null, rejectionComment: null, flaggedAt: null, flaggedBy: null, flagReason: null, flagComment: null, createdAt: new Date(), updatedAt: new Date(), deletedAt: null, category: { id: 'cat_1', name: 'Digital' }, provider: { id: 'provider_1', email: 'p@example.com', providerBusinessName: 'Provider', firstName: 'P', lastName: 'One' },
      }),
      update: jest.fn(),
    },
    user: { findFirst: jest.fn().mockResolvedValue({ id: 'provider_1', role: UserRole.PROVIDER, deletedAt: null }) },
    adminAuditLog: { create: jest.fn() },
  };
  const audit = { write: jest.fn().mockResolvedValue(undefined) };
  const repository = new GiftManagementRepository(prisma as unknown as ConstructorParameters<typeof GiftManagementRepository>[0]);
  const service = new GiftManagementService(
    repository,
    audit as unknown as ConstructorParameters<typeof GiftManagementService>[1],
  );
  return { service, prisma, audit, repository };
}

describe('GiftManagementService', () => {
  it('lists gifts with deleted records excluded', async () => {
    const { service, prisma } = createService();
    await service.listGifts({});
    expect(prisma.gift.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ deletedAt: null }) }));
  });

  it('uses logged-in provider id when provider creates a gift', async () => {
    const { service, prisma } = createService();
    await service.createGift({ uid: 'provider_1', role: UserRole.PROVIDER }, { name: 'Gift', categoryId: 'cat_1', providerId: 'other_provider', price: 10 });
    expect(prisma.gift.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ providerId: 'provider_1', moderationStatus: GiftModerationStatus.PENDING }) }));
  });

  it('writes audit log when creating gift', async () => {
    const { service, audit } = createService();
    await service.createGift({ uid: 'admin_1', role: UserRole.ADMIN }, { name: 'Gift', categoryId: 'cat_1', providerId: 'provider_1', price: 10 });
    expect(audit.write).toHaveBeenCalledWith(expect.objectContaining({ action: 'GIFT_CREATED', targetType: 'GIFT' }));
  });
});
