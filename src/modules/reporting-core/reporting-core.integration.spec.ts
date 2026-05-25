import { readFileSync } from 'fs';
import { join } from 'path';

describe('Reporting core adoption guards', () => {
  const modulesRoot = join(__dirname, '..');
  const providerService = readFileSync(join(modulesRoot, 'customer-provider-interactions/services/customer-provider-interactions.service.ts'), 'utf8');
  const userSafetyService = readFileSync(join(modulesRoot, 'user-safety/services/user-safety.service.ts'), 'utf8');
  const userSafetyAdminService = readFileSync(join(modulesRoot, 'user-safety/services/user-safety-admin.service.ts'), 'utf8');
  const socialService = readFileSync(join(modulesRoot, 'social-moderation/services/social-moderation.service.ts'), 'utf8');
  const messageService = readFileSync(join(modulesRoot, 'message-moderation/services/message-moderation.service.ts'), 'utf8');
  const providerController = readFileSync(join(modulesRoot, 'customer-provider-interactions/controllers/customer-provider-interactions.controller.ts'), 'utf8');
  const userSafetyController = readFileSync(join(modulesRoot, 'user-safety/controllers/user-safety.controller.ts'), 'utf8');
  const userSafetyAdminController = readFileSync(join(modulesRoot, 'user-safety/controllers/user-safety-admin.controller.ts'), 'utf8');
  const socialController = readFileSync(join(modulesRoot, 'social-moderation/controllers/social-moderation.controller.ts'), 'utf8');
  const messageController = readFileSync(join(modulesRoot, 'message-moderation/controllers/message-moderation.controller.ts'), 'utf8');

  it('keeps external reporting and moderation API surfaces unchanged', () => {
    expect(providerController).toContain("@ApiTags('05 Customer - Provider Reports')");
    expect(providerController).toContain("@Post('providers/:providerId/reports')");
    expect(userSafetyController).toContain("@Post('users/:userId/reports')");
    expect(userSafetyAdminController).toContain("@Post('reports/:id/action')");
    expect(socialController).toContain("@ApiTags('02 Admin - Social Moderation')");
    expect(socialController).toContain("@Post('reports/:id/action')");
    expect(messageController).toContain("@Post('messages/:messageId/action')");
  });

  it('provider, user safety, social, and message moderation lifecycle delegate to ReportingCoreService', () => {
    expect(providerService).toContain('reportingCore?.validateEvidence');
    expect(providerService).toContain("domain: 'providerReports'");
    expect(providerService).toContain('reportingCore.notifyMany');
    expect(userSafetyService).toContain('reportingCore.validateEvidence');
    expect(userSafetyService).toContain("domain: 'userSafety'");
    expect(userSafetyAdminService).toContain('reportingCore.audit');
    expect(userSafetyAdminService).toContain('reportingCore.notify');
    expect(socialService).toContain("domain: 'socialModeration'");
    expect(socialService).toContain('reportingCore.audit');
    expect(socialService).toContain('reportingCore.notify');
    expect(messageService).toContain("domain: 'messageModeration'");
    expect(messageService).toContain('MESSAGE_ESCALATED');
  });
});
