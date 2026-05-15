import { BadRequestException, ConflictException, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { Coupon, CouponDiscountType, PlanFeatureCatalog, Prisma, SubscriptionPlan, SubscriptionPlanStatus, SubscriptionPlanVisibility } from '@prisma/client';
import { AuthUserContext } from '../../common/decorators/current-user.decorator';
import { AuditLogWriterService } from '../../common/services/audit-log.service';
import { CouponsRepository } from './coupons.repository';
import { PlanFeaturesRepository } from './plan-features.repository';
import { CouponStatus, CouponStatusFilter, CreateCouponDto, CreatePlanFeatureDto, CreateSubscriptionPlanDto, ListCouponsDto, ListPlanFeaturesDto, ListSubscriptionPlansDto, PlanSortBy, PlanStatusFilter, PlanVisibilityFilter, SortOrder, UpdateCouponDto, UpdateCouponStatusDto, UpdatePlanFeatureDto, UpdatePlanStatusDto, UpdatePlanVisibilityDto, UpdateSubscriptionPlanDto } from './dto/subscription-plans.dto';
import { SubscriptionPlansRepository } from './subscription-plans.repository';

const DEFAULT_FEATURES = [
  { key: 'customBranding', label: 'Custom Branding', description: 'Allow users to add their own logos', type: 'BOOLEAN' },
  { key: 'prioritySupport', label: 'Priority Support', description: '24/7 dedicated support channel', type: 'BOOLEAN' },
  { key: 'advancedAnalytics', label: 'Advanced Analytics', description: 'Deep-dive reports and exports', type: 'BOOLEAN' },
  { key: 'apiAccess', label: 'API Access', description: 'Integrate with third-party services', type: 'BOOLEAN' },
];

@Injectable()
export class SubscriptionPlansService implements OnModuleInit {
  constructor(
    private readonly subscriptionPlansRepository: SubscriptionPlansRepository,
    private readonly planFeaturesRepository: PlanFeaturesRepository,
    private readonly couponsRepository: CouponsRepository,
    private readonly auditLog: AuditLogWriterService,
  ) {}

  async onModuleInit(): Promise<void> {
    for (const feature of DEFAULT_FEATURES) {
      await this.planFeaturesRepository.upsertFeatureByKey(feature);
    }
  }

  async listPlans(query: ListSubscriptionPlansDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const where: Prisma.SubscriptionPlanWhereInput = { deletedAt: null, ...(query.search ? { OR: [{ name: { contains: query.search, mode: 'insensitive' } }, { slug: { contains: query.search, mode: 'insensitive' } }] } : {}), ...(query.status && query.status !== PlanStatusFilter.ALL ? { status: query.status } : {}), ...(query.visibility && query.visibility !== PlanVisibilityFilter.ALL ? { visibility: query.visibility } : {}) };
    const [items, total] = await this.subscriptionPlansRepository.findPlansAndCount({ where, orderBy: this.planOrder(query.sortBy, query.sortOrder), skip: (page - 1) * limit, take: limit });
    return { data: items.map((plan) => this.toPlanListItem(plan)), meta: { page, limit, total, totalPages: Math.ceil(total / limit) }, message: 'Subscription plans fetched successfully' };
  }

  async planDetails(id: string) { const plan = await this.getPlan(id); return { data: await this.toPlanDetail(plan), message: 'Subscription plan details fetched successfully' }; }

  async createPlan(user: AuthUserContext, dto: CreateSubscriptionPlanDto) {
    const slug = await this.uniqueSlug(dto.name);
    if (dto.isPopular) await this.clearPopular();
    const plan = await this.subscriptionPlansRepository.createPlan( { name: dto.name.trim(), slug, description: dto.description?.trim(), monthlyPrice: new Prisma.Decimal(dto.monthlyPrice), yearlyPrice: new Prisma.Decimal(dto.yearlyPrice ?? dto.monthlyPrice * 10), currency: dto.currency ?? 'USD', visibility: dto.visibility ?? SubscriptionPlanVisibility.PUBLIC, status: dto.status ?? SubscriptionPlanStatus.ACTIVE, isPopular: dto.isPopular ?? false, featuresJson: this.toJson(dto.features ?? {}), limitsJson: this.toJson(dto.limits ?? this.defaultLimits()), createdBy: user.uid });
    await this.audit(user.uid, plan.id, 'SUBSCRIPTION_PLAN_CREATED', undefined, this.toPlanListItem(plan));
    return { data: await this.toPlanDetail(plan), message: 'Subscription plan created successfully' };
  }

  async updatePlan(user: AuthUserContext, id: string, dto: UpdateSubscriptionPlanDto) {
    const plan = await this.getPlan(id);
    const before = await this.toPlanDetail(plan);
    if (dto.isPopular) await this.clearPopular(id);
    const updated = await this.subscriptionPlansRepository.updatePlan(id, { name: dto.name?.trim(), slug: dto.name ? await this.uniqueSlug(dto.name, id) : undefined, description: dto.description?.trim(), monthlyPrice: dto.monthlyPrice === undefined ? undefined : new Prisma.Decimal(dto.monthlyPrice), yearlyPrice: dto.yearlyPrice === undefined ? undefined : new Prisma.Decimal(dto.yearlyPrice), currency: dto.currency, visibility: dto.visibility, status: dto.status, isPopular: dto.isPopular, featuresJson: dto.features === undefined ? undefined : this.toJson(dto.features), limitsJson: dto.limits === undefined ? undefined : this.toJson(dto.limits), updatedBy: user.uid });
    await this.audit(user.uid, id, 'SUBSCRIPTION_PLAN_UPDATED', before, await this.toPlanDetail(updated));
    return { data: await this.toPlanDetail(updated), message: 'Subscription plan updated successfully' };
  }

  async updateStatus(user: AuthUserContext, id: string, dto: UpdatePlanStatusDto) { const plan = await this.getPlan(id); const updated = await this.subscriptionPlansRepository.updatePlan(id, { status: dto.status, updatedBy: user.uid }); await this.audit(user.uid, id, 'SUBSCRIPTION_PLAN_STATUS_CHANGED', { status: plan.status, reason: dto.reason }, { status: updated.status, reason: dto.reason }); return { data: this.toPlanListItem(updated), message: 'Subscription plan status updated successfully' }; }
  async updateVisibility(user: AuthUserContext, id: string, dto: UpdatePlanVisibilityDto) { const plan = await this.getPlan(id); const updated = await this.subscriptionPlansRepository.updatePlan(id, { visibility: dto.visibility, updatedBy: user.uid }); await this.audit(user.uid, id, 'SUBSCRIPTION_PLAN_VISIBILITY_CHANGED', { visibility: plan.visibility }, { visibility: updated.visibility }); return { data: this.toPlanListItem(updated), message: 'Subscription plan visibility updated successfully' }; }
  async deletePlan(user: AuthUserContext, id: string) { const plan = await this.getPlan(id); if (plan.activeSubscribersPlaceholder > 0) throw new BadRequestException('Plan has active subscribers and cannot be deleted'); await this.subscriptionPlansRepository.deletePlan(id); await this.audit(user.uid, id, 'SUBSCRIPTION_PLAN_DELETED', this.toPlanListItem(plan), null); return { data: null, message: 'Subscription plan deleted successfully' }; }

  async stats() {
    const { totalPlans, activePlans, inactivePlans, archivedPlans } = await this.subscriptionPlansRepository.countPlanStats();
    return { data: { totalPlans, activePlans, inactivePlans, archivedPlans, totalActiveSubscribers: 0, monthlyRecurringRevenue: 0, mostPopularPlan: 'Pro' }, message: 'Subscription plan stats fetched successfully' };
  }
  async analytics(user: AuthUserContext, id: string) { await this.getPlan(id); const data = { planId: id, activeSubscribers: 0, newSubscribersThisMonth: 0, churnRate: 0, monthlyRecurringRevenue: 0, annualRecurringRevenue: 0 }; await this.audit(user.uid, id, 'PLAN_ANALYTICS_VIEWED', undefined, data); return { data, message: 'Plan analytics fetched successfully' }; }
  async featureCatalog() { const items = await this.planFeaturesRepository.findActiveCatalog(); return { data: items.map((item) => this.toFeature(item)), message: 'Plan feature catalog fetched successfully' }; }
  async listFeatures(query: ListPlanFeaturesDto) { const page = query.page ?? 1; const limit = query.limit ?? 20; const where: Prisma.PlanFeatureCatalogWhereInput = { deletedAt: null, ...(query.search ? { OR: [{ key: { contains: query.search, mode: 'insensitive' } }, { label: { contains: query.search, mode: 'insensitive' } }] } : {}), ...(query.isActive === undefined ? {} : { isActive: query.isActive }) }; const [items, total] = await this.planFeaturesRepository.findFeaturesAndCount({ where, orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }], skip: (page - 1) * limit, take: limit }); return { data: items.map((item) => this.toFeature(item)), meta: { page, limit, total, totalPages: Math.ceil(total / limit) }, message: 'Plan features fetched successfully' }; }
  async featureDetails(id: string) { const feature = await this.getFeature(id); return { data: this.toFeature(feature), message: 'Plan feature fetched successfully' }; }
  async createFeature(user: AuthUserContext, dto: CreatePlanFeatureDto) { await this.assertUniqueFeatureKey(dto.key); const feature = await this.planFeaturesRepository.createFeature( { key: dto.key.trim(), label: dto.label.trim(), description: dto.description?.trim(), type: dto.type, isActive: dto.isActive ?? true, sortOrder: dto.sortOrder ?? 0 }); await this.auditFeature(user.uid, feature.id, 'PLAN_FEATURE_CREATED', undefined, this.toFeature(feature)); return { data: this.toFeature(feature), message: 'Plan feature created successfully' }; }
  async updateFeature(user: AuthUserContext, id: string, dto: UpdatePlanFeatureDto) { const feature = await this.getFeature(id); if (dto.key) await this.assertUniqueFeatureKey(dto.key, id); const updated = await this.planFeaturesRepository.updateFeature(id, { key: dto.key?.trim(), label: dto.label?.trim(), description: dto.description?.trim(), type: dto.type, isActive: dto.isActive, sortOrder: dto.sortOrder }); await this.auditFeature(user.uid, id, 'PLAN_FEATURE_UPDATED', this.toFeature(feature), this.toFeature(updated)); return { data: this.toFeature(updated), message: 'Plan feature updated successfully' }; }
  async deleteFeature(user: AuthUserContext, id: string) { const feature = await this.getFeature(id); await this.planFeaturesRepository.deleteFeature(id); await this.auditFeature(user.uid, id, 'PLAN_FEATURE_DELETED', this.toFeature(feature), null); return { data: null, message: 'Plan feature deleted successfully' }; }

  async listCoupons(query: ListCouponsDto) { const page = query.page ?? 1; const limit = query.limit ?? 10; const now = new Date(); const where: Prisma.CouponWhereInput = { deletedAt: null, ...(query.search ? { code: { contains: query.search, mode: 'insensitive' } } : {}), ...(query.status === CouponStatusFilter.ACTIVE ? { isActive: true, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] } : {}), ...(query.status === CouponStatusFilter.INACTIVE ? { isActive: false } : {}), ...(query.status === CouponStatusFilter.EXPIRED ? { expiresAt: { lte: now } } : {}) }; const [items, total] = await this.couponsRepository.findCouponsAndCount({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }); const filtered = query.planId ? items.filter((coupon) => this.stringArray(coupon.planIdsJson).includes(query.planId ?? '')) : items; return { data: filtered.map((coupon) => this.toCoupon(coupon)), meta: { page, limit, total: query.planId ? filtered.length : total, totalPages: Math.ceil((query.planId ? filtered.length : total) / limit) }, message: 'Coupons fetched successfully' }; }
  async couponDetails(id: string) { const coupon = await this.getCoupon(id); return { data: this.toCoupon(coupon), message: 'Coupon fetched successfully' }; }
  async createCoupon(user: AuthUserContext, dto: CreateCouponDto) { this.assertValidCoupon(dto.discountType, dto.discountValue, dto.startsAt, dto.expiresAt); await this.assertUniqueCoupon(dto.code); const coupon = await this.couponsRepository.createCoupon( { code: dto.code.trim().toUpperCase(), description: dto.description?.trim(), discountType: dto.discountType, discountValue: new Prisma.Decimal(dto.discountValue), planIdsJson: dto.planIds ?? [], startsAt: dto.startsAt ? new Date(dto.startsAt) : null, expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null, maxRedemptions: dto.maxRedemptions, isActive: dto.isActive ?? true, createdBy: user.uid }); await this.audit(user.uid, coupon.id, 'COUPON_CREATED', undefined, this.toCoupon(coupon)); return { data: this.toCoupon(coupon), message: 'Coupon created successfully' }; }
  async updateCoupon(user: AuthUserContext, id: string, dto: UpdateCouponDto) { const coupon = await this.getCoupon(id); if (dto.code) await this.assertUniqueCoupon(dto.code, id); this.assertValidCoupon(dto.discountType ?? coupon.discountType, dto.discountValue ?? Number(coupon.discountValue), dto.startsAt ?? coupon.startsAt?.toISOString(), dto.expiresAt ?? coupon.expiresAt?.toISOString()); const updated = await this.couponsRepository.updateCoupon(id, { code: dto.code?.trim().toUpperCase(), description: dto.description?.trim(), discountType: dto.discountType, discountValue: dto.discountValue === undefined ? undefined : new Prisma.Decimal(dto.discountValue), planIdsJson: dto.planIds, startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined, expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined, maxRedemptions: dto.maxRedemptions, isActive: dto.isActive, updatedBy: user.uid }); await this.audit(user.uid, id, 'COUPON_UPDATED', this.toCoupon(coupon), this.toCoupon(updated)); return { data: this.toCoupon(updated), message: 'Coupon updated successfully' }; }
  async updateCouponStatus(user: AuthUserContext, id: string, dto: UpdateCouponStatusDto) { const coupon = await this.getCoupon(id); const data = dto.status === CouponStatus.ACTIVE ? { isActive: true, updatedBy: user.uid } : dto.status === CouponStatus.INACTIVE ? { isActive: false, updatedBy: user.uid } : { isActive: false, expiresAt: new Date(), updatedBy: user.uid }; const updated = await this.couponsRepository.updateCouponStatus(id, data); await this.audit(user.uid, id, 'COUPON_STATUS_CHANGED', { status: this.couponStatus(coupon), reason: dto.reason }, { status: this.couponStatus(updated), reason: dto.reason }); return { data: this.toCoupon(updated), message: 'Coupon status updated successfully' }; }
  async deleteCoupon(user: AuthUserContext, id: string) { const coupon = await this.getCoupon(id); await this.couponsRepository.deleteCoupon(id); await this.audit(user.uid, id, 'COUPON_DELETED', this.toCoupon(coupon), null); return { data: null, message: 'Coupon deleted successfully' }; }

  private async getPlan(id: string): Promise<SubscriptionPlan> { const plan = await this.subscriptionPlansRepository.findPlanById(id); if (!plan) throw new NotFoundException('Subscription plan not found'); return plan; }
  private async getCoupon(id: string): Promise<Coupon> { const coupon = await this.couponsRepository.findCouponById(id); if (!coupon) throw new NotFoundException('Coupon not found'); return coupon; }
  private async getFeature(id: string): Promise<PlanFeatureCatalog> { const feature = await this.planFeaturesRepository.findFeatureById(id); if (!feature) throw new NotFoundException('Plan feature not found'); return feature; }
  private async assertUniqueCoupon(code: string, exceptId?: string) { const exists = await this.couponsRepository.findCouponByCode(code, exceptId); if (exists) throw new ConflictException('Coupon code already exists'); }
  private async assertUniqueFeatureKey(key: string, exceptId?: string) { const exists = await this.planFeaturesRepository.findFeatureByKey(key.trim(), exceptId); if (exists) throw new ConflictException('Plan feature key already exists'); }
  private assertValidCoupon(discountType: CouponDiscountType, discountValue: number, startsAt?: string, expiresAt?: string) { if (discountType === CouponDiscountType.PERCENTAGE && (discountValue < 1 || discountValue > 100)) throw new BadRequestException('Percentage discount must be between 1 and 100'); if (discountType === CouponDiscountType.FIXED_AMOUNT && discountValue <= 0) throw new BadRequestException('Fixed amount discount must be greater than 0'); if (startsAt && expiresAt && new Date(expiresAt).getTime() < new Date(startsAt).getTime()) throw new BadRequestException('expiresAt cannot be before startsAt'); }
  private async clearPopular(exceptId?: string) { await this.subscriptionPlansRepository.clearPopular(exceptId); }
  private planOrder(sortBy?: PlanSortBy, sortOrder?: SortOrder): Prisma.SubscriptionPlanOrderByWithRelationInput { const direction = sortOrder === SortOrder.ASC ? 'asc' : 'desc'; const field = sortBy === PlanSortBy.NAME ? 'name' : sortBy === PlanSortBy.MONTHLY_PRICE ? 'monthlyPrice' : sortBy === PlanSortBy.YEARLY_PRICE ? 'yearlyPrice' : sortBy === PlanSortBy.ACTIVE_SUBSCRIBERS ? 'activeSubscribersPlaceholder' : 'createdAt'; return { [field]: direction }; }
  private toPlanListItem(plan: SubscriptionPlan) { return { id: plan.id, name: plan.name, slug: plan.slug, description: plan.description, badge: plan.isPopular ? 'MOST_POPULAR' : null, monthlyPrice: Number(plan.monthlyPrice), yearlyPrice: Number(plan.yearlyPrice), currency: plan.currency, status: plan.status, visibility: plan.visibility, activeSubscribers: plan.activeSubscribersPlaceholder, features: Object.entries(this.boolMap(plan.featuresJson)).filter(([, enabled]) => enabled).map(([key]) => key), limits: this.limits(plan.limitsJson), isPopular: plan.isPopular, createdAt: plan.createdAt }; }
  private async toPlanDetail(plan: SubscriptionPlan) { const catalog = await this.planFeaturesRepository.findManyFeatures({ where: { isActive: true } }); const features = this.boolMap(plan.featuresJson); return { ...this.toPlanListItem(plan), activeSubscribersChangePercent: 0, features: catalog.map((item) => ({ key: item.key, label: item.label, description: item.description, enabled: features[item.key] ?? false })), updatedAt: plan.updatedAt }; }
  private toFeature(item: PlanFeatureCatalog) { return { id: item.id, key: item.key, label: item.label, description: item.description, type: item.type, isActive: item.isActive, sortOrder: item.sortOrder, createdAt: item.createdAt, updatedAt: item.updatedAt }; }
  private toCoupon(coupon: Coupon) { return { id: coupon.id, code: coupon.code, description: coupon.description, discountType: coupon.discountType, discountValue: Number(coupon.discountValue), planIds: this.stringArray(coupon.planIdsJson), startsAt: coupon.startsAt, expiresAt: coupon.expiresAt, maxRedemptions: coupon.maxRedemptions, redemptionCount: coupon.redemptionCount, isActive: coupon.isActive, status: this.couponStatus(coupon), createdAt: coupon.createdAt }; }
  private couponStatus(coupon: Coupon): CouponStatus { if (coupon.expiresAt && coupon.expiresAt.getTime() <= Date.now()) return CouponStatus.EXPIRED; return coupon.isActive ? CouponStatus.ACTIVE : CouponStatus.INACTIVE; }
  private boolMap(value: Prisma.JsonValue): Record<string, boolean> { return typeof value === 'object' && value !== null && !Array.isArray(value) ? Object.fromEntries(Object.entries(value).filter((entry): entry is [string, boolean] => typeof entry[1] === 'boolean')) : {}; }
  private limits(value: Prisma.JsonValue) { return typeof value === 'object' && value !== null && !Array.isArray(value) ? value : this.defaultLimits(); }
  private defaultLimits() { return { maxGiftsPerMonth: -1, maxGroupGiftingEvents: -1, maxTeamMembers: -1, storageGb: -1 }; }
  private stringArray(value: Prisma.JsonValue): string[] { return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []; }
  private async uniqueSlug(name: string, exceptId?: string): Promise<string> { const base = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'plan'; let slug = base; let i = 1; while (await this.subscriptionPlansRepository.findPlanBySlug(slug, exceptId)) slug = `${base}-${i++}`; return slug; }
  private toJson(value: unknown): Prisma.InputJsonValue { return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue; }
  private async audit(actorId: string, targetId: string, action: string, beforeJson: unknown, afterJson: unknown): Promise<void> { await this.auditLog.write({ actorId, targetId, targetType: action.startsWith('COUPON') ? 'COUPON' : 'SUBSCRIPTION_PLAN', action, beforeJson, afterJson }); }
  private async auditFeature(actorId: string, targetId: string, action: string, beforeJson: unknown, afterJson: unknown): Promise<void> { await this.auditLog.write({ actorId, targetId, targetType: 'PLAN_FEATURE', action, beforeJson, afterJson }); }
}
