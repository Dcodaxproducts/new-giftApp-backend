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
  allowRefund: true,
  noteText: 'Refunds are processed according to cancellation policy.',
  refundWindowDays: 30,
  autoRefundThresholdAmount: new Prisma.Decimal(50),
  currency: 'PKR',
  autoApproveSmallRefunds: true,
  smallRefundAutoApproveAmount: new Prisma.Decimal(15),
  refundForAllCategories: false,
  eligibleCategoryIdsJson: ['category_electronics'],
  cancellationTiersJson: [{ id: 'tier_1', daysBeforeCheckIn: 5, deductionPercent: 10, label: 'Early', sortOrder: 1 }],
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
      update: jest.fn((args: { data: Record<string, unknown> }) => Promise.resolve({ ...settings, ...args.data, updatedAt: now })),
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
    expect(response.data.allowRefund).toBe(true);
    expect(response.data.noteText).toBe('Refunds are processed according to cancellation policy.');
    expect(response.data.refundWindowDays).toBe(30);
    expect(response.data.refundForAllCategories).toBe(false);
    expect(response.data.eligibleCategories).toEqual([{ id: 'category_electronics', name: 'Electronics', isActive: true }, { id: 'category_apparel', name: 'Apparel', isActive: true }]);
    expect(response.data.cancellationTiers).toEqual([{ id: 'tier_1', daysBeforeCheckIn: 5, deductionPercent: 10, label: 'Early', sortOrder: 1 }]);
    expect(response.data.lastUpdatedBy).toEqual({ id: 'admin_1', name: 'Alex Rivera' });
  });

  it('updates selected category settings, validates categories, and creates audit log', async () => {
    const { service, prisma, auditLog } = createService();
    await service.update({ uid: 'super_1', role: UserRole.SUPER_ADMIN }, { allowRefund: true, noteText: 'Updated policy', refundWindowDays: 45, autoRefundThresholdAmount: 50, autoApproveSmallRefunds: true, smallRefundAutoApproveAmount: 15, refundForAllCategories: false, eligibleCategoryIds: ['category_electronics', 'category_apparel'], cancellationTiers: [{ daysBeforeCheckIn: 5, deductionPercent: 10, label: 'Early', sortOrder: 1 }] });
    expect(prisma.giftCategory.findMany).toHaveBeenCalledWith({ where: { id: { in: ['category_electronics', 'category_apparel'] }, deletedAt: null }, select: { id: true, isActive: true } });
    const updateArgs = prisma.refundPolicySettings.update.mock.calls[0][0] as unknown as { data: { allowRefund: boolean; noteText: string; refundForAllCategories: boolean; eligibleCategoryIdsJson: string[]; cancellationTiersJson: Array<{ daysBeforeCheckIn: number; deductionPercent: number; label: string; sortOrder: number }> } };
    expect(updateArgs.data).toMatchObject({ allowRefund: true, noteText: 'Updated policy', refundForAllCategories: false, eligibleCategoryIdsJson: ['category_electronics', 'category_apparel'] });
    expect(updateArgs.data.cancellationTiersJson[0]).toMatchObject({ daysBeforeCheckIn: 5, deductionPercent: 10, label: 'Early', sortOrder: 1 });
    expect(auditLog.write).toHaveBeenCalledTimes(1);
    const auditCalls = auditLog.write.mock.calls as unknown as Array<[unknown]>;
    const auditArgs = auditCalls[0][0] as { beforeJson: Record<string, unknown>; afterJson: Record<string, unknown> };
    expect(auditArgs.beforeJson).toMatchObject({ allowRefund: true, noteText: 'Refunds are processed according to cancellation policy.', refundForAllCategories: false, eligibleCategoryIds: ['category_electronics'], cancellationTiers: [{ id: 'tier_1', daysBeforeCheckIn: 5, deductionPercent: 10, label: 'Early', sortOrder: 1 }] });
    expect(auditArgs.afterJson).toMatchObject({ allowRefund: true, noteText: 'Updated policy', refundForAllCategories: false, eligibleCategoryIds: ['category_electronics', 'category_apparel'] });
  });

  it('updates refundForAllCategories without eligibleCategoryIds', async () => {
    const { service, prisma } = createService();
    await service.update({ uid: 'super_1', role: UserRole.SUPER_ADMIN }, { allowRefund: true, refundForAllCategories: true, eligibleCategoryIds: [] });
    const updateArgs = prisma.refundPolicySettings.update.mock.calls[0][0] as unknown as { data: { refundForAllCategories: boolean; eligibleCategoryIdsJson: string[] } };
    expect(updateArgs.data).toMatchObject({ refundForAllCategories: true, eligibleCategoryIdsJson: [] });
  });

  it('requires eligibleCategoryIds when refundForAllCategories is false', async () => {
    const { service } = createService();
    await expect(service.update({ uid: 'super_1', role: UserRole.SUPER_ADMIN }, { refundForAllCategories: false, eligibleCategoryIds: [] })).rejects.toThrow('eligibleCategoryIds is required when refundForAllCategories is false');
  });

  it('rejects invalid refundWindowDays through DTO metadata and service threshold rules', () => {
    const dto = readFileSync(join(__dirname, '../dto/refund-policy-settings.dto.ts'), 'utf8');
    expect(dto).toContain('@Min(1) @Max(365) refundWindowDays');
    expect(dto).toContain('@MaxLength(1000) noteText');
  });

  it('validates autoRefundThresholdAmount and small refund threshold relationship', async () => {
    const { service } = createService();
    await expect(service.update({ uid: 'super_1', role: UserRole.SUPER_ADMIN }, { refundWindowDays: 30, autoRefundThresholdAmount: 10, autoApproveSmallRefunds: true, smallRefundAutoApproveAmount: 15, eligibleCategoryIds: ['category_electronics'] })).rejects.toBeInstanceOf(BadRequestException);
    const dto = readFileSync(join(__dirname, '../dto/refund-policy-settings.dto.ts'), 'utf8');
    expect(dto).toContain('@Min(0) autoRefundThresholdAmount');
    expect(dto).toContain('@Min(0) smallRefundAutoApproveAmount');
  });

  it('rejects missing and inactive eligible category IDs', async () => {
    const { service, prisma } = createService();
    prisma.giftCategory.findMany.mockResolvedValueOnce([{ id: 'category_inactive', isActive: false }]);
    await expect(service.update({ uid: 'super_1', role: UserRole.SUPER_ADMIN }, { refundWindowDays: 30, autoRefundThresholdAmount: 50, autoApproveSmallRefunds: true, smallRefundAutoApproveAmount: 15, eligibleCategoryIds: ['category_inactive'] })).rejects.toThrow('Inactive gift categories cannot be selected');
    prisma.giftCategory.findMany.mockResolvedValueOnce([]);
    await expect(service.update({ uid: 'super_1', role: UserRole.SUPER_ADMIN }, { refundWindowDays: 30, autoRefundThresholdAmount: 50, autoApproveSmallRefunds: true, smallRefundAutoApproveAmount: 15, eligibleCategoryIds: ['missing_category'] })).rejects.toThrow('Eligible category IDs do not exist');
  });

  it('validates cancellation tier percent and duplicate days', async () => {
    const dto = readFileSync(join(__dirname, '../dto/refund-policy-settings.dto.ts'), 'utf8');
    expect(dto).toContain('@Min(0) @Max(100) deductionPercent');
    const { service } = createService();
    await expect(service.update({ uid: 'super_1', role: UserRole.SUPER_ADMIN }, { eligibleCategoryIds: ['category_electronics'], cancellationTiers: [{ daysBeforeCheckIn: 5, deductionPercent: 10, label: 'Early' }, { daysBeforeCheckIn: 5, deductionPercent: 25, label: 'Duplicate' }] })).rejects.toThrow('Duplicate cancellation tier daysBeforeCheckIn values are not allowed');
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

  it('allowRefund=false makes refund eligibility return disabled reason', () => {
    const { service } = createService();
    const result = service.evaluateWithPolicy({ ...settings, allowRefund: false }, { deliveredAt: new Date('2026-05-10T10:00:00.000Z'), categoryIds: ['category_electronics'], requestedAmount: 10, remainingRefundableAmount: 20, paymentRefundable: true, now });
    expect(result.eligible).toBe(false);
    expect(result.manualReviewRequired).toBe(false);
    expect(result.reasons).toContain('REFUNDS_DISABLED_BY_POLICY');
  });

  it('refundForAllCategories=true treats all categories as refund eligible', () => {
    const { service } = createService();
    const result = service.evaluateWithPolicy({ ...settings, refundForAllCategories: true, eligibleCategoryIdsJson: [] }, { deliveredAt: new Date('2026-05-10T10:00:00.000Z'), categoryIds: ['category_home_decor'], requestedAmount: 10, remainingRefundableAmount: 20, paymentRefundable: true, now });
    expect(result.eligible).toBe(true);
    expect(result.reasons).not.toContain('CATEGORY_MANUAL_REVIEW_REQUIRED');
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
    expect(schema).toContain('allowRefund');
    expect(schema).toContain('noteText');
    expect(schema).toContain('refundForAllCategories');
    expect(schema).toContain('cancellationTiersJson');
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
    expect(controller).toContain('Updates global refund policy settings used by customer refund request eligibility, provider refund handling, cancellation deduction tiers, and admin/provider dispute workflows.');
    expect(controller).toContain('allowRefundForAllCategories');
    expect(controller).toContain('allowRefundForSelectedCategories');
    expect(controller).toContain('disableRefunds');
    expect(controller).toContain('updateCancellationTiers');
    expect(controller).not.toContain("currency: 'PKR'");
  });
});
