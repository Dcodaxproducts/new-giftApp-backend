/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { MessageModerationFlagType } from '@prisma/client';
import { MessagingSettingsRepository } from '../repositories/messaging-settings.repository';
import { MessageContentFilterService } from '../services/message-content-filter.service';
import { MessagingPolicyService } from '../services/messaging-policy.service';
import { MessagingSettingsService } from '../services/messaging-settings.service';

const now = new Date('2026-05-18T10:00:00.000Z');
const settings = {
  id: 'settings_1', buyerProviderChatEnabled: true, supportChatEnabled: true, messageRetentionDays: 365, maxMessageLength: 2000, maxAttachmentsPerMessage: 5,
  allowedAttachmentTypesJson: ['jpg', 'jpeg', 'png', 'pdf', 'mp4'], profanityFilterEnabled: true, piiFilterEnabled: true, autoFlagEnabled: true,
  autoFlagKeywordsJson: ['refund outside platform', 'bank account', 'whatsapp me'], offlineNotificationDelaySeconds: 10, messageEditWindowMinutes: 0,
  updatedById: 'admin_1', createdAt: now, updatedAt: now, updatedBy: { id: 'admin_1', firstName: 'Alex', lastName: 'Rivera' },
};

function createSubject(overrides: Partial<typeof settings> = {}) {
  const row = { ...settings, ...overrides };
  const repository = { findFirstSettings: jest.fn().mockResolvedValue(row), createDefaultSettings: jest.fn(), updateSettings: jest.fn().mockImplementation((_id: string, data: object) => Promise.resolve({ ...row, ...data })), createAuditLog: jest.fn().mockResolvedValue({ id: 'audit_1' }), findAuditLogsWithCount: jest.fn().mockResolvedValue([[{ id: 'audit_1', action: 'MESSAGING_SETTINGS_UPDATED', beforeJson: {}, afterJson: {}, createdAt: now, actor: { id: 'admin_1', firstName: 'Alex', lastName: 'Rivera' } }], 1]) };
  const mediaUploadPolicy = { allowedExtensions: jest.fn().mockResolvedValue(new Set(['jpg', 'jpeg', 'png', 'pdf', 'mp4'])) };
  const service = new MessagingSettingsService(repository as unknown as MessagingSettingsRepository, mediaUploadPolicy as never);
  return { service, repository, mediaUploadPolicy };
}

describe('MessagingSettingsService', () => {
  it('fetches settings response with updater', async () => {
    const { service } = createSubject();
    await expect(service.get()).resolves.toEqual(expect.objectContaining({ data: expect.objectContaining({ buyerProviderChatEnabled: true, lastUpdatedBy: { id: 'admin_1', name: 'Alex Rivera' } }), message: 'Messaging settings fetched successfully.' }));
  });

  it('updates settings and writes audit log with sanitized keywords/types', async () => {
    const { service, repository } = createSubject();
    await service.update({ uid: 'admin_1' } as never, { maxMessageLength: 1500, allowedAttachmentTypes: ['JPG', 'jpg', 'png'], autoFlagKeywords: [' Bank Account ', 'bank  account', 'ok'] });
    expect(repository.updateSettings).toHaveBeenCalledWith('settings_1', expect.objectContaining({ maxMessageLength: 1500, allowedAttachmentTypesJson: ['jpg', 'png'], autoFlagKeywordsJson: ['bank account'] }));
    expect(repository.createAuditLog).toHaveBeenCalledWith(expect.objectContaining({ module: 'messagingSettings', action: 'MESSAGING_SETTINGS_UPDATED' }));
  });

  it('lists audit logs', async () => {
    const { service } = createSubject();
    await expect(service.auditLogs({ page: 1, limit: 10 })).resolves.toEqual(expect.objectContaining({ data: [expect.objectContaining({ id: 'audit_1', actor: { id: 'admin_1', name: 'Alex Rivera' } })], meta: expect.objectContaining({ total: 1 }) }));
  });

  it('rejects attachment types not enabled in media upload policy', async () => {
    const { service } = createSubject();
    await expect(service.update({ uid: 'admin_1' } as never, { allowedAttachmentTypes: ['jpg', 'zip'] })).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('MessagingPolicyService', () => {
  it('enforces message length, attachment count, and attachment type', async () => {
    const policy = new MessagingPolicyService(createSubject({ maxMessageLength: 5, maxAttachmentsPerMessage: 1 }).service);
    await expect(policy.assertCanSend({ channel: 'buyerProvider', body: 'too long' })).rejects.toBeInstanceOf(BadRequestException);
    await expect(policy.assertCanSend({ channel: 'buyerProvider', body: 'ok', attachmentUrls: ['https://cdn/a.jpg', 'https://cdn/b.jpg'] })).rejects.toBeInstanceOf(BadRequestException);
    await expect(policy.assertCanSend({ channel: 'buyerProvider', body: 'ok', attachmentUrls: ['https://cdn/a.gif'] })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('blocks buyer-provider and support chats independently', async () => {
    await expect(new MessagingPolicyService(createSubject({ buyerProviderChatEnabled: false }).service).assertCanSend({ channel: 'buyerProvider', body: 'hello' })).rejects.toBeInstanceOf(ForbiddenException);
    await expect(new MessagingPolicyService(createSubject({ supportChatEnabled: false }).service).assertCanSend({ channel: 'support', body: 'hello' })).rejects.toBeInstanceOf(ForbiddenException);
  });
});

describe('MessageContentFilterService', () => {
  it('detects auto-flag keywords before persistence', async () => {
    const filter = new MessageContentFilterService(createSubject().service);
    const result = await filter.filter('Please whatsapp me for refund outside platform');
    expect(result.isFlagged).toBe(true);
    expect(result.flagTypes).toContain(MessageModerationFlagType.SCAM);
    expect(result.keywords).toEqual(expect.arrayContaining(['whatsapp me', 'refund outside platform']));
  });
});
