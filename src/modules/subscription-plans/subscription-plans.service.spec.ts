/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import { SubscriptionPlanStatus, SubscriptionPlanVisibility, UserRole } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';
import { PlanFeatureType, PlanSortBy, SortOrder } from './dto/subscription-plans.dto';
import { PlanFeaturesRepository } from './repositories/plan-features.repository';
import { SubscriptionPlansRepository } from './repositories/subscription-plans.repository';
import { SubscriptionPlansService } from './services/subscription-plans.service';

function createService() {
  const plan = { id: 'plan_1', name: 'Pro', slug: 'pro', description: null, monthlyPrice: { toString: () => '49' }, yearlyPrice: { toString: () => '490' }, currency: 'USD', status: SubscriptionPlanStatus.ACTIVE, visibility: SubscriptionPlanVisibility.PUBLIC, isPopular: false, featuresJson: { apiAccess: true }, limitsJson: { maxTeamMembers: 10 }, activeSubscribersPlaceholder: 0, createdAt: new Date(), updatedAt: new Date() };
  const feature = { id: 'feature_1', key: 'apiAccess', label: 'API Access', description: 'API', type: 'BOOLEAN', isActive: true, sortOrder: 0, deletedAt: null, createdAt: new Date(), updatedAt: new Date() };
  const prisma = {
    subscriptionPlan: { findFirst: jest.fn().mockResolvedValue(null), findUnique: jest.fn().mockResolvedValue(plan), create: jest.fn().mockResolvedValue(plan), findMany: jest.fn().mockResolvedValue([plan]), count: jest.fn().mockResolvedValue(1), update: jest.fn().mockImplementation(({ data }) => Promise.resolve({ ...plan, ...data })), updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
    planFeatureCatalog: { upsert: jest.fn(), findFirst: jest.fn().mockResolvedValue(null), create: jest.fn().mockResolvedValue(feature), update: jest.fn().mockResolvedValue({ ...feature, isActive: false }), delete: jest.fn().mockResolvedValue(feature), findMany: jest.fn().mockResolvedValue([feature]), count: jest.fn().mockResolvedValue(1) },
    $transaction: jest.fn().mockImplementation((items: unknown[]) => Promise.all(items)),
  };
  const audit = { write: jest.fn().mockResolvedValue(undefined) };
  const subscriptionPlansRepository = new SubscriptionPlansRepository(prisma as unknown as ConstructorParameters<typeof SubscriptionPlansRepository>[0]);
  const planFeaturesRepository = new PlanFeaturesRepository(prisma as unknown as ConstructorParameters<typeof PlanFeaturesRepository>[0]);
  const service = new SubscriptionPlansService(
    subscriptionPlansRepository,
    planFeaturesRepository,
    audit as unknown as ConstructorParameters<typeof SubscriptionPlansService>[2],
  );
  return { service, prisma, audit, subscriptionPlansRepository, planFeaturesRepository };
}

describe('SubscriptionPlansService', () => {
  it('creates plan and writes audit log', async () => {
    const { service, prisma, audit } = createService();
    await service.createPlan({ uid: 'admin_1', role: UserRole.STAFF }, { name: 'Pro', monthlyPrice: 49 });
    expect(prisma.subscriptionPlan.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ slug: 'pro', monthlyPrice: expect.anything(), yearlyPrice: expect.anything() }) }));
    expect(audit.write).toHaveBeenCalledWith(expect.objectContaining({ action: 'SUBSCRIPTION_PLAN_CREATED' }));
  });

  it('creates plan with yearly pricing only', async () => {
    const { service, prisma } = createService();
    await service.createPlan({ uid: 'admin_1', role: UserRole.STAFF }, { name: 'Annual Pro', yearlyPrice: 490 });
    expect(Number(prisma.subscriptionPlan.create.mock.calls[0][0].data.monthlyPrice)).toBe(0);
    expect(Number(prisma.subscriptionPlan.create.mock.calls[0][0].data.yearlyPrice)).toBe(490);
  });

  it('requires at least one pricing unit when creating a plan', async () => {
    const { service } = createService();
    await expect(service.createPlan({ uid: 'admin_1', role: UserRole.STAFF }, { name: 'Freeform' })).rejects.toThrow('Either monthlyPrice or yearlyPrice is required');
  });

  it('filters removed limit fields from plan responses and writes', async () => {
    const { service, prisma } = createService();
    await service.createPlan({ uid: 'admin_1', role: UserRole.STAFF }, { name: 'Pro', monthlyPrice: 49, limits: { maxGiftsPerMonth: 5, maxGroupGiftingEvents: 2, maxTeamMembers: 99, storageGb: 100 } as Record<string, unknown> });
    expect(prisma.subscriptionPlan.create.mock.calls[0][0].data.limitsJson).toEqual({ maxGiftsPerMonth: 5, maxGroupGiftingEvents: 2 });

    prisma.subscriptionPlan.findUnique.mockResolvedValue({ ...(await prisma.subscriptionPlan.findMany())[0], limitsJson: { maxGiftsPerMonth: 5, maxGroupGiftingEvents: 2, maxTeamMembers: 99, storageGb: 100 } });
    const result = await service.planDetails('plan_1');
    expect(result.data.limits).toEqual({ maxGiftsPerMonth: 5, maxGroupGiftingEvents: 2 });
  });

  it('lists plans without soft-delete filtering', async () => {
    const { service, prisma } = createService();
    await service.listPlans({});
    expect(prisma.subscriptionPlan.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: {} }));
  });

  it('lists newly created plans first by default and respects explicit sort', async () => {
    const { service, prisma } = createService();

    await service.listPlans({});
    await service.listPlans({ sortBy: PlanSortBy.NAME, sortOrder: SortOrder.ASC });

    expect(prisma.subscriptionPlan.findMany).toHaveBeenNthCalledWith(1, expect.objectContaining({ orderBy: { createdAt: 'desc' } }));
    expect(prisma.subscriptionPlan.findMany).toHaveBeenNthCalledWith(2, expect.objectContaining({ orderBy: { name: 'asc' } }));
  });

  it('normal update works through main PATCH service path', async () => {
    const { service, prisma, audit } = createService();
    const existing = (await prisma.subscriptionPlan.findMany())[0];
    prisma.subscriptionPlan.findUnique.mockResolvedValue(existing);
    prisma.subscriptionPlan.findFirst.mockImplementation((args: { where: { slug?: string } }) => Promise.resolve(args.where.slug ? null : existing));
    const result = await service.updatePlan({ uid: 'admin_1', role: UserRole.STAFF, permissions: { subscriptionPlans: ['update'] } }, 'plan_1', { name: 'Premium' });
    expect(result.data).toEqual(expect.objectContaining({ name: 'Premium', slug: 'premium' }));
    expect(audit.write).toHaveBeenCalledWith(expect.objectContaining({ action: 'SUBSCRIPTION_PLAN_UPDATED', beforeJson: expect.objectContaining({ name: 'Pro' }), afterJson: expect.objectContaining({ name: 'Premium' }) }));
  });

  it('status update works through main PATCH with status permission', async () => {
    const { service, prisma } = createService();
    prisma.subscriptionPlan.findUnique.mockResolvedValue((await prisma.subscriptionPlan.findMany())[0]);
    const result = await service.updatePlan({ uid: 'admin_1', role: UserRole.STAFF, permissions: { subscriptionPlans: ['status.update'] } }, 'plan_1', { status: SubscriptionPlanStatus.INACTIVE, reason: 'Plan paused.' });
    expect(result.data).toEqual(expect.objectContaining({ status: SubscriptionPlanStatus.INACTIVE }));
    expect(prisma.subscriptionPlan.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: SubscriptionPlanStatus.INACTIVE }) }));
  });

  it('visibility update works through main PATCH with visibility permission', async () => {
    const { service, prisma } = createService();
    prisma.subscriptionPlan.findUnique.mockResolvedValue((await prisma.subscriptionPlan.findMany())[0]);
    const result = await service.updatePlan({ uid: 'admin_1', role: UserRole.STAFF, permissions: { subscriptionPlans: ['visibility.update'] } }, 'plan_1', { isVisible: false, reason: 'Plan hidden.' });
    expect(result.data).toEqual(expect.objectContaining({ visibility: SubscriptionPlanVisibility.PRIVATE }));
    expect(prisma.subscriptionPlan.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ visibility: SubscriptionPlanVisibility.PRIVATE }) }));
  });

  it('permissions are enforced for status and visibility fields', async () => {
    const { service, prisma } = createService();
    prisma.subscriptionPlan.findUnique.mockResolvedValue((await prisma.subscriptionPlan.findMany())[0]);
    await expect(service.updatePlan({ uid: 'admin_1', role: UserRole.STAFF, permissions: { subscriptionPlans: ['read'] } }, 'plan_1', { status: SubscriptionPlanStatus.ACTIVE })).rejects.toThrow('Your role does not have the required permission');
    await expect(service.updatePlan({ uid: 'admin_1', role: UserRole.STAFF, permissions: { subscriptionPlans: ['status.update'] } }, 'plan_1', { visibility: SubscriptionPlanVisibility.PUBLIC })).rejects.toThrow('Your role does not have the required permission');
  });

  it('old status and visibility routes are removed from Swagger', () => {
    const controller = readFileSync(join(__dirname, 'controllers/subscription-plans.controller.ts'), 'utf8');
    const openapi = JSON.parse(readFileSync(join(__dirname, '../../../docs/generated/openapi.json'), 'utf8')) as { paths: Record<string, unknown> };
    expect(controller).toContain("@Patch(':id')");
    expect(controller).not.toContain("@Patch(':id/status')");
    expect(controller).not.toContain("@Patch(':id/visibility')");
    expect(openapi.paths['/api/v1/subscription-plans/{id}']).toBeDefined();
    expect(openapi.paths['/api/v1/subscription-plans/{id}/status']).toBeUndefined();
    expect(openapi.paths['/api/v1/subscription-plans/{id}/visibility']).toBeUndefined();
  });

  it('creates and archives plan feature catalog entries', async () => {
    const { service, prisma, audit } = createService();
    await service.createFeature({ uid: 'admin_1', role: UserRole.STAFF }, { key: 'apiAccess', label: 'API Access', type: PlanFeatureType.BOOLEAN });
    prisma.planFeatureCatalog.findFirst.mockResolvedValue((await prisma.planFeatureCatalog.findMany())[0]);
    await service.deleteFeature({ uid: 'admin_1', role: UserRole.STAFF }, 'feature_1');
    expect(prisma.planFeatureCatalog.delete).toHaveBeenCalledWith({ where: { id: 'feature_1' } });
    expect(audit.write).toHaveBeenCalledWith(expect.objectContaining({ action: 'PLAN_FEATURE_DELETED' }));
  });

  it('lists newest plan features first when sortOrder ties', async () => {
    const { service, prisma } = createService();
    await service.listFeatures({});
    expect(prisma.planFeatureCatalog.findMany).toHaveBeenCalledWith(expect.objectContaining({ orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }, { label: 'asc' }] }));
  });

  it('lists all non-deleted plan features when isActive is omitted and filters explicit active state', async () => {
    const { service, prisma } = createService();

    await service.listFeatures({});
    await service.listFeatures({ isActive: true });
    await service.listFeatures({ isActive: false });

    expect(prisma.planFeatureCatalog.findMany).toHaveBeenNthCalledWith(1, expect.objectContaining({ where: { deletedAt: null } }));
    expect(prisma.planFeatureCatalog.findMany).toHaveBeenNthCalledWith(2, expect.objectContaining({ where: expect.objectContaining({ deletedAt: null, isActive: true }) }));
    expect(prisma.planFeatureCatalog.findMany).toHaveBeenNthCalledWith(3, expect.objectContaining({ where: expect.objectContaining({ deletedAt: null, isActive: false }) }));
  });

  it('coupon routes are removed from Swagger', () => {
    const openapi = JSON.parse(readFileSync(join(__dirname, '../../../docs/generated/openapi.json'), 'utf8')) as { paths: Record<string, unknown> };
    expect(openapi.paths['/api/v1/coupons']).toBeUndefined();
    expect(openapi.paths['/api/v1/coupons/{id}']).toBeUndefined();
  });
});
