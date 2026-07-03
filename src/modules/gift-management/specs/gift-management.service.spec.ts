/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { ValidationPipe } from '@nestjs/common';
import { GiftStatus, UserRole } from '@prisma/client';
import { GiftCategorySortBy, SortOrder, UpdateGiftDto } from '../dto/gift-management.dto';
import { GiftManagementRepository } from '../repositories/gift-management.repository';
import { GiftManagementService } from '../services/gift-management.service';

const now = new Date();
const gift = {
  id: 'gift_1', name: 'Gift', slug: 'gift', description: null, categoryId: 'cat_1', providerId: 'provider_1',
  price: { toString: () => '10' }, currency: 'USD', imageUrls: [], status: GiftStatus.ACTIVE,
  isFeatured: false, ratingPlaceholder: { toString: () => '0' }, createdAt: now, updatedAt: now,
  category: { id: 'cat_1', name: 'Digital', isActive: true, deletedAt: null },
  provider: { id: 'provider_1', email: 'p@example.com', providerBusinessName: 'Provider', firstName: 'P', lastName: 'One', isActive: true, isApproved: true, suspendedAt: null },
  variants: [],
};

function createService() {
  const prisma = {
    $transaction: jest.fn().mockImplementation((input: unknown) => typeof input === 'function' ? (input as (tx: unknown) => unknown)(prisma) : Promise.all(input as unknown[])),
    $queryRaw: jest.fn().mockResolvedValue([{ name: 'Flowers', totalQuantity: BigInt(4), totalSales: { toString: () => '120' } }]),
    giftCategory: {
      findFirst: jest.fn().mockResolvedValue({ id: 'cat_1', name: 'Digital', slug: 'digital', description: null, iconKey: null, color: null, backgroundColor: null, imageUrl: null, sortOrder: 0, isActive: true, createdAt: now, updatedAt: now, deletedAt: null }),
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
      delete: jest.fn(),
    },
    giftVariant: {
      deleteMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    review: { groupBy: jest.fn().mockResolvedValue([]) },
    user: { findFirst: jest.fn().mockResolvedValue({ id: 'provider_1', role: UserRole.PROVIDER }) },
  };
  const audit = { write: jest.fn().mockResolvedValue(undefined) };
  const notificationDispatch = { createAndEmit: jest.fn(), emitExisting: jest.fn() };
  const repository = new GiftManagementRepository(prisma as unknown as ConstructorParameters<typeof GiftManagementRepository>[0], notificationDispatch as never);
  const service = new GiftManagementService(repository, audit as unknown as ConstructorParameters<typeof GiftManagementService>[1]);
  return { service, prisma, audit };
}

describe('GiftManagementService', () => {
  it('lists gifts without soft-delete or moderation filters', async () => {
    const { service, prisma } = createService();
    await service.listGifts({});
    expect(prisma.gift.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: {} }));
  });

  it('lists newly created gift categories first by default and respects explicit sort', async () => {
    const { service, prisma } = createService();
    await service.listCategories({});
    await service.listCategories({ sortBy: GiftCategorySortBy.NAME, sortOrder: SortOrder.ASC });
    expect(prisma.giftCategory.findMany).toHaveBeenNthCalledWith(1, expect.objectContaining({ orderBy: { createdAt: 'desc' } }));
    expect(prisma.giftCategory.findMany).toHaveBeenNthCalledWith(2, expect.objectContaining({ orderBy: { name: 'asc' } }));
  });

  it('creates gifts with simple status and name/price variants only', async () => {
    const { service, prisma } = createService();
    await service.createGift({ uid: 'admin_1', role: UserRole.SUPER_ADMIN }, { name: 'Gift', categoryId: 'cat_1', providerId: 'provider_1', price: 10, variants: [{ name: '50ml', price: 129.99 }] });
    const data = prisma.gift.create.mock.calls[0][0].data;
    expect(data).toEqual(expect.objectContaining({ status: GiftStatus.ACTIVE, providerId: 'provider_1' }));
    expect(data).not.toHaveProperty('isPublished');
    expect(data).not.toHaveProperty('moderationStatus');
    expect(data.variants.create[0]).toEqual({ name: '50ml', price: expect.any(Object) });
  });

  it('creates provider gifts for the authenticated provider as inactive', async () => {
    const { service, prisma } = createService();
    await service.createGift({ uid: 'provider_1', role: UserRole.PROVIDER }, { name: 'Gift', categoryId: 'cat_1', price: 10, status: GiftStatus.ACTIVE });
    const data = prisma.gift.create.mock.calls[0][0].data;
    expect(data).toEqual(expect.objectContaining({ status: GiftStatus.INACTIVE, providerId: 'provider_1' }));
  });

  it('requires gifts.create permission for staff gift creation', async () => {
    const { service } = createService();
    await expect(service.createGift({ uid: 'staff_1', role: UserRole.STAFF, permissions: { gifts: ['read'] } }, { name: 'Gift', categoryId: 'cat_1', providerId: 'provider_1', price: 10 })).rejects.toThrow('Your role does not have the required permission');
  });

  it('updates normal gift fields through the unified endpoint', async () => {
    const { service, prisma, audit } = createService();
    prisma.gift.findFirst.mockResolvedValue(gift);
    prisma.gift.update.mockResolvedValue({ ...gift, description: 'Updated copy.' });
    prisma.gift.findUniqueOrThrow.mockResolvedValue({ ...gift, description: 'Updated copy.' });
    const result = await service.updateGift({ uid: 'admin_1', role: UserRole.STAFF, permissions: { gifts: ['update'] } }, 'gift_1', { description: 'Updated copy.' });
    expect(result.data.description).toBe('Updated copy.');
    expect(prisma.gift.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ description: 'Updated copy.' }) }));
    expect(audit.write).toHaveBeenCalledWith(expect.objectContaining({ action: 'GIFT_UPDATED' }));
  });

  it('updates variants with partial variant fields', async () => {
    const { service, prisma } = createService();
    const existingVariant = { id: 'variant_1', giftId: 'gift_1', name: '50ml', price: { toString: () => '129.99' }, createdAt: now, updatedAt: now };
    prisma.gift.findFirst.mockResolvedValue({ ...gift, variants: [existingVariant] });
    prisma.giftVariant.findFirst.mockResolvedValue(existingVariant);
    prisma.gift.findUniqueOrThrow.mockResolvedValue({ ...gift, variants: [{ ...existingVariant, price: { toString: () => '149.99' } }] });
    const result = await service.updateGift({ uid: 'admin_1', role: UserRole.STAFF, permissions: { gifts: ['update'] } }, 'gift_1', { variants: [{ id: 'variant_1', price: 149.99 }] });
    expect(result.data.variants[0]).toMatchObject({ id: 'variant_1', price: 149.99 });
    expect(prisma.giftVariant.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'variant_1' }, data: expect.objectContaining({ price: expect.any(Object) }) }));
  });

  it('accepts partial update variant DTOs', async () => {
    const pipe = new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true });
    await expect(pipe.transform({ variants: [{ id: 'variant_1', price: 149.99 }] }, { type: 'body', metatype: UpdateGiftDto })).resolves.toBeInstanceOf(UpdateGiftDto);
  });

  it('updates operational status and audits the reason', async () => {
    const { service, prisma, audit } = createService();
    prisma.gift.findFirst.mockResolvedValue({ ...gift, status: GiftStatus.INACTIVE });
    prisma.gift.update.mockResolvedValue({ ...gift, status: GiftStatus.ACTIVE });
    prisma.gift.findUniqueOrThrow.mockResolvedValue({ ...gift, status: GiftStatus.ACTIVE });
    const result = await service.updateGift({ uid: 'admin_1', role: UserRole.STAFF, permissions: { gifts: ['status.update'] } }, 'gift_1', { status: GiftStatus.ACTIVE, reason: 'Back in stock.' });
    expect(result.data.status).toBe(GiftStatus.ACTIVE);
    expect(prisma.gift.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: GiftStatus.ACTIVE }) }));
    expect(audit.write).toHaveBeenCalledWith(expect.objectContaining({ action: 'GIFT_STATUS_CHANGED', beforeJson: expect.objectContaining({ reason: 'Back in stock.' }) }));
  });

  it('uses order sales aggregates for the most popular category stat', async () => {
    const { service, prisma } = createService();
    const result = await service.categoryStats();
    expect(prisma.$queryRaw).toHaveBeenCalled();
    expect(result.data.mostPopularCategory).toBe('Flowers');
  });
});
