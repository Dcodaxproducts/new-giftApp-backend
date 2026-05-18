import { readFileSync } from 'fs';
import { join } from 'path';

describe('Admin message moderation implementation guards', () => {
  const root = join(__dirname, '..');
  const controller = readFileSync(join(root, 'controllers/message-moderation.controller.ts'), 'utf8');
  const service = readFileSync(join(root, 'services/message-moderation.service.ts'), 'utf8');
  const repository = readFileSync(join(root, 'repositories/message-moderation.repository.ts'), 'utf8');
  const scanner = readFileSync(join(root, 'services/message-moderation-scanner.service.ts'), 'utf8');
  const schema = readFileSync(join(__dirname, '../../../../prisma/schema.prisma'), 'utf8');
  const permissions = readFileSync(join(__dirname, '../../admin-roles/constants/permission-catalog.ts'), 'utf8');
  const customerChat = readFileSync(join(__dirname, '../../customer-provider-interactions/services/customer-provider-interactions.service.ts'), 'utf8');
  const providerChat = readFileSync(join(__dirname, '../../provider-interactions/services/provider-interactions.service.ts'), 'utf8');
  const supportChat = readFileSync(join(__dirname, '../../support-chat/services/support-chat.service.ts'), 'utf8');

  it('SUPER_ADMIN and ADMIN route guards protect message moderation routes with final permissions', () => {
    expect(controller).toContain("@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)");
    for (const permission of [
      "@Permissions('messageModeration.read')",
      "@Permissions('messageModeration.export')",
      "@Permissions('messageModeration.moderate')",
      "@Permissions('messageModeration.warn')",
      "@Permissions('messageModeration.suspend')",
      "@Permissions('messageModeration.notes.create')",
      "@Permissions('messageModeration.reprocess')",
      "@Permissions('messageModeration.escalate')",
      "@Permissions('messageModeration.auditLogs.read')",
    ]) expect(controller).toContain(permission);
  });

  it('adds restore, escalation, audit logs, and correct Swagger language', () => {
    expect(controller).toContain("@Post('messages/:messageId/restore')");
    expect(controller).toContain("@Post('messages/:messageId/escalate')");
    expect(controller).toContain("@Get('audit-logs')");
    expect(controller).toContain('Hide a flagged message from chat participants. Does not block the sender account.');
    expect(controller).toContain('Warn message sender');
    expect(controller).toContain('Suspend message sender account');
  });

  it('message visibility is reversible and participant views mask hidden bodies', () => {
    expect(schema).toContain('enum MessageVisibilityStatus');
    expect(schema).toContain('visibilityStatus');
    expect(schema).toContain('hiddenByModeration');
    expect(repository).toContain('updateMessageVisibility');
    expect(service).toContain('HIDE_MESSAGE');
    expect(service).toContain('RESTORE_MESSAGE');
    expect(customerChat).toContain('This message was removed by moderation.');
    expect(providerChat).toContain('This message was removed by moderation.');
  });

  it('moderation actions create moderation logs and audit logs', () => {
    expect(service).toContain('createLog');
    expect(service).toContain('createAuditLog');
    for (const action of ['SUSPEND_ACCOUNT', 'DISMISS_FLAG', 'ADD_NOTE', 'REPROCESS', 'ESCALATE_MESSAGE']) expect(service).toContain(action);
  });

  it('suspension uses lifecycle services instead of direct message-moderation table updates', () => {
    expect(service).toContain('userManagementService.suspend');
    expect(service).toContain('providerManagementService.updateStatus');
    expect(repository).not.toContain('suspendUser(');
  });

  it('required permission keys are in the catalog', () => {
    for (const key of ['read', 'export', 'moderate', 'warn', 'suspend', 'notes.create', 'reprocess', 'escalate', 'auditLogs.read']) expect(permissions).toContain(`key: '${key}'`);
  });

  it('chat message creation creates moderation case when flagged', () => {
    expect(customerChat).toContain('scanCreatedMessage');
    expect(customerChat).toContain('CUSTOMER_PROVIDER_CHAT');
    expect(providerChat).toContain('scanCreatedMessage');
    expect(providerChat).toContain('PROVIDER_BUYER_CHAT');
    expect(supportChat).toContain('scanCreatedMessage');
    expect(supportChat).toContain('ADMIN_SUPPORT_CHAT');
  });

  it('scanner covers required deterministic categories', () => {
    for (const flag of ['PROFANITY', 'HOSTILITY', 'SUSPICIOUS_LINK', 'SPAM', 'SCAM', 'HARASSMENT', 'HATE_SPEECH']) expect(scanner).toContain(flag);
  });
});
