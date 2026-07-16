/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { readFileSync } from 'fs';
import { join } from 'path';
import { SocialModerationAction, SocialPostStatus, SocialPostVisibility, SocialReportReason, SocialReportSeverity, SocialReportStatus, SocialReportingEscalationRule, UserRole } from '@prisma/client';
import { SocialModerationRepository } from './repositories/social-moderation.repository';
import { SocialModerationService } from './services/social-moderation.service';
import { SocialReportingRulesRepository } from './repositories/social-reporting-rules.repository';
import { RuleSortBy, SortOrder } from './dto/social-moderation.dto';

const now = new Date('2026-05-14T10:00:00.000Z');
const user = { id: 'user_1', firstName: 'Sarah', lastName: 'Jenkins', avatarUrl: 'avatar.png', createdAt: new Date('2022-12-01T00:00:00.000Z') };
const report = { id: 'social_report_id', reportId: 'RPT-1024', postId: 'post_id', reportedById: 'reporter_1', reason: SocialReportReason.SPAM, comment: 'Spam links', severity: SocialReportSeverity.HIGH, status: SocialReportStatus.PENDING, createdAt: now, updatedAt: now, reportedBy: { id: 'reporter_1', firstName: 'Reporter', lastName: 'User' }, post: { id: 'post_id', userId: 'user_1', content: 'Check out this cool new crypto link for free coins.', mediaUrlsJson: ['https://cdn/post.png'], visibility: SocialPostVisibility.PUBLIC, status: SocialPostStatus.ACTIVE, createdAt: now, updatedAt: now, user, reports: [{ id: 'r1' }, { id: 'r2' }] } };
const rule = { id: 'rule_1', reportCategory: 'SPAM_ADVERTISING', label: 'Spam & Advertising', description: 'Spam links', iconKey: 'mail', autoFlagThreshold: 15, escalationRule: SocialReportingEscalationRule.AUTO_HIDE_CONTENT, isActive: true, createdAt: now, updatedAt: now, deletedAt: null };

function createService() {
  const prisma: Record<string, unknown> & { $transaction: jest.Mock } = {
    socialReport: { count: jest.fn().mockResolvedValue(1), findMany: jest.fn().mockResolvedValue([report]), findFirst: jest.fn().mockResolvedValue(report), update: jest.fn().mockResolvedValue({ ...report, status: SocialReportStatus.HIDDEN }) },
    socialPost: { count: jest.fn().mockResolvedValue(1), update: jest.fn().mockResolvedValue({ ...report.post, visibility: SocialPostVisibility.HIDDEN }) },
    userWarning: { count: jest.fn().mockResolvedValue(4), create: jest.fn().mockResolvedValue({}) },
    socialModerationLog: { findMany: jest.fn().mockResolvedValue([{ createdAt: now, report: { createdAt: now } }]), create: jest.fn().mockResolvedValue({}) },
    notification: { create: jest.fn().mockResolvedValue({}) },
    socialReportingRule: { count: jest.fn().mockResolvedValue(1), findMany: jest.fn().mockResolvedValue([rule]), findFirst: jest.fn().mockResolvedValue(rule), create: jest.fn().mockResolvedValue(rule), update: jest.fn().mockResolvedValue({ ...rule, label: 'Updated', isActive: false, deletedAt: now }), delete: jest.fn().mockResolvedValue(rule) },
    $transaction: jest.fn(async (input: unknown): Promise<unknown> => typeof input === 'function' ? (input as (tx: typeof prisma) => Promise<unknown>)(prisma) : Promise.all(input as Promise<unknown>[])),
  };
  const auditLog = { write: jest.fn().mockResolvedValue(undefined) };
  const socialModerationRepository = new SocialModerationRepository(prisma as never, { createAndEmit: jest.fn(), emitExisting: jest.fn() } as never);
  const socialReportingRulesRepository = new SocialReportingRulesRepository(prisma as never);
  return { service: new SocialModerationService(socialModerationRepository, socialReportingRulesRepository, auditLog as never), prisma, auditLog, socialModerationRepository, socialReportingRulesRepository };
}

describe('SocialModerationService', () => {
  it('admin can list/filter social reports and fetch details', async () => {
    const { service } = createService();
    const list = await service.reports({ reportType: 'SPAM', status: 'PENDING', fromDate: '2026-05-01T00:00:00.000Z' } as never);
    expect(list.data[0]).toMatchObject({ reportId: 'RPT-1024', reportType: 'SPAM', status: 'PENDING' });
    const details = await service.reportDetails('RPT-1024');
    expect(details.data.reportHistory).toHaveLength(1);
    expect(details.data.post.content).toContain('crypto');
  });

  it('can hide, remove, warn user, and mark reviewed with moderation/audit logs', async () => {
    const { service, prisma, auditLog } = createService();
    const actor = { uid: 'admin_1', role: UserRole.SUPER_ADMIN };
    await service.action(actor, 'RPT-1024', { action: SocialModerationAction.HIDE, reason: SocialReportReason.SPAM, notifyUser: true });
    await service.action(actor, 'RPT-1024', { action: SocialModerationAction.REMOVE, reason: SocialReportReason.DECEPTIVE_LINK, notifyUser: true });
    await service.action(actor, 'RPT-1024', { action: SocialModerationAction.WARN_USER, reason: SocialReportReason.INAPPROPRIATE_BEHAVIOR, notifyUser: true });
    await service.action(actor, 'RPT-1024', { action: SocialModerationAction.MARK_REVIEWED, notifyUser: false });
    expect(((prisma.socialModerationLog as { create: jest.Mock }).create)).toHaveBeenCalled();
    expect(((prisma.userWarning as { create: jest.Mock }).create)).toHaveBeenCalled();
    expect(auditLog.write).toHaveBeenCalledWith(expect.objectContaining({ action: 'SOCIAL_MODERATION_HIDE' }));
  });

  it('reporting rule stats/create/update/delete/export work and keep logs intact', async () => {
    const { service, prisma, auditLog } = createService();
    const actor = { uid: 'admin_1', role: UserRole.SUPER_ADMIN };
    expect((await service.ruleStats()).data.activeRules).toBe(1);
    expect((await service.createRule(actor, { reportCategory: 'SPAM_ADVERTISING', label: 'Spam & Advertising', autoFlagThreshold: 15, escalationRule: SocialReportingEscalationRule.AUTO_HIDE_CONTENT })).data.reportCategory).toBe('SPAM_ADVERTISING');
    await service.updateRule(actor, 'rule_1', { label: 'Updated' });
    await service.updateRule(actor, 'rule_1', { isActive: false, reason: 'Rule paused after campaign period.' });
    await service.deleteRule(actor, 'rule_1');
    expect((prisma.socialModerationLog as { findMany: jest.Mock }).findMany).not.toHaveBeenCalledWith('delete');
    const socialReportingRuleUpdate = (prisma.socialReportingRule as { update: jest.Mock }).update;
    const auditWrite = auditLog.write;
    expect(socialReportingRuleUpdate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ isActive: false }) }));
    expect(auditWrite).toHaveBeenCalledWith(expect.objectContaining({ action: 'SOCIAL_REPORTING_RULE_UPDATED', afterJson: expect.objectContaining({ reason: 'Rule paused after campaign period.' }) }));
    const file = await service.exportRules(actor, { format: 'CSV' as never });
    expect(file.content).toContain('SPAM_ADVERTISING');
    expect(auditLog.write).toHaveBeenCalledWith(expect.objectContaining({ action: 'SOCIAL_REPORTING_RULE_EXPORT_GENERATED' }));
  });

  it('lists social reporting rules newest first by default and respects explicit sort', async () => {
    const { service, prisma } = createService();

    await service.rules({});
    await service.rules({ sortBy: RuleSortBy.AUTO_FLAG_THRESHOLD, sortOrder: SortOrder.ASC });

    expect((prisma.socialReportingRule as { findMany: jest.Mock }).findMany).toHaveBeenNthCalledWith(1, expect.objectContaining({ orderBy: { createdAt: 'desc' } }));
    expect((prisma.socialReportingRule as { findMany: jest.Mock }).findMany).toHaveBeenNthCalledWith(2, expect.objectContaining({ orderBy: { autoFlagThreshold: 'asc' } }));
  });

  it('lists all non-deleted social reporting rules when isActive is omitted and filters explicit active state', async () => {
    const { service, prisma } = createService();
    const findMany = (prisma.socialReportingRule as { findMany: jest.Mock }).findMany;

    await service.rules({});
    await service.rules({ isActive: true });
    await service.rules({ isActive: false });

    expect(findMany).toHaveBeenNthCalledWith(1, expect.objectContaining({ where: { deletedAt: null, reportCategory: undefined } }));
    expect(findMany).toHaveBeenNthCalledWith(2, expect.objectContaining({ where: expect.objectContaining({ deletedAt: null, isActive: true }) }));
    expect(findMany).toHaveBeenNthCalledWith(3, expect.objectContaining({ where: expect.objectContaining({ deletedAt: null, isActive: false }) }));
  });

  it('exports social moderation logs', async () => {
    const { service } = createService();
    const file = await service.exportReports({ uid: 'admin_1', role: UserRole.SUPER_ADMIN }, { format: 'CSV' as never });
    expect(file.content).toContain('RPT-1024');
    expect(file.content).not.toContain('email');
  });
});

describe('Social moderation source safety', () => {
  const schema = readFileSync(join(__dirname, '../../../../prisma/schema.prisma'), 'utf8');
  const controller = readFileSync(join(__dirname, '../controllers/social-moderation.controller.ts'), 'utf8');
  const permissions = readFileSync(join(__dirname, '../../staff-roles/constants/permission-catalog.ts'), 'utf8');
  const main = readFileSync(join(__dirname, '../../../main.ts'), 'utf8');
  const swaggerAccess = readFileSync(join(__dirname, '../../common/swagger-access.ts'), 'utf8');

  it('adds social moderation models and permissions', () => {
    for (const text of ['model SocialPost', 'model SocialReport', 'model SocialModerationLog', 'model SocialReportingRule', 'model UserWarning']) expect(schema).toContain(text);
    for (const text of ["module: 'socialModeration'", "key: 'read'", "key: 'update'", "module: 'socialReportingRules'"]) expect(permissions).toContain(text);
  });

  it('uses required Swagger tags, route order, and no duplicate routes', () => {
    expect(main).toContain("'02 Admin - Social Moderation'");
    expect(main).toContain("'02 Admin - Social Reporting Rules'");
    expect(controller.indexOf("@Get('stats')")).toBeLessThan(controller.indexOf("@Get('reports/:id')"));
    expect(controller.indexOf("@Get('export')")).toBeLessThan(controller.indexOf("@Get('reports/:id')"));
    expect(swaggerAccess).toContain('/api/v1/admin/social-moderation/reports/{id}/action');
    expect(controller).toContain("@Patch(':id') @Permissions('socialReportingRules.update')");
    expect(controller).not.toContain("@Patch(':id/status')");
    expect(swaggerAccess).not.toContain('/api/v1/admin/social-reporting-rules/{id}/status');
  });

  it('removes old social reporting rule status route from Swagger', () => {
    const openapi = JSON.parse(readFileSync(join(__dirname, '../../../../docs/generated/openapi.json'), 'utf8')) as { paths: Record<string, { patch?: { requestBody?: { content?: { 'application/json'?: { examples?: Record<string, unknown> } } } } }> };
    expect(openapi.paths['/api/v1/admin/social-reporting-rules/{id}']).toBeDefined();
    expect(openapi.paths['/api/v1/admin/social-reporting-rules/{id}/status']).toBeUndefined();
    expect(Object.keys(openapi.paths['/api/v1/admin/social-reporting-rules/{id}']?.patch?.requestBody?.content?.['application/json']?.examples ?? {})).toEqual(expect.arrayContaining(['updateRule', 'activateRule', 'deactivateRule']));
  });
});
