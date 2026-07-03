import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { MessageModerationSeverity, MessageModerationSource, MessageModerationStatus, NotificationRecipientType, UserRole } from '@prisma/client';
import { AccountLifecycleService } from '../../../common/services/account-lifecycle.service';
import { MessageModerationMessageAction } from '../dto/message-moderation.dto';
import { MessageModerationRepository } from '../repositories/message-moderation.repository';
import { MessageModerationScanner } from '../services/message-moderation-scanner.service';
import { MessageModerationService } from '../services/message-moderation.service';

const moderationCase: { [key: string]: unknown } = {
  id: 'case_1',
  conversationId: 'conversation_1',
  messageId: 'message_1',
  source: MessageModerationSource.CUSTOMER_PROVIDER_CHAT,
  participantId: 'participant_1',
  participantRole: UserRole.REGISTERED_USER,
  participantName: 'Customer One',
  participantAvatarUrl: null,
  externalReference: null,
  senderId: 'sender_1',
  senderRole: UserRole.PROVIDER,
  rawBody: 'please pay outside',
  redactedBody: 'please pay outside',
  flagTypesJson: ['SCAM'],
  keywordsJson: ['pay outside'],
  severity: MessageModerationSeverity.HIGH,
  confidence: { toString: () => '0.9' },
  status: MessageModerationStatus.PENDING_REVIEW,
  assignedToId: null,
  lastMessageAt: new Date(),
  resolvedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  logs: [],
  escalations: [],
};

function createService(overrides?: { sender?: { id: string; role: UserRole } | null; moderationCase?: typeof moderationCase }) {
  const tx = {
    messageModerationCase: { update: jest.fn().mockResolvedValue({}) },
    messageModerationLog: { create: jest.fn().mockResolvedValue({}) },
    adminAuditLog: { create: jest.fn().mockResolvedValue({}) },
    messageModerationEscalation: { create: jest.fn().mockResolvedValue({ id: 'escalation_1' }) },
    chatMessage: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
  };
  const repository = {
    findCaseByMessage: jest.fn().mockResolvedValue({ ...(overrides?.moderationCase ?? moderationCase) }),
    findUser: jest.fn().mockResolvedValue(overrides && 'sender' in overrides ? overrides.sender : { id: 'sender_1', role: UserRole.PROVIDER, firstName: 'Prov', lastName: 'One', email: 'provider@example.com', avatarUrl: null, providerBusinessName: 'Provider One' }),
    runAction: jest.fn().mockImplementation(async (fn: (txArg: unknown) => Promise<unknown>) => fn(tx)),
    updateMessageVisibility: jest.fn().mockResolvedValue(1),
    updateStatus: jest.fn().mockResolvedValue({}),
    createLog: jest.fn().mockResolvedValue({}),
    createAuditLog: jest.fn().mockResolvedValue({}),
    createEscalation: jest.fn().mockResolvedValue({ id: 'escalation_1' }),
    upsertFlaggedCase: jest.fn().mockResolvedValue({ ...moderationCase }),
  };
  const scanner = { scanMessage: jest.fn().mockReturnValue({ isFlagged: true, flagTypes: ['SCAM'], severity: MessageModerationSeverity.HIGH, confidence: 0.9, redactedBody: 'please pay outside', keywords: ['pay outside'] }) };
  const accountLifecycleService = { updateStatus: jest.fn().mockResolvedValue({ id: 'sender_1', status: 'SUSPENDED', isActive: false }) };
  const notificationDispatch = { createAndEmit: jest.fn().mockResolvedValue({ id: 'notification_1' }) };
  const service = new MessageModerationService(
    repository as unknown as MessageModerationRepository,
    scanner as unknown as MessageModerationScanner,
    accountLifecycleService as unknown as AccountLifecycleService,
    notificationDispatch as never,
  );
  return { service, repository, scanner, accountLifecycleService, notificationDispatch };
}

describe('MessageModerationService', () => {
  it('all actions work through unified action endpoint service dispatcher', async () => {
    const { service } = createService();
    const { service: restoreService } = createService({ moderationCase: { ...moderationCase, status: MessageModerationStatus.ACTION_TAKEN } });

    await expect(service.action({ uid: 'admin_1', role: UserRole.SUPER_ADMIN }, 'message_1', { action: MessageModerationMessageAction.HIDE_MESSAGE, reason: 'OFF_PLATFORM_PAYMENT' })).resolves.toEqual(expect.objectContaining({ message: 'Message hidden successfully.' }));
    await expect(restoreService.action({ uid: 'admin_1', role: UserRole.SUPER_ADMIN }, 'message_1', { action: MessageModerationMessageAction.RESTORE_MESSAGE, reason: 'FALSE_POSITIVE' })).resolves.toEqual(expect.objectContaining({ message: 'Message restored successfully.' }));
    await expect(service.action({ uid: 'admin_1', role: UserRole.SUPER_ADMIN }, 'message_1', { action: MessageModerationMessageAction.WARN_SENDER, reason: 'OFF_PLATFORM_PAYMENT' })).resolves.toEqual(expect.objectContaining({ message: 'Message sender warned successfully.' }));
    await expect(service.action({ uid: 'admin_1', role: UserRole.SUPER_ADMIN }, 'message_1', { action: MessageModerationMessageAction.SUSPEND_SENDER, reason: 'OFF_PLATFORM_PAYMENT' })).resolves.toEqual(expect.objectContaining({ message: 'Message sender account suspended successfully.' }));
    await expect(service.action({ uid: 'admin_1', role: UserRole.SUPER_ADMIN }, 'message_1', { action: MessageModerationMessageAction.DISMISS_FLAG, reason: 'FALSE_POSITIVE' })).resolves.toEqual(expect.objectContaining({ message: 'Message moderation flag dismissed successfully.' }));
    await expect(service.action({ uid: 'admin_1', role: UserRole.SUPER_ADMIN }, 'message_1', { action: MessageModerationMessageAction.ADD_NOTE, comment: 'internal note' })).resolves.toEqual(expect.objectContaining({ message: 'Internal moderation note created successfully.' }));
    await expect(service.action({ uid: 'admin_1', role: UserRole.SUPER_ADMIN }, 'message_1', { action: MessageModerationMessageAction.REPROCESS })).resolves.toEqual(expect.objectContaining({ message: 'Message reprocessed successfully.' }));
    await expect(service.action({ uid: 'admin_1', role: UserRole.SUPER_ADMIN }, 'message_1', { action: MessageModerationMessageAction.ESCALATE, reason: 'Needs review', assignToAdminId: 'admin_2' })).resolves.toEqual(expect.objectContaining({ message: 'Message escalated successfully.' }));
  });

  it('action-specific permissions are enforced', async () => {
    const { service } = createService();
    await expect(service.action({ uid: 'admin_1', role: UserRole.STAFF, permissions: { messageModeration: ['warn'] } }, 'message_1', { action: MessageModerationMessageAction.HIDE_MESSAGE })).rejects.toThrow(ForbiddenException);
    await expect(service.action({ uid: 'admin_1', role: UserRole.STAFF, permissions: { messageModeration: ['moderate'] } }, 'message_1', { action: MessageModerationMessageAction.ESCALATE })).rejects.toThrow(ForbiddenException);
  });

  it('sender role resolves correctly for provider and registered user notifications', async () => {
    const providerCtx = createService({ sender: { id: 'provider_1', role: UserRole.PROVIDER } });
    await providerCtx.service.action({ uid: 'admin_1', role: UserRole.SUPER_ADMIN }, 'message_1', { action: MessageModerationMessageAction.WARN_SENDER, reason: 'OFF_PLATFORM_PAYMENT', notifySender: true });
    expect(providerCtx.notificationDispatch.createAndEmit).toHaveBeenCalledWith(expect.objectContaining({ recipientId: 'provider_1', recipientType: NotificationRecipientType.PROVIDER }));

    const userCtx = createService({ sender: { id: 'user_1', role: UserRole.REGISTERED_USER } });
    await userCtx.service.action({ uid: 'admin_1', role: UserRole.SUPER_ADMIN }, 'message_1', { action: MessageModerationMessageAction.WARN_SENDER, reason: 'OFF_PLATFORM_PAYMENT', notifySender: true });
    expect(userCtx.notificationDispatch.createAndEmit).toHaveBeenCalledWith(expect.objectContaining({ recipientId: 'user_1', recipientType: NotificationRecipientType.REGISTERED_USER }));
  });

  it('suspend sender uses AccountLifecycleService and never suspends admin/super admin', async () => {
    const { service, accountLifecycleService } = createService({ sender: { id: 'provider_1', role: UserRole.PROVIDER } });
    await service.action({ uid: 'admin_1', role: UserRole.SUPER_ADMIN }, 'message_1', { action: MessageModerationMessageAction.SUSPEND_SENDER, reason: 'OFF_PLATFORM_PAYMENT', notifySender: true });
    expect(accountLifecycleService.updateStatus).toHaveBeenCalledWith(expect.objectContaining({ accountId: 'provider_1', accountType: 'PROVIDER', status: 'SUSPENDED' }));

    const adminSender = createService({ sender: { id: 'admin_2', role: UserRole.STAFF } });
    await expect(adminSender.service.action({ uid: 'admin_1', role: UserRole.SUPER_ADMIN }, 'message_1', { action: MessageModerationMessageAction.SUSPEND_SENDER, reason: 'OFF_PLATFORM_PAYMENT' })).rejects.toThrow('Admin and Super Admin accounts cannot be suspended from message moderation.');
  });

  it('audit logs and notifications are created for unified actions', async () => {
    const { service, repository, notificationDispatch } = createService();
    await service.action({ uid: 'admin_1', role: UserRole.SUPER_ADMIN }, 'message_1', { action: MessageModerationMessageAction.HIDE_MESSAGE, reason: 'OFF_PLATFORM_PAYMENT', notifyParticipants: true });
    await service.action({ uid: 'admin_1', role: UserRole.SUPER_ADMIN }, 'message_1', { action: MessageModerationMessageAction.ESCALATE, reason: 'Needs review', assignToAdminId: 'admin_2' });
    expect(repository.createLog).toHaveBeenCalled();
    expect(repository.createAuditLog).toHaveBeenCalled();
    expect(notificationDispatch.createAndEmit).toHaveBeenCalled();
  });

  it('throws when sender cannot be resolved', async () => {
    const { service } = createService({ sender: null });
    await expect(service.action({ uid: 'admin_1', role: UserRole.SUPER_ADMIN }, 'message_1', { action: MessageModerationMessageAction.WARN_SENDER, reason: 'OFF_PLATFORM_PAYMENT' })).rejects.toThrow(NotFoundException);
  });
});
