/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { UserRole } from '@prisma/client';
import { ProviderBusinessCategoriesRepository } from '../repositories/provider-business-categories.repository';
import { ProviderBusinessCategoriesService } from '../services/provider-business-categories.service';

function createService() {
  const category = { id: 'cat_1', name: 'Florist', slug: 'florist', description: null, iconKey: null, sortOrder: 0, isActive: true, deletedAt: null, createdAt: new Date(), updatedAt: new Date() };
  const prisma = {
    providerBusinessCategory: { upsert: jest.fn(), findMany: jest.fn().mockResolvedValue([category]), count: jest.fn().mockResolvedValue(1), findFirst: jest.fn().mockResolvedValue(null), create: jest.fn().mockResolvedValue(category), update: jest.fn().mockResolvedValue({ ...category, isActive: false }) },
    user: { count: jest.fn().mockResolvedValue(0) },
    $transaction: jest.fn().mockImplementation((items: unknown[]) => Promise.all(items)),
  };
  const auditLog = { write: jest.fn().mockResolvedValue(undefined) };
  const repository = new ProviderBusinessCategoriesRepository(prisma as unknown as ConstructorParameters<typeof ProviderBusinessCategoriesRepository>[0]);
  const service = new ProviderBusinessCategoriesService(repository, auditLog as unknown as ConstructorParameters<typeof ProviderBusinessCategoriesService>[1]);
  return { service, prisma, auditLog, category };
}

describe('ProviderBusinessCategoriesService', () => {
  it('lists active non-deleted categories', async () => {
    const { service, prisma } = createService();
    await service.list({ isActive: true });
    expect(prisma.providerBusinessCategory.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ deletedAt: null, isActive: true }) }));
  });

  it('creates category and writes audit log', async () => {
    const { service, auditLog } = createService();
    await service.create({ uid: 'admin_1', role: UserRole.ADMIN }, { name: 'Florist' });
    expect(auditLog.write).toHaveBeenCalledWith(expect.objectContaining({ action: 'PROVIDER_BUSINESS_CATEGORY_CREATED' }));
  });

  it('blocks delete when active providers are attached', async () => {
    const { service, prisma, category } = createService();
    prisma.providerBusinessCategory.findFirst.mockResolvedValue(category);
    prisma.user.count.mockResolvedValue(1);
    await expect(service.delete({ uid: 'admin_1', role: UserRole.ADMIN }, 'cat_1')).rejects.toThrow('active providers');
  });
});
