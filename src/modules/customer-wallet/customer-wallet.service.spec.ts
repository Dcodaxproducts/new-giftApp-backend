/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { CustomerWalletLedgerDirection, CustomerWalletLedgerStatus, CustomerWalletLedgerType, UserRole } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';
import { CustomerWalletRepository } from './customer-wallet.repository';
import { CustomerWalletService } from './customer-wallet.service';
import { WalletHistoryStatus, WalletHistoryType } from './dto/customer-wallet.dto';

const wallet = { id: 'wallet_1', userId: 'customer_1', cashBalance: 100, giftCredits: 25, currency: 'USD', createdAt: new Date(), updatedAt: new Date() };
const ledger = { id: 'ledger_1', userId: 'customer_1', walletId: 'wallet_1', paymentId: null, rewardLedgerId: null, type: CustomerWalletLedgerType.TOP_UP, direction: CustomerWalletLedgerDirection.CREDIT, amount: 50, currency: 'USD', status: CustomerWalletLedgerStatus.SUCCESS, transactionId: 'TXN-1', description: 'Wallet top-up completed.', metadataJson: {}, createdAt: new Date(), updatedAt: new Date() };
const paymentMethod = { id: 'pm_1', userId: 'customer_1', stripePaymentMethodId: 'pm_card_visa', type: 'CARD', brand: 'visa', last4: '4242', expiryMonth: 9, expiryYear: 2028, isDefault: true, deletedAt: null };
const bankAccount = { id: 'bank_1', userId: 'customer_1', accountHolderName: 'John Smith', bankName: 'Chase Bank', maskedAccount: '**** 8821', last4: '8821', isDefault: true, deletedAt: null };

function createService(overrides: Partial<{ wallet: unknown; ledgerRows: unknown[] }> = {}) {
  const walletResult = Object.prototype.hasOwnProperty.call(overrides, 'wallet') ? overrides.wallet : wallet;
  const ledgerRows = overrides.ledgerRows ?? [ledger];
  const prisma = {
    customerWallet: {
      findUnique: jest.fn().mockResolvedValue(walletResult),
      create: jest.fn().mockResolvedValue(wallet),
      update: jest.fn(),
    },
    customerPaymentMethod: { findFirst: jest.fn().mockResolvedValue(paymentMethod) },
    customerBankAccount: { findFirst: jest.fn().mockResolvedValue(bankAccount), findMany: jest.fn(), updateMany: jest.fn(), update: jest.fn(), create: jest.fn(), delete: jest.fn() },
    customerWalletLedger: { findMany: jest.fn().mockResolvedValue(ledgerRows), count: jest.fn().mockResolvedValue(ledgerRows.length), create: jest.fn(), findFirst: jest.fn(), update: jest.fn(), updateMany: jest.fn() },
    payment: { create: jest.fn(), update: jest.fn() },
    notification: { create: jest.fn() },
    $transaction: jest.fn().mockImplementation((input: unknown) => Array.isArray(input) ? Promise.all(input as Promise<unknown>[]) : (input as (tx: unknown) => unknown)(prisma)),
  };
  const repository = new CustomerWalletRepository(prisma as unknown as ConstructorParameters<typeof CustomerWalletRepository>[0]);
  return { service: new CustomerWalletService(prisma as unknown as ConstructorParameters<typeof CustomerWalletService>[0], repository), prisma, repository };
}

describe('Customer wallet source safety', () => {
  const walletService = readFileSync(join(__dirname, 'customer-wallet.service.ts'), 'utf8');
  const walletRepository = readFileSync(join(__dirname, 'customer-wallet.repository.ts'), 'utf8');
  const walletController = readFileSync(join(__dirname, 'customer-wallet.controller.ts'), 'utf8');
  const paymentsService = readFileSync(join(__dirname, '../payments/payments.service.ts'), 'utf8');
  const paymentsController = readFileSync(join(__dirname, '../payments/payments.controller.ts'), 'utf8');
  const referralsService = readFileSync(join(__dirname, '../customer-referrals/customer-referrals.service.ts'), 'utf8');
  const schema = readFileSync(join(__dirname, '../../../prisma/schema.prisma'), 'utf8');

  it('adds customer wallet and ledger models without mutable-only balances', () => {
    expect(schema).toContain('model CustomerWallet');
    expect(schema).toContain('model CustomerWalletLedger');
    expect(schema).toContain('cashBalance Decimal');
    expect(schema).toContain('giftCredits Decimal');
    expect(walletService).toContain('customerWalletLedger.create');
    expect(walletService).toContain('cashBalance: { increment: ledger.amount }');
    expect(walletService).toContain('giftCredits: { increment: rewardLedger.amount }');
  });

  it('exposes registered-user wallet APIs under Customer Wallet', () => {
    expect(walletController).toContain("@ApiTags('05 Customer - Wallet')");
    expect(walletController).toContain('@Roles(UserRole.REGISTERED_USER)');
    expect(walletController).toContain("@Controller('customer/wallet')");
    expect(walletController).toContain("@Post('add-funds')");
    expect(walletController).toContain("@Get('history')");
  });

  it('wallet is scoped to the authenticated customer and lazily created', () => {
    expect(walletService).toContain('getOrCreateWallet(user.uid)');
    expect(walletService).toContain('userId: user.uid');
    expect(walletRepository).toContain('createWalletForUser');
    expect(walletRepository).toContain('customerWallet.create({ data: { userId');
    expect(walletService).not.toContain('query.userId');
  });

  it('repository owns wallet overview and history reads', () => {
    expect(walletRepository).toContain('findWalletByUserId');
    expect(walletRepository).toContain('findDefaultPaymentMethodForUser');
    expect(walletRepository).toContain('findDefaultBankAccountForUser');
    expect(walletRepository).toContain('findWalletLedgerEntries');
    expect(walletRepository).toContain('countWalletLedgerEntries');
    expect(walletRepository).toContain('findWalletHistoryRows');
    expect(walletService).not.toContain('customerWallet.findUnique');
    expect(walletService).not.toContain('customerPaymentMethod.findFirst');
    expect(walletService).not.toContain('customerWalletLedger.findMany');
    expect(walletService).not.toContain('customerWalletLedger.count');
  });

  it('wallet top-up creates Stripe PaymentIntent and credits only after success', () => {
    expect(walletService).toContain('paymentIntents.create');
    expect(walletService).toContain('Wallet top-up pending payment.');
    expect(walletService).toContain('creditWalletTopUp(payment');
    expect(paymentsService).toContain('creditWalletTopUp(updated)');
    expect(walletService).toContain('CustomerWalletLedgerStatus.SUCCESS');
  });

  it('referral reward redemption credits wallet ledger as gift credits', () => {
    expect(referralsService).toContain('creditRewardRedemption(user.uid, entry)');
    expect(walletService).toContain('CustomerWalletLedgerType.REWARD_CREDIT');
    expect(walletService).toContain('rewardLedgerId: rewardLedger.id');
  });

  it('generalizes customer payment methods and returns masked card data only', () => {
    expect(paymentsController).toContain("@ApiTags('05 Customer - Payment Methods')");
    expect(paymentsController).toContain("@Post('setup-intent')");
    expect(paymentsController).toContain("@Get('saved')");
    expect(paymentsService).toContain('setupIntents.create');
    expect(paymentsService).toContain('toSavedPaymentMethod');
    expect(paymentsService).toContain('last4');
    expect(paymentsService).not.toContain('cardNumber');
    expect(paymentsService).not.toContain('cvv');
  });

  it('enforces own payment methods, default uniqueness, and active recurring delete guard', () => {
    expect(paymentsService).toContain('getOwnedPaymentMethod(user.uid, id)');
    expect(paymentsService).toContain('updateMany({ where: { userId: user.uid, isDefault: true }');
    expect(paymentsService).toContain('activeRecurring');
    expect(paymentsService).toContain('Payment method is used by an active recurring payment');
  });

  it('bank accounts store and return masked metadata only', () => {
    expect(schema).toContain('model CustomerBankAccount');
    expect(schema).toContain('maskedAccount');
    expect(schema).not.toContain('ibanOrAccountNumber');
    expect(walletService).toContain('maskedAccount: `**** ${last4}`');
    expect(walletService).toContain('toBankAccount');
    expect(walletService).not.toContain('accountNumber:');
  });
});

describe('CustomerWalletService read APIs', () => {
  it('customer can fetch own wallet', async () => {
    const { service, prisma } = createService();
    const result = await service.overview({ uid: 'customer_1', role: UserRole.REGISTERED_USER });
    expect(result.message).toBe('Wallet fetched successfully.');
    expect(result.data.totalBalance).toBe(125);
    expect(prisma.customerWallet.findUnique).toHaveBeenCalledWith({ where: { userId: 'customer_1' } });
    expect(prisma.customerPaymentMethod.findFirst).toHaveBeenCalledWith({ where: { userId: 'customer_1', isDefault: true, deletedAt: null } });
  });

  it('wallet lazy creation behavior remains unchanged', async () => {
    const { service, prisma } = createService({ wallet: null });
    const result = await service.overview({ uid: 'customer_1', role: UserRole.REGISTERED_USER });
    expect(result.message).toBe('Wallet fetched successfully.');
    expect(prisma.customerWallet.create).toHaveBeenCalledWith({ data: { userId: 'customer_1', currency: 'USD' } });
  });

  it('customer cannot access another user wallet because JWT user id scopes reads', async () => {
    const { service, prisma } = createService();
    await service.overview({ uid: 'customer_2', role: UserRole.REGISTERED_USER });
    expect(prisma.customerWallet.findUnique).toHaveBeenCalledWith({ where: { userId: 'customer_2' } });
  });

  it('wallet balance calculation remains unchanged', async () => {
    const { service } = createService();
    const result = await service.overview({ uid: 'customer_1', role: UserRole.REGISTERED_USER });
    expect(result.data).toEqual(expect.objectContaining({ cashBalance: 100, giftCredits: 25, totalBalance: 125, currency: 'USD' }));
  });

  it('wallet history is scoped to customer', async () => {
    const { service, prisma } = createService();
    const result = await service.history({ uid: 'customer_1', role: UserRole.REGISTERED_USER }, {});
    expect(result.message).toBe('Wallet history fetched successfully.');
    expect(result.data[0]).toEqual(expect.objectContaining({ id: 'ledger_1', amount: 50, status: CustomerWalletLedgerStatus.SUCCESS }));
    expect(prisma.customerWalletLedger.count).toHaveBeenCalledWith({ where: { userId: 'customer_1' } });
  });

  it('wallet history filters remain unchanged', async () => {
    const { service, prisma } = createService();
    await service.history({ uid: 'customer_1', role: UserRole.REGISTERED_USER }, { type: WalletHistoryType.TOP_UP, status: WalletHistoryStatus.SUCCESS, fromDate: '2026-01-01T00:00:00.000Z', toDate: '2026-01-31T23:59:59.999Z' });
    expect(prisma.customerWalletLedger.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ userId: 'customer_1', type: WalletHistoryType.TOP_UP, status: WalletHistoryStatus.SUCCESS, createdAt: { gte: new Date('2026-01-01T00:00:00.000Z'), lte: new Date('2026-01-31T23:59:59.999Z') } }),
      orderBy: { createdAt: 'desc' },
      skip: 0,
      take: 20,
    }));
  });
});
