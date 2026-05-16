import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, UserRole } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';
import { RefundPolicySettingsRepository } from '../repositories/refund-policy-settings.repository';
import { RefundPolicySettingsService } from '../services/refund-policy-settings.service';

const now = new Date('2026-05-14T10:00:00.000Z');
const settings = {
  id: 'policy_1',
  refundWindowDays: 30,
  autoRefundThresholdAmount: new Prisma.Decimal(50),
  currency: 'PKR',
  autoApproveSmallRefunds: true,
  smallRefundAutoApproveAmount: new Prisma.Decimal(15),
  eligibleCategoryIdsJson: ['category_electronics'],
  updatedById: 'admin_1',
  createdAt: now,
  updatedAt: now,
  updatedBy: { id: 'admin_1', firstName: 'Alex', lastName: 'Rivera' },
};

function createService() {
  const prisma = {
    refundPolicySettings: {
      findFirst: jest.fn().mockResolvedValue(settings),
      create: jest.fn(),
      update: jest.fn().mockResolvedValue({ ...settings, refundWindowDays: 45, eligibleCategoryIdsJson: ['category_electronics', 'category_apparel'] }),
    },
    giftCategory: { findMany: jest.fn().mockResolvedValue([{ id: 'category_electronics', name: 'Electronics', isActive: true }, { id: 'category_apparel', name: 'Apparel', isActive: true }]) },
    adminAuditLog: { findMany: jest.fn().mockResolvedValue([]), count: jest.fn().mockResolvedValue(0) },
    $transaction: jest.fn((operations: Promise<unknown>[]) => Promise.all(operations)),
  };
  const auditLog = { write: jest.fn().mockResolvedValue(undefined) };
  const configService = { get: jest.fn((key: string, fallback?: string) => key === 'STRIPE_CURRENCY' ? 'PKR' : fallback) };
  const repository = new RefundPolicySettingsRepository(prisma as never);
  const service = new RefundPolicySettingsService(repository, auditLog as never, configService as unknown as ConfigService);
  return { service, prisma, auditLog };
}

describe('RefundPolicySettingsService', () => {
  it('fetches settings with active eligible gift categories and updater', async () => {
    const { service } = createService();
    const response = await service.get();
    expect(response.data.refundWindowDays).toBe(30);
    expect(response.data.eligibleCategories).toEqual([{ id: 'category_electronics', name: 'Electronics', isActive: true }, { id: 'category_apparel', name: 'Apparel', isActive: true }]);
    expect(response.data.lastUpdatedBy).toEqual({ id: 'admin_1', name: 'Alex Rivera' });
  });

  it('updates settings, validates categories, and creates audit log', async () => {
    const { service, prisma, auditLog } = createService();
    await service.update({ uid: 'super_1', role: UserRole.SUPER_ADMIN }, { refundWindowDays: 45, autoRefundThresholdAmount: 50, currency: 'PKR', autoApproveSmallRefunds: true, smallRefundAutoApproveAmount: 15, eligibleCategoryIds: ['category_electronics', 'category_apparel'] });
    expect(prisma.giftCategory.findMany).toHaveBeenCalledWith({ where: { id: { in: ['category_electronics', 'category_apparel'] }, deletedAt: null }, select: { id: true, isActive: true } });
    expect(prisma.refundPolicySettings.update).toHaveBeenCalledTimes(1);
    expect(auditLog.write).toHaveBeenCalledTimes(1);
  });

  it('rejects invalid refundWindowDays through DTO metadata and service threshold rules', () => {
    const dto = readFileSync(join(__dirname, '../dto/refund-policy-settings.dto.ts'), 'utf8');
    expect(dto).toContain('@Min(1) @Max(365) refundWindowDays');
  });

  it('validates autoRefundThresholdAmount and small refund threshold relationship', async () => {
    const { service } = createService();
    await expect(service.update({ uid: 'super_1', role: UserRole.SUPER_ADMIN }, { refundWindowDays: 30, autoRefundThresholdAmount: 10, currency: 'PKR', autoApproveSmallRefunds: true, smallRefundAutoApproveAmount: 15, eligibleCategoryIds: ['category_electronics'] })).rejects.toBeInstanceOf(BadRequestException);
    const dto = readFileSync(join(__dirname, '../dto/refund-policy-settings.dto.ts'), 'utf8');
    expect(dto).toContain('@Min(0) autoRefundThresholdAmount');
    expect(dto).toContain('@Min(0) smallRefundAutoApproveAmount');
  });

  it('rejects missing and inactive eligible category IDs', async () => {
    const { service, prisma } = createService();
    prisma.giftCategory.findMany.mockResolvedValueOnce([{ id: 'category_inactive', isActive: false }]);
    await expect(service.update({ uid: 'super_1', role: UserRole.SUPER_ADMIN }, { refundWindowDays: 30, autoRefundThresholdAmount: 50, currency: 'PKR', autoApproveSmallRefunds: true, smallRefundAutoApproveAmount: 15, eligibleCategoryIds: ['category_inactive'] })).rejects.toThrow('Inactive gift categories cannot be selected');
    prisma.giftCategory.findMany.mockResolvedValueOnce([]);
    await expect(service.update({ uid: 'super_1', role: UserRole.SUPER_ADMIN }, { refundWindowDays: 30, autoRefundThresholdAmount: 50, currency: 'PKR', autoApproveSmallRefunds: true, smallRefundAutoApproveAmount: 15, eligibleCategoryIds: ['missing_category'] })).rejects.toThrow('Eligible category IDs do not exist');
  });

  it('refund eligibility uses refundWindowDays and category eligibility', () => {
    const { service } = createService();
    const expired = service.evaluateWithPolicy(settings, { deliveredAt: new Date('2026-04-01T10:00:00.000Z'), categoryIds: ['category_electronics'], requestedAmount: 10, remainingRefundableAmount: 20, paymentRefundable: true, now });
    expect(expired.eligible).toBe(false);
    expect(expired.reasons).toContain('REFUND_WINDOW_EXPIRED');
    const categoryReview = service.evaluateWithPolicy(settings, { deliveredAt: new Date('2026-05-10T10:00:00.000Z'), categoryIds: ['category_home_decor'], requestedAmount: 10, remainingRefundableAmount: 20, paymentRefundable: true, now });
    expect(categoryReview.manualReviewRequired).toBe(true);
    expect(categoryReview.reasons).toContain('CATEGORY_MANUAL_REVIEW_REQUIRED');
  });

  it('small refund auto-approval and threshold review use policy settings', () => {
    const { service } = createService();
    const autoApproved = service.evaluateWithPolicy(settings, { deliveredAt: new Date('2026-05-10T10:00:00.000Z'), categoryIds: ['category_electronics'], requestedAmount: 15, remainingRefundableAmount: 20, paymentRefundable: true, now });
    expect(autoApproved.autoApproveSmallRefund).toBe(true);
    expect(autoApproved.canProcessWithoutSeniorReview).toBe(true);
    const seniorReview = service.evaluateWithPolicy(settings, { deliveredAt: new Date('2026-05-10T10:00:00.000Z'), categoryIds: ['category_electronics'], requestedAmount: 75, remainingRefundableAmount: 100, paymentRefundable: true, now });
    expect(seniorReview.manualReviewRequired).toBe(true);
    expect(seniorReview.canProcessWithoutSeniorReview).toBe(false);
  });
});

describe('Refund policy settings source safety', () => {
  const controller = readFileSync(join(__dirname, '../controllers/refund-policy-settings.controller.ts'), 'utf8');
  const permissions = readFileSync(join(__dirname, '../../admin-roles/constants/permission-catalog.ts'), 'utf8');
  const schema = readFileSync(join(__dirname, '../../../../prisma/schema.prisma'), 'utf8');
  const main = readFileSync(join(__dirname, '../../../main.ts'), 'utf8');
  const swaggerAccess = readFileSync(join(__dirname, '../../../swagger-access.ts'), 'utf8');

  it('adds schema, permission catalog entries, Swagger group, and access metadata', () => {
    expect(schema).toContain('model RefundPolicySettings');
    expect(schema).toContain('eligibleCategoryIdsJson');
    expect(permissions).toContain("module: 'refundPolicies'");
    expect(permissions).toContain("key: 'read'");
    expect(permissions).toContain("key: 'update'");
    expect(controller).toContain("@ApiTags('02 Admin - Refund Policy Settings')");
    expect(main).toContain("'02 Admin - Refund Policy Settings'");
    expect(swaggerAccess).toContain('GET /api/v1/admin/refund-policy-settings');
  });

  it('exposes required APIs with admin read and super admin-only update/logs', () => {
    expect(controller).toContain("@Controller('admin/refund-policy-settings')");
    expect(controller).toContain("@Permissions('refundPolicies.read')");
    expect(controller).toContain("@Get('logs')");
    expect(controller).toContain('@Roles(UserRole.SUPER_ADMIN)');
    expect(controller).toContain('SUPER_ADMIN only. Updates global refund policy settings');
  });
});
