/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import { CouponDiscountType, SubscriptionPlanStatus, SubscriptionPlanVisibility, UserRole } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';
import { CouponsRepository } from '../repositories/coupons.repository';
import { CouponStatus, PlanFeatureType } from '../dto/subscription-plans.dto';
import { PlanFeaturesRepository } from '../repositories/plan-features.repository';
import { SubscriptionPlansRepository } from '../repositories/subscription-plans.repository';
import { SubscriptionPlansService } from '../services/subscription-plans.service';

function createService() {
  const plan = { id: 'plan_1', name: 'Pro', slug: 'pro', description: null, monthlyPrice: { toString: () => '49' }, yearlyPrice: { toString: () => '490' }, currency: 'USD', status: SubscriptionPlanStatus.ACTIVE, visibility: SubscriptionPlanVisibility.PUBLIC, isPopular: false, featuresJson: { apiAccess: true }, limitsJson: { maxTeamMembers: 10 }, activeSubscribersPlaceholder: 0, createdBy: 'admin_1', updatedBy: null, createdAt: new Date(), updatedAt: new Date(), deletedAt: null };
  const coupon = { id: 'coupon_1', code: 'SUMMER25', description: null, discountType: CouponDiscountType.PERCENTAGE, discountValue: { toString: () => '25' }, planIdsJson: ['plan_1'], startsAt: null, expiresAt: null, maxRedemptions: 100, redemptionCount: 0, isActive: true, createdBy: 'admin_1', updatedBy: null, createdAt: new Date(), updatedAt: new Date(), deletedAt: null };
  const feature = { id: 'feature_1', key: 'apiAccess', label: 'API Access', description: 'API', type: 'BOOLEAN', isActive: true, sortOrder: 0, deletedAt: null, createdAt: new Date(), updatedAt: new Date() };
  const prisma = {
    subscriptionPlan: { findFirst: jest.fn().mockResolvedValue(null), create: jest.fn().mockResolvedValue(plan), findMany: jest.fn().mockResolvedValue([plan]), count: jest.fn().mockResolvedValue(1), update: jest.fn().mockImplementation(({ data }) => Promise.resolve({ ...plan, ...data })), updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
    planFeatureCatalog: { upsert: jest.fn(), findFirst: jest.fn().mockResolvedValue(null), create: jest.fn().mockResolvedValue(feature), update: jest.fn().mockResolvedValue({ ...feature, isActive: false }), delete: jest.fn().mockResolvedValue(feature), findMany: jest.fn().mockResolvedValue([feature]), count: jest.fn().mockResolvedValue(1) },
    coupon: { findFirst: jest.fn().mockResolvedValue(null), create: jest.fn().mockResolvedValue(coupon), findMany: jest.fn().mockResolvedValue([coupon]), count: jest.fn().mockResolvedValue(1), update: jest.fn().mockResolvedValue(coupon) },
    $transaction: jest.fn().mockImplementation((items: unknown[]) => Promise.all(items)),
  };
  const audit = { write: jest.fn().mockResolvedValue(undefined) };
  const subscriptionPlansRepository = new SubscriptionPlansRepository(prisma as unknown as ConstructorParameters<typeof SubscriptionPlansRepository>[0]);
  const planFeaturesRepository = new PlanFeaturesRepository(prisma as unknown as ConstructorParameters<typeof PlanFeaturesRepository>[0]);
  const couponsRepository = new CouponsRepository(prisma as unknown as ConstructorParameters<typeof CouponsRepository>[0]);
  const service = new SubscriptionPlansService(
    subscriptionPlansRepository,
    planFeaturesRepository,
    couponsRepository,
    audit as unknown as ConstructorParameters<typeof SubscriptionPlansService>[3],
  );
  return { service, prisma, audit, subscriptionPlansRepository, planFeaturesRepository, couponsRepository };
}

describe('SubscriptionPlansService', () => {
  it('creates plan and writes audit log', async () => {
    const { service, prisma, audit } = createService();
    await service.createPlan({ uid: 'admin_1', role: UserRole.ADMIN }, { name: 'Pro', monthlyPrice: 49 });
    expect(prisma.subscriptionPlan.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ slug: 'pro', yearlyPrice: expect.anything() }) }));
    expect(audit.write).toHaveBeenCalledWith(expect.objectContaining({ action: 'SUBSCRIPTION_PLAN_CREATED' }));
  });

  it('lists plans excluding deleted plans', async () => {
    const { service, prisma } = createService();
    await service.listPlans({});
    expect(prisma.subscriptionPlan.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ deletedAt: null }) }));
  });



  it('normal update works through main PATCH service path', async () => {
    const { service, prisma, audit } = createService();
    const existing = (await prisma.subscriptionPlan.findMany())[0];
    prisma.subscriptionPlan.findFirst.mockImplementation((args: { where: { id?: string; slug?: string } }) => Promise.resolve(args.where.slug ? null : existing));
    const result = await service.updatePlan({ uid: 'admin_1', role: UserRole.ADMIN, permissions: { subscriptionPlans: ['update'] } }, 'plan_1', { name: 'Premium' });
    expect(result.data).toEqual(expect.objectContaining({ name: 'Premium', slug: 'premium' }));
    expect(audit.write).toHaveBeenCalledWith(expect.objectContaining({ action: 'SUBSCRIPTION_PLAN_UPDATED', beforeJson: expect.objectContaining({ name: 'Pro' }), afterJson: expect.objectContaining({ name: 'Premium' }) }));
  });

  it('status update works through main PATCH with status permission', async () => {
    const { service, prisma } = createService();
    prisma.subscriptionPlan.findFirst.mockResolvedValue((await prisma.subscriptionPlan.findMany())[0]);
    const result = await service.updatePlan({ uid: 'admin_1', role: UserRole.ADMIN, permissions: { subscriptionPlans: ['status.update'] } }, 'plan_1', { status: SubscriptionPlanStatus.INACTIVE, reason: 'Plan paused.' });
    expect(result.data).toEqual(expect.objectContaining({ status: SubscriptionPlanStatus.INACTIVE }));
    expect(prisma.subscriptionPlan.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: SubscriptionPlanStatus.INACTIVE }) }));
  });

  it('visibility update works through main PATCH with visibility permission', async () => {
    const { service, prisma } = createService();
    prisma.subscriptionPlan.findFirst.mockResolvedValue((await prisma.subscriptionPlan.findMany())[0]);
    const result = await service.updatePlan({ uid: 'admin_1', role: UserRole.ADMIN, permissions: { subscriptionPlans: ['visibility.update'] } }, 'plan_1', { isVisible: false, reason: 'Plan hidden.' });
    expect(result.data).toEqual(expect.objectContaining({ visibility: SubscriptionPlanVisibility.PRIVATE }));
    expect(prisma.subscriptionPlan.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ visibility: SubscriptionPlanVisibility.PRIVATE }) }));
  });

  it('permissions are enforced for status and visibility fields', async () => {
    const { service, prisma } = createService();
    prisma.subscriptionPlan.findFirst.mockResolvedValue((await prisma.subscriptionPlan.findMany())[0]);
    await expect(service.updatePlan({ uid: 'admin_1', role: UserRole.ADMIN, permissions: { subscriptionPlans: ['read'] } }, 'plan_1', { status: SubscriptionPlanStatus.ACTIVE })).rejects.toThrow('Your role does not have the required permission');
    await expect(service.updatePlan({ uid: 'admin_1', role: UserRole.ADMIN, permissions: { subscriptionPlans: ['status.update'] } }, 'plan_1', { visibility: SubscriptionPlanVisibility.PUBLIC })).rejects.toThrow('Your role does not have the required permission');
  });

  it('old status and visibility routes are removed from Swagger', () => {
    const controller = readFileSync(join(__dirname, '../controllers/subscription-plans.controller.ts'), 'utf8');
    const openapi = JSON.parse(readFileSync(join(__dirname, '../../../../docs/generated/openapi.json'), 'utf8')) as { paths: Record<string, unknown> };
    expect(controller).toContain("@Patch(':id')");
    expect(controller).not.toContain("@Patch(':id/status')");
    expect(controller).not.toContain("@Patch(':id/visibility')");
    expect(openapi.paths['/api/v1/subscription-plans/{id}']).toBeDefined();
    expect(openapi.paths['/api/v1/subscription-plans/{id}/status']).toBeUndefined();
    expect(openapi.paths['/api/v1/subscription-plans/{id}/visibility']).toBeUndefined();
  });

  it('creates coupon and writes audit log', async () => {
    const { service, prisma, audit } = createService();
    await service.createCoupon({ uid: 'admin_1', role: UserRole.ADMIN }, { code: 'summer25', discountType: CouponDiscountType.PERCENTAGE, discountValue: 25 });
    expect(prisma.coupon.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ code: 'SUMMER25' }) }));
    expect(audit.write).toHaveBeenCalledWith(expect.objectContaining({ action: 'COUPON_CREATED' }));
  });

  it('fetches coupon details and updates coupon status', async () => {
    const { service, prisma, audit } = createService();
    prisma.coupon.findFirst.mockResolvedValue((await prisma.coupon.findMany())[0]);
    await service.updateCouponStatus({ uid: 'admin_1', role: UserRole.ADMIN }, 'coupon_1', { status: CouponStatus.INACTIVE });
    expect(prisma.coupon.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ isActive: false }) }));
    expect(audit.write).toHaveBeenCalledWith(expect.objectContaining({ action: 'COUPON_STATUS_CHANGED' }));
  });

  it('creates and archives plan feature catalog entries', async () => {
    const { service, prisma, audit } = createService();
    await service.createFeature({ uid: 'admin_1', role: UserRole.ADMIN }, { key: 'apiAccess', label: 'API Access', type: PlanFeatureType.BOOLEAN });
    prisma.planFeatureCatalog.findFirst.mockResolvedValue((await prisma.planFeatureCatalog.findMany())[0]);
    await service.deleteFeature({ uid: 'admin_1', role: UserRole.ADMIN }, 'feature_1');
    expect(prisma.planFeatureCatalog.delete).toHaveBeenCalledWith({ where: { id: 'feature_1' } });
    expect(audit.write).toHaveBeenCalledWith(expect.objectContaining({ action: 'PLAN_FEATURE_DELETED' }));
  });
});
