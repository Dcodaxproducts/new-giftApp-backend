import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AdminPayoutSettings, CommissionTier, Prisma } from '@prisma/client';
import { AuthUserContext } from '../../../common/decorators/current-user.decorator';
import { AuditLogWriterService } from '../../../common/services/audit-log.service';
import { ListPayoutSettingsAuditLogsDto, UpdateAdminPayoutSettingsDto, UpsertCommissionTierDto } from '../dto/admin-payout-settings.dto';
import { AdminPayoutSettingsRepository } from '../repositories/admin-payout-settings.repository';
import { CommissionTiersRepository } from '../repositories/commission-tiers.repository';

type SettingsWithUpdater = AdminPayoutSettings & { updatedBy?: { id: string; firstName: string; lastName: string } | null };
type TierWithUpdater = CommissionTier & { updatedBy?: { id: string; firstName: string; lastName: string } | null };

@Injectable()
export class AdminPayoutSettingsService {
  constructor(
    private readonly settingsRepository: AdminPayoutSettingsRepository,
    private readonly commissionTiersRepository: CommissionTiersRepository,
    private readonly auditLog: AuditLogWriterService,
    private readonly configService: ConfigService,
  ) {}

  async get() {
    const [settings, tiers] = await Promise.all([this.getOrCreate(), this.commissionTiersRepository.findActiveTiers()]);
    return { data: { ...this.toSettingsView(settings), commissionTiers: tiers.map((tier) => this.toTierView(tier)) }, message: 'Payout settings fetched successfully.' };
  }

  async update(user: AuthUserContext, dto: UpdateAdminPayoutSettingsDto, ipAddress?: string, userAgent?: string | string[]) {
    this.assertCurrencyAllowed(dto.currency);
    const current = await this.getOrCreate();
    const before = this.toSettingsAuditView(current);
    const updated = await this.settingsRepository.updateSettings(current.id, {
      platformRatePercent: new Prisma.Decimal(dto.platformRatePercent),
      minimumPayoutThreshold: new Prisma.Decimal(dto.minimumPayoutThreshold),
      currency: dto.currency.toUpperCase(),
      payoutSchedule: dto.payoutSchedule,
      payoutTimeUtc: dto.payoutTimeUtc,
      autoPayoutEnabled: dto.autoPayoutEnabled,
      updatedById: user.uid,
    });
    const after = this.toSettingsAuditView(updated);
    await this.writeAudit(user, current.id, 'PAYOUT_SETTINGS_UPDATED', 'PAYOUT_SETTINGS', before, after, ipAddress, userAgent);
    return { data: this.toSettingsView(updated), message: 'Payout settings updated successfully.' };
  }

  async tiers() {
    const tiers = await this.commissionTiersRepository.findActiveTiers();
    return { data: tiers.map((tier) => this.toTierView(tier)), message: 'Commission tiers fetched successfully.' };
  }

  async createTier(user: AuthUserContext, dto: UpsertCommissionTierDto, ipAddress?: string, userAgent?: string | string[]) {
    await this.assertThresholdAvailable(dto.orderVolumeThreshold);
    const created = await this.commissionTiersRepository.createTier({ name: dto.name.trim(), commissionRatePercent: new Prisma.Decimal(dto.commissionRatePercent), orderVolumeThreshold: new Prisma.Decimal(dto.orderVolumeThreshold), sortOrder: dto.sortOrder, isActive: dto.isActive, updatedById: user.uid });
    const after = this.toTierAuditView(created);
    await this.writeAudit(user, created.id, 'COMMISSION_TIER_CREATED', 'COMMISSION_TIER', null, after, ipAddress, userAgent);
    return { data: this.toTierView(created), message: 'Commission tier created successfully.' };
  }

  async updateTier(user: AuthUserContext, id: string, dto: UpsertCommissionTierDto, ipAddress?: string, userAgent?: string | string[]) {
    const current = await this.getTier(id);
    await this.assertThresholdAvailable(dto.orderVolumeThreshold, id);
    const before = this.toTierAuditView(current);
    const updated = await this.commissionTiersRepository.updateTier(id, { name: dto.name.trim(), commissionRatePercent: new Prisma.Decimal(dto.commissionRatePercent), orderVolumeThreshold: new Prisma.Decimal(dto.orderVolumeThreshold), sortOrder: dto.sortOrder, isActive: dto.isActive, updatedById: user.uid });
    const after = this.toTierAuditView(updated);
    await this.writeAudit(user, id, 'COMMISSION_TIER_UPDATED', 'COMMISSION_TIER', before, after, ipAddress, userAgent);
    return { data: this.toTierView(updated), message: 'Commission tier updated successfully.' };
  }

  async deleteTier(user: AuthUserContext, id: string, ipAddress?: string, userAgent?: string | string[]) {
    const current = await this.getTier(id);
    const before = this.toTierAuditView(current);
    const deleted = await this.commissionTiersRepository.deleteTier(id, user.uid);
    const after = this.toTierAuditView(deleted);
    await this.writeAudit(user, id, 'COMMISSION_TIER_DELETED', 'COMMISSION_TIER', before, after, ipAddress, userAgent);
    return { data: { id: deleted.id, deleted: true }, message: 'Commission tier deleted successfully.' };
  }

  async auditLogs(query: ListPayoutSettingsAuditLogsDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const where: Prisma.AdminAuditLogWhereInput = { action: { in: ['PAYOUT_SETTINGS_UPDATED', 'COMMISSION_TIER_CREATED', 'COMMISSION_TIER_UPDATED', 'COMMISSION_TIER_DELETED'] }, createdAt: { gte: query.fromDate ? new Date(query.fromDate) : undefined, lte: query.toDate ? new Date(query.toDate) : undefined } };
    const [items, total] = await this.settingsRepository.findAuditLogsWithCount({ where, skip: (page - 1) * limit, take: limit });
    return { data: items.map((item) => ({ id: item.id, action: item.action, actor: item.actor ? { id: item.actor.id, name: this.name(item.actor) } : null, targetType: item.targetType, before: item.beforeJson ?? null, after: item.afterJson ?? null, createdAt: item.createdAt })), meta: { page, limit, total, totalPages: Math.ceil(total / limit) }, message: 'Payout settings audit logs fetched successfully.' };
  }

  private async getOrCreate(): Promise<SettingsWithUpdater> {
    const settings = await this.settingsRepository.findFirstSettings();
    if (settings) return settings;
    return this.settingsRepository.createDefaultSettings(this.defaultCurrency());
  }

  private async getTier(id: string): Promise<TierWithUpdater> {
    const tier = await this.commissionTiersRepository.findTierById(id);
    if (!tier) throw new NotFoundException('Commission tier not found');
    return tier;
  }

  private async assertThresholdAvailable(threshold: number, excludeId?: string): Promise<void> {
    const duplicate = await this.commissionTiersRepository.findTierByThreshold(new Prisma.Decimal(threshold), excludeId);
    if (duplicate) throw new ConflictException('Commission tier orderVolumeThreshold already exists');
  }

  private assertCurrencyAllowed(currency: string): void {
    const normalized = currency.toUpperCase();
    if (!this.allowedCurrencies().has(normalized)) throw new BadRequestException('Currency does not match supported payout currency');
  }

  private allowedCurrencies(): Set<string> {
    const configured = this.configService.get<string>('PAYOUT_ALLOWED_CURRENCIES');
    if (!configured) return new Set([this.defaultCurrency()]);
    return new Set(configured.split(',').map((currency) => currency.trim().toUpperCase()).filter(Boolean));
  }

  private defaultCurrency(): string { return this.configService.get<string>('PAYOUT_DEFAULT_CURRENCY', 'USD').toUpperCase(); }
  private toSettingsView(settings: SettingsWithUpdater) { return { platformRatePercent: this.money(settings.platformRatePercent), minimumPayoutThreshold: this.money(settings.minimumPayoutThreshold), currency: settings.currency, payoutSchedule: settings.payoutSchedule, payoutTimeUtc: settings.payoutTimeUtc, autoPayoutEnabled: settings.autoPayoutEnabled, lastUpdatedAt: settings.updatedAt }; }
  private toSettingsAuditView(settings: SettingsWithUpdater) { return this.toSettingsView(settings); }
  private toTierView(tier: TierWithUpdater) { return { id: tier.id, name: tier.name, commissionRatePercent: this.money(tier.commissionRatePercent), orderVolumeThreshold: this.money(tier.orderVolumeThreshold), sortOrder: tier.sortOrder, isActive: tier.isActive }; }
  private toTierAuditView(tier: TierWithUpdater) { return { ...this.toTierView(tier), deletedAt: tier.deletedAt }; }
  private async writeAudit(user: AuthUserContext, targetId: string, action: string, targetType: string, beforeJson: unknown, afterJson: unknown, ipAddress?: string, userAgent?: string | string[]) { await this.auditLog.write({ actorId: user.uid, targetId, targetType, action, module: 'Commission & Payout Settings', beforeJson, afterJson, metadataJson: { appliesToFuturePayoutsOnly: true, tierChangesEffectiveFrom: 'NEXT_BILLING_OR_PAYOUT_CYCLE' }, ipAddress, userAgent: Array.isArray(userAgent) ? userAgent.join(', ') : userAgent }); }
  private money(value: Prisma.Decimal | number): number { return Number(Number(value).toFixed(2)); }
  private name(user: { firstName: string; lastName: string }): string { return `${user.firstName} ${user.lastName}`.trim(); }
}
