import { BadRequestException, Injectable } from '@nestjs/common';
import { MessagingSettings, Prisma } from '@prisma/client';
import { AuthUserContext } from '../../../common/decorators/current-user.decorator';
import { MediaUploadPolicyService } from '../../media-upload-policy/media-upload-policy.service';
import { ListMessagingSettingsAuditLogsDto, UpdateMessagingSettingsDto } from '../dto/messaging-settings.dto';
import { MessagingSettingsRepository } from '../repositories/messaging-settings.repository';
import { getPagination } from '../../../common/pagination/pagination.util';

type SettingsWithUpdater = MessagingSettings & { updatedBy?: { id: string; firstName: string; lastName: string } | null };

@Injectable()
export class MessagingSettingsService {
  private readonly defaultAttachmentTypes = ['jpg', 'jpeg', 'png', 'pdf', 'mp4'];
  private readonly defaultFlagKeywords = ['refund outside platform', 'bank account', 'whatsapp me'];
  private readonly neverAllowedAttachmentTypes = new Set(['exe', 'bat', 'cmd', 'sh', 'js', 'mjs', 'php', 'py', 'rb', 'jar', 'com', 'scr']);

  constructor(private readonly repository: MessagingSettingsRepository, private readonly mediaUploadPolicy: MediaUploadPolicyService) {}

  async getSettings(): Promise<SettingsWithUpdater> {
    return (await this.repository.findFirstSettings()) ?? this.repository.createDefaultSettings({ allowedAttachmentTypesJson: this.defaultAttachmentTypes, autoFlagKeywordsJson: this.defaultFlagKeywords });
  }

  async get() { return { data: this.toView(await this.getSettings()), message: 'Messaging settings fetched successfully.' }; }

  async update(user: AuthUserContext, dto: UpdateMessagingSettingsDto, ipAddress?: string, userAgent?: string | string[]) {
    const current = await this.getSettings();
    const before = this.toView(current);
    const data = await this.updateInput(dto, user.uid);
    const updated = await this.repository.updateSettings(current.id, data);
    const after = this.toView(updated);
    await this.repository.createAuditLog({ actorId: user.uid, targetId: updated.id, targetType: 'MESSAGING_SETTINGS', action: 'MESSAGING_SETTINGS_UPDATED', actionLabel: 'Messaging settings updated', module: 'messagingSettings', beforeJson: this.toJson(before), afterJson: this.toJson(after), ipAddress, userAgent: this.normalizeUserAgent(userAgent) });
    return { data: after, message: 'Messaging settings updated successfully.' };
  }

  async auditLogs(query: ListMessagingSettingsAuditLogsDto) {
    const { page, limit, skip, take } = getPagination(query);
    const where: Prisma.AdminAuditLogWhereInput = { module: 'messagingSettings' };
    const [items, total] = await this.repository.findAuditLogsWithCount({ where, skip, take });
    return { data: items.map((item) => ({ id: item.id, action: item.action, actor: item.actor ? { id: item.actor.id, name: `${item.actor.firstName} ${item.actor.lastName}`.trim() } : null, before: item.beforeJson ?? {}, after: item.afterJson ?? {}, createdAt: item.createdAt })), meta: { page, limit, total, totalPages: Math.ceil(total / limit) }, message: 'Messaging settings audit logs fetched successfully.' };
  }

  toView(settings: SettingsWithUpdater) {
    return {
      buyerProviderChatEnabled: settings.buyerProviderChatEnabled,
      supportChatEnabled: settings.supportChatEnabled,
      messageRetentionDays: settings.messageRetentionDays,
      maxMessageLength: settings.maxMessageLength,
      maxAttachmentsPerMessage: settings.maxAttachmentsPerMessage,
      allowedAttachmentTypes: this.stringArray(settings.allowedAttachmentTypesJson),
      profanityFilterEnabled: settings.profanityFilterEnabled,
      piiFilterEnabled: settings.piiFilterEnabled,
      autoFlagEnabled: settings.autoFlagEnabled,
      autoFlagKeywords: this.stringArray(settings.autoFlagKeywordsJson),
      offlineNotificationDelaySeconds: settings.offlineNotificationDelaySeconds,
      messageEditWindowMinutes: settings.messageEditWindowMinutes,
      lastUpdatedAt: settings.updatedAt,
      lastUpdatedBy: settings.updatedBy ? { id: settings.updatedBy.id, name: `${settings.updatedBy.firstName} ${settings.updatedBy.lastName}`.trim() } : null,
    };
  }

  private async updateInput(dto: UpdateMessagingSettingsDto, updatedById: string): Promise<Prisma.MessagingSettingsUncheckedUpdateInput> {
    const data: Prisma.MessagingSettingsUncheckedUpdateInput = { updatedById };
    if (dto.buyerProviderChatEnabled !== undefined) data.buyerProviderChatEnabled = dto.buyerProviderChatEnabled;
    if (dto.supportChatEnabled !== undefined) data.supportChatEnabled = dto.supportChatEnabled;
    if (dto.messageRetentionDays !== undefined) data.messageRetentionDays = dto.messageRetentionDays;
    if (dto.maxMessageLength !== undefined) data.maxMessageLength = dto.maxMessageLength;
    if (dto.maxAttachmentsPerMessage !== undefined) data.maxAttachmentsPerMessage = dto.maxAttachmentsPerMessage;
    if (dto.allowedAttachmentTypes !== undefined) data.allowedAttachmentTypesJson = await this.sanitizeAttachmentTypes(dto.allowedAttachmentTypes);
    if (dto.profanityFilterEnabled !== undefined) data.profanityFilterEnabled = dto.profanityFilterEnabled;
    if (dto.piiFilterEnabled !== undefined) data.piiFilterEnabled = dto.piiFilterEnabled;
    if (dto.autoFlagEnabled !== undefined) data.autoFlagEnabled = dto.autoFlagEnabled;
    if (dto.autoFlagKeywords !== undefined) data.autoFlagKeywordsJson = this.sanitizeKeywords(dto.autoFlagKeywords);
    if (dto.offlineNotificationDelaySeconds !== undefined) data.offlineNotificationDelaySeconds = dto.offlineNotificationDelaySeconds;
    if (dto.messageEditWindowMinutes !== undefined) data.messageEditWindowMinutes = dto.messageEditWindowMinutes;
    return data;
  }

  private async sanitizeAttachmentTypes(values: string[]): Promise<Prisma.InputJsonValue> {
    const normalized = [...new Set(values.map((value) => value.trim().toLowerCase()).filter(Boolean))];
    if (!normalized.length) throw new BadRequestException('At least one attachment type must be allowed.');
    for (const value of normalized) if (this.neverAllowedAttachmentTypes.has(value)) throw new BadRequestException('Executable or script file types must never be allowed.');
    const globallyAllowed = await this.mediaUploadPolicy.allowedExtensions();
    const blocked = normalized.filter((value) => !globallyAllowed.has(value));
    if (blocked.length) throw new BadRequestException(`Attachment types must also be enabled in media upload policy: ${blocked.join(', ')}`);
    return normalized;
  }

  private sanitizeKeywords(values: string[]): Prisma.InputJsonValue {
    return [...new Set(values.map((value) => value.trim().replace(/\s+/g, ' ').toLowerCase()).filter((value) => value.length >= 3))].slice(0, 50);
  }

  private stringArray(value: Prisma.JsonValue): string[] { return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []; }
  private toJson(value: unknown): Prisma.InputJsonValue { return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue; }
  private normalizeUserAgent(userAgent?: string | string[]): string | undefined { return Array.isArray(userAgent) ? userAgent.join(', ') : userAgent; }
}
