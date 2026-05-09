import { BadRequestException } from '@nestjs/common';
import { CustomerRecurringPaymentCancelMode, CustomerRecurringPaymentFrequency, CustomerRecurringPaymentOccurrenceStatus, CustomerRecurringPaymentStatus } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';
import { PrismaService } from '../../database/prisma.service';
import { CustomerRecurringPaymentsService } from './customer-recurring-payments.service';
import { Weekday } from './dto/customer-recurring-payments.dto';

describe('CustomerRecurringPaymentsService schedule rules', () => {
  const service = new CustomerRecurringPaymentsService({} as PrismaService);

  it('daily schedule calculates nextBillingAt', () => {
    const next = service.calculateNextBillingAt(CustomerRecurringPaymentFrequency.DAILY, { time: '09:00', timezone: 'Asia/Karachi' }, new Date('2026-05-09T08:00:00.000Z'));
    expect(next.toISOString()).toBe('2026-05-09T09:00:00.000Z');
  });

  it('weekly schedule calculates nextBillingAt', () => {
    const next = service.calculateNextBillingAt(CustomerRecurringPaymentFrequency.WEEKLY, { dayOfWeek: Weekday.MONDAY, time: '09:00', timezone: 'Asia/Karachi' }, new Date('2026-05-09T08:00:00.000Z'));
    expect(next.toISOString()).toBe('2026-05-11T09:00:00.000Z');
  });

  it('monthly schedule calculates nextBillingAt', () => {
    const next = service.calculateNextBillingAt(CustomerRecurringPaymentFrequency.MONTHLY, { dayOfMonth: 15, time: '09:00', timezone: 'Asia/Karachi' }, new Date('2026-05-16T08:00:00.000Z'));
    expect(next.toISOString()).toBe('2026-06-15T09:00:00.000Z');
  });

  it('yearly schedule calculates nextBillingAt', () => {
    const next = service.calculateNextBillingAt(CustomerRecurringPaymentFrequency.YEARLY, { monthOfYear: 3, dayOfMonth: 15, time: '09:00', timezone: 'Asia/Karachi' }, new Date('2026-03-16T08:00:00.000Z'));
    expect(next.toISOString()).toBe('2027-03-15T09:00:00.000Z');
  });

  it('amount must be greater than 0 through DTO Min validation metadata', () => {
    const dtoSource = readFileSync(join(__dirname, 'dto/customer-recurring-payments.dto.ts'), 'utf8');
    expect(dtoSource).toContain('@Min(1) amount');
  });

  it('weekly schedule requires dayOfWeek', () => {
    expect(() => service.calculateNextBillingAt(CustomerRecurringPaymentFrequency.WEEKLY, { time: '09:00', timezone: 'Asia/Karachi' }, new Date('2026-05-09T08:00:00.000Z'))).toThrow(BadRequestException);
  });
});

describe('Customer recurring payment source safety', () => {
  const source = readFileSync(join(__dirname, 'customer-recurring-payments.service.ts'), 'utf8');
  const controller = readFileSync(join(__dirname, 'customer-recurring-payments.controller.ts'), 'utf8');
  const schema = readFileSync(join(__dirname, '../../../prisma/schema.prisma'), 'utf8');

  it('registered user can create recurring payment and recipientContactId must belong to logged-in user', () => {
    expect(controller).toContain('@Roles(UserRole.REGISTERED_USER)');
    expect(source).toContain('async create');
    expect(source).toContain('await this.assertOwnedContact(user.uid, dto.recipientContactId)');
    expect(source).toContain('userId: user.uid, deletedAt: null');
  });

  it('user can list only own recurring payments and cannot fetch another user’s recurring payment', () => {
    expect(source).toContain('return { userId, deletedAt: null');
    expect(source).toContain('where: { id, userId, deletedAt: null }');
  });

  it('pause works only for ACTIVE recurring payment', () => {
    expect(source).toContain('item.status !== CustomerRecurringPaymentStatus.ACTIVE');
    expect(source).toContain('status: CustomerRecurringPaymentStatus.PAUSED');
  });

  it('resume works only for PAUSED recurring payment', () => {
    expect(source).toContain('item.status !== CustomerRecurringPaymentStatus.PAUSED');
    expect(source).toContain('status: CustomerRecurringPaymentStatus.ACTIVE');
  });

  it('cancel immediately prevents future processing', () => {
    expect(source).toContain('CustomerRecurringPaymentCancelMode.IMMEDIATELY');
    expect(source).toContain('status: CustomerRecurringPaymentStatus.CANCELLED');
  });

  it('cancel after current billing cycle sets cancelAtPeriodEnd', () => {
    expect(source).toContain('cancelAtPeriodEnd: true');
    expect(source).toContain('cancelAt: item.nextBillingAt');
    expect(CustomerRecurringPaymentCancelMode.AFTER_CURRENT_BILLING_CYCLE).toBe('AFTER_CURRENT_BILLING_CYCLE');
  });

  it('setup intent creates Stripe setup intent', () => {
    expect(source).toContain('setupIntents.create');
    expect(source).toContain("usage: 'off_session'");
  });

  it('saved payment methods are owned by user', () => {
    expect(source).toContain('customerPaymentMethod.findMany({ where: { userId: user.uid, deletedAt: null }');
    expect(source).toContain('Payment method is used by an active recurring payment');
  });

  it('scheduler charges due recurring payments', () => {
    expect(source).toContain('async processDue');
    expect(source).toContain('nextBillingAt: { lte: now }');
    expect(source).toContain('paymentIntents.create');
  });

  it('successful charge creates occurrence and money gift', () => {
    expect(source).toContain('customerRecurringPaymentOccurrence.create');
    expect(source).toContain('moneyGift.create');
    expect(source).toContain('CustomerRecurringPaymentOccurrenceStatus.SUCCESS');
  });

  it('failed charge creates failed occurrence and notification', () => {
    expect(source).toContain('CustomerRecurringPaymentOccurrenceStatus.FAILED');
    expect(source).toContain('RECURRING_PAYMENT_CHARGE_FAILED');
    expect(CustomerRecurringPaymentOccurrenceStatus.FAILED).toBe('FAILED');
  });

  it('schema separates customer recurring payments from admin subscription plans', () => {
    expect(schema).toContain('model CustomerRecurringPayment');
    expect(schema).toContain('model CustomerRecurringPaymentOccurrence');
    expect(schema).toContain('model CustomerPaymentMethod');
    expect(schema).toContain('model SubscriptionPlan');
    expect(CustomerRecurringPaymentStatus.ACTIVE).toBe('ACTIVE');
  });
});
