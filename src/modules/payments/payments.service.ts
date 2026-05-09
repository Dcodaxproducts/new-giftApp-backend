import { BadRequestException, Injectable, NotFoundException, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { CartStatus, MoneyGiftStatus, NotificationRecipientType, Payment, PaymentMethod, PaymentProvider, PaymentStatus, Prisma } from '@prisma/client';
import Stripe from 'stripe';
import { AuthUserContext } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../database/prisma.service';
import { ConfirmPaymentDto, CreateMoneyGiftDto, CreatePaymentIntentDto } from './dto/payments.dto';

type CartWithItems = Prisma.CartGetPayload<{ include: { items: true } }>;

type StripeIntentLike = {
  id: string;
  status: string;
  last_payment_error?: { message?: string | null } | null;
};

@Injectable()
export class PaymentsService {
  private stripeClient?: InstanceType<typeof Stripe>;

  constructor(private readonly prisma: PrismaService) {}

  paymentMethods() {
    return {
      data: [
        { key: PaymentMethod.STRIPE_CARD, label: 'Card', provider: PaymentProvider.STRIPE, isOnline: true, isAvailable: true },
        { key: PaymentMethod.COD, label: 'Cash on Delivery', provider: PaymentProvider.MANUAL, isOnline: false, isAvailable: true },
        { key: PaymentMethod.E_WALLET, label: 'E-Wallet', provider: PaymentProvider.MANUAL, isOnline: false, isAvailable: false },
        { key: PaymentMethod.BANK_TRANSFER, label: 'Bank Transfer', provider: PaymentProvider.MANUAL, isOnline: false, isAvailable: false },
        { key: PaymentMethod.PLACEHOLDER, label: 'Placeholder', provider: PaymentProvider.MANUAL, isOnline: false, isAvailable: true },
      ],
      message: 'Payment methods fetched successfully.',
    };
  }

  async createIntent(user: AuthUserContext, dto: CreatePaymentIntentDto) {
    const cart = await this.getOwnedCart(user.uid, dto.cartId);
    if (cart.items.length === 0) throw new BadRequestException('Cart is empty');
    const summary = this.cartSummary(cart.items);
    const provider = dto.paymentMethod === PaymentMethod.STRIPE_CARD ? PaymentProvider.STRIPE : PaymentProvider.MANUAL;
    const payment = await this.prisma.payment.create({ data: { userId: user.uid, provider, amount: new Prisma.Decimal(summary.total), currency: summary.currency, status: PaymentStatus.PENDING, paymentMethod: dto.paymentMethod, metadataJson: { cartId: cart.id, summary } } });

    if (dto.paymentMethod !== PaymentMethod.STRIPE_CARD) {
      return { data: this.toPaymentResponse(payment), message: 'Payment intent created successfully.' };
    }

    const intent = await this.stripe().paymentIntents.create({
      amount: this.toSmallestUnit(summary.total, summary.currency),
      currency: summary.currency.toLowerCase(),
      automatic_payment_methods: { enabled: true },
      metadata: { paymentId: payment.id, cartId: cart.id, userId: user.uid },
    });
    const updated = await this.prisma.payment.update({ where: { id: payment.id }, data: { providerPaymentIntentId: intent.id, status: PaymentStatus.PROCESSING, metadataJson: { cartId: cart.id, summary, stripeStatus: intent.status } } });
    return { data: { ...this.toPaymentResponse(updated), stripePaymentIntentId: intent.id, clientSecret: intent.client_secret, publishableKey: this.publishableKey(), amount: this.toSmallestUnit(summary.total, summary.currency), currency: summary.currency }, message: 'Payment intent created successfully.' };
  }

  async confirm(user: AuthUserContext, dto: ConfirmPaymentDto) {
    const payment = await this.getOwnedPayment(user.uid, dto.paymentId);
    if (payment.providerPaymentIntentId !== dto.stripePaymentIntentId) throw new BadRequestException('Stripe PaymentIntent does not match payment');
    const intent = await this.stripe().paymentIntents.retrieve(dto.stripePaymentIntentId) as StripeIntentLike;
    const status = this.statusFromStripe(intent.status);
    const updated = await this.prisma.payment.update({ where: { id: payment.id }, data: { status, failureReason: intent.last_payment_error?.message ?? null, metadataJson: this.mergeMetadata(payment.metadataJson, { stripeStatus: intent.status }) } });
    if (status === PaymentStatus.SUCCEEDED) await this.notify(user.uid, 'Payment successful', 'Your payment was completed successfully.', 'PAYMENT_SUCCEEDED', { paymentId: payment.id });
    if (status === PaymentStatus.FAILED) await this.notify(user.uid, 'Payment failed', 'Your payment could not be completed.', 'PAYMENT_FAILED', { paymentId: payment.id });
    return { data: { paymentId: updated.id, status: updated.status }, message: 'Payment confirmed successfully.' };
  }

  async details(user: AuthUserContext, id: string) {
    return { data: this.toPaymentResponse(await this.getOwnedPayment(user.uid, id)), message: 'Payment fetched successfully.' };
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
    return { data: { received: true }, message: 'Stripe webhook processed successfully.' };
  }

  async createMoneyGift(user: AuthUserContext, dto: CreateMoneyGiftDto) {
    const currency = this.currency(dto.currency);
    if (currency !== this.currency()) throw new BadRequestException('Currency does not match configured payment currency');
    const contact = await this.prisma.customerContact.findFirst({ where: { id: dto.recipientContactId, userId: user.uid, deletedAt: null } });
    if (!contact) throw new NotFoundException('Contact not found');
    const provider = dto.paymentMethod === PaymentMethod.STRIPE_CARD ? PaymentProvider.STRIPE : PaymentProvider.MANUAL;
    const moneyGift = await this.prisma.moneyGift.create({ data: { userId: user.uid, recipientContactId: contact.id, amount: new Prisma.Decimal(dto.amount), currency, message: dto.message?.trim(), messageMediaUrlsJson: dto.messageMediaUrls ?? [], deliveryDate: new Date(dto.deliveryDate), repeatAnnually: dto.repeatAnnually ?? false, status: MoneyGiftStatus.PAYMENT_PENDING } });
    const payment = await this.prisma.payment.create({ data: { userId: user.uid, moneyGiftId: moneyGift.id, provider, amount: new Prisma.Decimal(dto.amount), currency, status: PaymentStatus.PENDING, paymentMethod: dto.paymentMethod, metadataJson: { moneyGiftId: moneyGift.id } } });
    await this.prisma.moneyGift.update({ where: { id: moneyGift.id }, data: { paymentId: payment.id } });
    if (dto.paymentMethod !== PaymentMethod.STRIPE_CARD) {
      return { data: { ...this.toMoneyGift(moneyGift), payment: this.toPaymentResponse(payment) }, message: 'Money gift created successfully.' };
    }
    const intent = await this.stripe().paymentIntents.create({ amount: this.toSmallestUnit(dto.amount, currency), currency: currency.toLowerCase(), automatic_payment_methods: { enabled: true }, metadata: { paymentId: payment.id, moneyGiftId: moneyGift.id, userId: user.uid } });
    const updatedPayment = await this.prisma.payment.update({ where: { id: payment.id }, data: { providerPaymentIntentId: intent.id, status: PaymentStatus.PROCESSING, metadataJson: { moneyGiftId: moneyGift.id, stripeStatus: intent.status } } });
    return { data: { ...this.toMoneyGift(moneyGift), payment: { ...this.toPaymentResponse(updatedPayment), stripePaymentIntentId: intent.id, clientSecret: intent.client_secret, publishableKey: this.publishableKey(), amount: this.toSmallestUnit(dto.amount, currency), currency } }, message: 'Money gift created successfully.' };
  }

  async moneyGifts(user: AuthUserContext) {
    const items = await this.prisma.moneyGift.findMany({ where: { userId: user.uid }, include: { recipientContact: true }, orderBy: { createdAt: 'desc' } });
    return { data: items.map((item) => this.toMoneyGift(item)), message: 'Money gifts fetched successfully.' };
  }

  async moneyGiftDetails(user: AuthUserContext, id: string) {
    const item = await this.prisma.moneyGift.findFirst({ where: { id, userId: user.uid }, include: { recipientContact: true } });
    if (!item) throw new NotFoundException('Money gift not found');
    return { data: this.toMoneyGift(item), message: 'Money gift fetched successfully.' };
  }

  private async getOwnedCart(userId: string, cartId: string): Promise<CartWithItems> {
    const cart = await this.prisma.cart.findFirst({ where: { id: cartId, userId, status: CartStatus.ACTIVE }, include: { items: true } });
    if (!cart) throw new NotFoundException('Active cart not found');
    return cart;
  }

  private async getOwnedPayment(userId: string, id: string): Promise<Payment> {
    const payment = await this.prisma.payment.findFirst({ where: { id, userId } });
    if (!payment) throw new NotFoundException('Payment not found');
    return payment;
  }

  private async updateFromStripeIntent(intent: StripeIntentLike, status: PaymentStatus, failureReason?: string) {
    const payment = await this.prisma.payment.findUnique({ where: { providerPaymentIntentId: intent.id } });
    if (!payment) return;
    const finalStatuses: PaymentStatus[] = [PaymentStatus.SUCCEEDED, PaymentStatus.FAILED, PaymentStatus.CANCELLED];
    if (finalStatuses.includes(payment.status) && payment.status === status) return;
    const updated = await this.prisma.payment.update({ where: { id: payment.id }, data: { status, failureReason, metadataJson: this.mergeMetadata(payment.metadataJson, { stripeStatus: intent.status, webhookPaymentIntentId: intent.id }) } });
    if (updated.moneyGiftId && status === PaymentStatus.SUCCEEDED) {
      const deliveryDate = await this.prisma.moneyGift.findUnique({ where: { id: updated.moneyGiftId }, select: { deliveryDate: true } });
      await this.prisma.moneyGift.update({ where: { id: updated.moneyGiftId }, data: { status: deliveryDate && deliveryDate.deliveryDate > new Date() ? MoneyGiftStatus.SCHEDULED : MoneyGiftStatus.SENT } });
      await this.notify(updated.userId, 'Money gift paid', 'Your money gift payment was completed.', 'MONEY_GIFT_SENT', { paymentId: updated.id, moneyGiftId: updated.moneyGiftId });
    }
    if (status === PaymentStatus.SUCCEEDED) await this.notify(updated.userId, 'Payment successful', 'Your payment was completed successfully.', 'PAYMENT_SUCCEEDED', { paymentId: updated.id });
    if (status === PaymentStatus.FAILED) await this.notify(updated.userId, 'Payment failed', 'Your payment could not be completed.', 'PAYMENT_FAILED', { paymentId: updated.id });
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
  private toPaymentResponse(payment: Payment) { return { paymentId: payment.id, provider: payment.provider, stripePaymentIntentId: payment.providerPaymentIntentId, amount: Number(payment.amount), currency: payment.currency, status: payment.status, paymentMethod: payment.paymentMethod, failureReason: payment.failureReason, createdAt: payment.createdAt, updatedAt: payment.updatedAt }; }
  private toMoneyGift(item: { id: string; amount: Prisma.Decimal; currency: string; recipientContactId: string; message: string | null; messageMediaUrlsJson: Prisma.JsonValue; deliveryDate: Date; repeatAnnually: boolean; status: MoneyGiftStatus; createdAt: Date; updatedAt: Date; recipientContact?: { name: string; phone: string | null; email: string | null; avatarUrl: string | null } }) { return { id: item.id, amount: Number(item.amount), currency: item.currency, recipientContactId: item.recipientContactId, recipient: item.recipientContact ? { name: item.recipientContact.name, phone: item.recipientContact.phone, email: item.recipientContact.email, avatarUrl: item.recipientContact.avatarUrl } : undefined, message: item.message, messageMediaUrls: Array.isArray(item.messageMediaUrlsJson) ? item.messageMediaUrlsJson.filter((value): value is string => typeof value === 'string') : [], deliveryDate: item.deliveryDate, repeatAnnually: item.repeatAnnually, status: item.status, createdAt: item.createdAt, updatedAt: item.updatedAt }; }
  private async notify(recipientId: string, title: string, message: string, type: string, metadata: Prisma.InputJsonObject): Promise<void> { await this.prisma.notification.create({ data: { recipientId, recipientType: NotificationRecipientType.REGISTERED_USER, title, message, type, metadataJson: metadata } }); }
}
