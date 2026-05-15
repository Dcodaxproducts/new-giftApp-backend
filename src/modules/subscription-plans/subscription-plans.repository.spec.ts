import { readFileSync } from 'fs';
import { join } from 'path';

describe('Subscription plans repository cleanup', () => {
  const service = readFileSync(join(__dirname, 'subscription-plans.service.ts'), 'utf8');
  const plansRepository = readFileSync(join(__dirname, 'subscription-plans.repository.ts'), 'utf8');
  const featuresRepository = readFileSync(join(__dirname, 'plan-features.repository.ts'), 'utf8');
  const couponsRepository = readFileSync(join(__dirname, 'coupons.repository.ts'), 'utf8');
  const moduleFile = readFileSync(join(__dirname, 'subscription-plans.module.ts'), 'utf8');
  const plansController = readFileSync(join(__dirname, 'subscription-plans.controller.ts'), 'utf8');
  const featuresController = readFileSync(join(__dirname, 'plan-features.controller.ts'), 'utf8');
  const couponsController = readFileSync(join(__dirname, 'coupons.controller.ts'), 'utf8');

  it('keeps subscription plans service free of direct Prisma access', () => {
    expect(service).not.toContain('PrismaService');
    expect(service).not.toContain('this.prisma');
    expect(service).toContain('SubscriptionPlansRepository');
    expect(service).toContain('PlanFeaturesRepository');
    expect(service).toContain('CouponsRepository');
  });

  it('moves plan, feature, and coupon persistence into repositories', () => {
    ['findManyPlans', 'countPlans', 'findPlansAndCount', 'findPlanById', 'createPlan', 'updatePlan', 'updatePlanStatus', 'updatePlanVisibility', 'deletePlan', 'clearPopular', 'countPlanStats'].forEach((method) => expect(plansRepository).toContain(method));
    ['upsertFeatureByKey', 'findActiveCatalog', 'findFeaturesAndCount', 'findFeatureById', 'findFeatureByKey', 'createFeature', 'updateFeature', 'deleteFeature'].forEach((method) => expect(featuresRepository).toContain(method));
    ['findCouponsAndCount', 'findCouponById', 'findCouponByCode', 'createCoupon', 'updateCoupon', 'updateCouponStatus', 'deleteCoupon'].forEach((method) => expect(couponsRepository).toContain(method));
  });

  it('preserves module wiring, routes, permissions, and tags', () => {
    expect(moduleFile).toContain('SubscriptionPlansRepository');
    expect(moduleFile).toContain('PlanFeaturesRepository');
    expect(moduleFile).toContain('CouponsRepository');
    expect(plansController).toContain("@Controller('subscription-plans')");
    expect(featuresController).toContain("@Controller('plan-features')");
    expect(couponsController).toContain("@Controller('coupons')");
    expect(plansController).toContain("@Permissions('subscriptionPlans.read')");
    expect(featuresController).toContain("@Permissions('planFeatures.read')");
    expect(couponsController).toContain("@Permissions('coupons.read')");
    expect(plansController).toContain("@ApiTags('07 Plans & Coupons')");
    expect(featuresController).toContain("@ApiTags('07 Plans & Coupons')");
    expect(couponsController).toContain("@ApiTags('07 Plans & Coupons')");
  });
});
