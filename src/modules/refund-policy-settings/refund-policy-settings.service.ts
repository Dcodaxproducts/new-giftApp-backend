import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RefundPolicySettings } from '@prisma/client';
import { AuthUserContext } from '../../common/decorators/current-user.decorator';
import { AuditLogWriterService } from '../../common/services/audit-log.service';
import { RefundPolicySettingsRepository } from './refund-policy-settings.repository';
import { UpdateRefundPolicySettingsDto } from './dto/refund-policy-settings.dto';

type SettingsRecord = RefundPolicySettings;

@Injectable()
export class RefundPolicySettingsService {
  constructor(private readonly repository: RefundPolicySettingsRepository, private readonly auditLog: AuditLogWriterService, private readonly configService: ConfigService) {}

  async get() {
    const settings = await this.getOrCreate();
    return { data: this.toView(settings), message: 'Refund policy settings fetched successfully.' };
  }

  async update(user: AuthUserContext, dto: UpdateRefundPolicySettingsDto, ipAddress?: string, userAgent?: string | string[]) {
    const current = await this.getOrCreate();
    const before = this.toView(current);
    const updated = await this.repository.updateSettings(current.id, {
      allowCancellation: dto.allowCancellation ?? current.allowCancellation,
      cancellationDeductionPercent: dto.cancellationDeductionPercent ?? current.cancellationDeductionPercent,
    });
    const after = this.toView(updated);
    await this.writeAudit(user, current.id, before, after, ipAddress);
    return { data: this.toView(updated), message: 'Refund policy settings updated successfully.' };
  }

  async getActivePolicy(): Promise<RefundPolicySettings> {
    return this.getOrCreate();
  }

  private async getOrCreate(): Promise<SettingsRecord> {
    const existing = await this.repository.findFirstSettings();
    if (existing) return existing;
    return this.repository.createDefaultSettings(this.platformCurrency());
  }

  private platformCurrency(): string { return this.configService.get<string>('STRIPE_CURRENCY', 'USD').toUpperCase(); }
  private toView(settings: SettingsRecord) { return { allowCancellation: settings.allowCancellation, cancellationDeductionPercent: Number(settings.cancellationDeductionPercent), lastUpdatedAt: settings.updatedAt }; }
  private async writeAudit(user: AuthUserContext, targetId: string, beforeJson: unknown, afterJson: unknown, ipAddress?: string) { await this.auditLog.write({ actorId: user.uid, targetId, targetType: 'REFUND_POLICY_SETTINGS', action: 'REFUND_POLICY_SETTINGS_UPDATED', module: 'Refund Policy Settings', beforeJson, afterJson, ipAddress }); }
}
