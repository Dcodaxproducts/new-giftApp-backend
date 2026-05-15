/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { ProviderApprovalStatus, ProviderEarningsLedgerDirection, ProviderEarningsLedgerStatus, ProviderEarningsLedgerType, ProviderPayoutAccountType, ProviderPayoutExternalProvider, ProviderPayoutMethodType, ProviderPayoutStatus, ProviderPayoutVerificationStatus, UserRole } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';
import { ProviderEarningsPayoutsRepository } from './provider-earnings-payouts.repository';
import { ProviderEarningsPayoutsService } from './provider-earnings-payouts.service';

const provider = { id: 'provider_1', role: UserRole.PROVIDER, deletedAt: null, providerApprovalStatus: ProviderApprovalStatus.APPROVED, isActive: true, isApproved: true, suspendedAt: null };
const payoutMethod = { id: 'method_1', providerId: 'provider_1', type: ProviderPayoutMethodType.BANK_ACCOUNT, accountHolderName: 'Sylvia Bond', bankName: 'Chase Bank', accountType: ProviderPayoutAccountType.CHECKING, country: 'US', currency: 'USD', maskedAccount: '**** 5678', last4: '5678', payerId: 'SB-4491-5678', externalProvider: ProviderPayoutExternalProvider.MANUAL, externalAccountId: null, verificationStatus: ProviderPayoutVerificationStatus.VERIFIED, isDefault: true, isActive: true, deletedAt: null, createdAt: new Date(), updatedAt: new Date() };
const ledger = { id: 'ledger_1', providerId: 'provider_1', providerOrderId: 'po_1', payoutId: null, type: ProviderEarningsLedgerType.ORDER_EARNING, direction: ProviderEarningsLedgerDirection.CREDIT, amount: 1500, currency: 'USD', status: ProviderEarningsLedgerStatus.AVAILABLE, description: 'Order #ORD-10293 payout', metadataJson: {}, createdAt: new Date(), updatedAt: new Date(), providerOrder: { orderNumber: 'ORD-10293' } };
const payout = { id: 'payout_1', providerId: 'provider_1', payoutMethodId: 'method_1', transactionId: 'TXN-2026-001234', amount: 500, processingFee: 0, totalToReceive: 500, currency: 'USD', status: ProviderPayoutStatus.PENDING, externalPayoutId: null, failureReason: null, expectedArrivalAt: new Date(), completedAt: null, idempotencyKey: 'idem_1', createdAt: new Date(), updatedAt: new Date(), payoutMethod };

function createService(overrides: Partial<{ ledgers: unknown[]; payoutMethod: unknown; payout: unknown; duplicate: unknown }> = {}) {
  const ledgers = overrides.ledgers ?? [ledger];
  const prisma = {
    user: { findFirst: jest.fn().mockResolvedValue(provider) },
    providerEarningsLedger: { findMany: jest.fn().mockResolvedValue(ledgers), count: jest.fn().mockResolvedValue(ledgers.length), create: jest.fn().mockResolvedValue({ ...ledger, type: ProviderEarningsLedgerType.PAYOUT, direction: ProviderEarningsLedgerDirection.DEBIT, status: ProviderEarningsLedgerStatus.PAYOUT_PENDING }), updateMany: jest.fn().mockResolvedValue({ count: 1 }), upsert: jest.fn() },
    providerPayoutMethod: { findFirst: jest.fn().mockResolvedValue(Object.prototype.hasOwnProperty.call(overrides, 'payoutMethod') ? overrides.payoutMethod : payoutMethod) },
    providerPayout: { findMany: jest.fn().mockResolvedValue([payout]), count: jest.fn().mockResolvedValue(1), findFirst: jest.fn().mockImplementation(({ where }) => where?.idempotencyKey ? Promise.resolve(overrides.duplicate ?? null) : Promise.resolve(Object.prototype.hasOwnProperty.call(overrides, 'payout') ? overrides.payout : payout)), create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ ...payout, ...data, payoutMethod })), update: jest.fn().mockImplementation(({ data }) => Promise.resolve({ ...payout, ...data, payoutMethod })) },
    notification: { create: jest.fn().mockResolvedValue({ id: 'n1' }) },
    $transaction: jest.fn().mockImplementation((input: unknown) => typeof input === 'function' ? (input as (tx: unknown) => unknown)(prisma) : Promise.all(input as Promise<unknown>[])),
  };
  const repository = new ProviderEarningsPayoutsRepository(prisma as unknown as ConstructorParameters<typeof ProviderEarningsPayoutsRepository>[0]);
  return { service: new ProviderEarningsPayoutsService(prisma as unknown as ConstructorParameters<typeof ProviderEarningsPayoutsService>[0], repository), prisma, repository };
}

describe('Provider earnings/payouts source safety', () => {
  const earningsController = readFileSync(join(__dirname, 'provider-earnings.controller.ts'), 'utf8');
  const payoutsController = readFileSync(join(__dirname, 'provider-payouts.controller.ts'), 'utf8');
  const service = readFileSync(join(__dirname, 'provider-earnings-payouts.service.ts'), 'utf8');
  const repository = readFileSync(join(__dirname, 'provider-earnings-payouts.repository.ts'), 'utf8');
  it('creates provider-specific earnings and payouts routes without customer wallet reuse', () => {
    expect(earningsController).toContain("@Controller('provider/earnings')");
    expect(payoutsController).toContain("@Controller('provider/payouts')");
    expect(earningsController).toContain('@Roles(UserRole.PROVIDER)');
    expect(payoutsController.indexOf("@Get('summary')")).toBeLessThan(payoutsController.indexOf("@Get(':id')"));
    expect(payoutsController.indexOf("@Get('preview')")).toBeLessThan(payoutsController.indexOf("@Get(':id')"));
  });
  it('derives provider from JWT and never trusts providerId', () => {
    expect(service).toContain('getApprovedActiveProvider(user.uid)');
    expect(service).not.toContain('query.providerId');
    expect(service).not.toContain('dto.providerId');
  });
  it('adds repository methods for provider-scoped read APIs without route changes', () => {
    expect(repository).toContain('findLedgerEntriesForProvider');
    expect(repository).toContain('countLedgerEntriesForProvider');
    expect(repository).toContain('findEarningsChartRows');
    expect(repository).toContain('findPayoutsForProvider');
    expect(repository).toContain('countPayoutsForProvider');
    expect(repository).toContain('findPayoutByIdForProvider(providerId: string, id: string)');
    expect(repository).toContain('findDefaultPayoutMethodForProvider(providerId: string)');
    expect(repository).toContain('findPayoutMethodForProvider(providerId: string, id: string)');
    expect(repository).toContain('where: { id, providerId }');
  });
});

describe('ProviderEarningsPayoutsService', () => {
  it('provider can fetch own earnings summary', async () => { const { service, prisma } = createService(); const result = await service.earningsSummary({ uid: 'provider_1', role: UserRole.PROVIDER }, {}); expect(result.message).toBe('Provider earnings summary fetched successfully.'); expect(result.data.availableForPayout).toBe(1500); expect(prisma.providerEarningsLedger.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ providerId: 'provider_1' }) })); });
  it('provider cannot see another provider earnings through summary scope', async () => { const { service, prisma } = createService(); await service.earningsSummary({ uid: 'provider_2', role: UserRole.PROVIDER }, {}); expect(prisma.providerEarningsLedger.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ providerId: 'provider_2' }) })); });
  it('earnings chart is provider-scoped', async () => { const { service, prisma } = createService(); const result = await service.earningsChart({ uid: 'provider_1', role: UserRole.PROVIDER }, {}); expect(result.data.values).toHaveLength(7); expect(prisma.providerEarningsLedger.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ providerId: 'provider_1' }) })); });
  it('ledger is provider-scoped', async () => { const { service, prisma } = createService(); const result = await service.earningsLedger({ uid: 'provider_1', role: UserRole.PROVIDER }, {}); expect(result.data[0]).toEqual(expect.objectContaining({ type: ProviderEarningsLedgerType.ORDER_EARNING, orderNumber: 'ORD-10293' })); expect(prisma.providerEarningsLedger.count).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ providerId: 'provider_1' }) })); });
  it('provider can fetch payout summary', async () => { const { service, prisma } = createService(); const result = await service.payoutSummary({ uid: 'provider_1', role: UserRole.PROVIDER }); expect(result.message).toBe('Provider payout summary fetched successfully.'); expect(prisma.providerPayout.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { providerId: 'provider_1' } })); });
  it('payout history is provider-scoped', async () => { const { service, prisma } = createService(); const result = await service.payoutHistory({ uid: 'provider_1', role: UserRole.PROVIDER }, {}); expect(result.data[0]).toEqual(expect.objectContaining({ transactionId: 'TXN-2026-001234' })); expect(prisma.providerPayout.count).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ providerId: 'provider_1' }) })); });
  it('payout preview validates provider-owned payout method', async () => { const { service, prisma } = createService(); const result = await service.payoutPreview({ uid: 'provider_1', role: UserRole.PROVIDER }, { amount: 500, payoutMethodId: 'method_1' }); expect(result.message).toBe('Payout preview fetched successfully.'); expect(prisma.providerPayoutMethod.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ id: 'method_1', providerId: 'provider_1' }) })); });
  it('payout preview rejects amount above available balance', async () => { const { service } = createService(); await expect(service.payoutPreview({ uid: 'provider_1', role: UserRole.PROVIDER }, { amount: 5000, payoutMethodId: 'method_1' })).rejects.toThrow(BadRequestException); });
  it('provider can request payout from available balance', async () => { const { service } = createService(); const result = await service.requestPayout({ uid: 'provider_1', role: UserRole.PROVIDER }, { amount: 500, payoutMethodId: 'method_1', idempotencyKey: 'idem_new' }); expect(result.message).toBe('Payout requested successfully.'); });
  it('provider cannot request payout above available balance', async () => { const { service } = createService(); await expect(service.requestPayout({ uid: 'provider_1', role: UserRole.PROVIDER }, { amount: 5000, payoutMethodId: 'method_1', idempotencyKey: 'idem_new' })).rejects.toThrow(BadRequestException); });
  it('provider cannot request payout without verified payout method', async () => { const { service } = createService({ payoutMethod: { ...payoutMethod, verificationStatus: ProviderPayoutVerificationStatus.PENDING } }); await expect(service.requestPayout({ uid: 'provider_1', role: UserRole.PROVIDER }, { amount: 500, payoutMethodId: 'method_1', idempotencyKey: 'idem_new' })).rejects.toThrow(BadRequestException); });
  it('provider cannot use another provider payout method', async () => { const { service } = createService({ payoutMethod: null }); await expect(service.requestPayout({ uid: 'provider_1', role: UserRole.PROVIDER }, { amount: 500, payoutMethodId: 'other_method', idempotencyKey: 'idem_new' })).rejects.toThrow(NotFoundException); });
  it('duplicate payout request with same idempotencyKey is blocked', async () => { const { service } = createService({ duplicate: payout }); await expect(service.requestPayout({ uid: 'provider_1', role: UserRole.PROVIDER }, { amount: 500, payoutMethodId: 'method_1', idempotencyKey: 'idem_1' })).rejects.toThrow(ConflictException); });
  it('payout request locks ledger balance', async () => { const { service, prisma } = createService(); await service.requestPayout({ uid: 'provider_1', role: UserRole.PROVIDER }, { amount: 500, payoutMethodId: 'method_1', idempotencyKey: 'idem_new' }); expect(prisma.providerEarningsLedger.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: ProviderEarningsLedgerStatus.PAYOUT_PENDING, type: ProviderEarningsLedgerType.PAYOUT }) })); });
  it('failed payout returns balance to available', async () => { const { service, prisma } = createService(); await service.returnFailedPayoutBalance('provider_1', 'payout_1', 'Bank failed'); expect(prisma.providerEarningsLedger.updateMany).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: ProviderEarningsLedgerStatus.AVAILABLE }) })); });
  it('pending payout can be cancelled', async () => { const { service } = createService(); const result = await service.cancelPayout({ uid: 'provider_1', role: UserRole.PROVIDER }, 'payout_1', { reason: 'Requested by provider.' }); expect(result.data.status).toBe(ProviderPayoutStatus.CANCELLED); });
  it('completed payout cannot be cancelled', async () => { const { service } = createService({ payout: { ...payout, status: ProviderPayoutStatus.COMPLETED } }); await expect(service.cancelPayout({ uid: 'provider_1', role: UserRole.PROVIDER }, 'payout_1', {})).rejects.toThrow(ConflictException); });
  it('provider cannot access another provider payout', async () => { const { service } = createService({ payout: null }); await expect(service.payoutDetails({ uid: 'provider_1', role: UserRole.PROVIDER }, 'other_payout')).rejects.toThrow(NotFoundException); });
});
