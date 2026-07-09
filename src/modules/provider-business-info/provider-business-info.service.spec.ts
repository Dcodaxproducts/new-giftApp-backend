/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { UserRole, UserStatus } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';
import { ProviderFulfillmentMethodDto } from '../auth/dto/auth.dto';
import { ProviderBusinessInfoRepository } from './provider-business-info.repository';
import { ProviderBusinessInfoService } from './provider-business-info.service';

describe('Provider business info source safety', () => {
  const controller = readFileSync(join(__dirname, 'provider-business-info.controller.ts'), 'utf8');
  const service = readFileSync(join(__dirname, 'provider-business-info.service.ts'), 'utf8');
  const repository = readFileSync(join(__dirname, 'provider-business-info.repository.ts'), 'utf8');
  const dto = readFileSync(join(__dirname, 'dto/provider-business-info.dto.ts'), 'utf8');

  it('exposes provider-only business info endpoints without duplicate profile routes', () => {
    expect(controller).toContain("@ApiTags('03 Provider - Business Info')");
    expect(controller).toContain("@Controller('provider/business-info')");
    expect(controller).toContain('@Roles(UserRole.PROVIDER)');
    expect(controller).toContain('@Get()');
    expect(controller).toContain('@Patch()');
  });

  it('updates own provider only and blocks status self-approval fields', () => {
    expect(repository).toContain('where: { id, role: UserRole.PROVIDER');
    expect(repository).toContain('where: { id }');
    expect(dto).not.toContain('approvalStatus');
    expect(dto).not.toContain('isActive');
    expect(service).not.toContain('providerApprovalStatus: dto.approvalStatus');
    expect(service).not.toContain('isActive: dto.isActive');
  });

  it('material business changes trigger pending verification, audit, and admin notification', () => {
    expect(service).toContain('materialChange');
    expect(service).toContain('UserStatus.PENDING');
    expect(service).toContain('PROVIDER_BUSINESS_INFO_UPDATED');
    expect(service).not.toContain('website');
    expect(service).toContain('ADMIN_PROVIDER_REVIEW_NEEDED');
  });
});

const businessInfoProvider = {
  id: 'provider_1',
  email: 'provider@example.com',
  phone: '+923001234567',
  role: UserRole.PROVIDER,
  deletedAt: null,
  location: 'San Francisco, CA',
  providerProfile: {
    businessName: 'Global Logistics Solutions',
    legalName: 'Global Logistics Solutions LLC',
    taxId: 'XX-XXXXXXX',
    businessCategoryId: 'category_1',
    businessEmail: 'ops@globallogistics.com',
    businessPhone: '+1 (555) 012-3456',
    businessAddress: '842 Industrial Way, Suite 102',
    fulfillmentMethods: ['PICKUP', 'DELIVERY'],
    status: UserStatus.APPROVED,
  },
  isApproved: true,
};

function createBusinessInfoService(overrides: Record<string, unknown> = {}) {
  const provider = { ...businessInfoProvider, ...overrides };
  const prisma = {
    user: {
      findFirst: jest.fn().mockResolvedValue(provider),
      findMany: jest.fn().mockResolvedValue([{ id: 'admin_1' }]),
      findUnique: jest.fn().mockResolvedValue(provider),
      update: jest.fn().mockImplementation(({ data }) => Promise.resolve({ ...provider, ...data })),
      findUniqueOrThrow: jest.fn().mockResolvedValue(provider),
    },
    providerProfile: {
      upsert: jest.fn().mockResolvedValue(provider.providerProfile),
    },
    providerBusinessCategory: {
      findFirst: jest.fn().mockResolvedValue({ id: 'category_1', name: 'Industrial Warehousing & Distribution' }),
      findUnique: jest.fn().mockResolvedValue({ id: 'category_1', name: 'Industrial Warehousing & Distribution' }),
    },
    adminAuditLog: { create: jest.fn().mockResolvedValue({ id: 'audit_1' }) },
    notification: { create: jest.fn().mockResolvedValue({ id: 'notification_1' }) },
  };
  Object.assign(prisma, {
    $transaction: jest.fn(async (callback: (tx: unknown) => Promise<unknown>) => callback(prisma)),
  });
  const repository = new ProviderBusinessInfoRepository(prisma as unknown as ConstructorParameters<typeof ProviderBusinessInfoRepository>[0], { createAndEmit: jest.fn(), emitExisting: jest.fn() } as never);
  return { service: new ProviderBusinessInfoService(repository), prisma };
}

describe('ProviderBusinessInfoService mobile profile fields', () => {
  it('business-info does not return removed profile fields', async () => {
    const { service } = createBusinessInfoService();
    const result = await service.get({ uid: 'provider_1', role: UserRole.PROVIDER });
    expect(result.data).not.toHaveProperty('storeAddress');
    expect(result.data).not.toHaveProperty('businessHours');
    expect(result.data).not.toHaveProperty('serviceArea');
    expect(result.data).not.toHaveProperty('website');
  });

  it('business-info returns fulfillment methods', async () => {
    const { service } = createBusinessInfoService();
    const result = await service.get({ uid: 'provider_1', role: UserRole.PROVIDER });
    expect(result.data.fulfillmentMethods).toEqual(['PICKUP', 'DELIVERY']);
  });

  it('provider cannot update approvalStatus/isActive/providerId', async () => {
    const { service, prisma } = createBusinessInfoService();
    await service.update({ uid: 'provider_1', role: UserRole.PROVIDER }, {
      legalName: 'Global Logistics Solutions LLC',
      fulfillmentMethods: [ProviderFulfillmentMethodDto.PICKUP],
    });
    expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.not.objectContaining({ approvalStatus: expect.any(String) as string, isActive: expect.any(Boolean) as boolean, providerId: expect.any(String) as string }),
    }));
  });

  it('provider business info update creates activity/audit log', async () => {
    const { service, prisma } = createBusinessInfoService();
    await service.update({ uid: 'provider_1', role: UserRole.PROVIDER }, {
      legalName: 'Global Logistics Solutions LLC',
    });
    expect(prisma.adminAuditLog.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: 'PROVIDER_BUSINESS_INFO_UPDATED' }) }));
  });
});
