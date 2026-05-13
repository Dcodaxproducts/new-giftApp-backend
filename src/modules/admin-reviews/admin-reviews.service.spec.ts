import { readFileSync } from 'fs';
import { join } from 'path';

describe('Admin Ratings & Reviews Management module', () => {
  const service = readFileSync(join(__dirname, 'admin-reviews.service.ts'), 'utf8');
  const reviewsController = readFileSync(join(__dirname, 'admin-reviews.controller.ts'), 'utf8');
  const policiesController = readFileSync(join(__dirname, 'review-policies.controller.ts'), 'utf8');
  const moduleFile = readFileSync(join(__dirname, 'admin-reviews.module.ts'), 'utf8');
  const schema = readFileSync(join(__dirname, '../../../prisma/schema.prisma'), 'utf8');
  const permissions = readFileSync(join(__dirname, '../auth/permission-catalog.ts'), 'utf8');
  const appModule = readFileSync(join(__dirname, '../../app.module.ts'), 'utf8');

  it('creates shared review models for admin and provider review flows', () => {
    expect(schema).toContain('model Review');
    expect(schema).toContain('model ReviewResponse');
    expect(schema).toContain('model ReviewModerationLog');
    expect(schema).toContain('model ReviewPolicy');
    expect(schema).toContain('reviewCode');
    expect(schema).toContain('providerOrderId');
    expect(schema).toContain('detectedCategoriesJson');
    expect(schema).toContain('customerReviews');
    expect(schema).toContain('providerReviews');
    expect(schema).toContain('reviewResponses');
  });

  it('registers the admin review module and swagger groups', () => {
    expect(appModule).toContain('AdminReviewsModule');
    expect(moduleFile).toContain('AdminReviewsController');
    expect(moduleFile).toContain('ReviewPoliciesController');
    expect(reviewsController).toContain("@ApiTags('02 Admin - Reviews Management')");
    expect(reviewsController).toContain("@ApiTags('02 Admin - Review Moderation')");
    expect(policiesController).toContain("@ApiTags('02 Admin - Review Policies')");
  });

  it('adds required review permissions to the catalog', () => {
    for (const text of ["module: 'reviews'", "key: 'read'", "key: 'moderate'", "key: 'approve'", "key: 'remove'", "key: 'hide'", "key: 'penalize'", "key: 'export'", "module: 'reviewPolicies'", "key: 'update'", "module: 'reviewModerationLogs'"]) {
      expect(permissions).toContain(text);
    }
  });

  it('exposes admin dashboard, stats, list, details, and export routes before :id', () => {
    const dashboardIndex = reviewsController.indexOf("@Get('dashboard')");
    const statsIndex = reviewsController.indexOf("@Get('stats')");
    const exportIndex = reviewsController.indexOf("@Get('export')");
    const idIndex = reviewsController.indexOf("@Get(':id')");
    expect(dashboardIndex).toBeGreaterThan(-1);
    expect(statsIndex).toBeGreaterThan(dashboardIndex);
    expect(exportIndex).toBeGreaterThan(statsIndex);
    expect(exportIndex).toBeLessThan(idIndex);
    expect(reviewsController).toContain("@Permissions('reviews.read')");
    expect(reviewsController).toContain("@Permissions('reviews.export')");
  });

  it('exposes flagged queue, moderation action, and moderation log APIs before :id', () => {
    for (const route of ["@Get('flagged-summary')", "@Get('moderation-queue')", "@Get('moderation-logs')", "@Post(':id/moderate')"]) {
      expect(reviewsController).toContain(route);
    }
    expect(reviewsController.indexOf("@Get('moderation-logs')")).toBeLessThan(reviewsController.indexOf("@Get(':id')"));
    expect(reviewsController).toContain("@Permissions('reviews.moderate')");
    expect(reviewsController).toContain("@Permissions('reviewModerationLogs.read')");
  });

  it('implements moderation actions, ReviewModerationLog, audit log, and no physical delete', () => {
    for (const action of ['APPROVE', 'HIDE', 'REMOVE', 'PENALIZE', 'RESTORE', 'MARK_SPAM', 'MARK_FAKE']) expect(schema).toContain(action);
    expect(service).toContain('status: map[dto.action]');
    expect(service).toContain('reviewModerationLog.create');
    expect(service).toContain('REVIEW_${dto.action}');
    expect(service).toContain('deletedAt: null');
    expect(service).not.toContain('review.delete');
  });

  it('enforces delegated action permissions beyond broad moderation access', () => {
    expect(service).toContain('assertActionPermission');
    expect(service).toContain('reviews.approve');
    expect(service).toContain('reviews.remove');
    expect(service).toContain('reviews.hide');
    expect(service).toContain('reviews.penalize');
  });

  it('implements dashboard and analytics aggregations from reviews, logs, policies, and flagged records', () => {
    expect(service).toContain('review.aggregate');
    expect(service).toContain('reviewModerationLog.findMany');
    expect(service).toContain('getOrCreatePolicy');
    expect(service).toContain('flaggedSummary');
    expect(service).toContain('ratingDistribution');
    expect(service).toContain('autoModerationAccuracy');
  });

  it('implements policies get/update/test with deterministic placeholder logic and audit logging', () => {
    expect(policiesController).toContain("@Controller('admin/review-policies')");
    expect(policiesController).toContain("@Patch()");
    expect(policiesController).toContain("@Post('test')");
    expect(service).toContain('REVIEW_POLICY_UPDATED');
    expect(service).toContain('sampleReviewText.toLowerCase()');
    expect(policiesController).toContain('No external AI call');
  });

  it('supports export without customer PII and keeps provider responses linked', () => {
    expect(service).toContain('review.findMany');
    expect(service).toContain('Review Code');
    expect(service).toContain('Has Provider Response');
    expect(service).not.toContain("'Customer Email'");
    expect(service).toContain('response: { where: { deletedAt: null }');
  });
});
