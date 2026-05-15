import { Injectable } from '@nestjs/common';
import { Prisma, ReferralExpirationUnit, ReferralSettings } from '@prisma/client';
import { AuthUserContext } from '../../common/decorators/current-user.decorator';
import { AuditLogWriterService } from '../../common/services/audit-log.service';
import { ReferralSettingsRepository } from './referral-settings.repository';
import { DeactivateReferralSettingsDto, ListReferralSettingsAuditLogsDto, UpdateReferralSettingsDto } from './dto/referral-settings.dto';

type SettingsWithUpdater = ReferralSettings & { updatedBy?: { id: string; firstName: string; lastName: string } | null };

@Injectable()
export class ReferralSettingsService {
  constructor(private readonly repository: ReferralSettingsRepository, private readonly auditLog: AuditLogWriterService) {}

  async get() { return { data: this.toView(await this.getOrCreate()), message: 'Referral settings fetched successfully.' }; }

  async update(user: AuthUserContext, dto: UpdateReferralSettingsDto, ipAddress?: string, userAgent?: string | string[]) {
    const current = await this.getOrCreate();
    const before = this.toView(current);
    const updated = await this.repository.updateSettings(current.id, { referrerRewardAmount: new Prisma.Decimal(dto.referrerRewardAmount), newUserRewardAmount: new Prisma.Decimal(dto.newUserRewardAmount), rewardCurrency: dto.rewardCurrency.toUpperCase(), minimumTransactionAmount: new Prisma.Decimal(dto.minimumTransactionAmount), referralExpirationValue: dto.referralExpirationValue, referralExpirationUnit: dto.referralExpirationUnit, allowSelfReferrals: dto.allowSelfReferrals, qualificationRule: dto.qualificationRule, updatedById: user.uid });
    const after = this.toView(updated);
    await this.writeAudit(user, 'REFERRAL_SETTINGS_UPDATED', current.id, before, after, ipAddress, userAgent);
    return { data: { isActive: after.isActive, referrerRewardAmount: after.referrerRewardAmount, newUserRewardAmount: after.newUserRewardAmount, rewardCurrency: after.rewardCurrency, minimumTransactionAmount: after.minimumTransactionAmount, referralExpirationValue: after.referralExpirationValue, referralExpirationUnit: after.referralExpirationUnit, allowSelfReferrals: after.allowSelfReferrals }, message: 'Referral settings updated successfully.' };
  }

  async activate(user: AuthUserContext, ipAddress?: string, userAgent?: string | string[]) {
    const current = await this.getOrCreate();
    const before = this.toView(current);
    const updated = await this.repository.updateSettings(current.id, { isActive: true, updatedById: user.uid });
    await this.writeAudit(user, 'REFERRAL_PROGRAM_ACTIVATED', current.id, before, this.toView(updated), ipAddress, userAgent);
    return { data: { isActive: true }, message: 'Referral program activated successfully.' };
  }

  async deactivate(user: AuthUserContext, dto: DeactivateReferralSettingsDto, ipAddress?: string, userAgent?: string | string[]) {
    const current = await this.getOrCreate();
    const before = this.toView(current);
    const updated = await this.repository.updateSettings(current.id, { isActive: false, updatedById: user.uid });
    await this.writeAudit(user, 'REFERRAL_PROGRAM_DEACTIVATED', current.id, before, { ...this.toView(updated), reason: dto.reason }, ipAddress, userAgent);
    return { data: { isActive: false }, message: 'Referral program deactivated successfully.' };
  }

  async stats() {
    const settings = await this.getOrCreate();
    const [totalReferrals, successfulReferrals, pendingReferrals, rewards] = await this.repository.getStats();
    return { data: { totalReferrals, totalRewardsIssued: this.money(rewards.reduce((sum, item) => sum + Number(item.amount), 0)), currency: settings.rewardCurrency, activeProgram: settings.isActive, successfulReferrals, pendingReferrals }, message: 'Referral stats fetched successfully.' };
  }

  async auditLogs(query: ListReferralSettingsAuditLogsDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const where: Prisma.AdminAuditLogWhereInput = { action: { in: ['REFERRAL_SETTINGS_UPDATED', 'REFERRAL_PROGRAM_ACTIVATED', 'REFERRAL_PROGRAM_DEACTIVATED'] }, createdAt: { gte: query.fromDate ? new Date(query.fromDate) : undefined, lte: query.toDate ? new Date(query.toDate) : undefined } };
    const [items, total] = await this.repository.findAuditLogsWithCount({ where, skip: (page - 1) * limit, take: limit });
    return { data: items.map((item) => ({ id: item.id, action: item.action, actor: item.actor ? { id: item.actor.id, name: `${item.actor.firstName} ${item.actor.lastName}`.trim() } : null, before: item.beforeJson ?? {}, after: item.afterJson ?? {}, createdAt: item.createdAt })), meta: { page, limit, total, totalPages: Math.ceil(total / limit) }, message: 'Referral settings audit logs fetched successfully.' };
  }

  async getActiveSettings(): Promise<ReferralSettings> { return this.getOrCreate(); }

  expiresAt(settings: ReferralSettings, from = new Date()): Date {
    const date = new Date(from);
    if (settings.referralExpirationUnit === ReferralExpirationUnit.DAYS) date.setUTCDate(date.getUTCDate() + settings.referralExpirationValue);
    if (settings.referralExpirationUnit === ReferralExpirationUnit.WEEKS) date.setUTCDate(date.getUTCDate() + settings.referralExpirationValue * 7);
    if (settings.referralExpirationUnit === ReferralExpirationUnit.MONTHS) date.setUTCMonth(date.getUTCMonth() + settings.referralExpirationValue);
    return date;
  }

  private async getOrCreate(): Promise<SettingsWithUpdater> {
    const existing = await this.repository.findFirstSettings();
    if (existing) return existing;
    return this.repository.createDefaultSettings();
  }

  private toView(settings: SettingsWithUpdater) { return { isActive: settings.isActive, referrerRewardAmount: Number(settings.referrerRewardAmount), newUserRewardAmount: Number(settings.newUserRewardAmount), rewardCurrency: settings.rewardCurrency, minimumTransactionAmount: Number(settings.minimumTransactionAmount), referralExpirationValue: settings.referralExpirationValue, referralExpirationUnit: settings.referralExpirationUnit, allowSelfReferrals: settings.allowSelfReferrals, qualificationRule: settings.qualificationRule, updatedAt: settings.updatedAt, updatedBy: settings.updatedBy ? { id: settings.updatedBy.id, name: `${settings.updatedBy.firstName} ${settings.updatedBy.lastName}`.trim() } : null }; }
  private async writeAudit(user: AuthUserContext, action: string, targetId: string, beforeJson: unknown, afterJson: unknown, ipAddress?: string, userAgent?: string | string[]) { await this.auditLog.write({ actorId: user.uid, targetId, targetType: 'REFERRAL_SETTINGS', action, beforeJson, afterJson, ipAddress, userAgent: Array.isArray(userAgent) ? userAgent.join(', ') : userAgent }); }
  private money(value: number): number { return Number(value.toFixed(2)); }
}
