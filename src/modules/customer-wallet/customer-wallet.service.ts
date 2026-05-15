import { BadRequestException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { CustomerBankAccount, CustomerPaymentMethod, CustomerWallet, CustomerWalletLedger, CustomerWalletLedgerDirection, CustomerWalletLedgerStatus, CustomerWalletLedgerType, NotificationRecipientType, Payment, PaymentMethod, PaymentProvider, PaymentStatus, Prisma, RewardLedger } from '@prisma/client';
import Stripe from 'stripe';
import { AuthUserContext } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../database/prisma.service';
import { AddWalletFundsDto, CreateBankAccountDto, ListWalletHistoryDto, WalletHistoryStatus, WalletHistoryType } from './dto/customer-wallet.dto';
import { CustomerWalletRepository } from './customer-wallet.repository';

type StripeIntentCreateResult = { id: string; client_secret: string | null; status: string };

@Injectable()
export class CustomerWalletService {
  private stripeClient?: InstanceType<typeof Stripe>;
  constructor(
    private readonly prisma: PrismaService,
    private readonly repository: CustomerWalletRepository,
  ) {}

  async overview(user: AuthUserContext) {
    const wallet = await this.getOrCreateWallet(user.uid);
    const [defaultPaymentMethod, defaultBankAccount] = await Promise.all([
      this.repository.findDefaultPaymentMethodForUser(user.uid),
      this.repository.findDefaultBankAccountForUser(user.uid),
    ]);
    const cashBalance = Number(wallet.cashBalance);
    const giftCredits = Number(wallet.giftCredits);
    return { data: { totalBalance: this.money(cashBalance + giftCredits), giftCredits, cashBalance, currency: wallet.currency, defaultPaymentMethod: defaultPaymentMethod ? this.toPaymentMethod(defaultPaymentMethod) : null, defaultBankAccount: defaultBankAccount ? this.toBankAccount(defaultBankAccount) : null }, message: 'Wallet fetched successfully.' };
  }

  async addFunds(user: AuthUserContext, dto: AddWalletFundsDto) {
    if (dto.paymentMethod !== PaymentMethod.STRIPE_CARD) throw new BadRequestException('Wallet top-up currently supports STRIPE_CARD only');
    const currency = this.currency(dto.currency);
    if (currency !== this.currency()) throw new BadRequestException('Currency does not match configured payment currency');
    const wallet = await this.getOrCreateWallet(user.uid);
    const amount = this.money(dto.amount);
    const ledger = await this.repository.createWalletLedgerEntry({ userId: user.uid, walletId: wallet.id, type: CustomerWalletLedgerType.TOP_UP, direction: CustomerWalletLedgerDirection.CREDIT, amount: new Prisma.Decimal(amount), currency, status: CustomerWalletLedgerStatus.PENDING, transactionId: this.transactionId(), description: 'Wallet top-up pending payment.' });
    const payment = await this.repository.createWalletTopUpPayment({ userId: user.uid, provider: PaymentProvider.STRIPE, amount: new Prisma.Decimal(amount), currency, status: PaymentStatus.PENDING, paymentMethod: PaymentMethod.STRIPE_CARD, metadataJson: { walletTopUpId: ledger.id, walletId: wallet.id, stripePaymentMethodId: dto.stripePaymentMethodId } });
    await this.repository.markWalletTopUpPending(ledger.id, payment.id);
    const intent = await this.stripe().paymentIntents.create({ amount: this.toSmallestUnit(amount, currency), currency: currency.toLowerCase(), payment_method: dto.stripePaymentMethodId, automatic_payment_methods: dto.stripePaymentMethodId ? undefined : { enabled: true }, confirm: false, metadata: { paymentId: payment.id, walletTopUpId: ledger.id, userId: user.uid } }) as StripeIntentCreateResult;
    const updatedPayment = await this.repository.markWalletTopUpPaymentProcessing({ paymentId: payment.id, providerPaymentIntentId: intent.id, metadataJson: { walletTopUpId: ledger.id, walletId: wallet.id, stripeStatus: intent.status, stripePaymentMethodId: dto.stripePaymentMethodId } });
    return { data: { walletTopUpId: ledger.id, paymentId: updatedPayment.id, clientSecret: intent.client_secret, amount, currency, status: 'PAYMENT_PENDING' }, message: 'Wallet top-up payment created successfully.' };
  }

  async history(user: AuthUserContext, query: ListWalletHistoryDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const where: Prisma.CustomerWalletLedgerWhereInput = { userId: user.uid };
    if (query.type && query.type !== WalletHistoryType.ALL) where.type = query.type;
    if (query.status && query.status !== WalletHistoryStatus.ALL) where.status = query.status;
    if (query.fromDate || query.toDate) where.createdAt = { gte: query.fromDate ? new Date(query.fromDate) : undefined, lte: query.toDate ? new Date(query.toDate) : undefined };
    const [items, total] = await this.repository.findWalletHistoryRows({ where, skip: (page - 1) * limit, take: limit });
    return { data: items.map((item) => this.toHistoryItem(item)), meta: { page, limit, total, totalPages: Math.ceil(total / limit) }, message: 'Wallet history fetched successfully.' };
  }

  async linkBankAccount(user: AuthUserContext, dto: CreateBankAccountDto) {
    const last4 = this.last4(dto.ibanOrAccountNumber);
    const shouldDefault = dto.isDefault === true || !(await this.repository.findDefaultBankAccountForUserIncludingDeletedFilter(user.uid));
    const account = await this.repository.createBankAccountWithDefault({ userId: user.uid, shouldDefault, data: { accountHolderName: dto.accountHolderName.trim(), bankName: dto.bankName.trim(), maskedAccount: `**** ${last4}`, last4, isDefault: shouldDefault } });
    await this.notify(user.uid, 'Bank account linked', `${account.bankName} bank account was linked.`, 'BANK_ACCOUNT_LINKED', { bankAccountId: account.id });
    return { data: this.toBankAccount(account), message: 'Bank account linked successfully.' };
  }

  async bankAccounts(user: AuthUserContext) { const items = await this.repository.findBankAccountsByUserId(user.uid); return { data: items.map((item) => this.toBankAccount(item)), message: 'Bank accounts fetched successfully.' }; }
  async setDefaultBankAccount(user: AuthUserContext, id: string) { const account = await this.getOwnedBankAccount(user.uid, id); await this.repository.setDefaultBankAccountForUser(user.uid, account.id); return { data: { id: account.id, isDefault: true }, message: 'Default bank account updated successfully.' }; }
  async deleteBankAccount(user: AuthUserContext, id: string) { const account = await this.getOwnedBankAccount(user.uid, id); await this.repository.deleteBankAccount(account.id); return { data: null, message: 'Bank account deleted successfully.' }; }

  async creditWalletTopUp(payment: Payment): Promise<void> {
    const metadata = this.metadata(payment.metadataJson);
    if (!metadata.walletTopUpId) return;
    const ledger = await this.prisma.customerWalletLedger.findFirst({ where: { id: metadata.walletTopUpId, userId: payment.userId } });
    if (!ledger || ledger.status === CustomerWalletLedgerStatus.SUCCESS) return;
    await this.prisma.$transaction([this.prisma.customerWalletLedger.update({ where: { id: ledger.id }, data: { status: CustomerWalletLedgerStatus.SUCCESS, description: 'Wallet top-up completed.', paymentId: payment.id } }), this.prisma.customerWallet.update({ where: { id: ledger.walletId }, data: { cashBalance: { increment: ledger.amount } } })]);
    await this.notify(payment.userId, 'Wallet top-up succeeded', `${Number(ledger.amount)} ${ledger.currency} was added to your wallet.`, 'WALLET_TOP_UP_SUCCEEDED', { paymentId: payment.id, walletLedgerId: ledger.id });
  }

  async failWalletTopUp(payment: Payment): Promise<void> { const metadata = this.metadata(payment.metadataJson); if (!metadata.walletTopUpId) return; await this.prisma.customerWalletLedger.updateMany({ where: { id: metadata.walletTopUpId, userId: payment.userId, status: CustomerWalletLedgerStatus.PENDING }, data: { status: CustomerWalletLedgerStatus.FAILED, description: 'Wallet top-up payment failed.' } }); await this.notify(payment.userId, 'Wallet top-up failed', 'Your wallet top-up payment failed.', 'WALLET_TOP_UP_FAILED', { paymentId: payment.id, walletLedgerId: metadata.walletTopUpId }); }

  async creditRewardRedemption(userId: string, rewardLedger: RewardLedger): Promise<void> {
    const wallet = await this.getOrCreateWallet(userId);
    const existing = await this.prisma.customerWalletLedger.findFirst({ where: { userId, rewardLedgerId: rewardLedger.id } });
    if (existing) return;
    await this.prisma.$transaction([this.prisma.customerWalletLedger.create({ data: { userId, walletId: wallet.id, type: CustomerWalletLedgerType.REWARD_CREDIT, direction: CustomerWalletLedgerDirection.CREDIT, amount: rewardLedger.amount, currency: rewardLedger.currency, status: CustomerWalletLedgerStatus.SUCCESS, rewardLedgerId: rewardLedger.id, transactionId: this.transactionId(), description: 'Referral reward credit added to wallet.' } }), this.prisma.customerWallet.update({ where: { id: wallet.id }, data: { giftCredits: { increment: rewardLedger.amount } } })]);
    await this.notify(userId, 'Reward credit added', `${Number(rewardLedger.amount)} ${rewardLedger.currency} reward credit was added to your wallet.`, 'REWARD_CREDIT_ADDED', { rewardLedgerId: rewardLedger.id });
  }

  private async getOrCreateWallet(userId: string): Promise<CustomerWallet> { return (await this.repository.findWalletByUserId(userId)) ?? this.repository.createWalletForUser(userId, this.currency()); }
  private toPaymentMethod(item: CustomerPaymentMethod) { return { id: item.stripePaymentMethodId, type: item.type, brand: item.brand, last4: item.last4, expiryMonth: item.expiryMonth, expiryYear: item.expiryYear, isDefault: item.isDefault }; }
  private toBankAccount(item: CustomerBankAccount) { return { id: item.id, accountHolderName: item.accountHolderName, bankName: item.bankName, last4: item.last4, maskedAccount: item.maskedAccount, isDefault: item.isDefault }; }
  private toHistoryItem(item: CustomerWalletLedger) { return { id: item.id, type: item.type, title: this.title(item), description: item.description, amount: item.direction === CustomerWalletLedgerDirection.CREDIT ? Number(item.amount) : -Number(item.amount), currency: item.currency, status: item.status, transactionId: item.transactionId, createdAt: item.createdAt }; }
  private title(item: CustomerWalletLedger): string { if (item.type === CustomerWalletLedgerType.TOP_UP) return 'Wallet top-up'; if (item.type === CustomerWalletLedgerType.REWARD_CREDIT) return 'Reward credit'; if (item.type === CustomerWalletLedgerType.MONEY_GIFT_SENT) return 'Money gift sent'; if (item.type === CustomerWalletLedgerType.GIFT_SENT) return 'Gift sent'; return 'Wallet transaction'; }
  private async getOwnedBankAccount(userId: string, id: string): Promise<CustomerBankAccount> { const account = await this.repository.findBankAccountForUser(userId, id); if (!account) throw new NotFoundException('Bank account not found'); return account; }
  private metadata(value: Prisma.JsonValue): { walletTopUpId?: string } { if (!value || typeof value !== 'object' || Array.isArray(value)) return {}; const source = value as Record<string, unknown>; return { walletTopUpId: typeof source.walletTopUpId === 'string' ? source.walletTopUpId : undefined }; }
  private last4(value: string): string { const digits = value.replace(/\D/g, ''); if (digits.length < 4) throw new BadRequestException('Bank account number must include at least 4 digits'); return digits.slice(-4); }
  private transactionId(): string { return `TXN-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`; }
  private currency(input?: string): string { return (input ?? process.env.STRIPE_CURRENCY ?? 'USD').toUpperCase(); }
  private toSmallestUnit(amount: number, currency: string): number { return this.zeroDecimalCurrencies().has(currency.toUpperCase()) ? Math.round(amount) : Math.round(amount * 100); }
  private zeroDecimalCurrencies(): Set<string> { return new Set(['BIF', 'CLP', 'DJF', 'GNF', 'JPY', 'KMF', 'KRW', 'MGA', 'PYG', 'RWF', 'UGX', 'XAF', 'XOF', 'XPF']); }
  private stripe(): InstanceType<typeof Stripe> { const key = process.env.STRIPE_SECRET_KEY; if (!key) throw new ServiceUnavailableException('Stripe is not configured'); this.stripeClient ??= new Stripe(key); return this.stripeClient; }
  private money(value: number): number { return Number(value.toFixed(2)); }
  private async notify(recipientId: string, title: string, message: string, type: string, metadata: Prisma.InputJsonObject): Promise<void> { await this.prisma.notification.create({ data: { recipientId, recipientType: NotificationRecipientType.REGISTERED_USER, title, message, type, metadataJson: metadata } }); }
}
