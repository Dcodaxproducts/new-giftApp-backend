import { BadRequestException, Injectable, NotFoundException, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { MoneyGiftStatus, Payment, PaymentMethod, PaymentProvider, PaymentStatus, Prisma } from '@prisma/client';
import Stripe from 'stripe';
import { AuthUserContext } from '../../../common/decorators/current-user.decorator';
import { MoneyGiftsRepository } from '../repositories/money-gifts.repository';
import { StripeWebhookEventsRepository } from '../repositories/stripe-webhook-events.repository';
import { CustomerReferralsService } from '../../customer-referrals/services/customer-referrals.service';
import { CustomerWalletService } from '../../customer-wallet/services/customer-wallet.service';
import { CustomerSubscriptionsService } from '../../customer-subscriptions/services/customer-subscriptions.service';
import { ConfirmPaymentDto, CreateMoneyGiftDto, CreatePaymentIntentDto } from '../dto/payments.dto';
import { PaymentsRepository } from '../repositories/payments.repository';

type CartWithItems = Prisma.CartGetPayload<{ include: { items: true } }>;

type StripeIntentLike = {
  id: string;
  status: string;
  last_payment_error?: { message?: string | null } | null;
};

type StripeSetupIntentLike = {
  id: string;
  customer?: string | { id: string } | null;
  payment_method?: string | { id: string } | null;
  metadata?: { userId?: string } | null;
};

type StripePaymentMethodLike = {
  id: string;
  type: string;
  card?: { brand?: string | null; last4?: string | null; exp_month?: number | null; exp_year?: number | null } | null;
};

type StripeCustomerLike = { id: string };
type StripeSetupIntentCreateResult = { id: string; client_secret: string | null };

@Injectable()
export class PaymentsService {
  private stripeClient?: InstanceType<typeof Stripe>;

  constructor(
    private readonly customerReferralsService: CustomerReferralsService,
    private readonly customerWalletService: CustomerWalletService,
    private readonly customerSubscriptionsService: CustomerSubscriptionsService,
    private readonly repository: PaymentsRepository,
    private readonly moneyGiftsRepository: MoneyGiftsRepository,
    private readonly stripeWebhookEventsRepository: StripeWebhookEventsRepository,
  ) {}

  paymentMethods() {
    return {
      data: [
        { key: PaymentMethod.STRIPE_CARD, label: 'Credit/Debit Card', enabled: true },
        { key: PaymentMethod.BANK_TRANSFER, label: 'Bank Payment', enabled: true },
        { key: PaymentMethod.E_WALLET, label: 'E-Wallet', enabled: false },
      ],
      message: 'Payment methods fetched successfully.',
    };
  }

  async createIntent(user: AuthUserContext, dto: CreatePaymentIntentDto) {
    const cart = await this.getOwnedCart(user.uid, dto.cartId);
    if (cart.items.length === 0) throw new BadRequestException('Cart is empty');
    const summary = this.cartSummary(cart.items);
    const provider = dto.paymentMethod === PaymentMethod.STRIPE_CARD ? PaymentProvider.STRIPE : PaymentProvider.MANUAL;
    const payment = await this.repository.createPayment({ userId: user.uid, provider, amount: new Prisma.Decimal(summary.total), currency: summary.currency, status: PaymentStatus.PENDING, paymentMethod: dto.paymentMethod, metadataJson: { cartId: cart.id, summary } });

    if (dto.paymentMethod !== PaymentMethod.STRIPE_CARD) {
      return { data: this.toPaymentResponse(payment), message: 'Payment intent created successfully.' };
    }

    const intent = await this.stripe().paymentIntents.create({
      amount: this.toSmallestUnit(summary.total, summary.currency),
      currency: summary.currency.toLowerCase(),
      automatic_payment_methods: { enabled: true },
      metadata: { paymentId: payment.id, cartId: cart.id, userId: user.uid },
    });
    const updated = await this.repository.updatePaymentIntent({ id: payment.id, providerPaymentIntentId: intent.id, status: PaymentStatus.PROCESSING, metadataJson: { cartId: cart.id, summary, stripeStatus: intent.status } });
    return { data: { ...this.toPaymentResponse(updated), stripePaymentIntentId: intent.id, clientSecret: intent.client_secret, publishableKey: this.publishableKey(), amount: this.toSmallestUnit(summary.total, summary.currency), currency: summary.currency }, message: 'Payment intent created successfully.' };
  }

  async confirm(user: AuthUserContext, dto: ConfirmPaymentDto) {
    const payment = await this.getOwnedPayment(user.uid, dto.paymentId);
    if (payment.providerPaymentIntentId !== dto.stripePaymentIntentId) throw new BadRequestException('Stripe PaymentIntent does not match payment');
    const intent = await this.stripe().paymentIntents.retrieve(dto.stripePaymentIntentId) as StripeIntentLike;
    const status = this.statusFromStripe(intent.status);
    const updated = await this.repository.updatePaymentConfirmation({ id: payment.id, status, failureReason: intent.last_payment_error?.message ?? null, metadataJson: this.mergeMetadata(payment.metadataJson, { stripeStatus: intent.status }) });
    if (status === PaymentStatus.SUCCEEDED) {
      await this.customerWalletService.creditWalletTopUp(updated);
      await this.customerReferralsService.awardReferralForFirstEligiblePurchase(user.uid, payment.id, Number(updated.amount));
      await this.notify(user.uid, 'Payment successful', 'Your payment was completed successfully.', 'PAYMENT_SUCCEEDED', { paymentId: payment.id });
    }
    if (status === PaymentStatus.FAILED) {
      await this.customerWalletService.failWalletTopUp(updated);
      await this.notify(user.uid, 'Payment failed', 'Your payment could not be completed.', 'PAYMENT_FAILED', { paymentId: payment.id });
    }
    return { data: { paymentId: updated.id, status: updated.status }, message: 'Payment confirmed successfully.' };
  }

  async details(user: AuthUserContext, id: string) {
    return { data: this.toPaymentResponse(await this.getOwnedPayment(user.uid, id)), message: 'Payment fetched successfully.' };
  }

  async createSetupIntent(user: AuthUserContext) {
    const dbUser = await this.repository.findUserById(user.uid);
    if (!dbUser) throw new NotFoundException('User not found');
    const existing = await this.repository.findLatestSavedPaymentMethodForUser(user.uid);
    const customerId = existing?.stripeCustomerId ?? (await this.stripe().customers.create({ email: dbUser.email, name: `${dbUser.firstName} ${dbUser.lastName}`.trim(), metadata: { userId: user.uid } }) as StripeCustomerLike).id;
    const intent = await this.stripe().setupIntents.create({ customer: customerId, payment_method_types: ['card'], metadata: { userId: user.uid } }) as StripeSetupIntentCreateResult;
    return { data: { setupIntentId: intent.id, clientSecret: intent.client_secret, publishableKey: this.publishableKey() }, message: 'Setup intent created successfully.' };
  }

  async savedPaymentMethods(user: AuthUserContext) {
    const items = await this.repository.findSavedPaymentMethodsByUserId(user.uid);
    return { data: items.map((item) => this.toSavedPaymentMethod(item)), message: 'Saved payment methods fetched successfully.' };
  }

  async setDefaultPaymentMethod(user: AuthUserContext, id: string) {
    const method = await this.getOwnedPaymentMethod(user.uid, id);
    await this.repository.setDefaultPaymentMethodForUser(user.uid, method.id);
    await this.notify(user.uid, 'Default payment method changed', 'Your default payment method was updated.', 'DEFAULT_PAYMENT_METHOD_CHANGED', { paymentMethodId: method.id });
    return { data: { id: method.stripePaymentMethodId, isDefault: true }, message: 'Default payment method updated successfully.' };
  }

  async deletePaymentMethod(user: AuthUserContext, id: string) {
    const method = await this.getOwnedPaymentMethod(user.uid, id);
    const activeRecurring = await this.repository.findActiveRecurringUsageByPaymentMethod(user.uid, method.stripePaymentMethodId);
    if (activeRecurring > 0) throw new BadRequestException('Payment method is used by an active recurring payment');
    await this.repository.deleteSavedPaymentMethod(method.id);
    return { data: null, message: 'Payment method deleted successfully.' };
  }

  async handleStripeWebhook(rawBody: Buffer | undefined, signature: string | string[] | undefined) {
    if (!rawBody) throw new BadRequestException('Missing webhook payload');
    if (!signature || Array.isArray(signature)) throw new UnauthorizedException('Missing Stripe signature');
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) throw new ServiceUnavailableException('Stripe webhook is not configured');
    const event = this.stripe().webhooks.constructEvent(rawBody, signature, secret);
    const intent = event.data.object as StripeIntentLike & { cancellation_reason?: string | null };
    if (event.type === 'payment_intent.succeeded') await this.updateFromStripeIntent(intent, PaymentStatus.SUCCEEDED);
    if (event.type === 'payment_intent.payment_failed') await this.updateFromStripeIntent(intent, PaymentStatus.FAILED, intent.last_payment_error?.message ?? undefined);
    if (event.type === 'payment_intent.canceled') await this.updateFromStripeIntent(intent, PaymentStatus.CANCELLED, intent.cancellation_reason ?? undefined);
    if (event.type === 'setup_intent.succeeded') await this.saveSetupIntentPaymentMethod(event.data.object);
    if (event.type.startsWith('customer.subscription.') || event.type.startsWith('invoice.')) await this.customerSubscriptionsService.handleStripeSubscriptionEvent(event.type, event.data.object);
    return { data: { received: true }, message: 'Stripe webhook processed successfully.' };
  }

  async createMoneyGift(user: AuthUserContext, dto: CreateMoneyGiftDto) {
    const currency = this.currency(dto.currency);
    if (currency !== this.currency()) throw new BadRequestException('Currency does not match configured payment currency');
    const contact = await this.moneyGiftsRepository.findOwnedRecipientContact(user.uid, dto.recipientContactId);
    if (!contact) throw new NotFoundException('Contact not found');
    const provider = dto.paymentMethod === PaymentMethod.STRIPE_CARD ? PaymentProvider.STRIPE : PaymentProvider.MANUAL;
    const moneyGift = await this.moneyGiftsRepository.createMoneyGift({ userId: user.uid, recipientContactId: contact.id, amount: new Prisma.Decimal(dto.amount), currency, message: dto.message?.trim() ?? null, messageMediaUrlsJson: dto.messageMediaUrls ?? [], deliveryDate: new Date(dto.deliveryDate), repeatAnnually: dto.repeatAnnually ?? false });
    const payment = await this.repository.createPayment({ userId: user.uid, moneyGiftId: moneyGift.id, provider, amount: new Prisma.Decimal(dto.amount), currency, status: PaymentStatus.PENDING, paymentMethod: dto.paymentMethod, metadataJson: { moneyGiftId: moneyGift.id } });
    await this.moneyGiftsRepository.attachPaymentToMoneyGift(moneyGift.id, payment.id);
    if (dto.paymentMethod !== PaymentMethod.STRIPE_CARD) {
      return { data: { ...this.toMoneyGift(moneyGift), payment: this.toPaymentResponse(payment) }, message: 'Money gift created successfully.' };
    }
    const intent = await this.stripe().paymentIntents.create({ amount: this.toSmallestUnit(dto.amount, currency), currency: currency.toLowerCase(), automatic_payment_methods: { enabled: true }, metadata: { paymentId: payment.id, moneyGiftId: moneyGift.id, userId: user.uid } });
    const updatedPayment = await this.repository.updatePaymentIntent({ id: payment.id, providerPaymentIntentId: intent.id, status: PaymentStatus.PROCESSING, metadataJson: { moneyGiftId: moneyGift.id, stripeStatus: intent.status } });
    return { data: { ...this.toMoneyGift(moneyGift), payment: { ...this.toPaymentResponse(updatedPayment), stripePaymentIntentId: intent.id, clientSecret: intent.client_secret, publishableKey: this.publishableKey(), amount: this.toSmallestUnit(dto.amount, currency), currency } }, message: 'Money gift created successfully.' };
  }

  async moneyGifts(user: AuthUserContext) {
    const items = await this.moneyGiftsRepository.findMoneyGiftsByUserId(user.uid);
    return { data: items.map((item) => this.toMoneyGift(item)), message: 'Money gifts fetched successfully.' };
  }

  async moneyGiftDetails(user: AuthUserContext, id: string) {
    const item = await this.moneyGiftsRepository.findOwnedMoneyGift(user.uid, id);
    if (!item) throw new NotFoundException('Money gift not found');
    return { data: this.toMoneyGift(item), message: 'Money gift fetched successfully.' };
  }

  private async getOwnedCart(userId: string, cartId: string): Promise<CartWithItems> {
    const cart = await this.repository.findOwnedActiveCartWithItems(userId, cartId);
    if (!cart) throw new NotFoundException('Active cart not found');
    return cart;
  }

  private async getOwnedPayment(userId: string, id: string): Promise<Payment> {
    const payment = await this.repository.findOwnedPayment(userId, id);
    if (!payment) throw new NotFoundException('Payment not found');
    return payment;
  }

  private async saveSetupIntentPaymentMethod(intent: StripeSetupIntentLike): Promise<void> {
    const userId = intent.metadata?.userId;
    const paymentMethodId = typeof intent.payment_method === 'string' ? intent.payment_method : intent.payment_method?.id;
    const stripeCustomerId = typeof intent.customer === 'string' ? intent.customer : intent.customer?.id;
    if (!userId || !paymentMethodId || !stripeCustomerId) return;
    const method = await this.stripe().paymentMethods.retrieve(paymentMethodId) as StripePaymentMethodLike;
    const existingDefault = await this.repository.findExistingDefaultPaymentMethod(userId);
    await this.repository.upsertSavedPaymentMethod({
      stripePaymentMethodId: paymentMethodId,
      update: { stripeCustomerId, type: method.type.toUpperCase(), brand: method.card?.brand ?? null, last4: method.card?.last4 ?? null, expiryMonth: method.card?.exp_month ?? null, expiryYear: method.card?.exp_year ?? null, deletedAt: null },
      create: { userId, stripeCustomerId, stripePaymentMethodId: paymentMethodId, type: method.type.toUpperCase(), brand: method.card?.brand ?? null, last4: method.card?.last4 ?? null, expiryMonth: method.card?.exp_month ?? null, expiryYear: method.card?.exp_year ?? null, isDefault: !existingDefault },
    });
  }

  private async updateFromStripeIntent(intent: StripeIntentLike, status: PaymentStatus, failureReason?: string) {
    const payment = await this.stripeWebhookEventsRepository.findPaymentByProviderIntentId(intent.id);
    if (!payment) return;
    const finalStatuses: PaymentStatus[] = [PaymentStatus.SUCCEEDED, PaymentStatus.FAILED, PaymentStatus.CANCELLED];
    if (finalStatuses.includes(payment.status) && payment.status === status) return;
    const updated = await this.stripeWebhookEventsRepository.updatePaymentStatus({ id: payment.id, status, failureReason: failureReason ?? null, metadataJson: this.mergeMetadata(payment.metadataJson, { stripeStatus: intent.status, webhookPaymentIntentId: intent.id }) });
    if (updated.moneyGiftId && status === PaymentStatus.SUCCEEDED) {
      const deliveryDate = await this.stripeWebhookEventsRepository.findMoneyGiftDeliveryDate(updated.moneyGiftId);
      await this.stripeWebhookEventsRepository.updateMoneyGiftStatus(updated.moneyGiftId, deliveryDate && deliveryDate.deliveryDate > new Date() ? MoneyGiftStatus.SCHEDULED : MoneyGiftStatus.SENT);
      await this.notify(updated.userId, 'Money gift paid', 'Your money gift payment was completed.', 'MONEY_GIFT_SENT', { paymentId: updated.id, moneyGiftId: updated.moneyGiftId });
    }
    if (status === PaymentStatus.SUCCEEDED) {
      await this.customerWalletService.creditWalletTopUp(updated);
      await this.customerReferralsService.awardReferralForFirstEligiblePurchase(updated.userId, updated.id, Number(updated.amount));
      await this.notify(updated.userId, 'Payment successful', 'Your payment was completed successfully.', 'PAYMENT_SUCCEEDED', { paymentId: updated.id });
    }
    if (status === PaymentStatus.FAILED) {
      await this.customerWalletService.failWalletTopUp(updated);
      await this.notify(updated.userId, 'Payment failed', 'Your payment could not be completed.', 'PAYMENT_FAILED', { paymentId: updated.id });
    }
  }

  private async getOwnedPaymentMethod(userId: string, id: string) {
    const method = await this.repository.findSavedPaymentMethodForUser(userId, id);
    if (!method) throw new NotFoundException('Payment method not found');
    return method;
  }

  private cartSummary(items: { unitPriceSnapshot: Prisma.Decimal; discountAmountSnapshot: Prisma.Decimal; quantity: number }[]) {
    const subtotal = items.reduce((sum, item) => sum + Number(item.unitPriceSnapshot) * item.quantity, 0);
    const discountTotal = items.reduce((sum, item) => sum + Number(item.discountAmountSnapshot) * item.quantity, 0);
    const deliveryFee = 0;
    const tax = 0;
    const total = this.money(Math.max(0, subtotal - discountTotal + deliveryFee + tax));
    return { subtotal: this.money(subtotal), discountTotal: this.money(discountTotal), deliveryFee, tax, total, currency: this.currency() };
  }

  private statusFromStripe(status: string): PaymentStatus {
    if (status === 'succeeded') return PaymentStatus.SUCCEEDED;
    if (status === 'canceled') return PaymentStatus.CANCELLED;
    if (status === 'requires_payment_method') return PaymentStatus.FAILED;
    return PaymentStatus.PROCESSING;
  }

  private stripe(): InstanceType<typeof Stripe> {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new ServiceUnavailableException('Stripe is not configured');
    this.stripeClient ??= new Stripe(key);
    return this.stripeClient;
  }

  private publishableKey(): string { return process.env.STRIPE_PUBLISHABLE_KEY ?? ''; }
  private currency(input?: string): string { return (input ?? process.env.STRIPE_CURRENCY ?? 'PKR').toUpperCase(); }
  private toSmallestUnit(amount: number, currency: string): number { return this.zeroDecimalCurrencies().has(currency.toUpperCase()) ? Math.round(amount) : Math.round(amount * 100); }
  private zeroDecimalCurrencies(): Set<string> { return new Set(['BIF', 'CLP', 'DJF', 'GNF', 'JPY', 'KMF', 'KRW', 'MGA', 'PYG', 'RWF', 'UGX', 'VND', 'VUV', 'XAF', 'XOF', 'XPF']); }
  private money(value: number): number { return Number(value.toFixed(2)); }
  private mergeMetadata(current: Prisma.JsonValue, patch: Prisma.InputJsonObject): Prisma.InputJsonObject { return { ...(current && typeof current === 'object' && !Array.isArray(current) ? current : {}), ...patch }; }
  private toSavedPaymentMethod(item: { stripePaymentMethodId: string; type: string; brand: string | null; last4: string | null; expiryMonth: number | null; expiryYear: number | null; isDefault: boolean }) { return { id: item.stripePaymentMethodId, type: item.type, brand: item.brand, last4: item.last4, expiryMonth: item.expiryMonth, expiryYear: item.expiryYear, isDefault: item.isDefault }; }
  private toPaymentResponse(payment: Payment) { return { paymentId: payment.id, provider: payment.provider, stripePaymentIntentId: payment.providerPaymentIntentId, amount: Number(payment.amount), currency: payment.currency, status: payment.status, paymentMethod: payment.paymentMethod, failureReason: payment.failureReason, createdAt: payment.createdAt, updatedAt: payment.updatedAt }; }
  private toMoneyGift(item: { id: string; amount: Prisma.Decimal; currency: string; recipientContactId: string; message: string | null; messageMediaUrlsJson: Prisma.JsonValue; deliveryDate: Date; repeatAnnually: boolean; status: MoneyGiftStatus; createdAt: Date; updatedAt: Date; recipientContact?: { name: string; phone: string | null; email: string | null; avatarUrl: string | null } }) { return { id: item.id, amount: Number(item.amount), currency: item.currency, recipientContactId: item.recipientContactId, recipient: item.recipientContact ? { name: item.recipientContact.name, phone: item.recipientContact.phone, email: item.recipientContact.email, avatarUrl: item.recipientContact.avatarUrl } : undefined, message: item.message, messageMediaUrls: Array.isArray(item.messageMediaUrlsJson) ? item.messageMediaUrlsJson.filter((value): value is string => typeof value === 'string') : [], deliveryDate: item.deliveryDate, repeatAnnually: item.repeatAnnually, status: item.status, createdAt: item.createdAt, updatedAt: item.updatedAt }; }
  private async notify(recipientId: string, title: string, message: string, type: string, metadata: Prisma.InputJsonObject): Promise<void> { await this.repository.createNotification(recipientId, title, message, type, metadata); }
}
