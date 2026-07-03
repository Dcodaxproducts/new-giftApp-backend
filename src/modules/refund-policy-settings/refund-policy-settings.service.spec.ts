import { ConfigService } from '@nestjs/config';
import { Prisma, UserRole } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { readFileSync } from 'fs';
import { join } from 'path';
import { UpdateRefundPolicySettingsDto } from './dto/refund-policy-settings.dto';
import { RefundPolicySettingsRepository } from './refund-policy-settings.repository';
import { RefundPolicySettingsService } from './refund-policy-settings.service';

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
  };
  const auditLog = { write: jest.fn().mockResolvedValue(undefined) };
  const configService = { get: jest.fn((key: string, fallback?: string) => key === 'STRIPE_CURRENCY' ? 'PKR' : fallback) };
  const repository = new RefundPolicySettingsRepository(prisma as never);
  const service = new RefundPolicySettingsService(repository, auditLog as never, configService as unknown as ConfigService);
  return { service, prisma, auditLog };
}

describe('RefundPolicySettingsService', () => {
  it('GET returns simplified settings response with tiers in stored order', async () => {
    const { service } = createService();
    const response = await service.get();
    expect(response.data.allowRefund).toBe(true);
    expect(response.data).not.toHaveProperty('noteText');
    expect(response.data).not.toHaveProperty('refundWindowDays');
    expect(response.data).not.toHaveProperty('autoRefundThresholdAmount');
    expect(response.data).not.toHaveProperty('refundForAllCategories');
    expect(response.data).not.toHaveProperty('eligibleCategories');
    expect(response.data).not.toHaveProperty('autoApproveSmallRefunds');
    expect(response.data).not.toHaveProperty('smallRefundAutoApproveAmount');
    expect(response.data.cancellationTiers).toEqual([{ daysBeforeDelivery: 5, deductionPercent: 10, label: 'Early' }]);
    expect(response.data.lastUpdatedAt).toEqual(now);
    expect(response.data).not.toHaveProperty('lastUpdatedBy');
  });

  it('PATCH updates cancellation tiers only and creates audit log', async () => {
    const { service, prisma, auditLog } = createService();
    await service.update({ uid: 'super_1', role: UserRole.SUPER_ADMIN }, { allowRefund: false, cancellationTiers: [{ daysBeforeDelivery: 5, deductionPercent: 10, label: 'Early' }, { daysBeforeDelivery: 2, deductionPercent: 25, label: 'Late' }] });
    const updateArgs = prisma.refundPolicySettings.update.mock.calls[0][0] as unknown as { data: { allowRefund: boolean; cancellationTiersJson: Array<{ daysBeforeDelivery: number; deductionPercent: number; label: string; createdAt: string }> } };
    expect(updateArgs.data.allowRefund).toBe(false);
    expect(updateArgs.data).not.toHaveProperty('noteText');
    expect(updateArgs.data).not.toHaveProperty('refundWindowDays');
    expect(updateArgs.data).not.toHaveProperty('autoRefundThresholdAmount');
    expect(updateArgs.data).not.toHaveProperty('refundForAllCategories');
    expect(updateArgs.data).not.toHaveProperty('eligibleCategoryIdsJson');
    expect(updateArgs.data).not.toHaveProperty('autoApproveSmallRefunds');
    expect(updateArgs.data).not.toHaveProperty('smallRefundAutoApproveAmount');
    expect(updateArgs.data.cancellationTiersJson[0]).toMatchObject({ daysBeforeDelivery: 5, deductionPercent: 10, label: 'Early' });
    expect(updateArgs.data.cancellationTiersJson[0]).toHaveProperty('createdAt');
    expect(auditLog.write).toHaveBeenCalledTimes(1);
    const auditCalls = auditLog.write.mock.calls as unknown as Array<[unknown]>;
    const auditArgs = auditCalls[0][0] as { beforeJson: Record<string, unknown>; afterJson: Record<string, unknown> };
    expect(auditArgs.beforeJson).toMatchObject({ allowRefund: true, cancellationTiers: [{ daysBeforeDelivery: 5, deductionPercent: 10, label: 'Early' }] });
    expect(auditArgs.afterJson).toMatchObject({ allowRefund: false, cancellationTiers: [{ daysBeforeDelivery: 5, deductionPercent: 10, label: 'Early' }, { daysBeforeDelivery: 2, deductionPercent: 25, label: 'Late' }] });
  });

  it('returns cancellation tiers in the same order sent by the client', async () => {
    const { service } = createService();
    const response = await service.update({ uid: 'super_1', role: UserRole.SUPER_ADMIN }, {
      cancellationTiers: [
        { daysBeforeDelivery: 30, deductionPercent: 50, label: 'Early Cancellation' },
        { daysBeforeDelivery: 10, deductionPercent: 75, label: 'Late Cancellation' },
      ],
    });

    expect(response.data.cancellationTiers).toEqual([
      { daysBeforeDelivery: 30, deductionPercent: 50, label: 'Early Cancellation' },
      { daysBeforeDelivery: 10, deductionPercent: 75, label: 'Late Cancellation' },
    ]);
  });

  it('keeps only allowRefund and cancellation tiers in the update DTO', () => {
    const dto = readFileSync(join(__dirname, 'dto/refund-policy-settings.dto.ts'), 'utf8');
    expect(dto).toContain('allowRefund');
    expect(dto).not.toContain('noteText');
    expect(dto).not.toContain('refundWindowDays');
    expect(dto).not.toContain('autoRefundThresholdAmount');
  });

  it('validates cancellation tier percent and duplicate days', async () => {
    const dto = readFileSync(join(__dirname, 'dto/refund-policy-settings.dto.ts'), 'utf8');
    expect(dto).toContain('@Min(0) @Max(100) deductionPercent');
    const validationDto = plainToInstance(UpdateRefundPolicySettingsDto, { cancellationTiers: [{ daysBeforeDelivery: 1, deductionPercent: 101, label: 'Too high' }] });
    expect(validateSync(validationDto).length).toBeGreaterThan(0);
    const { service } = createService();
    await expect(service.update({ uid: 'super_1', role: UserRole.SUPER_ADMIN }, { cancellationTiers: [{ daysBeforeDelivery: 5, deductionPercent: 10, label: 'Early' }, { daysBeforeDelivery: 5, deductionPercent: 25, label: 'Duplicate' }] })).rejects.toThrow('Duplicate cancellation tier daysBeforeDelivery values are not allowed');
  });

  it('refund eligibility uses refundWindowDays and all categories when refunds are allowed', () => {
    const { service } = createService();
    const expired = service.evaluateWithPolicy(settings, { deliveredAt: new Date('2026-04-01T10:00:00.000Z'), requestedAmount: 10, remainingRefundableAmount: 20, paymentRefundable: true, now });
    expect(expired.eligible).toBe(false);
    expect(expired.reasons).toContain('REFUND_WINDOW_EXPIRED');
    const allCategories = service.evaluateWithPolicy(settings, { deliveredAt: new Date('2026-05-10T10:00:00.000Z'), requestedAmount: 10, remainingRefundableAmount: 20, paymentRefundable: true, now });
    expect(allCategories.eligible).toBe(true);
    expect(allCategories.reasons).not.toContain('CATEGORY_MANUAL_REVIEW_REQUIRED');
  });

  it('allowRefund=false makes refund eligibility return disabled reason', () => {
    const { service } = createService();
    const result = service.evaluateWithPolicy({ ...settings, allowRefund: false }, { deliveredAt: new Date('2026-05-10T10:00:00.000Z'), requestedAmount: 10, remainingRefundableAmount: 20, paymentRefundable: true, now });
    expect(result.eligible).toBe(false);
    expect(result.manualReviewRequired).toBe(false);
    expect(result.reasons).toContain('REFUNDS_DISABLED_BY_POLICY');
  });

  it('threshold review uses policy settings without small-refund auto approval', () => {
    const { service } = createService();
    const withinThreshold = service.evaluateWithPolicy(settings, { deliveredAt: new Date('2026-05-10T10:00:00.000Z'), requestedAmount: 15, remainingRefundableAmount: 20, paymentRefundable: true, now });
    expect(withinThreshold).not.toHaveProperty('autoApproveSmallRefund');
    expect(withinThreshold.canProcessWithoutSeniorReview).toBe(true);
    const seniorReview = service.evaluateWithPolicy(settings, { deliveredAt: new Date('2026-05-10T10:00:00.000Z'), requestedAmount: 75, remainingRefundableAmount: 100, paymentRefundable: true, now });
    expect(seniorReview.manualReviewRequired).toBe(true);
    expect(seniorReview.canProcessWithoutSeniorReview).toBe(false);
  });
});

describe('Refund policy settings source safety', () => {
  const controller = readFileSync(join(__dirname, 'refund-policy-settings.controller.ts'), 'utf8');
  const permissions = readFileSync(join(__dirname, '../staff-roles/constants/permission-catalog.ts'), 'utf8');
  const schema = readFileSync(join(__dirname, '../../../prisma/schema.prisma'), 'utf8');
  const main = readFileSync(join(__dirname, '../../main.ts'), 'utf8');
  const swaggerAccess = readFileSync(join(__dirname, '../../swagger-access.ts'), 'utf8');

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

  it('exposes required APIs with admin read and super admin-only update only', () => {
    expect(controller).toContain("@Controller('admin/refund-policy-settings')");
    expect(controller).toContain("@Permissions('refundPolicies.read')");
    expect(controller).not.toContain("@Get('logs')");
    expect(controller).not.toContain('List refund policy audit logs');
    expect(controller).not.toContain('logs(@Query()');
    expect(controller).toContain('@Roles(UserRole.SUPER_ADMIN)');
    expect(controller).toContain('Updates refund enablement status and cancellation deduction tiers used by refund policy settings.');
    expect(controller).toContain('updateRefundPolicy');
    expect(controller).not.toContain("currency: 'PKR'");
  });

  it('removes fields outside the refund settings design from Swagger examples and DTO', () => {
    const dto = readFileSync(join(__dirname, 'dto/refund-policy-settings.dto.ts'), 'utf8');
    const service = readFileSync(join(__dirname, 'refund-policy-settings.service.ts'), 'utf8');
    expect(controller).toContain('allowRefund');
    expect(controller).not.toContain('noteText');
    expect(controller).not.toContain('refundWindowDays');
    expect(controller).not.toContain('autoRefundThresholdAmount');
    expect(controller).not.toContain('refundForAllCategories');
    expect(controller).not.toContain('eligibleCategoryIds');
    expect(controller).not.toContain('eligibleCategories');
    expect(controller).not.toContain('autoApproveSmallRefunds');
    expect(controller).not.toContain('smallRefundAutoApproveAmount');
    expect(controller).not.toContain('sortOrder');
    expect(dto).not.toContain('categoryIds');
    expect(dto).toContain('allowRefund');
    expect(dto).not.toContain('noteText');
    expect(dto).not.toContain('refundWindowDays');
    expect(dto).not.toContain('autoRefundThresholdAmount');
    expect(service).not.toContain('categoryIds');
  });
});
