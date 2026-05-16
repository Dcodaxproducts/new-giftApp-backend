/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { ProviderApprovalStatus, UserRole } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';
import { ProviderFulfillmentMethodDto } from '../../auth/dto/auth.dto';
import { ProviderBusinessDayDto } from '../dto/provider-business-info.dto';
import { ProviderBusinessInfoRepository } from '../repositories/provider-business-info.repository';
import { ProviderBusinessInfoService } from '../services/provider-business-info.service';

describe('Provider business info source safety', () => {
  const controller = readFileSync(join(__dirname, '../controllers/provider-business-info.controller.ts'), 'utf8');
  const service = readFileSync(join(__dirname, '../services/provider-business-info.service.ts'), 'utf8');
  const repository = readFileSync(join(__dirname, '../repositories/provider-business-info.repository.ts'), 'utf8');
  const dto = readFileSync(join(__dirname, '../dto/provider-business-info.dto.ts'), 'utf8');

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
    expect(service).toContain('ProviderApprovalStatus.PENDING');
    expect(service).toContain('PROVIDER_BUSINESS_INFO_UPDATED');
    expect(service).toContain('providerWebsite: dto.website');
    expect(service).toContain('ADMIN_PROVIDER_REVIEW_NEEDED');
  });
});

const businessInfoProvider = {
  id: 'provider_1',
  email: 'provider@example.com',
  phone: '+923001234567',
  role: UserRole.PROVIDER,
  deletedAt: null,
  providerBusinessName: 'Global Logistics Solutions',
  providerLegalName: 'Global Logistics Solutions LLC',
  providerTaxId: 'XX-XXXXXXX',
  providerBusinessCategoryId: 'category_1',
  providerBusinessEmail: 'ops@globallogistics.com',
  providerBusinessPhone: '+1 (555) 012-3456',
  providerBusinessAddress: '842 Industrial Way, Suite 102',
  providerStoreAddress: { line1: '842 Industrial Way, Suite 102', city: 'San Francisco', state: 'CA', country: 'USA', postalCode: '94107', latitude: 37.7749, longitude: -122.4194 },
  providerBusinessHours: [{ day: 'MONDAY', isOpen: true, openTime: '09:00', closeTime: '18:00' }],
  providerServiceArea: 'San Francisco',
  providerWebsite: 'https://globallogistics.com',
  location: 'San Francisco, CA',
  providerFulfillmentMethods: ['PICKUP', 'DELIVERY'],
  providerAutoAcceptOrders: false,
  providerApprovalStatus: ProviderApprovalStatus.APPROVED,
  isApproved: true,
};

function createBusinessInfoService(overrides: Record<string, unknown> = {}) {
  const provider = { ...businessInfoProvider, ...overrides };
  const prisma = {
    user: {
      findFirst: jest.fn().mockResolvedValue(provider),
      findMany: jest.fn().mockResolvedValue([{ id: 'admin_1' }]),
      update: jest.fn().mockImplementation(({ data }) => Promise.resolve({ ...provider, ...data })),
    },
    providerBusinessCategory: {
      findFirst: jest.fn().mockResolvedValue({ id: 'category_1', name: 'Industrial Warehousing & Distribution', deletedAt: null }),
      findUnique: jest.fn().mockResolvedValue({ id: 'category_1', name: 'Industrial Warehousing & Distribution' }),
    },
    adminAuditLog: { create: jest.fn().mockResolvedValue({ id: 'audit_1' }) },
    notification: { create: jest.fn().mockResolvedValue({ id: 'notification_1' }) },
  };
  const repository = new ProviderBusinessInfoRepository(prisma as unknown as ConstructorParameters<typeof ProviderBusinessInfoRepository>[0]);
  return { service: new ProviderBusinessInfoService(repository), prisma };
}

describe('ProviderBusinessInfoService mobile profile fields', () => {
  it('business-info returns store address', async () => {
    const { service } = createBusinessInfoService();
    const result = await service.get({ uid: 'provider_1', role: UserRole.PROVIDER });
    expect(result.data.storeAddress).toEqual(expect.objectContaining({ line1: '842 Industrial Way, Suite 102', latitude: 37.7749, longitude: -122.4194 }));
  });

  it('business-info returns business hours', async () => {
    const { service } = createBusinessInfoService();
    const result = await service.get({ uid: 'provider_1', role: UserRole.PROVIDER });
    expect(result.data.businessHours).toEqual([{ day: 'MONDAY', isOpen: true, openTime: '09:00', closeTime: '18:00' }]);
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
      storeAddress: { line1: '842 Industrial Way' },
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
      businessHours: [{ day: ProviderBusinessDayDto.MONDAY, isOpen: true, openTime: '09:00', closeTime: '18:00' }],
      autoAcceptOrders: false,
    });
    expect(prisma.adminAuditLog.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: 'PROVIDER_BUSINESS_INFO_UPDATED' }) }));
  });
});
