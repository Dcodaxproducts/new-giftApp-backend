import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, SystemSettings } from '@prisma/client';
import { AuthUserContext } from '../../common/decorators/current-user.decorator';
import { AuditLogWriterService } from '../../common/services/audit-log.service';
import { UpdateSystemSettingsDto } from './dto/system-settings.dto';
import { SystemSettingsRepository } from './system-settings.repository';

type SettingsWithUpdater = SystemSettings & { updatedBy?: { id: string; firstName: string; lastName: string } | null };

const MASK = '************';
type OptionalTextInput = string | null | undefined;

@Injectable()
export class SystemSettingsService {
  constructor(
    private readonly repository: SystemSettingsRepository,
    private readonly auditLog: AuditLogWriterService,
    private readonly configService: ConfigService,
  ) {}

  async get() {
    const settings = await this.getOrCreate();
    return { data: this.toView(settings), message: 'System settings fetched successfully.' };
  }

  async update(user: AuthUserContext, dto: UpdateSystemSettingsDto, ipAddress?: string, userAgent?: string | string[]) {
    const current = await this.getOrCreate();
    const before = this.toAuditView(current);
    const updated = await this.repository.updateSettings(current.id, {
      applicationName: dto.platformInfo.applicationName.trim(),
      supportEmail: dto.platformInfo.supportEmail.trim(),
      platformLogoUrl: this.stableUrl(dto.platformInfo.platformLogoUrl),
      stripePublishableKey: this.nullableTrim(dto.payments.stripePublishableKey),
      stripeSecretKey: this.secretValue(dto.payments.stripeSecretKey, current.stripeSecretKey),
      stripeWebhookSecret: this.secretValue(dto.payments.stripeWebhookSecret, current.stripeWebhookSecret),
      firebaseServiceAccountJson: this.firebaseValue(dto.firebase.firebaseServiceAccountJson, current.firebaseServiceAccountJson),
      awsS3BucketName: this.nullableTrim(dto.storage.awsS3BucketName),
      awsRegion: this.nullableTrim(dto.storage.awsRegion),
      awsAccessKey: this.secretValue(dto.storage.awsAccessKey, current.awsAccessKey),
      awsSecretKey: this.secretValue(dto.storage.awsSecretKey, current.awsSecretKey),
      smtpHost: this.nullableTrim(dto.email.smtpHost),
      smtpPort: dto.email.smtpPort ?? null,
      smtpUsername: this.nullableTrim(dto.email.smtpUsername),
      smtpPassword: this.secretValue(dto.email.smtpPassword, current.smtpPassword),
      senderEmail: this.nullableTrim(dto.email.senderEmail),
      senderName: this.nullableTrim(dto.email.senderName),
      platformRatePercent: new Prisma.Decimal(dto.financial.platformRatePercent),
      minimumPayoutThreshold: new Prisma.Decimal(dto.financial.minimumPayoutThreshold),
      updatedById: user.uid,
    });
    await this.writeAudit(user, current.id, 'SYSTEM_SETTINGS_UPDATED', before, this.toAuditView(updated), ipAddress, userAgent);
    return { data: this.toView(updated), message: 'System settings updated successfully.' };
  }

  private async getOrCreate(): Promise<SettingsWithUpdater> {
    const existing = await this.repository.findFirstSettings();
    if (existing) return existing;
    return this.repository.createDefaultSettings({
      applicationName: this.configService.get<string>('APP_NAME', 'Gift App'),
      supportEmail: this.configService.get<string>('APP_SUPPORT_EMAIL', 'support@giftapp.com'),
      platformLogoUrl: this.configService.get<string>('APP_LOGO_URL'),
      stripePublishableKey: this.configService.get<string>('STRIPE_PUBLISHABLE_KEY'),
      stripeSecretKey: this.configService.get<string>('STRIPE_SECRET_KEY'),
      stripeWebhookSecret: this.configService.get<string>('STRIPE_WEBHOOK_SECRET'),
      awsS3BucketName: this.configService.get<string>('AWS_BUCKET_NAME'),
      awsRegion: this.configService.get<string>('AWS_REGION'),
      awsAccessKey: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
      awsSecretKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY'),
      smtpHost: this.configService.get<string>('MAIL_HOST'),
      smtpPort: this.optionalNumber(this.configService.get<string>('MAIL_PORT')),
      smtpUsername: this.configService.get<string>('MAIL_USERNAME'),
      smtpPassword: this.configService.get<string>('MAIL_PASSWORD'),
      senderEmail: this.configService.get<string>('MAIL_FROM_ADDRESS'),
      senderName: this.configService.get<string>('MAIL_FROM_NAME'),
    });
  }

  private toView(settings: SettingsWithUpdater) {
    return {
      platformInfo: {
        applicationName: settings.applicationName,
        supportEmail: settings.supportEmail,
        platformLogoUrl: settings.platformLogoUrl,
      },
      payments: {
        stripePublishableKey: settings.stripePublishableKey,
        stripeSecretKey: this.mask(settings.stripeSecretKey),
        stripeWebhookSecret: this.mask(settings.stripeWebhookSecret),
      },
      firebase: {
        firebaseServiceAccountJson: this.maskJson(settings.firebaseServiceAccountJson),
      },
      storage: {
        awsS3BucketName: settings.awsS3BucketName,
        awsRegion: settings.awsRegion,
        awsAccessKey: this.mask(settings.awsAccessKey),
        awsSecretKey: this.mask(settings.awsSecretKey),
      },
      email: {
        smtpHost: settings.smtpHost,
        smtpPort: settings.smtpPort,
        smtpUsername: settings.smtpUsername,
        smtpPassword: this.mask(settings.smtpPassword),
        senderEmail: settings.senderEmail,
        senderName: settings.senderName,
      },
      financial: {
        platformRatePercent: Number(settings.platformRatePercent),
        minimumPayoutThreshold: Number(settings.minimumPayoutThreshold),
      },
    };
  }

  private toAuditView(settings: SettingsWithUpdater) {
    return this.toView(settings);
  }

  private secretValue(input: OptionalTextInput, current: string | null): string | null | undefined {
    if (input === undefined || input === null) return input === undefined ? undefined : current;
    const trimmed = input.trim();
    if (!trimmed || trimmed === MASK) return current;
    return trimmed;
  }

  private firebaseValue(input: OptionalTextInput, current: Prisma.JsonValue | null): Prisma.InputJsonValue | undefined {
    if (input === undefined) return undefined;
    if (input === null) return current === null ? undefined : current as Prisma.InputJsonValue;
    const trimmed = input.trim();
    if (!trimmed || trimmed === MASK) return current === null ? undefined : current as Prisma.InputJsonValue;
    try {
      const parsed = JSON.parse(trimmed) as Prisma.InputJsonValue;
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Firebase service account must be a JSON object');
      return parsed;
    } catch {
      throw new BadRequestException('firebaseServiceAccountJson must be a valid JSON object string.');
    }
  }

  private nullableTrim(value: OptionalTextInput): string | null | undefined {
    if (value === undefined) return undefined;
    if (value === null) return null;
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }

  private stableUrl(value: OptionalTextInput): string | null | undefined {
    const trimmed = this.nullableTrim(value);
    if (!trimmed) return trimmed;
    return trimmed.split('?')[0];
  }

  private mask(value?: string | null): string | null {
    return value ? MASK : null;
  }

  private maskJson(value: Prisma.JsonValue | null): string | null {
    return value ? MASK : null;
  }

  private optionalNumber(value?: string): number | undefined {
    if (!value) return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  private async writeAudit(user: AuthUserContext, targetId: string | null, action: string, beforeJson: unknown, afterJson: unknown, ipAddress?: string, _userAgent?: string | string[]) {
    await this.auditLog.write({ actorId: user.uid, targetId, targetType: 'SYSTEM_SETTINGS', action, module: 'System Settings', beforeJson, afterJson, ipAddress });
  }
}
