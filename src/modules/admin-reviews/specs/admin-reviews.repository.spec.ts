import { readFileSync } from 'fs';
import { join } from 'path';

describe('Admin reviews repository cleanup', () => {
  const service = readFileSync(join(__dirname, '../services/admin-reviews.service.ts'), 'utf8');
  const repository = readFileSync(join(__dirname, '../repositories/admin-reviews.repository.ts'), 'utf8');
  const policiesRepository = readFileSync(join(__dirname, '../repositories/admin-review-policies.repository.ts'), 'utf8');
  const reviewsController = readFileSync(join(__dirname, '../controllers/admin-reviews.controller.ts'), 'utf8');
  const policiesController = readFileSync(join(__dirname, '../controllers/review-policies.controller.ts'), 'utf8');

  it('keeps admin review APIs stable', () => {
    for (const route of ["@Get('dashboard')", "@Get('stats')", '@Get()', "@Get('export')", "@Get(':id')", "@Get('flagged-summary')", "@Get('moderation-queue')", "@Get('moderation-logs')", "@Post(':id/moderate')"]) expect(reviewsController).toContain(route);
    expect(policiesController).toContain("@Controller('admin/review-policies')");
    expect(policiesController).toContain('@Get()');
    expect(policiesController).toContain('@Patch()');
    expect(policiesController).toContain("@Post('test')");
  });

  it('repositories own review and policy DB access', () => {
    for (const method of ['getDashboardRows', 'getReviewStatsRows', 'findReviewsAndCount', 'findReviewById', 'findReviewRawById', 'updateReview', 'createReviewModerationLog', 'findModerationLogsAndCount', 'findReviewsForExport', 'createModerationNotifications']) expect(repository).toContain(method);
    for (const method of ['findFirstPolicy', 'createDefaultPolicy', 'updatePolicy']) expect(policiesRepository).toContain(method);
    expect(repository).toContain('this.prisma.review.findMany');
    expect(repository).toContain('this.prisma.review.update');
    expect(repository).toContain('this.prisma.reviewModerationLog.create');
    expect(policiesRepository).toContain('this.prisma.reviewPolicy.update');
  });

  it('service preserves moderation decisions, logs, audit, policies, and exports', () => {
    expect(service).toContain('assertActionPermission');
    expect(service).toContain('status: map[dto.action]');
    expect(service).toContain('REVIEW_${dto.action}');
    expect(service).toContain('createModerationNotifications');
    expect(service).toContain('sampleReviewText.toLowerCase()');
    expect(service).toContain('Review Code');
    expect(service).not.toContain('review.delete');
  });
});
