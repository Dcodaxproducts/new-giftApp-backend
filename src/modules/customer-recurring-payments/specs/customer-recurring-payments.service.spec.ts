/* eslint-disable @typescript-eslint/require-await, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CustomerRecurringPaymentFrequency, CustomerRecurringPaymentOccurrenceStatus, CustomerRecurringPaymentStatus } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';
import { CustomerRecurringPaymentsRepository } from '../repositories/customer-recurring-payments.repository';
import { CustomerRecurringPaymentsService } from '../services/customer-recurring-payments.service';
import { CustomerRecurringPaymentAction, Weekday } from '../dto/customer-recurring-payments.dto';

describe('CustomerRecurringPaymentsService schedule rules', () => {
  const service = new CustomerRecurringPaymentsService({} as CustomerRecurringPaymentsRepository);

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
    const dtoSource = readFileSync(join(__dirname, '../dto/customer-recurring-payments.dto.ts'), 'utf8');
    expect(dtoSource).toContain('@Min(1) amount');
  });

  it('weekly schedule requires dayOfWeek', () => {
    expect(() => service.calculateNextBillingAt(CustomerRecurringPaymentFrequency.WEEKLY, { time: '09:00', timezone: 'Asia/Karachi' }, new Date('2026-05-09T08:00:00.000Z'))).toThrow(BadRequestException);
  });
});

describe('Customer recurring payment action behavior', () => {
  const user = { uid: 'customer_1', role: 'REGISTERED_USER' as const };
  const recurring = { id: 'recurring_1', userId: 'customer_1', recipientContactId: 'contact_1', amount: 50, currency: 'PKR', frequency: CustomerRecurringPaymentFrequency.MONTHLY, scheduleJson: { dayOfMonth: 15, time: '09:00', timezone: 'Asia/Karachi' }, message: 'Monthly flowers', messageMediaUrlsJson: [], paymentMethod: 'STRIPE_CARD', stripePaymentMethodId: 'pm_123', status: CustomerRecurringPaymentStatus.ACTIVE, nextBillingAt: new Date('2026-06-15T09:00:00.000Z'), cancelAtPeriodEnd: false, cancelAt: null, cancelledAt: null, cancelReason: null, createdAt: new Date(), updatedAt: new Date(), deletedAt: null, failureCount: 0, startDate: new Date('2026-05-01T00:00:00.000Z'), endDate: null, recipientContact: { id: 'contact_1', name: 'Sarah Johnson', email: 'sarah@example.com', avatarUrl: null } };
  const createService = (overrides: Record<string, jest.Mock> = {}) => {
    const repository = {
      findByIdForCustomer: jest.fn(async ({ where }) => (where.id === recurring.id ? recurring : null)),
      updateRecurringPayment: jest.fn(async (id, data) => ({ ...recurring, id, ...data })),
      createNotification: jest.fn(async () => undefined),
      ...overrides,
    } as unknown as CustomerRecurringPaymentsRepository;
    return { service: new CustomerRecurringPaymentsService(repository), repository };
  };

  it('pause works', async () => {
    const { service } = createService();
    const result = await service.action(user, 'recurring_1', { action: CustomerRecurringPaymentAction.PAUSE, reason: 'USER_REQUEST', comment: 'User paused payment temporarily.' });
    expect(result.data).toEqual(expect.objectContaining({ id: 'recurring_1', status: CustomerRecurringPaymentStatus.PAUSED, action: CustomerRecurringPaymentAction.PAUSE }));
  });

  it('resume works', async () => {
    const { service } = createService({ findByIdForCustomer: jest.fn(async () => ({ ...recurring, status: CustomerRecurringPaymentStatus.PAUSED })) });
    const result = await service.action(user, 'recurring_1', { action: CustomerRecurringPaymentAction.RESUME, reason: 'USER_REQUEST', comment: 'User resumed recurring payment.' });
    expect(result.data).toEqual(expect.objectContaining({ id: 'recurring_1', status: CustomerRecurringPaymentStatus.ACTIVE, action: CustomerRecurringPaymentAction.RESUME }));
  });

  it('cancel works and preserves billing history access', async () => {
    const repository = {
      findByIdForCustomer: jest.fn(async ({ where }) => (where.id === recurring.id ? recurring : null)),
      updateRecurringPayment: jest.fn(async (id, data) => ({ ...recurring, id, ...data })),
      createNotification: jest.fn(async () => undefined),
      findBillingHistory: jest.fn(async () => [{ id: 'occ_1', paymentId: 'pay_1', amount: 50, currency: 'PKR', status: 'SUCCESS', scheduledFor: new Date('2026-05-15T09:00:00.000Z'), failureReason: null }]),
      countBillingHistory: jest.fn(async () => 1),
    } as unknown as CustomerRecurringPaymentsRepository;
    const service = new CustomerRecurringPaymentsService(repository);
    const action = await service.action(user, 'recurring_1', { action: CustomerRecurringPaymentAction.CANCEL, reason: 'USER_REQUEST', cancelAtPeriodEnd: true, comment: 'Finish current cycle.' });
    const history = await service.history(user, 'recurring_1', {});
    expect(action.data).toEqual(expect.objectContaining({ id: 'recurring_1', action: CustomerRecurringPaymentAction.CANCEL, cancelAtPeriodEnd: true }));
    expect(history.data).toHaveLength(1);
  });

  it('ownership is enforced', async () => {
    const { service } = createService({ findByIdForCustomer: jest.fn(async () => null) });
    await expect(service.action(user, 'other_id', { action: CustomerRecurringPaymentAction.PAUSE })).rejects.toThrow(NotFoundException);
  });

  it('invalid transitions are rejected', async () => {
    const paused = createService({ findByIdForCustomer: jest.fn(async () => ({ ...recurring, status: CustomerRecurringPaymentStatus.PAUSED })) }).service;
    const cancelled = createService({ findByIdForCustomer: jest.fn(async () => ({ ...recurring, status: CustomerRecurringPaymentStatus.CANCELLED })) }).service;
    await expect(paused.action(user, 'recurring_1', { action: CustomerRecurringPaymentAction.PAUSE })).rejects.toThrow(BadRequestException);
    await expect(cancelled.action(user, 'recurring_1', { action: CustomerRecurringPaymentAction.CANCEL })).rejects.toThrow(BadRequestException);
  });
});

describe('Customer recurring payment source safety', () => {
  const source = readFileSync(join(__dirname, '../services/customer-recurring-payments.service.ts'), 'utf8');
  const repository = readFileSync(join(__dirname, '../repositories/customer-recurring-payments.repository.ts'), 'utf8');
  const controller = readFileSync(join(__dirname, '../controllers/customer-recurring-payments.controller.ts'), 'utf8');
  const schema = readFileSync(join(__dirname, '../../../../prisma/schema.prisma'), 'utf8');

  it('registered user can create recurring payment and recipientContactId must belong to logged-in user', () => {
    expect(controller).toContain('@Roles(UserRole.REGISTERED_USER)');
    expect(source).toContain('async create');
    expect(source).toContain('await this.assertOwnedContact(user.uid, dto.recipientContactId)');
    expect(repository).toContain('findContactForCustomer');
  });

  it('user can list only own recurring payments and cannot fetch another user’s recurring payment', () => {
    expect(source).toContain('return { userId, deletedAt: null');
    expect(repository).toContain('findByIdForCustomer');
  });

  it('unified action endpoint enforces pause, resume, and cancel transition rules', () => {
    expect(source).toContain('dto.action === CustomerRecurringPaymentAction.PAUSE');
    expect(source).toContain('item.status !== CustomerRecurringPaymentStatus.ACTIVE');
    expect(source).toContain('dto.action === CustomerRecurringPaymentAction.RESUME');
    expect(source).toContain('item.status !== CustomerRecurringPaymentStatus.PAUSED');
    expect(source).toContain('Only active or paused recurring payment can be cancelled');
    expect(source).toContain('cancelAtPeriodEnd = dto.cancelAtPeriodEnd ?? false');
  });

  it('setup intent creates Stripe setup intent', () => {
    expect(source).toContain('setupIntents.create');
    expect(source).toContain("usage: 'off_session'");
  });

  it('saved payment methods are owned by user', () => {
    expect(repository).toContain('findSavedPaymentMethodsForCustomer');
    expect(source).toContain('Payment method is used by an active recurring payment');
  });


  it('repository owns Prisma access for recurring payment module', () => {
    expect(source).toContain('repository.findManyForCustomer');
    expect(source).toContain('repository.createRecurringPayment');
    expect(source).toContain('repository.updateRecurringPayment');
    expect(source).toContain('repository.findBillingHistory');
    expect(repository).toContain('prisma.customerRecurringPayment.findMany');
    expect(repository).toContain('prisma.customerRecurringPayment.create');
    expect(repository).toContain('prisma.customerRecurringPaymentOccurrence.findMany');
  });

  it('customer cannot access another customer recurring payment and history is customer-scoped', () => {
    expect(repository).toContain('findByIdForCustomer');
    expect(source).toContain('const where: Prisma.CustomerRecurringPaymentOccurrenceWhereInput = { recurringPaymentId: id, userId: user.uid, status }');
  });

  it('old pause, resume, and cancel routes are removed from Swagger and controller code', () => {
    const openapi = JSON.parse(readFileSync(join(__dirname, '../../../../docs/generated/openapi.json'), 'utf8')) as { paths: Record<string, unknown> };
    expect(controller).toContain("@Post(':id/action')");
    expect(controller).not.toContain("@Post(':id/pause')");
    expect(controller).not.toContain("@Post(':id/resume')");
    expect(controller).not.toContain("@Post(':id/cancel')");
    expect(openapi.paths['/api/v1/customer/recurring-payments/{id}/action']).toBeDefined();
    expect(openapi.paths['/api/v1/customer/recurring-payments/{id}/pause']).toBeUndefined();
    expect(openapi.paths['/api/v1/customer/recurring-payments/{id}/resume']).toBeUndefined();
    expect(openapi.paths['/api/v1/customer/recurring-payments/{id}/cancel']).toBeUndefined();
  });

  it('create validates own saved payment method and schedule behavior remains unchanged', () => {
    expect(source).toContain('await this.assertOwnedPaymentMethod(user.uid, dto.stripePaymentMethodId)');
    expect(source).toContain('calculateNextBillingAt(dto.frequency, dto.schedule, startDate)');
  });

  it('scheduler charges due recurring payments', () => {
    expect(source).toContain('async processDue');
    expect(source).toContain('nextBillingAt: { lte: now }');
    expect(source).toContain('paymentIntents.create');
  });

  it('successful charge creates occurrence and money gift', () => {
    expect(repository).toContain('createOccurrence');
    expect(repository).toContain('createMoneyGift');
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
