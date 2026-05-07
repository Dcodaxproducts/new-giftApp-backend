/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import { CouponDiscountType, SubscriptionPlanStatus, UserRole } from '@prisma/client';
import { CouponStatus, PlanFeatureType } from './dto/subscription-plans.dto';
import { SubscriptionPlansService } from './subscription-plans.service';

function createService() {
  const plan = { id: 'plan_1', name: 'Pro', slug: 'pro', description: null, monthlyPrice: { toString: () => '49' }, yearlyPrice: { toString: () => '490' }, currency: 'USD', status: SubscriptionPlanStatus.ACTIVE, visibility: 'PUBLIC', isPopular: false, featuresJson: { apiAccess: true }, limitsJson: { maxTeamMembers: 10 }, activeSubscribersPlaceholder: 0, createdBy: 'admin_1', updatedBy: null, createdAt: new Date(), updatedAt: new Date(), deletedAt: null };
  const coupon = { id: 'coupon_1', code: 'SUMMER25', description: null, discountType: CouponDiscountType.PERCENTAGE, discountValue: { toString: () => '25' }, planIdsJson: ['plan_1'], startsAt: null, expiresAt: null, maxRedemptions: 100, redemptionCount: 0, isActive: true, createdBy: 'admin_1', updatedBy: null, createdAt: new Date(), updatedAt: new Date(), deletedAt: null };
  const feature = { id: 'feature_1', key: 'apiAccess', label: 'API Access', description: 'API', type: 'BOOLEAN', isActive: true, sortOrder: 0, deletedAt: null, createdAt: new Date(), updatedAt: new Date() };
  const prisma = {
    subscriptionPlan: { findFirst: jest.fn().mockResolvedValue(null), create: jest.fn().mockResolvedValue(plan), findMany: jest.fn().mockResolvedValue([plan]), count: jest.fn().mockResolvedValue(1), update: jest.fn().mockResolvedValue(plan), updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
    planFeatureCatalog: { upsert: jest.fn(), findFirst: jest.fn().mockResolvedValue(null), create: jest.fn().mockResolvedValue(feature), update: jest.fn().mockResolvedValue({ ...feature, isActive: false }), findMany: jest.fn().mockResolvedValue([feature]), count: jest.fn().mockResolvedValue(1) },
    coupon: { findFirst: jest.fn().mockResolvedValue(null), create: jest.fn().mockResolvedValue(coupon), findMany: jest.fn().mockResolvedValue([coupon]), count: jest.fn().mockResolvedValue(1), update: jest.fn().mockResolvedValue(coupon) },
    $transaction: jest.fn().mockImplementation((items: unknown[]) => Promise.all(items)),
  };
  const audit = { write: jest.fn().mockResolvedValue(undefined) };
  const service = new SubscriptionPlansService(prisma as unknown as ConstructorParameters<typeof SubscriptionPlansService>[0], audit as unknown as ConstructorParameters<typeof SubscriptionPlansService>[1]);
  return { service, prisma, audit };
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
    expect(prisma.planFeatureCatalog.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ deletedAt: expect.any(Date), isActive: false }) }));
    expect(audit.write).toHaveBeenCalledWith(expect.objectContaining({ action: 'PLAN_FEATURE_DELETED' }));
  });
});
