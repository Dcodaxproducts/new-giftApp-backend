import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { Prisma, RefundPolicySettings } from '@prisma/client';
import { AuthUserContext } from '../../../common/decorators/current-user.decorator';
import { AuditLogWriterService } from '../../../common/services/audit-log.service';
import { RefundPolicySettingsRepository } from '../repositories/refund-policy-settings.repository';
import { CancellationTierDto, ListRefundPolicyAuditLogsDto, UpdateRefundPolicySettingsDto } from '../dto/refund-policy-settings.dto';

type SettingsWithUpdater = RefundPolicySettings & { updatedBy?: { id: string; firstName: string; lastName: string } | null };
type EligibleCategory = { id: string; name: string };
type CancellationTier = { id: string; daysBeforeCheckIn: number; deductionPercent: number; label: string; sortOrder: number };

export interface RefundEligibilityInput {
  deliveredAt: Date;
  categoryIds: string[];
  requestedAmount: number;
  remainingRefundableAmount: number;
  paymentRefundable: boolean;
  riskFlagged?: boolean;
  now?: Date;
}

export interface RefundEligibilityResult {
  eligible: boolean;
  manualReviewRequired: boolean;
  autoApproveSmallRefund: boolean;
  canProcessWithoutSeniorReview: boolean;
  reasons: string[];
  policy: {
    allowRefund: boolean;
    refundWindowDays: number;
    autoRefundThresholdAmount: number;
    autoApproveSmallRefunds: boolean;
    smallRefundAutoApproveAmount: number;
    refundForAllCategories: boolean;
    eligibleCategoryIds: string[];
    cancellationTiers: CancellationTier[];
  };
}

@Injectable()
export class RefundPolicySettingsService {
  constructor(private readonly repository: RefundPolicySettingsRepository, private readonly auditLog: AuditLogWriterService, private readonly configService: ConfigService) {}

  async get() {
    const settings = await this.getOrCreate();
    const categories = await this.eligibleCategories(settings);
    return { data: this.toView(settings, categories), message: 'Refund policy settings fetched successfully.' };
  }

  async update(user: AuthUserContext, dto: UpdateRefundPolicySettingsDto, ipAddress?: string, userAgent?: string | string[]) {
    const current = await this.getOrCreate();
    const refundForAllCategories = dto.refundForAllCategories ?? (dto.eligibleCategoryIds === undefined ? current.refundForAllCategories : false);
    const eligibleCategoryIds = refundForAllCategories ? [] : (dto.eligibleCategoryIds ?? this.categoryIds(current.eligibleCategoryIdsJson));
    this.assertEligibleCategorySelection(refundForAllCategories, eligibleCategoryIds);
    this.assertSmallRefundLimit({
      autoApproveSmallRefunds: dto.autoApproveSmallRefunds ?? current.autoApproveSmallRefunds,
      autoRefundThresholdAmount: dto.autoRefundThresholdAmount ?? Number(current.autoRefundThresholdAmount),
      smallRefundAutoApproveAmount: dto.smallRefundAutoApproveAmount ?? Number(current.smallRefundAutoApproveAmount),
    });
    await this.assertActiveCategories(eligibleCategoryIds);
    const cancellationTiers = dto.cancellationTiers === undefined ? this.cancellationTiers(current.cancellationTiersJson) : this.normalizeCancellationTiers(dto.cancellationTiers);
    const before = this.toAuditView(current);
    const updated = await this.repository.updateSettings(current.id, {
      allowRefund: dto.allowRefund ?? current.allowRefund,
      noteText: dto.noteText ?? current.noteText,
      refundWindowDays: dto.refundWindowDays ?? current.refundWindowDays,
      autoRefundThresholdAmount: new Prisma.Decimal(dto.autoRefundThresholdAmount ?? Number(current.autoRefundThresholdAmount)),
      autoApproveSmallRefunds: dto.autoApproveSmallRefunds ?? current.autoApproveSmallRefunds,
      smallRefundAutoApproveAmount: new Prisma.Decimal(dto.smallRefundAutoApproveAmount ?? Number(current.smallRefundAutoApproveAmount)),
      refundForAllCategories,
      eligibleCategoryIdsJson: eligibleCategoryIds,
      cancellationTiersJson: cancellationTiers,
      updatedById: user.uid,
    });
    const after = this.toAuditView(updated);
    await this.writeAudit(user, current.id, before, after, ipAddress, userAgent);
    return { data: { ...after, lastUpdatedAt: updated.updatedAt }, message: 'Refund policy settings updated successfully.' };
  }

  async auditLogs(query: ListRefundPolicyAuditLogsDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const where: Prisma.AdminAuditLogWhereInput = { action: 'REFUND_POLICY_SETTINGS_UPDATED', createdAt: { gte: query.fromDate ? new Date(query.fromDate) : undefined, lte: query.toDate ? new Date(query.toDate) : undefined } };
    const [items, total] = await this.repository.findAuditLogsWithCount({ where, skip: (page - 1) * limit, take: limit });
    return { data: items.map((item) => ({ id: item.id, action: item.action, actor: item.actor ? { id: item.actor.id, name: this.name(item.actor) } : null, before: item.beforeJson ?? {}, after: item.afterJson ?? {}, createdAt: item.createdAt })), meta: { page, limit, total, totalPages: Math.ceil(total / limit) }, message: 'Refund policy audit logs fetched successfully.' };
  }

  async getActivePolicy(): Promise<RefundPolicySettings> { return this.getOrCreate(); }

  async evaluateRefundEligibility(input: RefundEligibilityInput): Promise<RefundEligibilityResult> {
    const settings = await this.getOrCreate();
    return this.evaluateWithPolicy(settings, input);
  }

  evaluateWithPolicy(settings: RefundPolicySettings, input: RefundEligibilityInput): RefundEligibilityResult {
    const eligibleCategoryIds = this.categoryIds(settings.eligibleCategoryIdsJson);
    const reasons: string[] = [];
    const daysSinceDelivery = this.daysBetween(input.deliveredAt, input.now ?? new Date());
    const categoryEligible = settings.refundForAllCategories || input.categoryIds.some((categoryId) => eligibleCategoryIds.includes(categoryId));

    if (!settings.allowRefund) reasons.push('REFUNDS_DISABLED_BY_POLICY');
    if (daysSinceDelivery > settings.refundWindowDays) reasons.push('REFUND_WINDOW_EXPIRED');
    if (!categoryEligible) reasons.push('CATEGORY_MANUAL_REVIEW_REQUIRED');
    if (!input.paymentRefundable) reasons.push('PAYMENT_NOT_REFUNDABLE');
    if (input.requestedAmount > input.remainingRefundableAmount) reasons.push('REQUESTED_AMOUNT_EXCEEDS_REMAINING_REFUNDABLE_AMOUNT');
    if (input.riskFlagged) reasons.push('RISK_REVIEW_REQUIRED');

    const eligible = reasons.length === 0;
    const autoApproveSmallRefund = eligible && settings.autoApproveSmallRefunds && input.requestedAmount <= Number(settings.smallRefundAutoApproveAmount);
    return {
      eligible,
      manualReviewRequired: settings.allowRefund && (!categoryEligible || input.requestedAmount > Number(settings.autoRefundThresholdAmount) || Boolean(input.riskFlagged)),
      autoApproveSmallRefund,
      canProcessWithoutSeniorReview: eligible && input.requestedAmount <= Number(settings.autoRefundThresholdAmount),
      reasons,
      policy: {
        allowRefund: settings.allowRefund,
        refundWindowDays: settings.refundWindowDays,
        autoRefundThresholdAmount: Number(settings.autoRefundThresholdAmount),
        autoApproveSmallRefunds: settings.autoApproveSmallRefunds,
        smallRefundAutoApproveAmount: Number(settings.smallRefundAutoApproveAmount),
        refundForAllCategories: settings.refundForAllCategories,
        eligibleCategoryIds,
        cancellationTiers: this.cancellationTiers(settings.cancellationTiersJson),
      },
    };
  }

  private async getOrCreate(): Promise<SettingsWithUpdater> {
    const existing = await this.repository.findFirstSettings();
    if (existing) return existing;
    return this.repository.createDefaultSettings(this.platformCurrency());
  }

  private async eligibleCategories(settings: SettingsWithUpdater): Promise<EligibleCategory[]> {
    if (settings.refundForAllCategories) return this.repository.findAllActiveCategories();
    return this.activeCategories(this.categoryIds(settings.eligibleCategoryIdsJson));
  }

  private async activeCategories(ids: string[]): Promise<EligibleCategory[]> {
    if (!ids.length) return [];
    return this.repository.findActiveCategories(ids);
  }

  private async assertActiveCategories(ids: string[]): Promise<void> {
    const categories = await this.repository.findCategoriesForValidation(ids);
    const foundIds = new Set(categories.map((category) => category.id));
    const missingIds = ids.filter((id) => !foundIds.has(id));
    if (missingIds.length) throw new BadRequestException(`Eligible category IDs do not exist: ${missingIds.join(', ')}`);
    const inactiveIds = categories.filter((category) => !category.isActive).map((category) => category.id);
    if (inactiveIds.length) throw new BadRequestException(`Inactive gift categories cannot be selected: ${inactiveIds.join(', ')}`);
  }

  private assertSmallRefundLimit(dto: { autoApproveSmallRefunds: boolean; smallRefundAutoApproveAmount: number; autoRefundThresholdAmount: number }): void {
    if (dto.autoApproveSmallRefunds && dto.smallRefundAutoApproveAmount > dto.autoRefundThresholdAmount) throw new BadRequestException('smallRefundAutoApproveAmount cannot exceed autoRefundThresholdAmount when autoApproveSmallRefunds is true');
  }

  private assertEligibleCategorySelection(refundForAllCategories: boolean, eligibleCategoryIds: string[]): void {
    if (!refundForAllCategories && eligibleCategoryIds.length === 0) throw new BadRequestException('eligibleCategoryIds is required when refundForAllCategories is false');
  }

  private normalizeCancellationTiers(tiers: CancellationTierDto[]): CancellationTier[] {
    const seenDays = new Set<number>();
    const normalized = tiers.map((tier) => {
      const label = tier.label.trim();
      if (!label) throw new BadRequestException('Cancellation tier label is required');
      if (seenDays.has(tier.daysBeforeCheckIn)) throw new BadRequestException('Duplicate cancellation tier daysBeforeCheckIn values are not allowed');
      seenDays.add(tier.daysBeforeCheckIn);
      return { id: randomUUID(), daysBeforeCheckIn: tier.daysBeforeCheckIn, deductionPercent: tier.deductionPercent, label, sortOrder: tier.sortOrder ?? 0 };
    });
    return normalized.sort((left, right) => (left.sortOrder || Number.MAX_SAFE_INTEGER) - (right.sortOrder || Number.MAX_SAFE_INTEGER) || right.daysBeforeCheckIn - left.daysBeforeCheckIn).map((tier, index) => ({ ...tier, sortOrder: index + 1 }));
  }

  private platformCurrency(): string { return this.configService.get<string>('STRIPE_CURRENCY', 'PKR').toUpperCase(); }
  private categoryIds(value: Prisma.JsonValue): string[] { return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []; }
  private cancellationTiers(value: Prisma.JsonValue): CancellationTier[] {
    if (!Array.isArray(value)) return [];
    return value
      .filter((item): item is Prisma.JsonObject => Boolean(item) && typeof item === 'object' && !Array.isArray(item))
      .map((item, index) => ({
        id: typeof item.id === 'string' ? item.id : `tier_${index + 1}`,
        daysBeforeCheckIn: typeof item.daysBeforeCheckIn === 'number' ? item.daysBeforeCheckIn : 0,
        deductionPercent: typeof item.deductionPercent === 'number' ? item.deductionPercent : 0,
        label: typeof item.label === 'string' ? item.label : '',
        sortOrder: typeof item.sortOrder === 'number' ? item.sortOrder : index + 1,
      }))
      .sort((left, right) => left.sortOrder - right.sortOrder || right.daysBeforeCheckIn - left.daysBeforeCheckIn);
  }
  private toView(settings: SettingsWithUpdater, categories: EligibleCategory[]) { return { allowRefund: settings.allowRefund, noteText: settings.noteText, refundWindowDays: settings.refundWindowDays, autoRefundThresholdAmount: Number(settings.autoRefundThresholdAmount), autoApproveSmallRefunds: settings.autoApproveSmallRefunds, smallRefundAutoApproveAmount: Number(settings.smallRefundAutoApproveAmount), refundForAllCategories: settings.refundForAllCategories, eligibleCategories: categories, cancellationTiers: this.cancellationTiers(settings.cancellationTiersJson), lastUpdatedAt: settings.updatedAt, lastUpdatedBy: settings.updatedBy ? { id: settings.updatedBy.id, name: this.name(settings.updatedBy) } : null }; }
  private toAuditView(settings: SettingsWithUpdater) { return { allowRefund: settings.allowRefund, noteText: settings.noteText, refundWindowDays: settings.refundWindowDays, autoRefundThresholdAmount: Number(settings.autoRefundThresholdAmount), autoApproveSmallRefunds: settings.autoApproveSmallRefunds, smallRefundAutoApproveAmount: Number(settings.smallRefundAutoApproveAmount), refundForAllCategories: settings.refundForAllCategories, eligibleCategoryIds: this.categoryIds(settings.eligibleCategoryIdsJson), cancellationTiers: this.cancellationTiers(settings.cancellationTiersJson) }; }
  private async writeAudit(user: AuthUserContext, targetId: string, beforeJson: unknown, afterJson: unknown, ipAddress?: string, userAgent?: string | string[]) { await this.auditLog.write({ actorId: user.uid, targetId, targetType: 'REFUND_POLICY_SETTINGS', action: 'REFUND_POLICY_SETTINGS_UPDATED', module: 'Refund Policy Settings', beforeJson, afterJson, ipAddress, userAgent: Array.isArray(userAgent) ? userAgent.join(', ') : userAgent }); }
  private daysBetween(from: Date, to: Date): number { return Math.floor((to.getTime() - from.getTime()) / 86_400_000); }
  private name(user: { firstName: string; lastName: string }): string { return `${user.firstName} ${user.lastName}`.trim(); }
}
