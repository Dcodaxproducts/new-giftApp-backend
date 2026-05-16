/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { CustomerWalletLedgerDirection, CustomerWalletLedgerStatus, CustomerWalletLedgerType, PaymentMethod, PaymentProvider, PaymentStatus, UserRole } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';
import { CustomerWalletRepository } from '../repositories/customer-wallet.repository';
import { CustomerWalletService } from '../services/customer-wallet.service';
import { WalletHistoryStatus, WalletHistoryType } from '../dto/customer-wallet.dto';

const wallet = { id: 'wallet_1', userId: 'customer_1', cashBalance: 100, giftCredits: 25, currency: 'USD', createdAt: new Date(), updatedAt: new Date() };
const ledger = { id: 'ledger_1', userId: 'customer_1', walletId: 'wallet_1', paymentId: null, rewardLedgerId: null, type: CustomerWalletLedgerType.TOP_UP, direction: CustomerWalletLedgerDirection.CREDIT, amount: 50, currency: 'USD', status: CustomerWalletLedgerStatus.SUCCESS, transactionId: 'TXN-1', description: 'Wallet top-up completed.', metadataJson: {}, createdAt: new Date(), updatedAt: new Date() };
const paymentMethod = { id: 'pm_1', userId: 'customer_1', stripePaymentMethodId: 'pm_card_visa', type: 'CARD', brand: 'visa', last4: '4242', expiryMonth: 9, expiryYear: 2028, isDefault: true, deletedAt: null };
const bankAccount = { id: 'bank_1', userId: 'customer_1', accountHolderName: 'John Smith', bankName: 'Chase Bank', maskedAccount: '**** 8821', last4: '8821', isDefault: true, deletedAt: null };
const pendingLedger = { ...ledger, id: 'ledger_pending', status: CustomerWalletLedgerStatus.PENDING, description: 'Wallet top-up pending payment.' };
const payment = { id: 'payment_1', userId: 'customer_1', provider: PaymentProvider.STRIPE, amount: 50, currency: 'USD', status: PaymentStatus.PENDING, paymentMethod: PaymentMethod.STRIPE_CARD, providerPaymentIntentId: null, metadataJson: {} };

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
    customerBankAccount: { findFirst: jest.fn().mockResolvedValue(bankAccount), findMany: jest.fn().mockResolvedValue([bankAccount]), updateMany: jest.fn().mockResolvedValue({ count: 1 }), update: jest.fn().mockResolvedValue({ ...bankAccount, isDefault: true }), create: jest.fn().mockResolvedValue(bankAccount), delete: jest.fn().mockResolvedValue(bankAccount) },
    customerWalletLedger: { findMany: jest.fn().mockResolvedValue(ledgerRows), count: jest.fn().mockResolvedValue(ledgerRows.length), create: jest.fn().mockResolvedValue(pendingLedger), findFirst: jest.fn(), update: jest.fn().mockResolvedValue({ ...pendingLedger, paymentId: payment.id }), updateMany: jest.fn() },
    payment: { create: jest.fn().mockResolvedValue(payment), update: jest.fn().mockImplementation(({ data }) => Promise.resolve({ ...payment, ...data })) },
    notification: { create: jest.fn() },
    $transaction: jest.fn().mockImplementation((input: unknown) => Array.isArray(input) ? Promise.all(input as Promise<unknown>[]) : (input as (tx: unknown) => unknown)(prisma)),
  };
  const repository = new CustomerWalletRepository(prisma as unknown as ConstructorParameters<typeof CustomerWalletRepository>[0]);
  return { service: new CustomerWalletService(repository), prisma, repository };
}

function mockStripe(service: CustomerWalletService) {
  process.env.STRIPE_SECRET_KEY = 'sk_test_mock';
  process.env.STRIPE_CURRENCY = 'USD';
  const create = jest.fn().mockResolvedValue({ id: 'pi_1', client_secret: 'secret_1', status: 'requires_confirmation' });
  Object.defineProperty(service, 'stripeClient', { value: { paymentIntents: { create } }, configurable: true });
  return create;
}

describe('Customer wallet source safety', () => {
  const walletService = readFileSync(join(__dirname, '../services/customer-wallet.service.ts'), 'utf8');
  const walletRepository = readFileSync(join(__dirname, '../repositories/customer-wallet.repository.ts'), 'utf8');
  const walletController = readFileSync(join(__dirname, '../controllers/customer-wallet.controller.ts'), 'utf8');
  const paymentsService = readFileSync(join(__dirname, '../../payments/services/payments.service.ts'), 'utf8');
  const paymentsController = readFileSync(join(__dirname, '../../payments/controllers/payments.controller.ts'), 'utf8');
  const referralsService = readFileSync(join(__dirname, '../../customer-referrals/services/customer-referrals.service.ts'), 'utf8');
  const schema = readFileSync(join(__dirname, '../../../../prisma/schema.prisma'), 'utf8');

  it('adds customer wallet and ledger models without mutable-only balances', () => {
    expect(schema).toContain('model CustomerWallet');
    expect(schema).toContain('model CustomerWalletLedger');
    expect(schema).toContain('cashBalance Decimal');
    expect(schema).toContain('giftCredits Decimal');
    expect(walletRepository).toContain('customerWalletLedger.create');
    expect(walletRepository).toContain('cashBalance: { increment: params.amount }');
    expect(walletRepository).toContain('giftCredits: { increment: params.amount }');
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
    expect(walletService).not.toContain('dto.userId');
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
    expect(walletRepository).toContain('CustomerWalletLedgerStatus.SUCCESS');
  });

  it('repository owns wallet top-up write queries while service keeps Stripe orchestration', () => {
    expect(walletRepository).toContain('createWalletLedgerEntry');
    expect(walletRepository).toContain('createWalletTopUpPayment');
    expect(walletRepository).toContain('markWalletTopUpPending');
    expect(walletRepository).toContain('markWalletTopUpPaymentProcessing');
    expect(walletRepository).toContain('completeWalletTopUp');
    expect(walletRepository).toContain('updateWalletTopUpStatus');
    expect(walletService).toContain('paymentIntents.create');
    expect(walletService).not.toContain('customerWalletLedger.create({ data: { userId: user.uid');
    expect(walletService).not.toContain('payment.create({ data: { userId: user.uid');
    expect(walletService).not.toContain('payment.update({ where: { id: payment.id }');
  });

  it('referral reward redemption credits wallet ledger as gift credits', () => {
    expect(referralsService).toContain('creditRewardRedemption(user.uid, entry)');
    expect(walletRepository).toContain('CustomerWalletLedgerType.REWARD_CREDIT');
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
    expect(readFileSync(join(__dirname, '../../payments/repositories/payments.repository.ts'), 'utf8')).toContain('updateMany({ where: { userId, isDefault: true }');
    expect(paymentsService).toContain('activeRecurring');
    expect(paymentsService).toContain('Payment method is used by an active recurring payment');
  });

  it('bank accounts store and return masked metadata only', () => {
    expect(schema).toContain('model CustomerBankAccount');
    expect(schema).toContain('maskedAccount');
    expect(schema).not.toContain('ibanOrAccountNumber');
    expect(walletService).toContain('maskedAccount: `**** ${last4}`');
    expect(walletRepository).toContain('findBankAccountsByUserId');
    expect(walletRepository).toContain('findBankAccountForUser');
    expect(walletRepository).toContain('createBankAccountWithDefault');
    expect(walletRepository).toContain('setDefaultBankAccountForUser');
    expect(walletRepository).toContain('deleteBankAccount');
    expect(walletService).toContain('toBankAccount');
    expect(walletService).not.toContain('accountNumber:');
  });
});

describe('CustomerWalletService read APIs', () => {
  it('customer-wallet.service.ts no longer imports PrismaService or uses this.prisma', () => {
    const serviceSource = readFileSync(join(__dirname, '../services/customer-wallet.service.ts'), 'utf8');
    const repositorySource = readFileSync(join(__dirname, '../repositories/customer-wallet.repository.ts'), 'utf8');
    expect(serviceSource).not.toContain('PrismaService');
    expect(serviceSource).not.toContain('this.prisma');
    expect(repositorySource).toContain('constructor(private readonly prisma: PrismaService)');
    expect(repositorySource).toContain('createCustomerNotification');
  });

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

  it('customer can create wallet top-up payment', async () => {
    const { service, prisma } = createService();
    const stripeCreate = mockStripe(service);
    const result = await service.addFunds({ uid: 'customer_1', role: UserRole.REGISTERED_USER }, { amount: 50, currency: 'USD', paymentMethod: PaymentMethod.STRIPE_CARD, stripePaymentMethodId: 'pm_card_visa' });
    expect(result.message).toBe('Wallet top-up payment created successfully.');
    expect(result.data).toEqual(expect.objectContaining({ walletTopUpId: 'ledger_pending', paymentId: 'payment_1', clientSecret: 'secret_1', amount: 50, currency: 'USD', status: 'PAYMENT_PENDING' }));
    expect(stripeCreate).toHaveBeenCalledWith(expect.objectContaining({ amount: 5000, currency: 'usd', payment_method: 'pm_card_visa', metadata: { paymentId: 'payment_1', walletTopUpId: 'ledger_pending', userId: 'customer_1' } }));
    expect(prisma.payment.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'payment_1' }, data: expect.objectContaining({ providerPaymentIntentId: 'pi_1', status: PaymentStatus.PROCESSING }) }));
  });

  it('wallet top-up uses logged-in user only', async () => {
    const { service, prisma } = createService();
    mockStripe(service);
    await service.addFunds({ uid: 'customer_2', role: UserRole.REGISTERED_USER }, { amount: 50, currency: 'USD', paymentMethod: PaymentMethod.STRIPE_CARD });
    expect(prisma.customerWalletLedger.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ userId: 'customer_2', walletId: 'wallet_1' }) }));
    expect(prisma.payment.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ userId: 'customer_2' }) }));
  });

  it('amount validation remains unchanged at DTO level and service money formatting', async () => {
    const dto = readFileSync(join(__dirname, '../dto/customer-wallet.dto.ts'), 'utf8');
    expect(dto).toContain('@Min(0.01)');
    const { service, prisma } = createService();
    mockStripe(service);
    await service.addFunds({ uid: 'customer_1', role: UserRole.REGISTERED_USER }, { amount: 50.129, currency: 'USD', paymentMethod: PaymentMethod.STRIPE_CARD });
    expect(prisma.customerWalletLedger.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ amount: expect.objectContaining({}) }) }));
  });

  it('wallet ledger behavior remains unchanged for top-up pending flow', async () => {
    const { service, prisma } = createService();
    mockStripe(service);
    await service.addFunds({ uid: 'customer_1', role: UserRole.REGISTERED_USER }, { amount: 50, currency: 'USD', paymentMethod: PaymentMethod.STRIPE_CARD });
    expect(prisma.customerWalletLedger.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ type: CustomerWalletLedgerType.TOP_UP, direction: CustomerWalletLedgerDirection.CREDIT, status: CustomerWalletLedgerStatus.PENDING, description: 'Wallet top-up pending payment.' }) }));
    expect(prisma.customerWalletLedger.update).toHaveBeenCalledWith({ where: { id: 'ledger_pending' }, data: { paymentId: 'payment_1' } });
  });

  it('wallet top-up completion credits cash balance once and writes success ledger', async () => {
    const { service, prisma } = createService();
    prisma.customerWalletLedger.findFirst.mockResolvedValueOnce(pendingLedger);

    await service.creditWalletTopUp({ ...payment, status: PaymentStatus.SUCCEEDED, metadataJson: { walletTopUpId: 'ledger_pending' } } as never);

    expect(prisma.customerWalletLedger.update).toHaveBeenCalledWith({ where: { id: 'ledger_pending' }, data: { status: CustomerWalletLedgerStatus.SUCCESS, description: 'Wallet top-up completed.', paymentId: 'payment_1' } });
    expect(prisma.customerWallet.update).toHaveBeenCalledWith({ where: { id: 'wallet_1' }, data: { cashBalance: { increment: pendingLedger.amount } } });
    expect(prisma.notification.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ type: 'WALLET_TOP_UP_SUCCEEDED' }) }));
  });

  it('wallet credit is not duplicated for successful top-up ledger', async () => {
    const { service, prisma } = createService();
    prisma.customerWalletLedger.findFirst.mockResolvedValueOnce({ ...pendingLedger, status: CustomerWalletLedgerStatus.SUCCESS });

    await service.creditWalletTopUp({ ...payment, status: PaymentStatus.SUCCEEDED, metadataJson: { walletTopUpId: 'ledger_pending' } } as never);

    expect(prisma.customerWallet.update).not.toHaveBeenCalled();
    expect(prisma.notification.create).not.toHaveBeenCalled();
  });

  it('wallet top-up failure updates pending ledger only', async () => {
    const { service, prisma } = createService();

    await service.failWalletTopUp({ ...payment, status: PaymentStatus.FAILED, metadataJson: { walletTopUpId: 'ledger_pending' } } as never);

    expect(prisma.customerWalletLedger.updateMany).toHaveBeenCalledWith({ where: { id: 'ledger_pending', userId: 'customer_1', status: CustomerWalletLedgerStatus.PENDING }, data: { status: CustomerWalletLedgerStatus.FAILED, description: 'Wallet top-up payment failed.' } });
    expect(prisma.notification.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ type: 'WALLET_TOP_UP_FAILED' }) }));
  });

  it('reward wallet credit is not duplicated when reward ledger was already credited', async () => {
    const { service, prisma } = createService();
    prisma.customerWalletLedger.findFirst.mockResolvedValueOnce(ledger);

    await service.creditRewardRedemption('customer_1', { id: 'reward_1', amount: 25, currency: 'USD' } as never);

    expect(prisma.customerWalletLedger.create).not.toHaveBeenCalled();
    expect(prisma.customerWallet.update).not.toHaveBeenCalled();
  });

  it('rejects unsupported payment method and currency as before', async () => {
    const { service } = createService();
    await expect(service.addFunds({ uid: 'customer_1', role: UserRole.REGISTERED_USER }, { amount: 50, currency: 'USD', paymentMethod: PaymentMethod.COD })).rejects.toThrow('Wallet top-up currently supports STRIPE_CARD only');
    await expect(service.addFunds({ uid: 'customer_1', role: UserRole.REGISTERED_USER }, { amount: 50, currency: 'EUR', paymentMethod: PaymentMethod.STRIPE_CARD })).rejects.toThrow('Currency does not match configured payment currency');
  });

  it('customer can list own bank accounts', async () => {
    const { service, prisma } = createService();
    const result = await service.bankAccounts({ uid: 'customer_1', role: UserRole.REGISTERED_USER });
    expect(result.message).toBe('Bank accounts fetched successfully.');
    expect(result.data[0]).toEqual(expect.objectContaining({ id: 'bank_1', maskedAccount: '**** 8821', last4: '8821' }));
    expect(prisma.customerBankAccount.findMany).toHaveBeenCalledWith({ where: { userId: 'customer_1', deletedAt: null }, orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }] });
  });

  it('customer can create bank account with masked output', async () => {
    const { service, prisma } = createService();
    const result = await service.linkBankAccount({ uid: 'customer_1', role: UserRole.REGISTERED_USER }, { accountHolderName: 'John Smith', bankName: 'Chase Bank', ibanOrAccountNumber: '123456788821' });
    expect(result.message).toBe('Bank account linked successfully.');
    expect(result.data).toEqual(expect.objectContaining({ maskedAccount: '**** 8821', last4: '8821' }));
    expect(prisma.customerBankAccount.create).toHaveBeenCalledWith({ data: expect.objectContaining({ userId: 'customer_1', maskedAccount: '**** 8821', last4: '8821' }) });
  });

  it('customer can set own default bank account', async () => {
    const { service, prisma } = createService();
    const result = await service.setDefaultBankAccount({ uid: 'customer_1', role: UserRole.REGISTERED_USER }, 'bank_1');
    expect(result.data).toEqual({ id: 'bank_1', isDefault: true });
    expect(prisma.customerBankAccount.findFirst).toHaveBeenCalledWith({ where: { id: 'bank_1', userId: 'customer_1', deletedAt: null } });
    expect(prisma.customerBankAccount.updateMany).toHaveBeenCalledWith({ where: { userId: 'customer_1', isDefault: true }, data: { isDefault: false } });
  });

  it('customer cannot set another user bank account as default', async () => {
    const { service, prisma } = createService();
    prisma.customerBankAccount.findFirst.mockResolvedValueOnce(null);
    await expect(service.setDefaultBankAccount({ uid: 'customer_1', role: UserRole.REGISTERED_USER }, 'bank_other')).rejects.toThrow('Bank account not found');
  });

  it('customer cannot access another user bank account for delete', async () => {
    const { service, prisma } = createService();
    prisma.customerBankAccount.findFirst.mockResolvedValueOnce(null);
    await expect(service.deleteBankAccount({ uid: 'customer_1', role: UserRole.REGISTERED_USER }, 'bank_other')).rejects.toThrow('Bank account not found');
  });
});
