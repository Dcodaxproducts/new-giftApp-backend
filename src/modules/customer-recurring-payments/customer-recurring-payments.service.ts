import { BadRequestException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { CustomerRecurringPayment, CustomerRecurringPaymentCancelMode, CustomerRecurringPaymentFrequency, CustomerRecurringPaymentOccurrence, CustomerRecurringPaymentOccurrenceStatus, CustomerRecurringPaymentStatus, MoneyGiftStatus, NotificationRecipientType, PaymentMethod, PaymentProvider, PaymentStatus, Prisma } from '@prisma/client';
import Stripe from 'stripe';
import { AuthUserContext } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../database/prisma.service';
import { CancelRecurringPaymentDto, CreateRecurringPaymentDto, HistoryStatusFilter, ListRecurringPaymentsDto, ListRecurringPaymentsSortBy, ListRecurringPaymentsStatus, PauseRecurringPaymentDto, RecurringPaymentScheduleDto, SortOrder, UpdateRecurringPaymentDto, Weekday } from './dto/customer-recurring-payments.dto';

type RecurringWithContact = CustomerRecurringPayment & { recipientContact: { id: string; name: string; email: string | null; avatarUrl: string | null } };
type StripeSetupIntentLike = { id: string; client_secret: string | null };
type StripePaymentIntentLike = { id: string; status: string; last_payment_error?: { message?: string | null } | null };
type StripePaymentMethodCardLike = { brand?: string; last4?: string; exp_month?: number; exp_year?: number };
type StripePaymentMethodLike = { customer?: string | null; type: string; card?: StripePaymentMethodCardLike | null };

@Injectable()
export class CustomerRecurringPaymentsService {
  private stripeClient?: InstanceType<typeof Stripe>;
  constructor(private readonly prisma: PrismaService) {}

  async list(user: AuthUserContext, query: ListRecurringPaymentsDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const where = this.listWhere(user.uid, query);
    const sortBy = query.sortBy ?? ListRecurringPaymentsSortBy.CREATED_AT;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.customerRecurringPayment.findMany({ where, include: { recipientContact: true }, orderBy: { [sortBy]: (query.sortOrder ?? SortOrder.DESC).toLowerCase() as Prisma.SortOrder }, skip: (page - 1) * limit, take: limit }),
      this.prisma.customerRecurringPayment.count({ where }),
    ]);
    return { data: items.map((item) => this.toListItem(item)), meta: { page, limit, total, totalPages: Math.ceil(total / limit) }, message: 'Recurring payments fetched successfully.' };
  }

  async create(user: AuthUserContext, dto: CreateRecurringPaymentDto) {
    const currency = this.currency(dto.currency);
    if (currency !== this.currency()) throw new BadRequestException('Currency does not match configured payment currency');
    const startDate = this.futureDate(dto.startDate, 'startDate cannot be in the past');
    const endDate = dto.endDate ? new Date(dto.endDate) : null;
    if (endDate && endDate <= startDate) throw new BadRequestException('endDate must be after startDate');
    await this.assertOwnedContact(user.uid, dto.recipientContactId);
    if (dto.paymentMethod === PaymentMethod.STRIPE_CARD) await this.assertOwnedPaymentMethod(user.uid, dto.stripePaymentMethodId);
    const nextBillingAt = this.calculateNextBillingAt(dto.frequency, dto.schedule, startDate);
    const item = await this.prisma.customerRecurringPayment.create({ data: { userId: user.uid, recipientContactId: dto.recipientContactId, amount: new Prisma.Decimal(dto.amount), currency, frequency: dto.frequency, scheduleJson: this.scheduleForStorage(dto.schedule), message: dto.message?.trim(), messageMediaUrlsJson: dto.messageMediaUrls ?? [], paymentMethod: dto.paymentMethod, stripePaymentMethodId: dto.stripePaymentMethodId, status: CustomerRecurringPaymentStatus.ACTIVE, nextBillingAt, startDate, endDate } });
    await this.notify(user.uid, 'Recurring payment created', 'Your recurring payment was created successfully.', 'RECURRING_PAYMENT_CREATED', { recurringPaymentId: item.id });
    return { data: { id: item.id, amount: Number(item.amount), currency: item.currency, frequency: item.frequency, nextBillingAt: item.nextBillingAt, status: item.status }, message: 'Recurring payment created successfully.' };
  }

  async details(user: AuthUserContext, id: string) {
    const item = await this.getOwned(user.uid, id);
    const method = item.stripePaymentMethodId ? await this.prisma.customerPaymentMethod.findFirst({ where: { userId: user.uid, stripePaymentMethodId: item.stripePaymentMethodId, deletedAt: null } }) : null;
    return { data: { ...this.toListItem(item), messageMediaUrls: this.stringArray(item.messageMediaUrlsJson), paymentMethod: method ? this.toSavedMethod(method) : { type: item.paymentMethod }, schedule: { frequency: item.frequency, ...this.scheduleFromJson(item.scheduleJson) } }, message: 'Recurring payment fetched successfully.' };
  }

  async update(user: AuthUserContext, id: string, dto: UpdateRecurringPaymentDto) {
    const current = await this.getOwned(user.uid, id);
    if (current.status === CustomerRecurringPaymentStatus.CANCELLED) throw new BadRequestException('Cancelled recurring payment cannot be edited');
    const frequency = dto.frequency ?? current.frequency;
    const schedule = dto.schedule ?? this.scheduleFromJson(current.scheduleJson);
    if (dto.stripePaymentMethodId) await this.assertOwnedPaymentMethod(user.uid, dto.stripePaymentMethodId);
    const nextBillingAt = this.calculateNextBillingAt(frequency, schedule, new Date());
    const updated = await this.prisma.customerRecurringPayment.update({ where: { id }, data: { amount: dto.amount === undefined ? undefined : new Prisma.Decimal(dto.amount), frequency, scheduleJson: this.scheduleForStorage(schedule), message: dto.message?.trim(), messageMediaUrlsJson: dto.messageMediaUrls, stripePaymentMethodId: dto.stripePaymentMethodId, nextBillingAt } });
    await this.notify(user.uid, 'Recurring payment updated', 'Your recurring payment was updated.', 'RECURRING_PAYMENT_UPDATED', { recurringPaymentId: id });
    return { data: { id: updated.id, status: updated.status, nextBillingAt: updated.nextBillingAt }, message: 'Recurring payment updated successfully. Changes will apply from the next billing cycle.' };
  }

  async pause(user: AuthUserContext, id: string, dto: PauseRecurringPaymentDto) {
    const item = await this.getOwned(user.uid, id);
    if (item.status !== CustomerRecurringPaymentStatus.ACTIVE) throw new BadRequestException('Only active recurring payment can be paused');
    const updated = await this.prisma.customerRecurringPayment.update({ where: { id }, data: { status: CustomerRecurringPaymentStatus.PAUSED, cancelReason: dto.reason } });
    await this.notify(user.uid, 'Recurring payment paused', 'Your recurring payment was paused.', 'RECURRING_PAYMENT_PAUSED', { recurringPaymentId: id });
    return { data: { id: updated.id, status: updated.status }, message: 'Recurring payment paused successfully.' };
  }

  async resume(user: AuthUserContext, id: string) {
    const item = await this.getOwned(user.uid, id);
    if (item.status !== CustomerRecurringPaymentStatus.PAUSED) throw new BadRequestException('Only paused recurring payment can be resumed');
    const nextBillingAt = this.calculateNextBillingAt(item.frequency, this.scheduleFromJson(item.scheduleJson), new Date());
    const updated = await this.prisma.customerRecurringPayment.update({ where: { id }, data: { status: CustomerRecurringPaymentStatus.ACTIVE, nextBillingAt, cancelReason: null } });
    await this.notify(user.uid, 'Recurring payment resumed', 'Your recurring payment was resumed.', 'RECURRING_PAYMENT_RESUMED', { recurringPaymentId: id });
    return { data: { id: updated.id, status: updated.status, nextBillingAt: updated.nextBillingAt }, message: 'Recurring payment resumed successfully.' };
  }

  async cancel(user: AuthUserContext, id: string, dto: CancelRecurringPaymentDto) {
    const item = await this.getOwned(user.uid, id);
    if (item.status === CustomerRecurringPaymentStatus.CANCELLED) throw new BadRequestException('Recurring payment is already cancelled');
    const now = new Date();
    const data: Prisma.CustomerRecurringPaymentUpdateInput = dto.cancelMode === CustomerRecurringPaymentCancelMode.IMMEDIATELY ? { status: CustomerRecurringPaymentStatus.CANCELLED, cancelledAt: now, cancelAtPeriodEnd: false, cancelAt: null, cancelReason: dto.reason } : { cancelAtPeriodEnd: true, cancelAt: item.nextBillingAt, cancelReason: dto.reason };
    const updated = await this.prisma.customerRecurringPayment.update({ where: { id }, data });
    await this.notify(user.uid, 'Recurring payment cancelled', 'Your recurring payment was cancelled.', 'RECURRING_PAYMENT_CANCELLED', { recurringPaymentId: id, cancelMode: dto.cancelMode });
    return { data: { id: updated.id, status: updated.status, cancelMode: dto.cancelMode }, message: 'Recurring payment cancelled successfully.' };
  }

  async history(user: AuthUserContext, id: string, query: { page?: number; limit?: number; status?: HistoryStatusFilter }) {
    await this.getOwned(user.uid, id);
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const status = query.status && query.status !== HistoryStatusFilter.ALL ? query.status : undefined;
    const where: Prisma.CustomerRecurringPaymentOccurrenceWhereInput = { recurringPaymentId: id, userId: user.uid, status };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.customerRecurringPaymentOccurrence.findMany({ where, orderBy: { scheduledFor: 'desc' }, skip: (page - 1) * limit, take: limit }),
      this.prisma.customerRecurringPaymentOccurrence.count({ where }),
    ]);
    return { data: items.map((item) => this.toHistoryItem(item)), meta: { page, limit, total, totalPages: Math.ceil(total / limit) }, message: 'Recurring payment history fetched successfully.' };
  }

  async summary(user: AuthUserContext) {
    const rows = await this.prisma.customerRecurringPayment.groupBy({ by: ['status'], where: { userId: user.uid, deletedAt: null }, _count: { _all: true } });
    const count = (status: CustomerRecurringPaymentStatus) => rows.find((row) => row.status === status)?._count._all ?? 0;
    return { data: { total: rows.reduce((sum, row) => sum + row._count._all, 0), active: count(CustomerRecurringPaymentStatus.ACTIVE), paused: count(CustomerRecurringPaymentStatus.PAUSED), cancelled: count(CustomerRecurringPaymentStatus.CANCELLED), failed: count(CustomerRecurringPaymentStatus.FAILED) }, message: 'Recurring payment summary fetched successfully.' };
  }

  async createSetupIntent(user: AuthUserContext) {
    const customerId = await this.stripeCustomerId(user.uid);
    const intent = await this.stripe().setupIntents.create({ customer: customerId, payment_method_types: ['card'], usage: 'off_session', metadata: { userId: user.uid } }) as StripeSetupIntentLike;
    return { data: { setupIntentId: intent.id, clientSecret: intent.client_secret, publishableKey: this.publishableKey() }, message: 'Setup intent created successfully.' };
  }

  async savedPaymentMethods(user: AuthUserContext) {
    const items = await this.prisma.customerPaymentMethod.findMany({ where: { userId: user.uid, deletedAt: null }, orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }] });
    return { data: items.map((item) => this.toSavedMethod(item)), message: 'Saved payment methods fetched successfully.' };
  }

  async deletePaymentMethod(user: AuthUserContext, id: string) {
    const method = await this.prisma.customerPaymentMethod.findFirst({ where: { OR: [{ id }, { stripePaymentMethodId: id }], userId: user.uid, deletedAt: null } });
    if (!method) throw new NotFoundException('Payment method not found');
    const active = await this.prisma.customerRecurringPayment.findFirst({ where: { userId: user.uid, stripePaymentMethodId: method.stripePaymentMethodId, status: { in: [CustomerRecurringPaymentStatus.ACTIVE, CustomerRecurringPaymentStatus.PAUSED] }, deletedAt: null } });
    if (active) throw new BadRequestException('Payment method is used by an active recurring payment');
    await this.stripe().paymentMethods.detach(method.stripePaymentMethodId).catch(() => undefined);
    await this.prisma.customerPaymentMethod.update({ where: { id: method.id }, data: { deletedAt: new Date(), isDefault: false } });
    return { data: { id: method.id }, message: 'Payment method deleted successfully.' };
  }

  async processDue(now = new Date()) {
    const due = await this.prisma.customerRecurringPayment.findMany({ where: { status: CustomerRecurringPaymentStatus.ACTIVE, nextBillingAt: { lte: now }, deletedAt: null }, include: { recipientContact: true }, take: 50, orderBy: { nextBillingAt: 'asc' } });
    const results: { id: string; status: CustomerRecurringPaymentOccurrenceStatus }[] = [];
    for (const item of due) results.push(await this.processOne(item, now));
    return { data: { processed: results.length, results }, message: 'Due recurring payments processed successfully.' };
  }

  async processOne(item: RecurringWithContact, now = new Date()) {
    const occurrence = await this.prisma.customerRecurringPaymentOccurrence.create({ data: { recurringPaymentId: item.id, userId: item.userId, amount: item.amount, currency: item.currency, scheduledFor: item.nextBillingAt, status: CustomerRecurringPaymentOccurrenceStatus.PENDING } });
    try {
      if (item.paymentMethod !== PaymentMethod.STRIPE_CARD || !item.stripePaymentMethodId) throw new BadRequestException('Recurring payment requires saved Stripe card');
      const intent = await this.stripe().paymentIntents.create({ amount: this.toSmallestUnit(Number(item.amount), item.currency), currency: item.currency.toLowerCase(), customer: await this.stripeCustomerId(item.userId), payment_method: item.stripePaymentMethodId, off_session: true, confirm: true, metadata: { recurringPaymentId: item.id, occurrenceId: occurrence.id, userId: item.userId } }) as StripePaymentIntentLike;
      const paymentStatus = intent.status === 'succeeded' ? PaymentStatus.SUCCEEDED : PaymentStatus.PROCESSING;
      const moneyGift = await this.prisma.moneyGift.create({ data: { userId: item.userId, recipientContactId: item.recipientContactId, amount: item.amount, currency: item.currency, message: item.message, messageMediaUrlsJson: this.stringArray(item.messageMediaUrlsJson), deliveryDate: now, repeatAnnually: false, status: paymentStatus === PaymentStatus.SUCCEEDED ? MoneyGiftStatus.SENT : MoneyGiftStatus.PAYMENT_PENDING } });
      const payment = await this.prisma.payment.create({ data: { userId: item.userId, moneyGiftId: moneyGift.id, provider: PaymentProvider.STRIPE, providerPaymentIntentId: intent.id, amount: item.amount, currency: item.currency, status: paymentStatus, paymentMethod: item.paymentMethod, metadataJson: { recurringPaymentId: item.id, occurrenceId: occurrence.id } } });
      await this.prisma.moneyGift.update({ where: { id: moneyGift.id }, data: { paymentId: payment.id } });
      await this.prisma.customerRecurringPaymentOccurrence.update({ where: { id: occurrence.id }, data: { paymentId: payment.id, moneyGiftId: moneyGift.id, status: CustomerRecurringPaymentOccurrenceStatus.SUCCESS, processedAt: now } });
      const next = this.calculateNextBillingAt(item.frequency, this.scheduleFromJson(item.scheduleJson), now);
      await this.prisma.customerRecurringPayment.update({ where: { id: item.id }, data: { nextBillingAt: next, failureCount: 0, status: item.endDate && next > item.endDate ? CustomerRecurringPaymentStatus.EXPIRED : item.cancelAtPeriodEnd && item.cancelAt && item.cancelAt <= now ? CustomerRecurringPaymentStatus.CANCELLED : CustomerRecurringPaymentStatus.ACTIVE, cancelledAt: item.cancelAtPeriodEnd && item.cancelAt && item.cancelAt <= now ? now : item.cancelledAt } });
      await this.notify(item.userId, 'Recurring payment sent', 'Your recurring payment was charged successfully.', 'RECURRING_PAYMENT_CHARGE_SUCCEEDED', { recurringPaymentId: item.id, occurrenceId: occurrence.id, paymentId: payment.id, moneyGiftId: moneyGift.id });
      return { id: item.id, status: CustomerRecurringPaymentOccurrenceStatus.SUCCESS };
    } catch (error) {
      const failureReason = error instanceof Error ? error.message : 'Recurring charge failed';
      await this.prisma.customerRecurringPaymentOccurrence.update({ where: { id: occurrence.id }, data: { status: CustomerRecurringPaymentOccurrenceStatus.FAILED, failureReason, processedAt: now } });
      const failureCount = item.failureCount + 1;
      await this.prisma.customerRecurringPayment.update({ where: { id: item.id }, data: { failureCount, status: failureCount >= 3 ? CustomerRecurringPaymentStatus.FAILED : item.status } });
      await this.notify(item.userId, 'Recurring payment failed', 'Your recurring payment charge failed. Please update your payment method.', 'RECURRING_PAYMENT_CHARGE_FAILED', { recurringPaymentId: item.id, occurrenceId: occurrence.id, failureReason });
      return { id: item.id, status: CustomerRecurringPaymentOccurrenceStatus.FAILED };
    }
  }

  calculateNextBillingAt(frequency: CustomerRecurringPaymentFrequency, schedule: RecurringPaymentScheduleDto, from: Date): Date {
    this.validateSchedule(frequency, schedule);
    const [hours, minutes] = schedule.time.split(':').map(Number);
    const candidate = new Date(from);
    candidate.setUTCHours(hours, minutes, 0, 0);
    if (frequency === CustomerRecurringPaymentFrequency.DAILY) return candidate > from ? candidate : this.addDays(candidate, 1);
    if (frequency === CustomerRecurringPaymentFrequency.WEEKLY) return this.nextWeekday(candidate, this.weekdayIndex(schedule.dayOfWeek as Weekday), from);
    if (frequency === CustomerRecurringPaymentFrequency.MONTHLY) return this.nextMonthDay(candidate, schedule.dayOfMonth as number, from);
    return this.nextYearDay(candidate, schedule.monthOfYear as number, schedule.dayOfMonth as number, from);
  }

  private validateSchedule(frequency: CustomerRecurringPaymentFrequency, schedule: RecurringPaymentScheduleDto): void {
    if (!schedule.time || !schedule.timezone) throw new BadRequestException('time and timezone are required');
    if (frequency === CustomerRecurringPaymentFrequency.WEEKLY && !schedule.dayOfWeek) throw new BadRequestException('WEEKLY schedule requires dayOfWeek');
    if (frequency === CustomerRecurringPaymentFrequency.MONTHLY && !schedule.dayOfMonth) throw new BadRequestException('MONTHLY schedule requires dayOfMonth');
    if (frequency === CustomerRecurringPaymentFrequency.YEARLY && (!schedule.monthOfYear || !schedule.dayOfMonth)) throw new BadRequestException('YEARLY schedule requires monthOfYear and dayOfMonth');
  }

  private listWhere(userId: string, query: ListRecurringPaymentsDto): Prisma.CustomerRecurringPaymentWhereInput {
    return { userId, deletedAt: null, status: query.status && query.status !== ListRecurringPaymentsStatus.ALL ? query.status : undefined, frequency: query.frequency, recipientContactId: query.recipientContactId, OR: query.search ? [{ message: { contains: query.search, mode: 'insensitive' } }, { recipientContact: { name: { contains: query.search, mode: 'insensitive' } } }] : undefined };
  }
  private async getOwned(userId: string, id: string): Promise<RecurringWithContact> { const item = await this.prisma.customerRecurringPayment.findFirst({ where: { id, userId, deletedAt: null }, include: { recipientContact: true } }); if (!item) throw new NotFoundException('Recurring payment not found'); return item; }
  private async assertOwnedContact(userId: string, contactId: string): Promise<void> { const contact = await this.prisma.customerContact.findFirst({ where: { id: contactId, userId, deletedAt: null } }); if (!contact) throw new NotFoundException('Contact not found'); }
  private async assertOwnedPaymentMethod(userId: string, stripePaymentMethodId?: string): Promise<void> {
    if (!stripePaymentMethodId) throw new BadRequestException('stripePaymentMethodId is required for STRIPE_CARD recurring payments');
    const method = await this.prisma.customerPaymentMethod.findFirst({ where: { userId, stripePaymentMethodId, deletedAt: null } });
    if (method) return;
    const stripeCustomerId = await this.stripeCustomerId(userId);
    const stripeMethod = await this.stripe().paymentMethods.retrieve(stripePaymentMethodId) as unknown as StripePaymentMethodLike;
    if (typeof stripeMethod.customer !== 'string' || stripeMethod.customer !== stripeCustomerId) throw new NotFoundException('Payment method not found');
    const count = await this.prisma.customerPaymentMethod.count({ where: { userId, deletedAt: null } });
    await this.prisma.customerPaymentMethod.create({ data: { userId, stripeCustomerId, stripePaymentMethodId, type: stripeMethod.type.toUpperCase(), brand: stripeMethod.card?.brand, last4: stripeMethod.card?.last4, expiryMonth: stripeMethod.card?.exp_month, expiryYear: stripeMethod.card?.exp_year, isDefault: count === 0 } });
  }
  private futureDate(input: string, message: string): Date { const value = new Date(input); if (value < new Date(Date.now() - 60000)) throw new BadRequestException(message); return value; }
  private scheduleForStorage(schedule: RecurringPaymentScheduleDto): Prisma.InputJsonObject { return { dayOfWeek: schedule.dayOfWeek ?? null, dayOfMonth: schedule.dayOfMonth ?? null, monthOfYear: schedule.monthOfYear ?? null, time: schedule.time, timezone: schedule.timezone }; }
  private scheduleFromJson(value: Prisma.JsonValue): RecurringPaymentScheduleDto { const source = value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}; return { dayOfWeek: typeof source.dayOfWeek === 'string' ? source.dayOfWeek as Weekday : undefined, dayOfMonth: typeof source.dayOfMonth === 'number' ? source.dayOfMonth : undefined, monthOfYear: typeof source.monthOfYear === 'number' ? source.monthOfYear : undefined, time: typeof source.time === 'string' ? source.time : '09:00', timezone: typeof source.timezone === 'string' ? source.timezone : 'Asia/Karachi' }; }
  private stringArray(value: Prisma.JsonValue): string[] { return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []; }
  private toListItem(item: RecurringWithContact) { return { id: item.id, title: item.message || `${item.recipientContact.name} recurring payment`, recipient: { id: item.recipientContact.id, name: item.recipientContact.name, email: item.recipientContact.email, avatarUrl: item.recipientContact.avatarUrl }, amount: Number(item.amount), currency: item.currency, frequency: item.frequency, nextBillingAt: item.nextBillingAt, status: item.status, message: item.message, createdAt: item.createdAt }; }
  private toHistoryItem(item: CustomerRecurringPaymentOccurrence) { return { id: item.id, paymentId: item.paymentId, amount: Number(item.amount), currency: item.currency, status: item.status, billingDate: item.scheduledFor, transactionId: item.paymentId ? `GFT-${item.paymentId.slice(-8).toUpperCase()}` : null, failureReason: item.failureReason }; }
  private toSavedMethod(item: { id: string; stripePaymentMethodId: string; type: string; brand: string | null; last4: string | null; expiryMonth: number | null; expiryYear: number | null; isDefault: boolean }) { return { id: item.stripePaymentMethodId || item.id, type: item.type, brand: item.brand, last4: item.last4, expiryMonth: item.expiryMonth, expiryYear: item.expiryYear, isDefault: item.isDefault }; }
  private async stripeCustomerId(userId: string): Promise<string> {
    const existing = await this.prisma.customerPaymentMethod.findFirst({ where: { userId }, orderBy: { createdAt: 'desc' } });
    if (existing) return existing.stripeCustomerId;
    const found = await this.stripe().customers.search({ query: `metadata['userId']:'${userId}'`, limit: 1 });
    if (found.data[0]) return found.data[0].id;
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { email: true, firstName: true, lastName: true } });
    const customer = await this.stripe().customers.create({ email: user?.email, name: user ? `${user.firstName} ${user.lastName}` : undefined, metadata: { userId } });
    return customer.id;
  }
  private stripe(): InstanceType<typeof Stripe> { const key = process.env.STRIPE_SECRET_KEY; if (!key) throw new ServiceUnavailableException('Stripe is not configured'); this.stripeClient ??= new Stripe(key); return this.stripeClient; }
  private publishableKey(): string { return process.env.STRIPE_PUBLISHABLE_KEY ?? ''; }
  private currency(input?: string): string { return (input ?? process.env.STRIPE_CURRENCY ?? 'PKR').toUpperCase(); }
  private toSmallestUnit(amount: number, currency: string): number { return this.zeroDecimalCurrencies().has(currency.toUpperCase()) ? Math.round(amount) : Math.round(amount * 100); }
  private zeroDecimalCurrencies(): Set<string> { return new Set(['BIF', 'CLP', 'DJF', 'GNF', 'JPY', 'KMF', 'KRW', 'MGA', 'PYG', 'RWF', 'UGX', 'VND', 'VUV', 'XAF', 'XOF', 'XPF']); }
  private addDays(date: Date, days: number): Date { const next = new Date(date); next.setUTCDate(next.getUTCDate() + days); return next; }
  private weekdayIndex(day: Weekday): number { return [Weekday.SUNDAY, Weekday.MONDAY, Weekday.TUESDAY, Weekday.WEDNESDAY, Weekday.THURSDAY, Weekday.FRIDAY, Weekday.SATURDAY].indexOf(day); }
  private nextWeekday(candidate: Date, target: number, from: Date): Date { const next = new Date(candidate); const delta = (target - next.getUTCDay() + 7) % 7; next.setUTCDate(next.getUTCDate() + delta); return next > from ? next : this.addDays(next, 7); }
  private nextMonthDay(candidate: Date, day: number, from: Date): Date { const next = new Date(candidate); next.setUTCDate(Math.min(day, this.daysInMonth(next.getUTCFullYear(), next.getUTCMonth()))); if (next > from) return next; next.setUTCMonth(next.getUTCMonth() + 1, Math.min(day, this.daysInMonth(next.getUTCFullYear(), next.getUTCMonth() + 1))); return next; }
  private nextYearDay(candidate: Date, month: number, day: number, from: Date): Date { const next = new Date(candidate); next.setUTCMonth(month - 1, Math.min(day, this.daysInMonth(next.getUTCFullYear(), month - 1))); if (next > from) return next; next.setUTCFullYear(next.getUTCFullYear() + 1, month - 1, Math.min(day, this.daysInMonth(next.getUTCFullYear() + 1, month - 1))); return next; }
  private daysInMonth(year: number, monthIndex: number): number { return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate(); }
  private async notify(recipientId: string, title: string, message: string, type: string, metadata: Prisma.InputJsonObject): Promise<void> { await this.prisma.notification.create({ data: { recipientId, recipientType: NotificationRecipientType.REGISTERED_USER, title, message, type, metadataJson: metadata } }); }
}
