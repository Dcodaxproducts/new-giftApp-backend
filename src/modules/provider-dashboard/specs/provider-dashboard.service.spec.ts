/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { ForbiddenException } from '@nestjs/common';
import { GiftStatus, PaymentStatus, PromotionalOfferApprovalStatus, PromotionalOfferStatus, ProviderApprovalStatus, ProviderOrderStatus, UserRole } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';
import { ProviderDashboardRepository } from '../repositories/provider-dashboard.repository';
import { ProviderDashboardService } from '../services/provider-dashboard.service';

const approvedProvider = {
  id: 'provider_1',
  role: UserRole.PROVIDER,
  deletedAt: null,
  providerBusinessName: 'Global Logistics Solutions',
  avatarUrl: 'https://cdn.yourdomain.com/provider-avatars/provider.png',
  providerApprovalStatus: ProviderApprovalStatus.APPROVED,
  isActive: true,
  isApproved: true,
  suspendedAt: null,
};

function createService(provider: Record<string, unknown> | null = approvedProvider) {
  const orders = [
    { createdAt: new Date(), totalPayout: 120, total: 120, currency: 'PKR' },
  ];
  const recentOrder = {
    id: 'provider_order_1',
    orderNumber: 'ORD-8821',
    status: ProviderOrderStatus.PENDING,
    totalPayout: 120,
    total: 120,
    currency: 'PKR',
    createdAt: new Date(),
    order: { orderNumber: 'ORD-8821', paymentStatus: PaymentStatus.SUCCEEDED },
    items: [{ nameSnapshot: 'Nike Air Max 270', imageUrl: 'https://cdn.yourdomain.com/gifts/shoe.png' }],
  };
  const prisma = {
    user: { findFirst: jest.fn().mockResolvedValue(provider) },
    providerOrder: {
      count: jest.fn().mockResolvedValueOnce(24).mockResolvedValueOnce(12),
      findMany: jest.fn().mockResolvedValueOnce(orders).mockResolvedValueOnce([recentOrder]),
    },
    promotionalOffer: { count: jest.fn().mockResolvedValue(5) },
    gift: { count: jest.fn().mockResolvedValue(128) },
    $transaction: jest.fn().mockImplementation((queries: Promise<unknown>[]) => Promise.all(queries)),
  };
  const repository = new ProviderDashboardRepository(prisma as unknown as ConstructorParameters<typeof ProviderDashboardRepository>[0]);
  return { service: new ProviderDashboardService(repository), prisma };
}

describe('Provider dashboard source safety', () => {
  const controller = readFileSync(join(__dirname, '../controllers/provider-dashboard.controller.ts'), 'utf8');
  const service = readFileSync(join(__dirname, '../services/provider-dashboard.service.ts'), 'utf8');
  const repository = readFileSync(join(__dirname, '../repositories/provider-dashboard.repository.ts'), 'utf8');

  it('adds one provider-only dashboard endpoint without duplicate profile API', () => {
    expect(controller).toContain("@ApiTags('03 Provider - Dashboard')");
    expect(controller).toContain("@Controller('provider/dashboard')");
    expect(controller).toContain('@Roles(UserRole.PROVIDER)');
    expect(controller).toContain('@Get()');
    expect(controller).not.toContain("provider/profile");
  });

  it('derives provider id from JWT and blocks pending/inactive providers', () => {
    expect(service).toContain('getApprovedActiveProvider(user.uid)');
    expect(service).not.toContain('query.providerId');
    expect(repository).toContain('role: UserRole.PROVIDER');
    expect(service).toContain('ProviderApprovalStatus.APPROVED');
    expect(service).toContain('!provider.isActive');
    expect(service).toContain('ForbiddenException');
  });
});

describe('ProviderDashboardService', () => {
  it('approved active provider can fetch dashboard', async () => {
    const { service } = createService();
    const result = await service.get({ uid: 'provider_1', role: UserRole.PROVIDER });
    expect(result.message).toBe('Provider dashboard fetched successfully.');
    expect(result.data.provider).toEqual(expect.objectContaining({ id: 'provider_1', approvalStatus: ProviderApprovalStatus.APPROVED, status: 'ACTIVE' }));
  });

  it('pending provider cannot fetch dashboard', async () => {
    const { service } = createService({ ...approvedProvider, providerApprovalStatus: ProviderApprovalStatus.PENDING, isApproved: false });
    await expect(service.get({ uid: 'provider_1', role: UserRole.PROVIDER })).rejects.toThrow(ForbiddenException);
  });

  it('dashboard returns operational summary', async () => {
    const { service, prisma } = createService();
    const result = await service.get({ uid: 'provider_1', role: UserRole.PROVIDER });
    expect(result.data.operationalSummary).toEqual({ todayOrders: 24, pendingOrders: 12, activeOffers: 5, totalItems: 128 });
    expect(prisma.promotionalOffer.count).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ status: PromotionalOfferStatus.ACTIVE, approvalStatus: PromotionalOfferApprovalStatus.APPROVED }) }));
    expect(prisma.gift.count).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ status: { not: GiftStatus.INACTIVE } }) }));
  });

  it('dashboard returns recent orders', async () => {
    const { service } = createService();
    const result = await service.get({ uid: 'provider_1', role: UserRole.PROVIDER });
    expect(result.data.recentOrders[0]).toEqual(expect.objectContaining({ id: 'provider_order_1', orderNumber: 'ORD-8821', itemName: 'Nike Air Max 270', status: 'PAID' }));
  });

  it('dashboard returns performance chart', async () => {
    const { service } = createService();
    const result = await service.get({ uid: 'provider_1', role: UserRole.PROVIDER });
    expect(result.data.performance).toEqual(expect.objectContaining({ range: 'WEEKLY', labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], currency: 'PKR' }));
    expect(result.data.performance.values).toHaveLength(7);
  });
});
