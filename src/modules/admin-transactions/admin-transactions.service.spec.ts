import { DisputePriority, DisputeReason, PaymentMethod, PaymentProvider, PaymentStatus, Prisma, ProviderOrderStatus, UserRole } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';
import { AdminTransactionsRepository } from './admin-transactions.repository';
import { AdminTransactionsService } from './admin-transactions.service';
import { AdminNotificationChannel, AdminRefundReason, AdminRefundType, AdminTransactionStatus, AdminTransactionType } from './dto/admin-transactions.dto';

const createdAt = new Date('2026-10-24T14:20:00.000Z');
const payment = {
  id: 'payment_1', userId: 'user_1', orderId: 'order_1', moneyGiftId: null, customerSubscriptionId: null, provider: PaymentProvider.STRIPE, providerPaymentIntentId: 'TRX-982341', amount: new Prisma.Decimal(1281.25), currency: 'PKR', status: PaymentStatus.SUCCEEDED, paymentMethod: PaymentMethod.STRIPE_CARD, failureReason: null, metadataJson: { cardBrand: 'Visa', cardLast4: '4242', clientSecret: 'should_not_leak', processorAuthCode: 'AUTH-9921-X' }, createdAt, updatedAt: createdAt,
  user: { id: 'user_1', firstName: 'Julianne', lastName: 'Doe', email: 'julianne.doe@example.com', avatarUrl: 'avatar.png', location: 'San Francisco, CA, USA' },
  order: { id: 'order_1', orderNumber: 'ORD-88421', subtotal: new Prisma.Decimal(1250), discountTotal: new Prisma.Decimal(0), deliveryFee: new Prisma.Decimal(0), tax: new Prisma.Decimal(31.25), currency: 'PKR', providerOrders: [{ id: 'provider_order_1', providerId: 'provider_1', status: ProviderOrderStatus.COMPLETED, fulfilledAt: createdAt, provider: { id: 'provider_1', providerBusinessName: 'Gift Shop' } }], items: [{ gift: { categoryId: 'category_electronics', name: 'Headphones' } }] },
  moneyGift: null, customerSubscription: null, recurringPaymentOccurrences: [], refundRequests: [],
};

function createService(overrides: Partial<{ refundRequests: unknown[]; disputes: unknown[]; categories: string[] }> = {}) {
  const providerOrder = { id: 'provider_order_1', providerId: 'provider_1', status: ProviderOrderStatus.COMPLETED, fulfilledAt: createdAt, items: [] };
  const prisma: {
    payment: { findMany: jest.Mock; findFirst: jest.Mock; update: jest.Mock };
    refundRequest: { findMany: jest.Mock; create: jest.Mock };
    disputeCase: { findMany: jest.Mock; findFirst: jest.Mock; create: jest.Mock };
    adminAuditLog: { findMany: jest.Mock };
    providerOrder: { findFirst: jest.Mock };
    orderItem: { findMany: jest.Mock };
    order: { update: jest.Mock };
    providerOrderTimeline: { create: jest.Mock };
    notification: { create: jest.Mock };
    disputeTimeline: { create: jest.Mock };
    $transaction: jest.Mock;
  } = {
    payment: { findMany: jest.fn().mockResolvedValue([payment]), findFirst: jest.fn().mockResolvedValue(payment), update: jest.fn().mockResolvedValue({ ...payment, status: PaymentStatus.REFUNDED }) },
    refundRequest: { findMany: jest.fn().mockResolvedValue(overrides.refundRequests ?? []), create: jest.fn().mockResolvedValue({ id: 'refund_1' }) },
    disputeCase: { findMany: jest.fn().mockResolvedValue([]), findFirst: jest.fn().mockResolvedValue((overrides.disputes ?? [])[0] ?? null), create: jest.fn().mockResolvedValue({ id: 'dispute_1', caseId: 'DSP-1024', status: 'OPEN' }) },
    adminAuditLog: { findMany: jest.fn().mockResolvedValue([]) },
    providerOrder: { findFirst: jest.fn().mockResolvedValue(providerOrder) },
    orderItem: { findMany: jest.fn().mockResolvedValue((overrides.categories ?? ['category_electronics']).map((categoryId) => ({ gift: { categoryId } }))) },
    order: { update: jest.fn().mockResolvedValue({}) },
    providerOrderTimeline: { create: jest.fn().mockResolvedValue({}) },
    notification: { create: jest.fn().mockResolvedValue({}) },
    disputeTimeline: { create: jest.fn().mockResolvedValue({}) },
    $transaction: jest.fn(async (input: unknown): Promise<unknown> => typeof input === 'function' ? (input as (tx: typeof prisma) => Promise<unknown>)(prisma) : Promise.all(input as Promise<unknown>[])),
  };
  const auditLog = { write: jest.fn().mockResolvedValue(undefined) };
  const refundPolicy = { getActivePolicy: jest.fn().mockResolvedValue({ refundWindowDays: 30 }), evaluateRefundEligibility: jest.fn().mockResolvedValue({ eligible: true, manualReviewRequired: false, reasons: [], policy: { refundWindowDays: 30 } }) };
  const adminTransactionsRepository = new AdminTransactionsRepository(prisma as never);
  const service = new AdminTransactionsService(adminTransactionsRepository, auditLog as never, refundPolicy as never);
  return { service, prisma, auditLog, refundPolicy, adminTransactionsRepository };
}

describe('AdminTransactionsService', () => {
  it('admin with transactions.read can list transactions and filters work by type/status/date', async () => {
    const { service, prisma } = createService();
    const response = await service.list({ transactionType: AdminTransactionType.PAYMENT, status: AdminTransactionStatus.SUCCESS, fromDate: '2026-10-01T00:00:00.000Z', toDate: '2026-10-31T23:59:59.999Z' });
    expect(response.data).toHaveLength(1);
    expect(response.data[0]).toMatchObject({ transactionId: 'TRX-982341', type: 'PAYMENT', status: 'SUCCESS' });
    expect(prisma.payment.findMany).toHaveBeenCalled();
  });

  it('transaction details masks card data and excludes payment secrets', async () => {
    const { service } = createService();
    const response = await service.details('payment_1');
    expect(response.data.gatewayInformation.paymentMethod).toBe('Visa **** 4242');
    expect(JSON.stringify(response.data)).not.toContain('should_not_leak');
    expect(response.data.refund.remainingRefundableAmount).toBe(1281.25);
  });

  it('transaction timeline returns ordered events', async () => {
    const { service } = createService({ refundRequests: [{ id: 'refund_1', status: 'REFUNDED', transactionId: 'RF-0001', createdAt: new Date('2026-10-25T00:00:00.000Z') }] });
    const response = await service.timeline('payment_1');
    expect(response.data[0].status).toBe('INITIATED');
    expect(response.data.map((item) => item.timestamp.getTime())).toEqual([...response.data.map((item) => item.timestamp.getTime())].sort((a, b) => a - b));
  });

  it('refund rejects amount above refundable amount', async () => {
    const { service } = createService();
    await expect(service.refund({ uid: 'admin_1', role: UserRole.SUPER_ADMIN }, 'payment_1', { refundType: AdminRefundType.PARTIAL, refundAmount: 2000, reason: AdminRefundReason.CUSTOMER_REQUEST, notifyUser: true })).rejects.toThrow('Refund amount cannot exceed remaining refundable amount');
  });

  it('refund creates refund transaction record and updates original transaction status', async () => {
    const { service, prisma, auditLog } = createService();
    const response = await service.refund({ uid: 'admin_1', role: UserRole.SUPER_ADMIN }, 'payment_1', { refundType: AdminRefundType.FULL, refundAmount: 1281.25, reason: AdminRefundReason.CUSTOMER_REQUEST, notifyUser: true });
    expect(response.data.status).toBe('REFUNDED');
    expect(prisma.refundRequest.create).toHaveBeenCalled();
    expect(prisma.payment.update).toHaveBeenCalled();
    expect(auditLog.write).toHaveBeenCalledWith(expect.objectContaining({ action: 'TRANSACTION_REFUNDED_BY_ADMIN' }));
  });

  it('open dispute creates linked dispute case and blocks duplicate open dispute', async () => {
    const { service, prisma, auditLog } = createService();
    const response = await service.openDispute({ uid: 'admin_1', role: UserRole.SUPER_ADMIN }, 'payment_1', { reason: DisputeReason.PRODUCT_NOT_RECEIVED, priority: DisputePriority.HIGH, claimDetails: 'Missing gift.' });
    expect(response.data.caseId).toBe('DSP-1024');
    expect(prisma.disputeCase.create).toHaveBeenCalled();
    expect(auditLog.write).toHaveBeenCalledWith(expect.objectContaining({ action: 'TRANSACTION_DISPUTE_OPENED' }));

    const duplicate = createService({ disputes: [{ id: 'dispute_existing' }] });
    await expect(duplicate.service.openDispute({ uid: 'admin_1', role: UserRole.SUPER_ADMIN }, 'payment_1', { reason: DisputeReason.PRODUCT_NOT_RECEIVED, priority: DisputePriority.HIGH, claimDetails: 'Missing gift.' })).rejects.toThrow('An open dispute already exists');
  });

  it('receipt download, notification, and export create safe audit logs', async () => {
    const { service, auditLog, prisma } = createService();
    const user = { uid: 'admin_1', role: UserRole.SUPER_ADMIN };
    const receipt = await service.receipt(user, 'payment_1');
    expect(receipt.content).toContain('Visa **** 4242');
    expect(receipt.content).not.toContain('clientSecret');
    await service.notifyUser(user, 'payment_1', { channel: AdminNotificationChannel.IN_APP, subject: 'Transaction update', message: 'Processed.', includeReceipt: true });
    expect(prisma.notification.create).toHaveBeenCalled();
    const exported = await service.export(user, { status: AdminTransactionStatus.SUCCESS });
    expect(exported.content).toContain('TRX-982341');
    expect(exported.content).not.toContain('4242');
    expect(auditLog.write).toHaveBeenCalledWith(expect.objectContaining({ action: 'TRANSACTION_EXPORT_GENERATED' }));
  });
});

describe('Admin transaction monitoring source safety', () => {
  const controller = readFileSync(join(__dirname, 'admin-transactions.controller.ts'), 'utf8');
  const service = readFileSync(join(__dirname, 'admin-transactions.service.ts'), 'utf8');
  const dto = readFileSync(join(__dirname, 'dto/admin-transactions.dto.ts'), 'utf8');
  const permissions = readFileSync(join(__dirname, '../auth/permission-catalog.ts'), 'utf8');
  const main = readFileSync(join(__dirname, '../../main.ts'), 'utf8');
  const swaggerAccess = readFileSync(join(__dirname, '../../swagger-access.ts'), 'utf8');

  it('admin without transactions.read cannot list transactions because controller requires permission', () => {
    expect(controller).toContain("@Permissions('transactions.read')");
    expect(controller).toContain("@Controller('admin/transactions')");
    expect(controller.indexOf("@Get('stats')")).toBeLessThan(controller.indexOf('@Get()'));
    expect(controller.indexOf("@Get('export')")).toBeLessThan(controller.indexOf("@Get(':id')"));
  });

  it('adds all required permissions and access metadata', () => {
    for (const permission of ['read', 'export', 'refund', 'openDispute', 'notifyUser', 'receipt.download']) expect(permissions).toContain(`key: '${permission}'`);
    expect(swaggerAccess).toContain('GET /api/v1/admin/transactions/stats');
    expect(swaggerAccess).toContain('POST /api/v1/admin/transactions/{id}/refund');
  });

  it('documents Swagger tag, masking, server-side refund validation, and export secret exclusion', () => {
    expect(main).toContain("'02 Admin - Transaction Monitoring'");
    expect(controller).toContain("@ApiTags('02 Admin - Transaction Monitoring')");
    expect(controller).toContain('Refund amount is server-validated');
    expect(controller).toContain('Raw card numbers, CVV, Stripe secret keys, and payment intent client secrets are never exposed');
    expect(service).toContain('safeExportFilters');
    expect(service).toContain('AdminTransactionsRepository');
    expect(dto).toContain('AdminTransactionType');
  });
});
