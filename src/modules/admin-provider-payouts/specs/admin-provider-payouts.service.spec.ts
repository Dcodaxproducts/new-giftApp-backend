import { NotFoundException } from '@nestjs/common';
import { Prisma, ProviderEarningsLedgerDirection, ProviderEarningsLedgerStatus, ProviderEarningsLedgerType, ProviderPayoutStatus, ProviderPayoutVerificationStatus } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';
import { AdminProviderPayoutSortBy, AdminProviderPayoutStatusFilter } from '../dto/admin-provider-payouts.dto';
import { AdminProviderPayoutsRepository } from '../repositories/admin-provider-payouts.repository';
import { AdminProviderPayoutsService } from '../services/admin-provider-payouts.service';

const now = new Date();
const current = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 5));
const previous = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 5));
const provider = { id: 'provider_90210', providerBusinessName: 'TechSolutions Inc.', firstName: 'Tech', lastName: 'Solutions', avatarUrl: 'https://cdn.example.com/provider.png' };
const payoutMethod = { id: 'method_1', bankName: 'Chase Bank', maskedAccount: '****1234', last4: '1234', verificationStatus: ProviderPayoutVerificationStatus.VERIFIED };
const completedPayout = { id: 'payout_1', providerId: provider.id, payoutMethodId: 'method_1', transactionId: 'TXN-001', amount: new Prisma.Decimal(3420), processingFee: new Prisma.Decimal(42), totalToReceive: new Prisma.Decimal(3378), currency: 'USD', status: ProviderPayoutStatus.COMPLETED, externalPayoutId: 'po_ext_1', failureReason: null, expectedArrivalAt: new Date('2026-05-12T00:00:00.000Z'), completedAt: new Date('2026-05-12T00:00:00.000Z'), idempotencyKey: null, createdAt: current, updatedAt: current, provider, payoutMethod };
const pendingPayout = { ...completedPayout, id: 'payout_2', transactionId: 'TXN-002', amount: new Prisma.Decimal(1000), processingFee: new Prisma.Decimal(10), totalToReceive: new Prisma.Decimal(990), status: ProviderPayoutStatus.PENDING, completedAt: null, createdAt: current };
const previousPayout = { ...completedPayout, id: 'payout_prev', amount: new Prisma.Decimal(2000), processingFee: new Prisma.Decimal(20), createdAt: previous, completedAt: previous };

function createService() {
  const repository = {
    findPayouts: jest.fn().mockResolvedValue([completedPayout, pendingPayout, previousPayout]),
    findPayoutById: jest.fn().mockResolvedValue(completedPayout),
    findPreviousCompletedPayout: jest.fn().mockResolvedValue(previousPayout),
    findLedgerEntries: jest.fn().mockResolvedValue([{ id: 'ledger_1', providerId: provider.id, amount: new Prisma.Decimal(6000), currency: 'USD', direction: ProviderEarningsLedgerDirection.CREDIT, type: ProviderEarningsLedgerType.ORDER_EARNING, status: ProviderEarningsLedgerStatus.AVAILABLE, description: 'Order earning', metadataJson: {}, createdAt: current, updatedAt: current, provider }]),
    findCommissionTiers: jest.fn().mockResolvedValue([{ id: 'tier_standard', name: 'Standard Tier', commissionRatePercent: new Prisma.Decimal(15), orderVolumeThreshold: new Prisma.Decimal(0), sortOrder: 1, isActive: true, updatedById: null, deletedAt: null, createdAt: current, updatedAt: current }, { id: 'tier_silver', name: 'Silver Partner', commissionRatePercent: new Prisma.Decimal(12.5), orderVolumeThreshold: new Prisma.Decimal(5000), sortOrder: 2, isActive: true, updatedById: null, deletedAt: null, createdAt: current, updatedAt: current }]),
  };
  return { service: new AdminProviderPayoutsService(repository as unknown as AdminProviderPayoutsRepository), repository };
}

describe('AdminProviderPayoutsService', () => {
  it('calculates stats from provider payout records', async () => {
    const { service } = createService();
    const response = await service.stats();
    expect(response.data).toMatchObject({ totalPayoutsThisMonth: 4420, pendingPayouts: 1000, completedPayouts: 3420, platformRevenue: 52, currency: 'USD' });
    expect(response.message).toBe('Provider payout stats fetched successfully.');
  });

  it('filters by provider, status, date, search and returns scoped list rows', async () => {
    const { service, repository } = createService();
    const response = await service.list({ providerId: provider.id, status: AdminProviderPayoutStatusFilter.COMPLETED, search: 'TechSolutions', fromDate: '2026-05-01T00:00:00.000Z', sortBy: AdminProviderPayoutSortBy.amount });
    expect(response.data[0]).toMatchObject({ id: 'payout_1', provider: { id: provider.id, businessName: 'TechSolutions Inc.', providerCode: 'PRV-90210' }, pendingAmount: 3420, currency: 'USD', status: 'COMPLETED' });
    const calls = repository.findPayouts.mock.calls as unknown[][];
    expect(calls[0]?.[0]).toMatchObject({ where: { providerId: provider.id, status: ProviderPayoutStatus.COMPLETED } });
  });

  it('returns empty list for unsupported ON_HOLD/REJECTED filters without invalid Prisma enum queries', async () => {
    const { service, repository } = createService();
    await expect(service.list({ status: AdminProviderPayoutStatusFilter.ON_HOLD })).resolves.toMatchObject({ data: [], meta: { total: 0 } });
    expect(repository.findPayouts).not.toHaveBeenCalled();
  });

  it('exports using same filters and does not expose full bank account fields', async () => {
    const { service } = createService();
    const exported = await service.export({ providerId: provider.id, status: AdminProviderPayoutStatusFilter.COMPLETED });
    expect(exported.content).toContain('TechSolutions Inc.');
    expect(exported.content).not.toContain('accountHolderName');
    expect(exported.content).not.toContain('externalAccountId');
    expect(exported.content).not.toContain('000123456789');
  });

  it('returns details with masked payout destination only', async () => {
    const { service } = createService();
    const response = await service.details('payout_1');
    expect(response.data.destination).toEqual({ id: 'method_1', bankName: 'Chase Bank', maskedAccount: '****1234', last4: '1234', verificationStatus: 'VERIFIED' });
    expect(JSON.stringify(response.data)).not.toContain('externalAccountId');
    expect(JSON.stringify(response.data)).not.toContain('accountHolderName');
  });

  it('returns payout trends and earning distribution by commission tier', async () => {
    const { service, repository } = createService();
    const trends = await service.trends();
    expect(trends.data.values.reduce((sum, value) => sum + value, 0)).toBeGreaterThan(0);
    const distribution = await service.earningDistribution();
    expect(distribution.data[0]).toMatchObject({ tierId: 'tier_silver', tierName: 'Silver Partner', providerCount: 1, totalEarnings: 6000, currency: 'USD' });
    expect(repository.findLedgerEntries).toHaveBeenCalledWith({ direction: ProviderEarningsLedgerDirection.CREDIT, type: ProviderEarningsLedgerType.ORDER_EARNING, status: { in: [ProviderEarningsLedgerStatus.AVAILABLE, ProviderEarningsLedgerStatus.PAYOUT_PENDING, ProviderEarningsLedgerStatus.PAID] } });
  });

  it('throws for missing payout details', async () => {
    const { service, repository } = createService();
    repository.findPayoutById.mockResolvedValueOnce(null);
    await expect(service.details('missing')).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('Admin provider payouts Swagger and permission safety', () => {
  const controller = readFileSync(join(__dirname, '../controllers/admin-provider-payouts.controller.ts'), 'utf8');
  const repository = readFileSync(join(__dirname, '../repositories/admin-provider-payouts.repository.ts'), 'utf8');
  const permissions = readFileSync(join(__dirname, '../../admin-roles/constants/permission-catalog.ts'), 'utf8');
  const main = readFileSync(join(__dirname, '../../../main.ts'), 'utf8');
  const swaggerAccess = readFileSync(join(__dirname, '../../../swagger-access.ts'), 'utf8');

  it('adds required routes, Swagger examples, and access metadata', () => {
    expect(controller).toContain("@ApiTags('02 Admin - Provider Payouts')");
    for (const route of ["@Get('stats')", "@Get('trends')", "@Get('earning-distribution')", "@Get('export')", '@Get()', "@Get(':id')"]) expect(controller).toContain(route);
    expect(controller).toContain('totalPayoutsThisMonth');
    expect(controller).toContain('TechSolutions Inc.');
    expect(main).toContain("'02 Admin - Provider Payouts'");
    expect(swaggerAccess).toContain('GET /api/v1/admin/provider-payouts/stats');
  });

  it('uses provider payout/ledger records, permissions, and masked payout data', () => {
    expect(permissions).toContain("module: 'providerPayouts'");
    expect(permissions).toContain("key: 'read'");
    expect(permissions).toContain("key: 'export'");
    expect(permissions).toContain("key: 'initiate'");
    expect(controller.match(/@Permissions\('providerPayouts\.read'\)/g)).toHaveLength(5);
    expect(controller).toContain("@Permissions('providerPayouts.export')");
    expect(repository).toContain('this.prisma.providerPayout.findMany');
    expect(repository).toContain('this.prisma.providerEarningsLedger.findMany');
    expect(repository).toContain('maskedAccount');
    expect(repository).not.toContain('accountHolderName: true');
    expect(repository).not.toContain('externalAccountId: true');
  });
});
