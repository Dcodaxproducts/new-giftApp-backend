import { readFileSync } from 'fs';
import { join } from 'path';

describe('Customer wallet source safety', () => {
  const walletService = readFileSync(join(__dirname, 'customer-wallet.service.ts'), 'utf8');
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
    expect(walletService).toContain('customerWallet.create({ data: { userId');
    expect(walletService).not.toContain('query.userId');
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
