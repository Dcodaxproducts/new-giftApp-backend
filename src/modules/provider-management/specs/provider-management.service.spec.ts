/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { BadRequestException, ForbiddenException, ValidationPipe } from '@nestjs/common';
import { GiftStatus, ProviderApprovalStatus, UserRole } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';
import { CreateProviderDto, ExportFormat, ProviderItemSortBy, ProviderItemStatus, ProviderLifecycleAction, ProviderLifecycleReason, ProviderSortBy, ProviderStatusUpdate, SortOrder } from '../dto/provider-management.dto';
import { ProviderManagementRepository } from '../repositories/provider-management.repository';
import { ProviderManagementService } from '../services/provider-management.service';


const providerLifecycleAdmin = {
  uid: 'admin_1',
  role: UserRole.ADMIN,
  permissions: { providers: ['approve', 'reject', 'suspend', 'updateStatus'] },
};

const now = new Date('2026-05-14T10:00:00.000Z');

const provider: Record<string, unknown> = {
  id: 'provider_1',
  email: 'provider@example.com',
  firstName: 'Premium',
  lastName: 'Provider',
  providerBusinessName: 'Premium Gifts Co',
  providerLegalName: 'Premium Gifts Co. Ltd',
  providerBusinessEmail: 'business@example.com',
  providerBusinessPhone: '+15550001111',
  providerBusinessCategoryId: 'provider_business_category_id',
  providerTaxId: 'TAX-12345',
  providerBusinessAddress: '123 Gift Street',
  role: UserRole.PROVIDER,
  deletedAt: null,
  isActive: false,
  isApproved: false,
  providerApprovalStatus: ProviderApprovalStatus.PENDING,
  providerApprovedAt: null,
  providerApprovedBy: null,
  providerRejectedAt: null,
  providerRejectedBy: null,
  providerRejectionReason: null,
  providerRejectionComment: null,
  providerDocuments: null,
  providerStoreAddress: null,
  suspendedAt: null,
  suspensionReason: null,
  suspensionComment: null,
  suspendedBy: null,
  refreshTokenHash: 'refresh_hash',
  createdAt: new Date('2026-05-01T00:00:00.000Z'),
};

function createService(overrides: Record<string, unknown> = {}) {
  const currentProvider = { ...provider, ...overrides };
  const prisma = {
    $transaction: jest.fn().mockImplementation((input: unknown) => typeof input === 'function' ? (input as (tx: unknown) => unknown)(prisma) : Promise.all(input as unknown[])),
    user: {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      findFirst: jest.fn().mockResolvedValue(currentProvider),
      update: jest.fn().mockImplementation(({ data }) => Promise.resolve({ ...currentProvider, ...data })),
      create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'provider_new', ...data })),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    accountSuspension: {
      create: jest.fn().mockResolvedValue({ id: 'suspension_1' }),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      deleteMany: jest.fn(),
    },
    authSession: { deleteMany: jest.fn() },
    notification: { create: jest.fn().mockResolvedValue({ id: 'notification_1' }), deleteMany: jest.fn() },
    notificationDeviceToken: { deleteMany: jest.fn() },
    uploadedFile: { deleteMany: jest.fn(), findMany: jest.fn().mockResolvedValue([]) },
    providerOrder: { count: jest.fn().mockResolvedValue(0) },
    providerOrderItem: { groupBy: jest.fn().mockResolvedValue([]) },
    providerBusinessCategory: { findUnique: jest.fn().mockResolvedValue({ id: 'provider_business_category_id', isActive: true }) },
    promotionalOffer: { updateMany: jest.fn(), deleteMany: jest.fn() },
    gift: { findMany: jest.fn().mockResolvedValue([]), updateMany: jest.fn(), deleteMany: jest.fn() },
    adminAuditLog: { create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'provider_new', ...data })), findMany: jest.fn().mockResolvedValue([]) },
  };
  const mailer = {
    sendAccountStatusEmail: jest.fn(),
    sendProviderApprovedEmail: jest.fn(),
    sendProviderRejectedEmail: jest.fn(),
    sendProviderMessageEmail: jest.fn(),
    sendProviderInviteEmail: jest.fn(),
  };
  const notificationDispatch = { createAndEmit: jest.fn(), emitExisting: jest.fn() };
  const repository = new ProviderManagementRepository(prisma as never, notificationDispatch as never);
  const service = new ProviderManagementService(
    repository,
    mailer as unknown as ConstructorParameters<typeof ProviderManagementService>[1],
  );
  return { service, repository, prisma, mailer, notificationDispatch };
}

describe('ProviderManagementService', () => {
  it('admin can list providers with filters through repository-owned Prisma access', async () => {
    const { service, prisma } = createService();

    await service.list({ search: 'Premium', approvalStatus: ProviderApprovalStatus.PENDING });

    expect(prisma.user.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        role: UserRole.PROVIDER,
        providerApprovalStatus: ProviderApprovalStatus.PENDING,
        OR: expect.arrayContaining([
          expect.objectContaining({ providerBusinessName: expect.objectContaining({ contains: 'Premium' }) }),
        ]),
      }),
    }));
  });

  it('provider list uses aggregate map once and avoids placeholder stats', async () => {
    const { service, repository } = createService();
    jest.spyOn(repository, 'findManyProviders').mockResolvedValue([{ ...provider }] as never);
    jest.spyOn(repository, 'countProviders').mockResolvedValue(1);
    const aggregateSpy = jest.spyOn(repository, 'findProviderAggregateMap').mockResolvedValue(new Map([['provider_1', { revenue: 1200, performanceStats: 88.5, performanceChangePercent: 10, listedItems: 6, listedItemsChange: 2, orderFulfillment: 91.25, orderFulfillmentChangePercent: 5, disputeCount: 1, disputeChangePercent: -50, averageRating: 4.7, reviewCount: 14 }]]));

    const result = await service.list({ page: 1, limit: 10 });

    expect(aggregateSpy).toHaveBeenCalledTimes(1);
    expect(result.data[0]).toEqual(expect.objectContaining({ revenue: 1200, listedItems: 6, performanceStats: 88.5 }));
  });

  it('provider revenue sort uses batched aggregate values before pagination', async () => {
    const { service, repository } = createService();
    jest.spyOn(repository, 'findManyProviders').mockResolvedValue([
      { ...provider, id: 'provider_low', createdAt: new Date('2026-05-02T00:00:00.000Z') },
      { ...provider, id: 'provider_high', createdAt: new Date('2026-05-01T00:00:00.000Z') },
    ] as never);
    const countSpy = jest.spyOn(repository, 'countProviders');
    const aggregateSpy = jest.spyOn(repository, 'findProviderAggregateMap').mockResolvedValue(new Map([
      ['provider_low', { revenue: 100, performanceStats: 0, performanceChangePercent: 0, listedItems: 0, listedItemsChange: 0, orderFulfillment: 0, orderFulfillmentChangePercent: 0, disputeCount: 0, disputeChangePercent: 0, averageRating: 0, reviewCount: 0 }],
      ['provider_high', { revenue: 900, performanceStats: 0, performanceChangePercent: 0, listedItems: 0, listedItemsChange: 0, orderFulfillment: 0, orderFulfillmentChangePercent: 0, disputeCount: 0, disputeChangePercent: 0, averageRating: 0, reviewCount: 0 }],
    ]));

    const result = await service.list({ page: 1, limit: 1, sortBy: ProviderSortBy.REVENUE, sortOrder: SortOrder.DESC });

    expect(aggregateSpy).toHaveBeenCalledWith(['provider_low', 'provider_high']);
    expect(countSpy).not.toHaveBeenCalled();
    expect(result.data).toHaveLength(1);
    expect(result.data[0]).toEqual(expect.objectContaining({ id: 'provider_high', revenue: 900 }));
    expect(result.meta).toEqual({ page: 1, limit: 1, total: 2, totalPages: 2 });
  });

  it('provider details keeps stats and exposes only admin provider payload profile fields', async () => {
    const { service, repository } = createService({
      phone: '+15551234567',
      avatarUrl: 'https://cdn.yourdomain.com/provider-logos/logo.png',
      providerStoreAddress: { lat: 31.5, lng: 74.3 },
      providerDocuments: {
        businessBio: 'Short customer-facing business summary.',
        coverImageUrl: 'https://cdn.yourdomain.com/provider-covers/cover.png',
      },
    });
    jest.spyOn(repository, 'findSingleProviderAggregate').mockResolvedValue({ revenue: 4200, performanceStats: 92.15, performanceChangePercent: 12.5, listedItems: 8, listedItemsChange: 1, orderFulfillment: 95.2, orderFulfillmentChangePercent: 4.2, disputeCount: 2, disputeChangePercent: -33.33, averageRating: 4.9, reviewCount: 22 });

    const result = await service.details('provider_1');

    expect(result.data).toEqual(expect.objectContaining({
      id: 'provider_1',
      name: 'Premium Provider',
      email: 'provider@example.com',
      contact: '+15551234567',
      businessName: 'Premium Gifts Co',
      businessCategoryId: 'provider_business_category_id',
      taxId: 'TAX-12345',
      businessAddress: '123 Gift Street',
      businessBio: 'Short customer-facing business summary.',
      companyLogoUrl: 'https://cdn.yourdomain.com/provider-logos/logo.png',
      coverImageUrl: 'https://cdn.yourdomain.com/provider-covers/cover.png',
      location: { lat: 31.5, lng: 74.3 },
      approvalStatus: ProviderApprovalStatus.PENDING,
      isActive: false,
      revenue: 4200,
      stats: expect.objectContaining({ listedItems: 8, disputeCount: 2, averageRating: 4.9, reviewCount: 22, performanceStats: 92.15 }),
      verification: expect.any(Object),
      suspension: expect.any(Object),
    }));
    expect(result.data).not.toHaveProperty('legalName');
    expect(result.data).not.toHaveProperty('businessEmail');
    expect(result.data).not.toHaveProperty('businessPhone');
    expect(result.data).not.toHaveProperty('storeAddress');
    expect(result.data).not.toHaveProperty('providerDocuments');
    expect(result.data).not.toHaveProperty('documentUrls');
    expect(JSON.stringify(result.data)).not.toContain('password');
    expect(JSON.stringify(result.data)).not.toContain('refresh_hash');
  });

  it('provider stats returns real active revenue and 30-day change values', async () => {
    const { service, repository } = createService();
    jest.spyOn(repository, 'findProviderPlatformStats').mockResolvedValue({ totalProviders: 1284, totalProvidersCurrentPeriod: 112, totalProvidersPreviousPeriod: 100, pendingApproval: 42, inactiveProviders: 31, inactiveProvidersCurrentPeriod: 3, inactiveProvidersPreviousPeriod: 5, activeRevenue: 4200000, activeRevenueCurrentPeriod: 1250000, activeRevenuePreviousPeriod: 1000000 });

    const result = await service.stats();

    expect(result.data).toEqual(expect.objectContaining({ totalProviders: 1284, pendingApproval: 42, activeRevenue: 4200000, totalProvidersChangePercent: 12, activeRevenueChangePercent: 25 }));
  });

  it('provider items returns real listed item rows from repository aggregates', async () => {
    const { service, repository } = createService();
    jest.spyOn(repository, 'findProviderListedItems').mockResolvedValue({ total: 2, items: [
      { id: 'gift_1', name: 'Luxury Perfume', createdAt: now, price: 99.99, currency: 'PKR', salesCount: 15, salesPercentage: 75, status: ProviderItemStatus.ACTIVE, imageUrl: 'https://cdn.yourdomain.com/gift-images/perfume.png' },
      { id: 'gift_2', name: 'Gift Basket', createdAt: now, price: 49.99, currency: 'PKR', salesCount: 5, salesPercentage: 25, status: ProviderItemStatus.OUT_OF_STOCK, imageUrl: null },
    ] });

    const result = await service.items('provider_1', { page: 1, limit: 10 });

    expect(result.data[0]).toEqual(expect.objectContaining({ id: 'gift_1', salesCount: 15, salesPercentage: 75, status: ProviderItemStatus.ACTIVE }));
    expect(result.meta.total).toBe(2);
  });

  it('provider items repository lists newly created items first and respects explicit sort', async () => {
    const { repository, prisma } = createService();
    const olderGift = {
      id: 'gift_old',
      name: 'A Hamper',
      createdAt: new Date('2026-05-01T00:00:00.000Z'),
      price: 20,
      currency: 'PKR',
      status: GiftStatus.ACTIVE,
      isPublished: true,
      stockQuantity: 10,
      variants: [],
      imageUrls: [],
    };
    const newerGift = {
      ...olderGift,
      id: 'gift_new',
      name: 'Z Bouquet',
      createdAt: new Date('2026-05-02T00:00:00.000Z'),
      price: 30,
    };
    prisma.gift.findMany.mockResolvedValue([olderGift, newerGift]);

    const newestFirst = await repository.findProviderListedItems('provider_1', {});
    const explicitNameSort = await repository.findProviderListedItems('provider_1', { sortBy: ProviderItemSortBy.NAME, sortOrder: SortOrder.ASC });

    expect(newestFirst.items.map((item) => item.id)).toEqual(['gift_new', 'gift_old']);
    expect(explicitNameSort.items.map((item) => item.id)).toEqual(['gift_old', 'gift_new']);
  });

  it('provider export includes real aggregate fields', async () => {
    const { service, repository } = createService();
    jest.spyOn(repository, 'findManyProviders').mockResolvedValue([{ ...provider }] as never);
    jest.spyOn(repository, 'findProviderAggregateMap').mockResolvedValue(new Map([['provider_1', { revenue: 4200, performanceStats: 0, performanceChangePercent: 0, listedItems: 8, listedItemsChange: 0, orderFulfillment: 95.2, orderFulfillmentChangePercent: 0, disputeCount: 2, disputeChangePercent: 0, averageRating: 4.9, reviewCount: 22 }]]));

    const result = await service.export({ format: ExportFormat.CSV });
    const csv = result.content.toString();

    expect(csv).toContain('Revenue');
    expect(csv).toContain('Listed Items');
    expect(csv).toContain('Order Fulfillment');
    expect(csv).toContain('Average Rating');
    expect(csv).toContain('4200');
    expect(csv).toContain('4.9');
  });



  it('admin provider creation accepts name and current frontend fields', async () => {
    const { service, prisma, mailer } = createService();
    prisma.uploadedFile.findMany.mockResolvedValue([
      { fileUrl: 'https://cdn.yourdomain.com/provider-logos/logo.png', folder: 'provider-logos', sizeBytes: 1024 * 1024 },
      { fileUrl: 'https://cdn.yourdomain.com/provider-covers/cover.png', folder: 'provider-covers', sizeBytes: 2 * 1024 * 1024 },
    ]);

    const result = await service.create({ uid: 'admin_1', role: UserRole.ADMIN }, {
      name: 'Ali Raza',
      email: 'contact@giftsandblooms.com',
      contact: '+15551234567',
      password: 'Provider@123456',
      businessName: 'Gifts & Blooms Co. Ltd',
      businessCategoryId: 'provider_business_category_id',
      taxId: 'TAX-12345',
      businessAddress: '123 Gift Street',
      businessBio: 'Short customer-facing business summary.',
      companyLogoUrl: 'https://cdn.yourdomain.com/provider-logos/logo.png',
      coverImageUrl: 'https://cdn.yourdomain.com/provider-covers/cover.png',
      location: { lat: 31.5, lng: 74.3 },
      approvalStatus: ProviderApprovalStatus.PENDING,
      isActive: true,
    });

    expect(prisma.providerBusinessCategory.findUnique).toHaveBeenCalledWith({ where: { id: 'provider_business_category_id' } });
    expect(prisma.user.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        email: 'contact@giftsandblooms.com',
        firstName: 'Ali Raza',
        lastName: '',
        phone: '+15551234567',
        avatarUrl: 'https://cdn.yourdomain.com/provider-logos/logo.png',
        role: UserRole.PROVIDER,
        providerLegalName: 'Gifts & Blooms Co. Ltd',
        providerBusinessEmail: 'contact@giftsandblooms.com',
        providerBusinessPhone: '+15551234567',
        providerBusinessName: 'Gifts & Blooms Co. Ltd',
        providerBusinessCategoryId: 'provider_business_category_id',
        providerTaxId: 'TAX-12345',
        providerBusinessAddress: '123 Gift Street',
        location: '31.5,74.3',
        providerStoreAddress: { lat: 31.5, lng: 74.3 },
        providerDocuments: { businessBio: 'Short customer-facing business summary.', coverImageUrl: 'https://cdn.yourdomain.com/provider-covers/cover.png' },
      }),
    }));
    expect(mailer.sendProviderInviteEmail).toHaveBeenCalledWith(expect.objectContaining({
      email: 'contact@giftsandblooms.com',
      providerName: 'Ali Raza',
      businessName: 'Gifts & Blooms Co. Ltd',
      temporaryPassword: 'Provider@123456',
      approvalStatus: ProviderApprovalStatus.PENDING,
    }));
    expect(prisma.adminAuditLog.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: 'PROVIDER_CREATED_BY_ADMIN' }) }));
    expect(JSON.stringify(prisma.adminAuditLog.create.mock.calls)).not.toContain('Provider@123456');
    expect(JSON.stringify(result)).not.toContain('Provider@123456');
    expect(result).toEqual(expect.objectContaining({
      data: expect.objectContaining({ name: 'Ali Raza', email: 'contact@giftsandblooms.com', contact: '+15551234567', businessName: 'Gifts & Blooms Co. Ltd', companyLogoUrl: 'https://cdn.yourdomain.com/provider-logos/logo.png', coverImageUrl: 'https://cdn.yourdomain.com/provider-covers/cover.png', location: { lat: 31.5, lng: 74.3 }, inviteEmailSent: true }),
      message: 'Provider created successfully and invite email sent.',
    }));
  });

  it('admin provider creation remains optional without location and stores address only', async () => {
    const { service, prisma } = createService();

    const result = await service.create({ uid: 'admin_1', role: UserRole.ADMIN }, {
      email: 'provider@example.com',
      name: 'Ali Raza',
      contact: '+15551234567',
      password: 'Provider@123456',
      businessName: 'Premium Gifts Co',
      businessCategoryId: 'provider_business_category_id',
      businessAddress: '123 Gift Street',
    });

    expect(prisma.user.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        providerBusinessAddress: '123 Gift Street',
        location: undefined,
        providerStoreAddress: undefined,
      }),
    }));
    expect(result.data).toEqual(expect.objectContaining({ location: null }));
  });

  it('admin provider creation handles invite email failure without returning password', async () => {
    const { service, prisma, mailer } = createService();
    mailer.sendProviderInviteEmail.mockRejectedValue(new Error('smtp down'));

    const result = await service.create({ uid: 'admin_1', role: UserRole.ADMIN }, {
      email: 'provider@example.com',
      name: 'Ali Raza',
      contact: '+15551234567',
      password: 'Provider@123456',
      businessName: 'Premium Gifts Co',
      businessCategoryId: 'provider_business_category_id',
      businessAddress: '123 Gift Street',
    });

    expect(prisma.user.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ password: expect.any(String) as string }) }));
    expect(result.data).toEqual(expect.objectContaining({ inviteEmailSent: false }));
    expect(result.message).toBe('Provider created successfully, but invite email could not be sent.');
    expect(JSON.stringify(result)).not.toContain('Provider@123456');
  });

  it('admin provider creation requires password', async () => {
    const { service } = createService();
    await expect(service.create({ uid: 'admin_1', role: UserRole.ADMIN }, {
      email: 'provider@example.com',
      name: 'Ali Raza',
      contact: '+15551234567',
      businessName: 'Premium Gifts Co',
      businessCategoryId: 'provider_business_category_id',
      businessAddress: '123 Gift Street',
    } as CreateProviderDto)).rejects.toThrow(BadRequestException);
  });

  it('admin provider creation rejects missing categories and oversized completed branding uploads', async () => {
    const { service, prisma } = createService();
    prisma.providerBusinessCategory.findUnique.mockResolvedValueOnce(null);
    await expect(service.create({ uid: 'admin_1', role: UserRole.ADMIN }, {
      email: 'provider@example.com',
      name: 'Ali Raza',
      contact: '+15551234567',
      password: 'Provider@123456',
      businessName: 'Premium Gifts Co',
      businessCategoryId: 'missing_category',
      businessAddress: '123 Gift Street',
    })).rejects.toThrow('Provider business category not found');

    prisma.providerBusinessCategory.findUnique.mockResolvedValueOnce({ id: 'provider_business_category_id', isActive: false });
    prisma.uploadedFile.findMany.mockResolvedValueOnce([{ fileUrl: 'https://cdn.yourdomain.com/provider-logos/logo.png', folder: 'provider-logos', sizeBytes: 6 * 1024 * 1024 }]);
    await expect(service.create({ uid: 'admin_1', role: UserRole.ADMIN }, {
      email: 'provider@example.com',
      name: 'Ali Raza',
      contact: '+15551234567',
      password: 'Provider@123456',
      businessName: 'Premium Gifts Co',
      businessCategoryId: 'provider_business_category_id',
      businessAddress: '123 Gift Street',
      companyLogoUrl: 'https://cdn.yourdomain.com/provider-logos/logo.png',
    })).rejects.toThrow('Company Logo must be 5MB or smaller.');
  });

  it('admin create provider DTO blocks old admin fields and enforces businessBio max length', async () => {
    const pipe = new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true });
    const basePayload = {
      name: 'Ali Raza',
      email: 'contact@giftsandblooms.com',
      contact: '+15551234567',
      password: 'Provider@123456',
      businessName: 'Gifts & Blooms Co. Ltd',
      businessCategoryId: 'provider_business_category_id',
      businessAddress: '123 Gift Street',
    };

    await expect(pipe.transform({ ...basePayload, fulfillmentMethods: ['DELIVERY'] }, { type: 'body', metatype: CreateProviderDto })).rejects.toThrow();
    await expect(pipe.transform({ ...basePayload, firstName: 'Ali', lastName: 'Raza' }, { type: 'body', metatype: CreateProviderDto })).rejects.toThrow();
    await expect(pipe.transform({ ...basePayload, username: 'gifts-blooms-admin' }, { type: 'body', metatype: CreateProviderDto })).rejects.toThrow();
    await expect(pipe.transform({ ...basePayload, generateTemporaryPassword: true }, { type: 'body', metatype: CreateProviderDto })).rejects.toThrow();
    await expect(pipe.transform({ ...basePayload, mustChangePassword: true }, { type: 'body', metatype: CreateProviderDto })).rejects.toThrow();
    await expect(pipe.transform({ ...basePayload, sendInviteEmail: true }, { type: 'body', metatype: CreateProviderDto })).rejects.toThrow();
    await expect(pipe.transform({ ...basePayload, businessBio: 'x'.repeat(501) }, { type: 'body', metatype: CreateProviderDto })).rejects.toThrow();
    await expect(pipe.transform({ ...basePayload, location: { lat: 31.5 } }, { type: 'body', metatype: CreateProviderDto })).rejects.toThrow();
    await expect(pipe.transform({ ...basePayload, location: { lat: 91, lng: 74.3 } }, { type: 'body', metatype: CreateProviderDto })).rejects.toThrow();
    await expect(pipe.transform({ ...basePayload, location: { lat: 31.5, lng: 181 } }, { type: 'body', metatype: CreateProviderDto })).rejects.toThrow();
    await expect(pipe.transform({ ...basePayload, businessBio: 'x'.repeat(500) }, { type: 'body', metatype: CreateProviderDto })).resolves.toBeInstanceOf(CreateProviderDto);
    await expect(pipe.transform({ ...basePayload, location: { lat: 31.5, lng: 74.3 } }, { type: 'body', metatype: CreateProviderDto })).resolves.toBeInstanceOf(CreateProviderDto);
  });

  it('provider-management.service.ts no longer imports PrismaService or uses this.prisma', () => {
    const serviceSource = readFileSync(join(__dirname, '../services/provider-management.service.ts'), 'utf8');
    const repositorySource = readFileSync(join(__dirname, '../repositories/provider-management.repository.ts'), 'utf8');

    expect(serviceSource).not.toContain('PrismaService');
    expect(serviceSource).not.toContain('this.prisma');
    expect(repositorySource).toContain('constructor(private readonly prisma: PrismaService');
    expect(repositorySource).toContain('findManyProviders');
    expect(repositorySource).toContain('deleteProviderPermanently');
    expect(serviceSource).not.toContain('emptyProviderStats');
    expect(serviceSource).not.toContain('Premium Gift Box');
  });

  it('Swagger shows consistent admin provider create payload and self-registration remains unchanged', () => {
    const controller = readFileSync(join(__dirname, '../controllers/provider-management.controller.ts'), 'utf8');
    const dto = readFileSync(join(__dirname, '../dto/provider-management.dto.ts'), 'utf8');
    const createProviderDto = dto.slice(dto.indexOf('export class CreateProviderDto'), dto.indexOf('export class UpdateProviderDto'));
    const authDto = readFileSync(join(__dirname, '../../auth/dto/auth.dto.ts'), 'utf8');
    expect(controller).toContain('Create provider from admin dashboard');
    expect(createProviderDto).toContain('name!: string');
    expect(createProviderDto).toContain('businessCategoryId!: string');
    expect(createProviderDto).toContain('taxId?: string');
    expect(createProviderDto).toContain('businessAddress!: string');
    expect(createProviderDto).toContain('businessBio?: string');
    expect(createProviderDto).toContain('companyLogoUrl?: string');
    expect(createProviderDto).toContain('coverImageUrl?: string');
    expect(createProviderDto).toContain('location?: ProviderLocationDto');
    expect(createProviderDto).not.toContain('username');
    expect(createProviderDto).not.toContain('generateTemporaryPassword');
    expect(createProviderDto).not.toContain('mustChangePassword');
    expect(createProviderDto).not.toContain('sendInviteEmail');
    expect(createProviderDto).not.toContain('firstName');
    expect(createProviderDto).not.toContain('lastName');
    expect(createProviderDto).not.toContain('fulfillmentMethods');
    expect(createProviderDto).not.toContain('autoAcceptOrders');
    expect(createProviderDto).not.toContain('documentUrls');
    expect(authDto).toContain('export class RegisterProviderDto extends RegisterUserDto');
    expect(authDto).toContain('name?: string');
    expect(authDto).toContain('fulfillmentMethods?: ProviderFulfillmentMethodDto[]');
    expect(authDto).toContain('password!: string');
  });

  it('PATCH /providers/:id/status with action APPROVE approves provider and clears rejection fields', async () => {
    const { service, prisma, mailer, notificationDispatch } = createService({
      providerApprovalStatus: ProviderApprovalStatus.REJECTED,
      providerRejectionReason: ProviderLifecycleReason.INCOMPLETE_DOCUMENTS,
      providerRejectionComment: 'Missing docs',
    });

    const result = await service.updateStatus(providerLifecycleAdmin, 'provider_1', {
      action: ProviderLifecycleAction.APPROVE,
      comment: 'Documents verified successfully.',
      notifyProvider: true,
    });

    expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        isApproved: true,
        isActive: true,
        providerApprovalStatus: ProviderApprovalStatus.APPROVED,
        providerApprovedBy: 'admin_1',
        providerRejectionReason: null,
        providerRejectionComment: null,
      }),
    }));
    expect(prisma.adminAuditLog.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: 'PROVIDER_APPROVED' }) }));
    expect(notificationDispatch.createAndEmit).toHaveBeenCalledWith(expect.objectContaining({ recipientId: 'provider_1', type: 'PROVIDER_APPROVED' }));
    expect(mailer.sendProviderApprovedEmail).toHaveBeenCalledWith('provider@example.com', 'Premium Gifts Co');
    expect(result).toEqual(expect.objectContaining({ message: 'Provider approved successfully.' }));
    expect(result.data).toEqual(expect.objectContaining({ id: 'provider_1', approvalStatus: ProviderApprovalStatus.APPROVED, status: 'ACTIVE', isActive: true }));
  });

  it('provider lifecycle action requires the mapped admin permission', async () => {
    const { service } = createService();

    await expect(service.updateStatus({ uid: 'admin_1', role: UserRole.ADMIN, permissions: { providers: ['read'] } }, 'provider_1', {
      action: ProviderLifecycleAction.APPROVE,
      comment: 'Documents verified successfully.',
    })).rejects.toThrow(ForbiddenException);

    await expect(service.updateStatus({ uid: 'admin_1', role: UserRole.ADMIN, permissions: { providers: ['approve'] } }, 'provider_1', {
      action: ProviderLifecycleAction.APPROVE,
      comment: 'Documents verified successfully.',
    })).resolves.toEqual(expect.objectContaining({ data: expect.objectContaining({ approvalStatus: ProviderApprovalStatus.APPROVED }) }));
  });

  it('PATCH /providers/:id/status with action REJECT rejects provider and requires reason', async () => {
    const { service, prisma, mailer } = createService();

    await expect(service.updateStatus(providerLifecycleAdmin, 'provider_1', {
      action: ProviderLifecycleAction.REJECT,
    })).rejects.toThrow(BadRequestException);

    const result = await service.updateStatus(providerLifecycleAdmin, 'provider_1', {
      action: ProviderLifecycleAction.REJECT,
      reason: ProviderLifecycleReason.INCOMPLETE_DOCUMENTS,
      comment: 'Business license document is missing.',
      notifyProvider: true,
    });

    expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        isApproved: false,
        isActive: false,
        providerApprovalStatus: ProviderApprovalStatus.REJECTED,
        providerRejectedBy: 'admin_1',
        providerRejectionReason: ProviderLifecycleReason.INCOMPLETE_DOCUMENTS,
        refreshTokenHash: null,
      }),
    }));
    expect(prisma.adminAuditLog.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: 'PROVIDER_REJECTED' }) }));
    expect(mailer.sendProviderRejectedEmail).toHaveBeenCalled();
    expect(result.data).toEqual(expect.objectContaining({ approvalStatus: ProviderApprovalStatus.REJECTED, status: 'INACTIVE', isActive: false, rejectionReason: ProviderLifecycleReason.INCOMPLETE_DOCUMENTS }));
  });

  it('PATCH /providers/:id/status with action UPDATE_STATUS updates status only', async () => {
    const { service, prisma } = createService({ providerApprovalStatus: ProviderApprovalStatus.APPROVED, isActive: false });

    await expect(service.updateStatus(providerLifecycleAdmin, 'provider_1', {
      action: ProviderLifecycleAction.UPDATE_STATUS,
    })).rejects.toThrow(BadRequestException);

    const result = await service.updateStatus(providerLifecycleAdmin, 'provider_1', {
      action: ProviderLifecycleAction.UPDATE_STATUS,
      status: ProviderStatusUpdate.ACTIVE,
      reason: ProviderLifecycleReason.OTHER,
      comment: 'Provider account restored after review.',
      notifyProvider: true,
    });

    expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.not.objectContaining({ providerApprovalStatus: expect.any(String) as string }),
    }));
    expect(prisma.adminAuditLog.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: 'PROVIDER_STATUS_UPDATED' }) }));
    expect(result.data).toEqual(expect.objectContaining({ approvalStatus: ProviderApprovalStatus.APPROVED, status: 'ACTIVE', isActive: true }));
  });

  it('PATCH /providers/:id/status with action SUSPEND suspends provider and requires reason', async () => {
    const { service, prisma } = createService({ providerApprovalStatus: ProviderApprovalStatus.APPROVED, isActive: true });

    await expect(service.updateStatus(providerLifecycleAdmin, 'provider_1', {
      action: ProviderLifecycleAction.SUSPEND,
    })).rejects.toThrow(BadRequestException);

    const result = await service.updateStatus(providerLifecycleAdmin, 'provider_1', {
      action: ProviderLifecycleAction.SUSPEND,
      reason: ProviderLifecycleReason.POLICY_VIOLATION,
      comment: 'Provider violated platform policy.',
    });

    expect(prisma.accountSuspension.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ reason: ProviderLifecycleReason.POLICY_VIOLATION }) }));
    expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ isActive: false, suspendedBy: 'admin_1', refreshTokenHash: null }) }));
    expect(prisma.adminAuditLog.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: 'PROVIDER_SUSPENDED' }) }));
    expect(result.data).toEqual(expect.objectContaining({ status: 'SUSPENDED', isActive: false, suspensionReason: ProviderLifecycleReason.POLICY_VIOLATION }));
  });

  it('does not fail provider suspension when lifecycle email is unavailable', async () => {
    const { service, prisma, mailer, notificationDispatch } = createService({ providerApprovalStatus: ProviderApprovalStatus.APPROVED, isActive: true });
    mailer.sendAccountStatusEmail.mockRejectedValue(new Error('smtp down'));

    const result = await service.updateStatus(providerLifecycleAdmin, 'provider_1', {
      action: ProviderLifecycleAction.SUSPEND,
      reason: ProviderLifecycleReason.POLICY_VIOLATION,
      comment: 'Provider violated platform policy.',
      notifyProvider: true,
    });

    expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ isActive: false, suspendedBy: 'admin_1' }) }));
    expect(notificationDispatch.createAndEmit).toHaveBeenCalledWith(expect.objectContaining({ type: 'PROVIDER_SUSPENDED' }));
    expect(mailer.sendAccountStatusEmail).toHaveBeenCalled();
    expect(result).toEqual(expect.objectContaining({ message: 'Provider suspended successfully.' }));
  });

  it('PATCH /providers/:id/status with action UNSUSPEND restores approved provider', async () => {
    const { service, prisma } = createService({
      providerApprovalStatus: ProviderApprovalStatus.APPROVED,
      isActive: false,
      suspendedAt: new Date('2026-05-01T00:00:00.000Z'),
      suspensionReason: ProviderLifecycleReason.POLICY_VIOLATION,
    });

    const result = await service.updateStatus(providerLifecycleAdmin, 'provider_1', {
      action: ProviderLifecycleAction.UNSUSPEND,
      comment: 'Provider account reviewed and restored.',
    });

    expect(prisma.accountSuspension.updateMany).toHaveBeenCalled();
    expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ isActive: true, suspendedAt: null, suspensionReason: null }) }));
    expect(prisma.adminAuditLog.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: 'PROVIDER_UNSUSPENDED' }) }));
    expect(result.data).toEqual(expect.objectContaining({ approvalStatus: ProviderApprovalStatus.APPROVED, status: 'ACTIVE', isActive: true }));
  });

  it('UNSUSPEND rejects non-approved or already active provider', async () => {
    const pending = createService({ providerApprovalStatus: ProviderApprovalStatus.PENDING, isActive: false, suspendedAt: new Date() });
    await expect(pending.service.updateStatus(providerLifecycleAdmin, 'provider_1', {
      action: ProviderLifecycleAction.UNSUSPEND,
    })).rejects.toThrow(BadRequestException);

    const active = createService({ providerApprovalStatus: ProviderApprovalStatus.APPROVED, isActive: true, suspendedAt: null });
    await expect(active.service.updateStatus(providerLifecycleAdmin, 'provider_1', {
      action: ProviderLifecycleAction.UNSUSPEND,
    })).rejects.toThrow(BadRequestException);
  });

  it('only unified provider status route remains in controller swagger surface', () => {
    const controller = readFileSync(join(__dirname, '../controllers/provider-management.controller.ts'), 'utf8');
    expect(controller).toContain("@Patch(':id/status')");
    expect(controller).not.toContain("@Permissions('providers.updateStatus')");
    expect(controller).toContain('APPROVE requires providers.approve');
    expect(controller).toContain('Update provider lifecycle status');
    expect(controller).not.toContain("@Patch(':id/approve')");
    expect(controller).not.toContain("@Patch(':id/reject')");
    expect(controller).not.toContain("@Post(':id/suspend')");
    expect(controller).not.toContain("@Post(':id/unsuspend')");
  });

  it('DELETE /providers/:id is SUPER_ADMIN only and blocks active processing orders', async () => {
    const { service, prisma } = createService();
    const controller = readFileSync(join(__dirname, '../controllers/provider-management.controller.ts'), 'utf8');
    expect(controller).toContain("@Delete(':id')");
    expect(controller).toContain('@Roles(UserRole.SUPER_ADMIN)');
    expect(controller).toContain('Permanently delete provider');
    expect(controller).toContain('DANGER:');

    expect(controller).not.toContain('@Body() dto: PermanentlyDeleteProviderDto');

    prisma.providerOrder.count.mockResolvedValueOnce(1);
    await expect(service.permanentlyDelete(
      { uid: 'super_admin_1', role: UserRole.SUPER_ADMIN },
      'provider_1',
    )).rejects.toThrow('Provider has active processing orders and cannot be permanently deleted');
  });

  it('DELETE /providers/:id writes audit and removes provider-owned non-financial records', async () => {
    const { service, prisma } = createService({ providerApprovalStatus: ProviderApprovalStatus.APPROVED });

    await service.permanentlyDelete(
      { uid: 'super_admin_1', role: UserRole.SUPER_ADMIN },
      'provider_1',
    );

    expect(prisma.adminAuditLog.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: 'PROVIDER_PERMANENTLY_DELETED' }) }));
    expect(prisma.promotionalOffer.deleteMany).toHaveBeenCalledWith({ where: { providerId: 'provider_1' } });
    expect(prisma.gift.deleteMany).toHaveBeenCalledWith({ where: { providerId: 'provider_1' } });
    expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 'provider_1' } });
  });

});
