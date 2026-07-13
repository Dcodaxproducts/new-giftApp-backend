/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { OrderStatus, WalletLedgerDirection, WalletLedgerStatus, WalletLedgerType, ProviderPayoutAccountType, ProviderPayoutExternalProvider, ProviderPayoutMethodType, ProviderPayoutStatus, ProviderPayoutVerificationStatus, UserRole, UserStatus } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';
import { ProviderPayoutAction } from './dto/provider-earnings-payouts.dto';
import { ProviderEarningsPayoutsRepository } from './repositories/provider-earnings-payouts.repository';
import { ProviderEarningsPayoutsService } from './services/provider-earnings-payouts.service';

const provider = { id: 'provider_1', role: UserRole.PROVIDER, deletedAt: null, status: UserStatus.APPROVED };
const providerWallet = { id: 'wallet_p1', ownerType: 'PROVIDER', ownerId: 'provider_1', balance: 1500, giftCredits: 0, currency: 'USD', createdAt: new Date(), updatedAt: new Date() };
const payoutMethod = { id: 'method_1', providerId: 'provider_1', type: ProviderPayoutMethodType.BANK_ACCOUNT, accountHolderName: 'Sylvia Bond', bankName: 'Chase Bank', accountType: ProviderPayoutAccountType.CHECKING, country: 'US', currency: 'USD', maskedAccount: '**** 5678', last4: '5678', payerId: 'SB-4491-5678', externalProvider: ProviderPayoutExternalProvider.MANUAL, externalAccountId: null, verificationStatus: ProviderPayoutVerificationStatus.VERIFIED, isDefault: true, isActive: true, deletedAt: null, createdAt: new Date(), updatedAt: new Date() };
const ledger = { id: 'ledger_1', walletId: 'wallet_p1', orderId: 'order_1', paymentId: null, withdrawalId: null, rewardLedgerId: null, type: WalletLedgerType.ORDER_EARNING, direction: WalletLedgerDirection.CREDIT, amount: 1500, currency: 'USD', status: WalletLedgerStatus.SUCCESS, transactionId: 'TXN-1', description: 'Order #ORD-10293 payout', createdAt: new Date(), order: { orderNumber: 'ORD-10293' } };
const withdrawal = { id: 'payout_1', walletId: 'wallet_p1', bankAccountId: 'method_1', transactionId: 'TXN-2026-001234', amount: 500, processingFee: 0, totalToReceive: 500, currency: 'USD', status: ProviderPayoutStatus.PENDING, externalPayoutId: null, failureReason: null, expectedArrivalAt: new Date(), completedAt: null, idempotencyKey: 'idem_1', createdAt: new Date(), updatedAt: new Date() };
const order = { id: 'order_1', providerId: 'provider_1', orderNumber: 'ORD-10293', total: 1200, currency: 'USD', status: OrderStatus.DELIVERED };

function createService(overrides: Partial<{ payoutMethod: unknown; withdrawal: unknown; duplicate: unknown; order: unknown; provider: unknown; wallet: unknown }> = {}) {
  const currentProvider = Object.prototype.hasOwnProperty.call(overrides, 'provider') ? overrides.provider : provider;
  const currentWallet = Object.prototype.hasOwnProperty.call(overrides, 'wallet') ? overrides.wallet : providerWallet;
  const currentWithdrawal = Object.prototype.hasOwnProperty.call(overrides, 'withdrawal') ? overrides.withdrawal : withdrawal;
  const prisma = {
    user: { findFirst: jest.fn().mockResolvedValue(currentProvider) },
    wallet: { findUnique: jest.fn().mockResolvedValue(currentWallet), upsert: jest.fn().mockResolvedValue(providerWallet), update: jest.fn() },
    walletLedger: { findMany: jest.fn().mockResolvedValue([ledger]), count: jest.fn().mockResolvedValue(1), findFirst: jest.fn().mockResolvedValue(null), create: jest.fn().mockResolvedValue(ledger), updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
    walletWithdrawal: { findMany: jest.fn().mockResolvedValue([withdrawal]), count: jest.fn().mockResolvedValue(1), findFirst: jest.fn().mockImplementation(({ where }) => where?.idempotencyKey ? Promise.resolve(overrides.duplicate ?? null) : where?.bankAccountId ? Promise.resolve(null) : Promise.resolve(currentWithdrawal)), create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ ...withdrawal, ...data })), update: jest.fn().mockImplementation(({ data }) => Promise.resolve({ ...withdrawal, ...data })) },
    providerPayoutMethod: { findFirst: jest.fn().mockResolvedValue(Object.prototype.hasOwnProperty.call(overrides, 'payoutMethod') ? overrides.payoutMethod : payoutMethod), findMany: jest.fn().mockResolvedValue([payoutMethod]) },
    order: { findUnique: jest.fn().mockResolvedValue(Object.prototype.hasOwnProperty.call(overrides, 'order') ? overrides.order : order) },
    notification: { create: jest.fn().mockResolvedValue({ id: 'n1' }) },
    $transaction: jest.fn().mockImplementation((input: unknown) => typeof input === 'function' ? (input as (tx: unknown) => unknown)(prisma) : Promise.all(input as Promise<unknown>[])),
  };
  const notificationDispatch = { createAndEmit: jest.fn(), emitExisting: jest.fn() };
  const repository = new ProviderEarningsPayoutsRepository(prisma as unknown as ConstructorParameters<typeof ProviderEarningsPayoutsRepository>[0], notificationDispatch as never);
  return { service: new ProviderEarningsPayoutsService(repository), prisma, repository, notificationDispatch };
}

describe('Provider earnings/payouts source safety', () => {
  const earningsController = readFileSync(join(__dirname, './controllers/provider-earnings.controller.ts'), 'utf8');
  const payoutsController = readFileSync(join(__dirname, './controllers/provider-payouts.controller.ts'), 'utf8');
  const service = readFileSync(join(__dirname, './services/provider-earnings-payouts.service.ts'), 'utf8');
  const repository = readFileSync(join(__dirname, './repositories/provider-earnings-payouts.repository.ts'), 'utf8');
  it('creates provider-specific earnings and payouts routes without customer wallet reuse', () => {
    expect(earningsController).toContain("@Controller('provider/earnings')");
    expect(payoutsController).toContain("@Controller('provider/payouts')");
    expect(earningsController).toContain('@Roles(UserRole.PROVIDER)');
    expect(payoutsController.indexOf("@Get('summary')")).toBeLessThan(payoutsController.indexOf("@Get(':id')"));
    expect(payoutsController.indexOf("@Get('preview')")).toBeLessThan(payoutsController.indexOf("@Get(':id')"));
    expect(payoutsController).toContain("@Post(':id/action')");
    expect(payoutsController).toContain('ProviderPayoutActionDto');
  });
  it('derives provider from JWT and never trusts providerId', () => {
    expect(service).toContain('getApprovedActiveProvider(user.uid)');
    expect(service).not.toContain('query.providerId');
    expect(service).not.toContain('dto.providerId');
  });
  it('adds repository methods for provider-scoped read APIs on the unified wallet', () => {
    expect(repository).toContain('findProviderUserById');
    expect(repository).toContain("role: 'PROVIDER'");
    expect(repository).toContain('findLedgerEntriesForProvider');
    expect(repository).toContain('findEarningsChartRows');
    expect(repository).toContain('findPayoutsForProvider');
    expect(repository).toContain('countPayoutsForProvider');
    expect(repository).toContain('findPayoutByIdForProvider');
    expect(repository).toContain('findDefaultPayoutMethodForProvider');
    expect(repository).toContain('findPayoutMethodForProvider');
    expect(repository).toContain('WalletOwnerType.PROVIDER');
  });
  it('adds repository write methods while service keeps payout decisions', () => {
    expect(repository).toContain('findExistingPayoutByIdempotencyKey');
    expect(repository).toContain('createPayoutRequest');
    expect(repository).toContain('cancelPayoutRequest');
    expect(repository).toContain('findOrderForEarning');
    expect(repository).toContain('createOrderEarningLedgerEntry');
    expect(repository).toContain('returnFailedPayoutBalance');
    expect(service).toContain('if (duplicate) throw new ConflictException');
    expect(service).toContain('if (payout.status !== ProviderPayoutStatus.PENDING)');
    expect(service).toContain('async payoutAction');
    expect(service).toContain('ProviderPayoutAction.CANCEL');
    expect(service).toContain('preview(user.uid, dto.amount, dto.payoutMethodId)');
  });
  it('service no longer contains direct Prisma writes for payout lifecycle methods', () => {
    expect(service).not.toContain('this.prisma');
    expect(service).not.toContain('PrismaService');
  });
});

describe('ProviderEarningsPayoutsService', () => {
  it('approved active provider can access earnings summary from wallet balance', async () => { const { service, prisma } = createService(); const result = await service.earningsSummary({ uid: 'provider_1', role: UserRole.PROVIDER }, {}); expect(result.message).toBe('Provider earnings summary fetched successfully.'); expect(result.data.availableForPayout).toBe(1500); expect(prisma.user.findFirst).toHaveBeenCalledWith({ where: { id: 'provider_1', role: 'PROVIDER' }, include: { providerProfile: true } }); });
  it('pending provider is rejected with existing behavior', async () => { const { service } = createService({ provider: { ...provider, status: UserStatus.PENDING } }); await expect(service.earningsSummary({ uid: 'provider_1', role: UserRole.PROVIDER }, {})).rejects.toThrow(ForbiddenException); });
  it('earnings chart is provider-scoped', async () => { const { service } = createService(); const result = await service.earningsChart({ uid: 'provider_1', role: UserRole.PROVIDER }, {}); expect(result.data.values).toHaveLength(7); });
  it('ledger is provider-scoped', async () => { const { service } = createService(); const result = await service.earningsLedger({ uid: 'provider_1', role: UserRole.PROVIDER }, {}); expect(result.data[0]).toEqual(expect.objectContaining({ type: WalletLedgerType.ORDER_EARNING, orderNumber: 'ORD-10293' })); });
  it('provider can fetch payout summary', async () => { const { service } = createService(); const result = await service.payoutSummary({ uid: 'provider_1', role: UserRole.PROVIDER }); expect(result.message).toBe('Provider payout summary fetched successfully.'); });
  it('payout history is provider-scoped', async () => { const { service } = createService(); const result = await service.payoutHistory({ uid: 'provider_1', role: UserRole.PROVIDER }, {}); expect(result.data[0]).toEqual(expect.objectContaining({ transactionId: 'TXN-2026-001234' })); });
  it('payout preview validates provider-owned payout method', async () => { const { service, prisma } = createService(); const result = await service.payoutPreview({ uid: 'provider_1', role: UserRole.PROVIDER }, { amount: 500, payoutMethodId: 'method_1' }); expect(result.message).toBe('Payout preview fetched successfully.'); expect(prisma.providerPayoutMethod.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ id: 'method_1', providerId: 'provider_1' }) })); });
  it('payout preview rejects amount above available balance', async () => { const { service } = createService(); await expect(service.payoutPreview({ uid: 'provider_1', role: UserRole.PROVIDER }, { amount: 5000, payoutMethodId: 'method_1' })).rejects.toThrow(BadRequestException); });
  it('provider can request payout from available balance', async () => { const { service } = createService(); const result = await service.requestPayout({ uid: 'provider_1', role: UserRole.PROVIDER }, { amount: 500, payoutMethodId: 'method_1', idempotencyKey: 'idem_new' }); expect(result.message).toBe('Payout requested successfully.'); });
  it('provider cannot request payout above available balance', async () => { const { service } = createService(); await expect(service.requestPayout({ uid: 'provider_1', role: UserRole.PROVIDER }, { amount: 5000, payoutMethodId: 'method_1', idempotencyKey: 'idem_new' })).rejects.toThrow(BadRequestException); });
  it('provider cannot request payout without verified payout method', async () => { const { service } = createService({ payoutMethod: { ...payoutMethod, verificationStatus: ProviderPayoutVerificationStatus.PENDING } }); await expect(service.requestPayout({ uid: 'provider_1', role: UserRole.PROVIDER }, { amount: 500, payoutMethodId: 'method_1', idempotencyKey: 'idem_new' })).rejects.toThrow(BadRequestException); });
  it('provider cannot use another provider payout method', async () => { const { service } = createService({ payoutMethod: null }); await expect(service.requestPayout({ uid: 'provider_1', role: UserRole.PROVIDER }, { amount: 500, payoutMethodId: 'other_method', idempotencyKey: 'idem_new' })).rejects.toThrow(NotFoundException); });
  it('duplicate payout request with same idempotencyKey is blocked', async () => { const { service } = createService({ duplicate: withdrawal }); await expect(service.requestPayout({ uid: 'provider_1', role: UserRole.PROVIDER }, { amount: 500, payoutMethodId: 'method_1', idempotencyKey: 'idem_1' })).rejects.toThrow(ConflictException); });
  it('payout request debits the wallet balance', async () => { const { service, prisma } = createService(); await service.requestPayout({ uid: 'provider_1', role: UserRole.PROVIDER }, { amount: 500, payoutMethodId: 'method_1', idempotencyKey: 'idem_new' }); expect(prisma.wallet.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ balance: expect.objectContaining({ decrement: expect.anything() }) }) })); });
  it('recordOrderEarning credits provider wallet ledger', async () => { const { service, prisma } = createService(); await service.recordOrderEarning('order_1'); expect(prisma.walletLedger.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ type: WalletLedgerType.ORDER_EARNING, direction: WalletLedgerDirection.CREDIT }) })); });
  it('recordOrderEarning skips unpaid or incomplete orders', async () => { const { service, prisma } = createService({ order: { ...order, status: OrderStatus.ACCEPTED } }); await service.recordOrderEarning('order_1'); expect(prisma.walletLedger.create).not.toHaveBeenCalled(); });
  it('failed payout returns balance to the wallet and marks payout failed', async () => { const { service, prisma } = createService(); await service.returnFailedPayoutBalance('provider_1', 'payout_1', 'Bank failed'); expect(prisma.walletWithdrawal.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'payout_1' }, data: expect.objectContaining({ status: ProviderPayoutStatus.FAILED, failureReason: 'Bank failed' }) })); expect(prisma.wallet.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ balance: expect.objectContaining({ increment: expect.anything() }) }) })); });
  it('pending payout can be cancelled through action and returns amount to the wallet', async () => { const { service, prisma } = createService(); const result = await service.payoutAction({ uid: 'provider_1', role: UserRole.PROVIDER }, 'payout_1', { action: ProviderPayoutAction.CANCEL, reason: 'Requested by provider.' }); expect(result.data.status).toBe(ProviderPayoutStatus.CANCELLED); expect(prisma.wallet.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ balance: expect.objectContaining({ increment: expect.anything() }) }) })); });
  it('processing payout cannot be cancelled', async () => { const { service } = createService({ withdrawal: { ...withdrawal, status: ProviderPayoutStatus.PROCESSING } }); await expect(service.payoutAction({ uid: 'provider_1', role: UserRole.PROVIDER }, 'payout_1', { action: ProviderPayoutAction.CANCEL })).rejects.toThrow(ConflictException); });
  it('completed payout cannot be cancelled', async () => { const { service } = createService({ withdrawal: { ...withdrawal, status: ProviderPayoutStatus.COMPLETED } }); await expect(service.payoutAction({ uid: 'provider_1', role: UserRole.PROVIDER }, 'payout_1', { action: ProviderPayoutAction.CANCEL })).rejects.toThrow(ConflictException); });
  it('provider cannot access another provider payout', async () => { const { service } = createService({ withdrawal: null }); await expect(service.payoutDetails({ uid: 'provider_1', role: UserRole.PROVIDER }, 'other_payout')).rejects.toThrow(NotFoundException); });
  it('provider cannot cancel another provider payout', async () => { const { service } = createService({ withdrawal: null }); await expect(service.payoutAction({ uid: 'provider_1', role: UserRole.PROVIDER }, 'other_payout', { action: ProviderPayoutAction.CANCEL })).rejects.toThrow(NotFoundException); });
});
