import { readFileSync } from 'fs';
import { join } from 'path';

describe('Admin message moderation implementation guards', () => {
  const root = join(__dirname, '..');
  const controller = readFileSync(join(root, 'controllers/message-moderation.controller.ts'), 'utf8');
  const service = readFileSync(join(root, 'services/message-moderation.service.ts'), 'utf8');
  const scanner = readFileSync(join(root, 'services/message-moderation-scanner.service.ts'), 'utf8');
  const customerChat = readFileSync(join(__dirname, '../../customer-provider-interactions/services/customer-provider-interactions.service.ts'), 'utf8');
  const providerChat = readFileSync(join(__dirname, '../../provider-interactions/services/provider-interactions.service.ts'), 'utf8');
  const supportChat = readFileSync(join(__dirname, '../../support-chat/services/support-chat.service.ts'), 'utf8');

  it('SUPER_ADMIN and ADMIN route guards protect message moderation routes', () => {
    expect(controller).toContain("@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)");
    expect(controller).toContain("@Permissions('messageModeration.read')");
    expect(controller).toContain("@Permissions('messageModeration.block')");
    expect(controller).toContain("@Permissions('messageModeration.warn')");
    expect(controller).toContain("@Permissions('messageModeration.suspend')");
    expect(controller).toContain("@Permissions('messageModeration.dismiss')");
    expect(controller).toContain("@Permissions('messageModeration.notes.create')");
  });

  it('redacts flagged message bodies by default', () => {
    expect(service).toContain('body: canUnmask ? row.rawBody : null');
    expect(service).toContain('redactedBody: row.redactedBody');
  });

  it('moderation actions create moderation logs and audit logs', () => {
    expect(service).toContain('createLog');
    expect(service).toContain('createAuditLog');
    expect(service).toContain('SUSPEND_ACCOUNT');
    expect(service).toContain('DISMISS_FLAG');
    expect(service).toContain('ADD_NOTE');
    expect(service).toContain('REPROCESS');
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
    for (const flag of ['PROFANITY', 'HOSTILITY', 'SUSPICIOUS_LINK', 'SPAM', 'SCAM', 'HARASSMENT', 'HATE_SPEECH']) {
      expect(scanner).toContain(flag);
    }
  });
});
