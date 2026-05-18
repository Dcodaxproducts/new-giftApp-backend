import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { MessagingSettingsService } from './messaging-settings.service';

export type MessagingChannel = 'buyerProvider' | 'support';

@Injectable()
export class MessagingPolicyService {
  constructor(private readonly settingsService: MessagingSettingsService) {}

  async assertCanSend(params: { channel: MessagingChannel; body?: string | null; attachmentUrls?: string[] }): Promise<void> {
    const settings = this.settingsService.toView(await this.settingsService.getSettings());
    if (params.channel === 'buyerProvider' && !settings.buyerProviderChatEnabled) throw new ForbiddenException('Buyer-provider chat is currently disabled by messaging settings.');
    if (params.channel === 'support' && !settings.supportChatEnabled) throw new ForbiddenException('Support chat is currently disabled by messaging settings.');
    const bodyLength = (params.body ?? '').trim().length;
    if (bodyLength > settings.maxMessageLength) throw new BadRequestException(`Message body exceeds the maximum length of ${settings.maxMessageLength} characters.`);
    const attachments = params.attachmentUrls ?? [];
    if (attachments.length > settings.maxAttachmentsPerMessage) throw new BadRequestException(`Message exceeds the maximum of ${settings.maxAttachmentsPerMessage} attachments.`);
    const allowed = new Set(settings.allowedAttachmentTypes.map((value) => value.toLowerCase()));
    const blocked = attachments.map((url) => this.extension(url)).filter((extension) => extension && !allowed.has(extension));
    if (blocked.length) throw new BadRequestException(`Attachment type is not allowed by messaging settings: ${[...new Set(blocked)].join(', ')}`);
  }

  async offlineNotificationDelaySeconds(): Promise<number> { return this.settingsService.toView(await this.settingsService.getSettings()).offlineNotificationDelaySeconds; }
  private extension(url: string): string { const path = url.split('?')[0] ?? url; return path.split('.').pop()?.toLowerCase() ?? ''; }
}
