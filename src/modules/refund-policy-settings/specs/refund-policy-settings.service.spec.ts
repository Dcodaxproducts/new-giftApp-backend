import { ConfigService } from '@nestjs/config';
import { Prisma, UserRole } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { readFileSync } from 'fs';
import { join } from 'path';
import { UpdateRefundPolicySettingsDto } from '../dto/refund-policy-settings.dto';
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
  cancellationTiersJson: [{ id: 'tier_1', daysBeforeCheckIn: 5, deductionPercent: 10, label: 'Early', createdAt: '2026-05-14T10:00:00.000Z' }],
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
  it('GET returns simplified settings response with newest tiers first and updater', async () => {
    const { service } = createService();
    const response = await service.get();
    expect(response.data.allowRefund).toBe(true);
    expect(response.data.noteText).toBe('Refunds are processed according to cancellation policy.');
    expect(response.data.refundWindowDays).toBe(30);
    expect(response.data.autoRefundThresholdAmount).toBe(50);
    expect(response.data).not.toHaveProperty('refundForAllCategories');
    expect(response.data).not.toHaveProperty('eligibleCategories');
    expect(response.data).not.toHaveProperty('autoApproveSmallRefunds');
    expect(response.data).not.toHaveProperty('smallRefundAutoApproveAmount');
    expect(response.data.cancellationTiers).toEqual([{ id: 'tier_1', daysBeforeCheckIn: 5, deductionPercent: 10, label: 'Early' }]);
    expect(response.data.lastUpdatedBy).toEqual({ id: 'admin_1', name: 'Alex Rivera' });
  });

  it('PATCH updates allowRefund, noteText, window, threshold, tiers and creates audit log', async () => {
    const { service, prisma, auditLog } = createService();
    await service.update({ uid: 'super_1', role: UserRole.SUPER_ADMIN }, { allowRefund: true, noteText: 'Updated policy', refundWindowDays: 45, autoRefundThresholdAmount: 60, cancellationTiers: [{ daysBeforeCheckIn: 5, deductionPercent: 10, label: 'Early' }, { daysBeforeCheckIn: 2, deductionPercent: 25, label: 'Late' }] });
    const updateArgs = prisma.refundPolicySettings.update.mock.calls[0][0] as unknown as { data: { allowRefund: boolean; noteText: string; refundWindowDays: number; autoRefundThresholdAmount: Prisma.Decimal; cancellationTiersJson: Array<{ daysBeforeCheckIn: number; deductionPercent: number; label: string; createdAt: string }> } };
    expect(updateArgs.data).toMatchObject({ allowRefund: true, noteText: 'Updated policy', refundWindowDays: 45 });
    expect(Number(updateArgs.data.autoRefundThresholdAmount)).toBe(60);
    expect(updateArgs.data).not.toHaveProperty('refundForAllCategories');
    expect(updateArgs.data).not.toHaveProperty('eligibleCategoryIdsJson');
    expect(updateArgs.data).not.toHaveProperty('autoApproveSmallRefunds');
    expect(updateArgs.data).not.toHaveProperty('smallRefundAutoApproveAmount');
    expect(updateArgs.data.cancellationTiersJson[0]).toMatchObject({ daysBeforeCheckIn: 5, deductionPercent: 10, label: 'Early' });
    expect(updateArgs.data.cancellationTiersJson[0]).toHaveProperty('createdAt');
    expect(auditLog.write).toHaveBeenCalledTimes(1);
    const auditCalls = auditLog.write.mock.calls as unknown as Array<[unknown]>;
    const auditArgs = auditCalls[0][0] as { beforeJson: Record<string, unknown>; afterJson: Record<string, unknown> };
    expect(auditArgs.beforeJson).toMatchObject({ allowRefund: true, noteText: 'Refunds are processed according to cancellation policy.', refundWindowDays: 30, autoRefundThresholdAmount: 50, cancellationTiers: [{ id: 'tier_1', daysBeforeCheckIn: 5, deductionPercent: 10, label: 'Early' }] });
    expect(auditArgs.afterJson).toMatchObject({ allowRefund: true, noteText: 'Updated policy', refundWindowDays: 45, autoRefundThresholdAmount: 60, cancellationTiers: [{ daysBeforeCheckIn: 2, deductionPercent: 25, label: 'Late' }, { daysBeforeCheckIn: 5, deductionPercent: 10, label: 'Early' }] });
  });

  it('rejects invalid refundWindowDays through DTO metadata and service threshold rules', () => {
    const dto = readFileSync(join(__dirname, '../dto/refund-policy-settings.dto.ts'), 'utf8');
    expect(dto).toContain('@Min(1) @Max(365) refundWindowDays');
    expect(dto).toContain('@MaxLength(1000) noteText');
  });

  it('validates cancellation tier percent and duplicate days', async () => {
    const dto = readFileSync(join(__dirname, '../dto/refund-policy-settings.dto.ts'), 'utf8');
    expect(dto).toContain('@Min(0) @Max(100) deductionPercent');
    const validationDto = plainToInstance(UpdateRefundPolicySettingsDto, { cancellationTiers: [{ daysBeforeCheckIn: 1, deductionPercent: 101, label: 'Too high' }] });
    expect(validateSync(validationDto).length).toBeGreaterThan(0);
    const { service } = createService();
    await expect(service.update({ uid: 'super_1', role: UserRole.SUPER_ADMIN }, { cancellationTiers: [{ daysBeforeCheckIn: 5, deductionPercent: 10, label: 'Early' }, { daysBeforeCheckIn: 5, deductionPercent: 25, label: 'Duplicate' }] })).rejects.toThrow('Duplicate cancellation tier daysBeforeCheckIn values are not allowed');
  });

  it('refund eligibility uses refundWindowDays and all categories when refunds are allowed', () => {
    const { service } = createService();
    const expired = service.evaluateWithPolicy(settings, { deliveredAt: new Date('2026-04-01T10:00:00.000Z'), categoryIds: ['category_electronics'], requestedAmount: 10, remainingRefundableAmount: 20, paymentRefundable: true, now });
    expect(expired.eligible).toBe(false);
    expect(expired.reasons).toContain('REFUND_WINDOW_EXPIRED');
    const otherCategory = service.evaluateWithPolicy(settings, { deliveredAt: new Date('2026-05-10T10:00:00.000Z'), categoryIds: ['category_home_decor'], requestedAmount: 10, remainingRefundableAmount: 20, paymentRefundable: true, now });
    expect(otherCategory.eligible).toBe(true);
    expect(otherCategory.reasons).not.toContain('CATEGORY_MANUAL_REVIEW_REQUIRED');
  });

  it('allowRefund=false makes refund eligibility return disabled reason', () => {
    const { service } = createService();
    const result = service.evaluateWithPolicy({ ...settings, allowRefund: false }, { deliveredAt: new Date('2026-05-10T10:00:00.000Z'), categoryIds: ['category_electronics'], requestedAmount: 10, remainingRefundableAmount: 20, paymentRefundable: true, now });
    expect(result.eligible).toBe(false);
    expect(result.manualReviewRequired).toBe(false);
    expect(result.reasons).toContain('REFUNDS_DISABLED_BY_POLICY');
  });

  it('threshold review uses policy settings without small-refund auto approval', () => {
    const { service } = createService();
    const withinThreshold = service.evaluateWithPolicy(settings, { deliveredAt: new Date('2026-05-10T10:00:00.000Z'), categoryIds: ['category_electronics'], requestedAmount: 15, remainingRefundableAmount: 20, paymentRefundable: true, now });
    expect(withinThreshold).not.toHaveProperty('autoApproveSmallRefund');
    expect(withinThreshold.canProcessWithoutSeniorReview).toBe(true);
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
    expect(schema).toContain('cancellationTiersJson');
    expect(schema).not.toContain('refundForAllCategories');
    expect(schema).not.toContain('eligibleCategoryIdsJson');
    expect(schema).not.toContain('autoApproveSmallRefunds');
    expect(schema).not.toContain('smallRefundAutoApproveAmount');
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
    expect(controller).toContain('enableRefunds');
    expect(controller).toContain('disableRefunds');
    expect(controller).toContain('updateCancellationTiers');
    expect(controller).not.toContain("currency: 'PKR'");
  });

  it('removes category and small-refund fields from Swagger examples', () => {
    expect(controller).not.toContain('refundForAllCategories');
    expect(controller).not.toContain('eligibleCategoryIds');
    expect(controller).not.toContain('eligibleCategories');
    expect(controller).not.toContain('autoApproveSmallRefunds');
    expect(controller).not.toContain('smallRefundAutoApproveAmount');
    expect(controller).not.toContain('sortOrder');
  });
});
