import { Injectable } from '@nestjs/common';
import { MessageModerationFlagType, MessageModerationSeverity } from '@prisma/client';
import { MessagingSettingsService } from './messaging-settings.service';

export type MessageContentFilterResult = { isFlagged: boolean; flagTypes: MessageModerationFlagType[]; severity: MessageModerationSeverity; confidence: number; keywords: string[]; redactedBody: string };

@Injectable()
export class MessageContentFilterService {
  constructor(private readonly settingsService: MessagingSettingsService) {}

  async filter(body?: string | null): Promise<MessageContentFilterResult> {
    const view = this.settingsService.toView(await this.settingsService.getSettings());
    const text = body ?? '';
    const lower = text.toLowerCase();
    const flagTypes = new Set<MessageModerationFlagType>();
    const keywords: string[] = [];
    if (view.profanityFilterEnabled) this.addMatches(lower, ['damn', 'shit', 'fuck', 'bitch', 'idiot'], MessageModerationFlagType.PROFANITY, flagTypes, keywords);
    if (view.piiFilterEnabled && (/\b\d{10,16}\b/.test(lower) || /\b[\w.%+-]+@[\w.-]+\.[a-z]{2,}\b/i.test(text))) { flagTypes.add(MessageModerationFlagType.SCAM); keywords.push('[pii]'); }
    if (view.autoFlagEnabled) this.addMatches(lower, view.autoFlagKeywords, MessageModerationFlagType.SCAM, flagTypes, keywords);
    const list = [...flagTypes];
    const severity = list.includes(MessageModerationFlagType.SCAM) ? MessageModerationSeverity.MEDIUM : list.length ? MessageModerationSeverity.LOW : MessageModerationSeverity.LOW;
    const confidence = list.length ? Math.min(0.99, 0.76 + list.length * 0.07) : 0;
    return { isFlagged: list.length > 0, flagTypes: list, severity, confidence: Number(confidence.toFixed(2)), keywords, redactedBody: this.redact(text, keywords) };
  }

  private addMatches(text: string, terms: string[], flag: MessageModerationFlagType, flagTypes: Set<MessageModerationFlagType>, keywords: string[]): void {
    for (const term of terms) if (term && text.includes(term.toLowerCase())) { flagTypes.add(flag); keywords.push(term); }
  }

  private redact(text: string, keywords: string[]): string {
    let redacted = text;
    for (const keyword of keywords.filter((item) => item !== '[pii]')) redacted = redacted.replace(new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '[REDACTED]');
    return keywords.includes('[pii]') ? redacted.replace(/\b\d{10,16}\b/g, '[REDACTED]').replace(/\b[\w.%+-]+@[\w.-]+\.[a-z]{2,}\b/gi, '[REDACTED]') : redacted;
  }
}
