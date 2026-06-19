import { DisputePriority, DisputeReason, DisputeStatus, PaymentStatus, Prisma, ProviderDisputeCategory, ProviderDisputeSeverity, ProviderDisputeStatus } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';
import { AdminDashboardRepository } from './admin-dashboard.repository';
import { AdminDashboardService } from './admin-dashboard.service';

type MockRepository = jest.Mocked<Pick<AdminDashboardRepository, 'countUsers' | 'countProviders' | 'countPayments' | 'countOrders' | 'sumPayments' | 'findRevenuePayments' | 'findDistributionPayments' | 'findProviderPerformanceRows' | 'findRecentCustomerDisputes' | 'findRecentProviderDisputes'>>;

function aggregate(amount: number): Prisma.GetPaymentAggregateType<{ _sum: { amount: true }; where: Prisma.PaymentWhereInput }> {
  return { _sum: { amount: new Prisma.Decimal(amount) } };
}

function createService(overrides: Partial<MockRepository> = {}) {
  const repository: MockRepository = {
    countUsers: jest.fn().mockResolvedValue(0),
    countProviders: jest.fn().mockResolvedValue(0),
    countPayments: jest.fn().mockResolvedValue(0),
    countOrders: jest.fn().mockResolvedValue(0),
    sumPayments: jest.fn().mockResolvedValue(aggregate(0)),
    findRevenuePayments: jest.fn().mockResolvedValue([]),
    findDistributionPayments: jest.fn().mockResolvedValue([]),
    findProviderPerformanceRows: jest.fn().mockResolvedValue([]),
    findRecentCustomerDisputes: jest.fn().mockResolvedValue([]),
    findRecentProviderDisputes: jest.fn().mockResolvedValue([]),
    ...overrides,
  };
  return { service: new AdminDashboardService(repository as unknown as AdminDashboardRepository), repository };
}

describe('AdminDashboardService', () => {
  it('aggregates overview metrics and deltas from existing records', async () => {
    const { service, repository } = createService({
      countUsers: jest.fn().mockResolvedValueOnce(100).mockResolvedValueOnce(12).mockResolvedValueOnce(8),
      countProviders: jest.fn().mockResolvedValueOnce(20).mockResolvedValueOnce(3).mockResolvedValueOnce(2),
      countPayments: jest.fn().mockResolvedValueOnce(50).mockResolvedValueOnce(11).mockResolvedValueOnce(10),
      sumPayments: jest.fn().mockResolvedValueOnce(aggregate(1240)).mockResolvedValueOnce(aggregate(550)).mockResolvedValueOnce(aggregate(500)),
    });
    const response = await service.get({});
    expect(response.data.overview).toMatchObject({ totalUsers: 100, totalUsersDeltaPercent: 50, totalProviders: 20, totalProvidersDeltaPercent: 50, transactions: 50, transactionsDeltaPercent: 10, totalRevenue: 1240, totalRevenueDeltaPercent: 10 });
    expect(response.data.revenueTrends.range).toBe('LAST_12_MONTHS');
    expect(Array.isArray(response.data.revenueTrends.labels)).toBe(true);
    expect(Array.isArray(response.data.revenueTrends.values)).toBe(true);
    expect(response.data.giftVsPayment).toEqual({ giftCardsPercent: 0, directPaymentsPercent: 0 });
    expect(response.data.providerPerformance).toEqual([]);
    expect(response.data.recentDisputes).toEqual([]);
    expect(response.message).toBe('Dashboard data fetched successfully.');
    expect(repository.countUsers).toHaveBeenCalledWith(expect.objectContaining({ role: 'REGISTERED_USER', deletedAt: null }));
    expect(repository.countPayments).toHaveBeenCalledWith({ status: PaymentStatus.SUCCEEDED });
    expect(repository.sumPayments).toHaveBeenCalledWith({ status: PaymentStatus.SUCCEEDED });
  });

  it('returns stable zero-data responses when analytics records are missing', async () => {
    const { service } = createService();
    const response = await service.get({});
    expect(response.data.overview).toMatchObject({ totalUsers: 0, totalUsersDeltaPercent: 0, totalProviders: 0, totalProvidersDeltaPercent: 0, transactions: 0, totalRevenue: 0, totalRevenueDeltaPercent: 0 });
    expect(response.data.revenueTrends.range).toBe('LAST_12_MONTHS');
    expect(response.data.revenueTrends.values).toHaveLength(12);
    expect(response.data.revenueTrends.values.every((value) => value === 0)).toBe(true);
    expect(response.data.giftVsPayment).toEqual({ giftCardsPercent: 0, directPaymentsPercent: 0 });
    expect(response.data.providerPerformance).toEqual([]);
    expect(response.data.recentDisputes).toEqual([]);
  });

  it('calculates revenue trends, payment distribution, provider performance, and recent disputes', async () => {
    const now = new Date();
    const currentMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 2));
    const { service } = createService({
      findRevenuePayments: jest.fn().mockResolvedValue([{ amount: new Prisma.Decimal(120), currency: 'USD', createdAt: currentMonth }]),
      findDistributionPayments: jest.fn().mockResolvedValue([{ moneyGiftId: 'gift_1' }, { moneyGiftId: null }, { moneyGiftId: 'gift_2' }]),
        findProviderPerformanceRows: jest.fn().mockResolvedValue([
        { providerId: 'provider_1', providerName: 'Stripe Integration', totalOrders: 2, successfulOrders: 1, totalVolume: 200, currency: 'USD' },
      ]),
      findRecentCustomerDisputes: jest.fn().mockResolvedValue([{ id: 'dispute_1', caseId: 'DISP-9021', reason: DisputeReason.DUPLICATE_CHARGE, priority: DisputePriority.HIGH, status: DisputeStatus.OPEN, createdAt: new Date('2026-04-08T10:00:00.000Z'), user: { firstName: 'Marcus', lastName: 'Wright' } }]),
      findRecentProviderDisputes: jest.fn().mockResolvedValue([{ id: 'provider_dispute_1', caseId: 'PD-9021', reason: 'Late evidence', category: ProviderDisputeCategory.NON_DELIVERY, priority: ProviderDisputeSeverity.LOW, status: ProviderDisputeStatus.OPEN, createdAt: new Date('2026-04-07T10:00:00.000Z'), customer: { firstName: 'Ada', lastName: 'Lovelace' } }]),
    });
    const response = await service.get({});
    expect(response.data.revenueTrends.values.reduce((sum, value) => sum + value, 0)).toBe(120);
    expect(response.data.giftVsPayment).toEqual({ giftCardsPercent: 67, directPaymentsPercent: 33 });
    expect(response.data.providerPerformance).toEqual([{ providerId: 'provider_1', providerName: 'Stripe Integration', successRate: 50, totalVolume: 200 }]);
    expect(response.data.recentDisputes[0]).toMatchObject({ id: 'dispute_1', caseId: 'DISP-9021', userName: 'Marcus Wright', reason: 'Duplicate Charge', status: 'HIGH_PRIORITY' });
  });
});

describe('Admin dashboard overview source safety', () => {
  const controller = readFileSync(join(__dirname, '../admin-dashboard.controller.ts'), 'utf8');
  const service = readFileSync(join(__dirname, '../admin-dashboard.service.ts'), 'utf8');
  const repository = readFileSync(join(__dirname, '../admin-dashboard.repository.ts'), 'utf8');
  const permissions = readFileSync(join(__dirname, '../../admin-roles/constants/permission-catalog.ts'), 'utf8');
  const main = readFileSync(join(__dirname, '../../../main.ts'), 'utf8');
  const swaggerAccess = readFileSync(join(__dirname, '../../../swagger-access.ts'), 'utf8');
  const openapi = JSON.parse(readFileSync(join(__dirname, '../../../../docs/generated/openapi.json'), 'utf8')) as { paths: Record<string, unknown> };

  it('requires dashboard.read permission for every endpoint and documents Swagger examples', () => {
    expect(controller).toContain("@ApiTags('02 Admin - Dashboard Overview')");
    expect(controller.match(/@Permissions\('dashboard\.read'\)/g)).toHaveLength(1);
    expect(controller).toContain('@Get()');
    for (const route of ["@Get('overview')", "@Get('revenue-trends')", "@Get('gift-vs-payment')", "@Get('provider-performance')", "@Get('recent-disputes')"]) expect(controller).not.toContain(route);
    expect(controller).toContain('Dashboard data fetched successfully.');
    expect(controller).toContain('providerPerformance');
  });

  it('adds permission catalog and Swagger access metadata', () => {
    expect(permissions).toContain("module: 'dashboard'");
    expect(permissions).toContain("key: 'read'");
    expect(main).toContain("'02 Admin - Dashboard Overview'");
    expect(swaggerAccess).toContain('GET /api/v1/admin/dashboard');
    expect(swaggerAccess).not.toContain('GET /api/v1/admin/dashboard/overview');
    expect(swaggerAccess).not.toContain('GET /api/v1/admin/dashboard/revenue-trends');
    expect(swaggerAccess).toContain('ADMIN with dashboard.read');
  });

  it('removes legacy dashboard routes from generated Swagger and keeps one route only', () => {
    expect(openapi.paths['/api/v1/admin/dashboard']).toBeDefined();
    for (const path of ['/api/v1/admin/dashboard/overview', '/api/v1/admin/dashboard/revenue-trends', '/api/v1/admin/dashboard/gift-vs-payment', '/api/v1/admin/dashboard/provider-performance', '/api/v1/admin/dashboard/recent-disputes']) {
      expect(openapi.paths[path]).toBeUndefined();
    }
    const dashboardRoutes = Object.keys(openapi.paths).filter((path) => path.startsWith('/api/v1/admin/dashboard'));
    expect(dashboardRoutes).toEqual(['/api/v1/admin/dashboard']);
  });

  it('stays read-only and reuses existing source tables', () => {
    expect(repository).toContain('this.prisma.payment.findMany');
    expect(repository).toContain('this.prisma.providerOrder.groupBy');
    expect(repository).toContain('this.prisma.disputeCase.findMany');
    expect(repository).toContain('this.prisma.providerDisputeCase.findMany');
    expect(repository).not.toContain('.create(');
    expect(repository).not.toContain('.update(');
    expect(repository).not.toContain('.delete(');
    expect(service).not.toContain('Math.random');
  });

  it('does not expose sensitive dashboard fields', () => {
    for (const source of [controller, service, repository]) {
      expect(source).not.toMatch(/cardNumber|cvv|clientSecret|stripeSecret|bankAccount/i);
    }
    for (const source of [service, repository]) {
      expect(source).not.toMatch(/evidence|internalNote/i);
    }
  });
});
