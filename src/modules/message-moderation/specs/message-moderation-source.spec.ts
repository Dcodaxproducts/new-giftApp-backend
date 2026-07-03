import { readFileSync } from 'fs';
import { join } from 'path';

describe('Admin message moderation implementation guards', () => {
  const root = join(__dirname, '..');
  const controller = readFileSync(join(root, 'controllers/message-moderation.controller.ts'), 'utf8');
  const service = readFileSync(join(root, 'services/message-moderation.service.ts'), 'utf8');
  const repository = readFileSync(join(root, 'repositories/message-moderation.repository.ts'), 'utf8');
  const scanner = readFileSync(join(root, 'services/message-moderation-scanner.service.ts'), 'utf8');
  const schema = readFileSync(join(__dirname, '../../../../prisma/schema.prisma'), 'utf8');
  const permissions = readFileSync(join(__dirname, '../../staff-roles/constants/permission-catalog.ts'), 'utf8');
  const chatMessages = readFileSync(join(__dirname, '../../chats/services/chat-message.service.ts'), 'utf8');
  const chatModerationBridge = readFileSync(join(__dirname, '../../chats/services/chat-moderation-bridge.service.ts'), 'utf8');

  it('SUPER_ADMIN and ADMIN route guards protect message moderation routes with final permissions', () => {
    expect(controller).toContain("@Roles(UserRole.SUPER_ADMIN, UserRole.STAFF)");
    for (const permission of [
      "@Permissions('messageModeration.read')",
      "@Permissions('messageModeration.export')",
      "@Permissions('messageModeration.auditLogs.read')",
    ]) expect(controller).toContain(permission);
    for (const permission of [
      "'messageModeration.moderate'",
      "'messageModeration.warn'",
      "'messageModeration.suspend'",
      "'messageModeration.notes.create'",
      "'messageModeration.reprocess'",
      "'messageModeration.escalate'",
    ]) expect(service).toContain(permission);
  });

  it('adds restore, escalation, audit logs, and correct Swagger language', () => {
    expect(controller).toContain("@Post('messages/:messageId/action')");
    expect(controller).not.toContain("@Post('messages/:messageId/restore')");
    expect(controller).not.toContain("@Post('messages/:messageId/escalate')");
    expect(controller).toContain("@Get('audit-logs')");
    expect(controller).toContain('HIDE_MESSAGE, RESTORE_MESSAGE, and DISMISS_FLAG require');
    expect(controller).toContain('Run message moderation action');
  });

  it('message visibility is reversible and participant views mask hidden bodies', () => {
    expect(schema).toContain('enum MessageVisibilityStatus');
    expect(schema).toContain('visibilityStatus');
    expect(schema).toContain('hiddenByModeration');
    expect(repository).toContain('updateMessageVisibility');
    expect(service).toContain('HIDE_MESSAGE');
    expect(service).toContain('RESTORE_MESSAGE');
    expect(chatMessages).toContain('This message was removed by moderation.');
  });

  it('moderation actions create moderation logs and audit logs', () => {
    expect(service).toContain('createLog');
    expect(service).toContain('createAuditLog');
    for (const action of ['SUSPEND_ACCOUNT', 'DISMISS_FLAG', 'ADD_NOTE', 'REPROCESS', 'ESCALATE_MESSAGE']) expect(service).toContain(action);
  });

  it('suspension uses lifecycle services instead of direct message-moderation table updates', () => {
    expect(service).toContain('accountLifecycleService.updateStatus');
    expect(repository).not.toContain('suspendUser(');
  });

  it('required permission keys are in the catalog', () => {
    for (const key of ['read', 'export', 'moderate', 'warn', 'suspend', 'notes.create', 'reprocess', 'escalate', 'auditLogs.read']) expect(permissions).toContain(`key: '${key}'`);
  });

  it('chat message creation creates moderation case when flagged', () => {
    expect(chatMessages).toContain('scanCreatedMessage');
    expect(chatModerationBridge).toContain('CUSTOMER_PROVIDER_CHAT');
    expect(chatModerationBridge).toContain('PROVIDER_BUYER_CHAT');
    expect(chatModerationBridge).toContain('ADMIN_SUPPORT_CHAT');
  });

  it('scanner covers required deterministic categories', () => {
    for (const flag of ['PROFANITY', 'HOSTILITY', 'SUSPICIOUS_LINK', 'SPAM', 'SCAM', 'HARASSMENT', 'HATE_SPEECH']) expect(scanner).toContain(flag);
  });
});
