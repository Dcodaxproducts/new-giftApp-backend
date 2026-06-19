/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { PaymentStatus, Prisma, UserRole } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';
import { AdminPlatformAnalyticsRepository, PlatformAnalyticsPayment } from './admin-platform-analytics.repository';
import { AdminPlatformAnalyticsService } from './admin-platform-analytics.service';
import { PlatformAnalyticsReportFormat, PlatformAnalyticsRange, PlatformAnalyticsTransactionStatus } from './dto/platform-analytics-query.dto';

function payment(params: { id: string; email: string; amount: number; status?: PaymentStatus; giftName?: string; categoryId?: string; categoryName?: string; providerId?: string; providerName?: string; plan?: string; orderNumber?: string; refundAmount?: number }): PlatformAnalyticsPayment {
  const createdAt = new Date('2026-06-01T12:00:00.000Z');
  return {
    id: params.id,
    userId: 'user_1',
    orderId: 'order_1',
    moneyGiftId: null,
    customerSubscriptionId: params.plan ? 'sub_1' : null,
    provider: 'STRIPE',
    providerPaymentIntentId: `TXN-${params.id}`,
    amount: new Prisma.Decimal(params.amount),
    currency: 'PKR',
    status: params.status ?? PaymentStatus.SUCCEEDED,
    paymentMethod: 'STRIPE_CARD',
    failureReason: null,
    metadataJson: {},
    idempotencyKey: null,
    createdAt,
    updatedAt: createdAt,
    user: { id: 'user_1', email: params.email, firstName: 'Alex', lastName: 'Rivera' },
    order: {
      id: 'order_1',
      orderNumber: params.orderNumber ?? 'ORD-1',
      items: [{
        id: 'item_1',
        orderId: 'order_1',
        giftId: 'gift_1',
        variantId: null,
        providerId: params.providerId ?? 'provider_1',
        quantity: 1,
        unitPrice: new Prisma.Decimal(params.amount),
        discountAmount: new Prisma.Decimal(0),
        finalUnitPrice: new Prisma.Decimal(params.amount),
        total: new Prisma.Decimal(params.amount),
        promotionalOfferId: null,
        status: 'COMPLETED',
        createdAt,
        updatedAt: createdAt,
        gift: { id: 'gift_1', name: params.giftName ?? 'Rose Bouquet', categoryId: params.categoryId ?? 'cat_1', category: { id: params.categoryId ?? 'cat_1', name: params.categoryName ?? 'Flowers' } },
      }],
      providerOrders: [{
        id: 'po_1',
        providerId: params.providerId ?? 'provider_1',
        provider: { id: params.providerId ?? 'provider_1', providerBusinessName: params.providerName ?? 'Gift Provider', firstName: 'Gift', lastName: 'Provider' },
      }],
    },
    customerSubscription: params.plan ? { id: 'sub_1', plan: { id: 'plan_1', name: params.plan } } : null,
    refundRequests: params.refundAmount ? [{ approvedAmount: new Prisma.Decimal(params.refundAmount), requestedAmount: new Prisma.Decimal(params.refundAmount), status: 'REFUNDED' }] : [],
  } as unknown as PlatformAnalyticsPayment;
}

function createService() {
  const repository = {
    sumSuccessfulPayments: jest.fn(),
    countNewSubscriptions: jest.fn(),
    countCancelledSubscriptions: jest.fn(),
    countActiveSubscriptionsAt: jest.fn(),
    countActiveRegisteredUsers: jest.fn(),
    findPayments: jest.fn(),
    countPayments: jest.fn(),
    findFilterCategories: jest.fn().mockResolvedValue([{ id: 'cat_1', name: 'Flowers' }]),
    findFilterProviders: jest.fn().mockResolvedValue([{ id: 'provider_1', providerBusinessName: 'Gift Provider', firstName: 'Gift', lastName: 'Provider' }]),
    findFilterPlans: jest.fn().mockResolvedValue([{ name: 'Pro' }, { name: 'Enterprise' }]),
  };
  const auditLog = { write: jest.fn().mockResolvedValue(undefined) };
  const service = new AdminPlatformAnalyticsService(repository as unknown as AdminPlatformAnalyticsRepository, auditLog as never);
  return { service, repository, auditLog };
}

describe('AdminPlatformAnalyticsService', () => {
  it('summary returns real revenue, new subscriptions, churn rate, and active users', async () => {
    const { service, repository } = createService();
    repository.sumSuccessfulPayments.mockResolvedValueOnce({ _sum: { amount: new Prisma.Decimal(154320) } });
    repository.sumSuccessfulPayments.mockResolvedValueOnce({ _sum: { amount: new Prisma.Decimal(142756) } });
    repository.countNewSubscriptions.mockResolvedValueOnce(215);
    repository.countNewSubscriptions.mockResolvedValueOnce(204);
    repository.countCancelledSubscriptions.mockResolvedValueOnce(29);
    repository.countActiveSubscriptionsAt.mockResolvedValueOnce(1000);
    repository.countCancelledSubscriptions.mockResolvedValueOnce(28);
    repository.countActiveSubscriptionsAt.mockResolvedValueOnce(1000);
    repository.countActiveRegisteredUsers.mockResolvedValueOnce(5120);
    repository.countActiveRegisteredUsers.mockResolvedValueOnce(5230);

    const result = await service.summary({ range: PlatformAnalyticsRange.LAST_30_DAYS });

    expect(result.data.totalRevenue).toEqual({ value: 154320, changePercent: 8.1 });
    expect(result.data.newSubscriptions).toEqual({ value: 215, changePercent: 5.39 });
    expect(result.data.churnRate).toEqual({ value: 2.9, changePercent: 3.57 });
    expect(result.data.activeUsers).toEqual({ value: 5120, changePercent: -2.1 });
  });

  it('summary and revenue transactions return zeros and empty arrays when no records exist', async () => {
    const { service, repository } = createService();
    repository.sumSuccessfulPayments.mockResolvedValue({ _sum: { amount: null } });
    repository.countNewSubscriptions.mockResolvedValue(0);
    repository.countCancelledSubscriptions.mockResolvedValue(0);
    repository.countActiveSubscriptionsAt.mockResolvedValue(0);
    repository.countActiveRegisteredUsers.mockResolvedValue(0);
    repository.findPayments.mockResolvedValue([]);

    const summary = await service.summary({ range: PlatformAnalyticsRange.LAST_30_DAYS });
    const transactions = await service.revenueTransactions({ page: 1, limit: 10 });

    expect(summary.data).toEqual({
      totalRevenue: { value: 0, changePercent: 0 },
      newSubscriptions: { value: 0, changePercent: 0 },
      churnRate: { value: 0, changePercent: 0 },
      activeUsers: { value: 0, changePercent: 0 },
    });
    expect(transactions.data).toEqual([]);
    expect(transactions.meta).toEqual({ page: 1, limit: 10, total: 0, totalPages: 0 });
  });

  it('revenue transactions paginate and map safe fields only', async () => {
    const { service, repository } = createService();
    repository.findPayments.mockResolvedValue([
      payment({ id: 'pay_1', email: 'alex.rivera@gmail.com', amount: 150, plan: 'Pro' }),
      payment({ id: 'pay_2', email: 'jane@example.com', amount: 99, plan: 'Free' }),
    ]);

    const result = await service.revenueTransactions({ page: 1, limit: 1 });

    expect(result.meta).toEqual({ page: 1, limit: 1, total: 2, totalPages: 2 });
    expect(result.data[0]).toEqual(expect.objectContaining({ id: 'TXN-pay_1', userEmail: 'alex.rivera@gmail.com', plan: 'Pro', amount: 150, status: PlatformAnalyticsTransactionStatus.COMPLETED, currency: 'PKR' }));
    expect(JSON.stringify(result.data[0])).not.toContain('card');
  });

  it('search works across email, transaction id, order number, gift name, and provider name', async () => {
    const { service, repository } = createService();
    repository.findPayments.mockResolvedValue([
      payment({ id: 'pay_1', email: 'alex.rivera@gmail.com', amount: 150, giftName: 'Rose Bouquet', providerName: 'Gift Provider', orderNumber: 'ORD-1' }),
      payment({ id: 'pay_2', email: 'jane@example.com', amount: 75, giftName: 'Chocolate Box', providerName: 'Snack Provider', orderNumber: 'ORD-2' }),
    ]);

    const result = await service.revenueTransactions({ search: 'Rose', page: 1, limit: 10 });

    expect(result.data).toHaveLength(1);
    expect(result.data[0].id).toBe('TXN-pay_1');
  });

  it('category and provider filters are pushed into the payment query', async () => {
    const { service, repository } = createService();
    repository.findPayments.mockResolvedValue([payment({ id: 'pay_1', email: 'alex.rivera@gmail.com', amount: 150 })]);

    await service.revenueTransactions({ categoryId: 'cat_1', providerId: 'provider_1' });

    expect(repository.findPayments).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        order: expect.objectContaining({ AND: expect.any(Array) as unknown[] }),
      }),
    }));
  });

  it('filter options come from active categories, approved providers, plans, and fixed statuses', async () => {
    const { service } = createService();
    const result = await service.filterOptions();

    expect(result.data).toEqual({
      categories: [{ id: 'cat_1', name: 'Flowers' }],
      providers: [{ id: 'provider_1', businessName: 'Gift Provider' }],
      plans: ['Pro', 'Enterprise'],
      statuses: ['COMPLETED', 'PENDING', 'FAILED', 'REFUNDED'],
    });
  });

  it('report endpoint streams CSV, audits generation, and excludes sensitive payment fields', async () => {
    const { service, repository, auditLog } = createService();
    repository.findPayments.mockResolvedValue([payment({ id: 'pay_1', email: 'alex.rivera@gmail.com', amount: 150, plan: 'Pro' })]);

    const file = await service.report({ uid: 'admin_1', role: UserRole.ADMIN }, { format: PlatformAnalyticsReportFormat.PDF, status: PlatformAnalyticsTransactionStatus.COMPLETED });

    expect(file.contentType).toBe('text/csv');
    expect(file.content).toContain('Transaction ID');
    expect(file.content).not.toMatch(/cardNumber|cvv|stripeSecret|client_secret|bankAccount/i);
    expect(auditLog.write).toHaveBeenCalledWith(expect.objectContaining({ action: 'PLATFORM_ANALYTICS_REPORT_GENERATED', targetType: 'PLATFORM_ANALYTICS_REPORT' }));
  });

  it('analytics.read and analytics.export permissions are enforced in controller metadata', () => {
    const controller = readFileSync(join(__dirname, '../admin-platform-analytics.controller.ts'), 'utf8');
    expect(controller.match(/@Permissions\('analytics\.read'\)/g)).toHaveLength(3);
    expect(controller).toContain("@Permissions('analytics.export')");
    expect(controller).toContain('@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)');
  });
});
