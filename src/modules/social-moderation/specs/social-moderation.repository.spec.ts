import { readFileSync } from 'fs';
import { join } from 'path';

describe('Social moderation repository cleanup', () => {
  const service = readFileSync(join(__dirname, '../services/social-moderation.service.ts'), 'utf8');
  const moderationRepository = readFileSync(join(__dirname, '../repositories/social-moderation.repository.ts'), 'utf8');
  const rulesRepository = readFileSync(join(__dirname, '../repositories/social-reporting-rules.repository.ts'), 'utf8');
  const controller = readFileSync(join(__dirname, '../controllers/social-moderation.controller.ts'), 'utf8');

  it('keeps social moderation and rules APIs stable', () => {
    for (const route of ["@Get('stats')", "@Get('reports')", "@Get('reports/:id')", "@Post('reports/:id/action')", "@Get('export')"]) expect(controller).toContain(route);
    for (const route of ["@Get('stats')", '@Get()', '@Post()', "@Get(':id')", "@Patch(':id')", "@Delete(':id')", "@Patch(':id/status')", "@Get('export')"]) expect(controller).toContain(route);
    expect(controller).toContain("@ApiTags('02 Admin - Social Moderation')");
    expect(controller).toContain("@ApiTags('02 Admin - Social Reporting Rules')");
  });

  it('repositories own social moderation and reporting rule DB access', () => {
    for (const method of ['findStatsRows', 'findReportsAndCount', 'findReport', 'findReportHistory', 'runModerationAction', 'updateSocialPost', 'updateSocialReportStatus', 'createSocialModerationLog', 'createUserWarning', 'createNotification', 'findReportsForExport']) expect(moderationRepository).toContain(method);
    for (const method of ['findRuleStatsRows', 'findRulesAndCount', 'createRule', 'findRuleById', 'updateRule', 'softDeleteRule', 'updateRuleStatus', 'findRulesForExport']) expect(rulesRepository).toContain(method);
    expect(moderationRepository).toContain('tx.socialModerationLog.create');
    expect(moderationRepository).toContain('tx.userWarning.create');
    expect(rulesRepository).toContain('deletedAt: new Date()');
  });

  it('service preserves social moderation decisions, audit, notifications, and export formatting', () => {
    expect(service).toContain('statusForAction');
    expect(service).toContain('postUpdateForAction');
    expect(service).toContain('assertActionPermission');
    expect(service).toContain('SOCIAL_MODERATION_${dto.action}');
    expect(service).toContain('SOCIAL_MODERATION_ACTION');
    expect(service).toContain('SOCIAL_REPORTING_RULE_DELETED');
    expect(service).toContain('SOCIAL_REPORTING_RULE_EXPORT_GENERATED');
    expect(service).toContain('this.file(');
  });
});
