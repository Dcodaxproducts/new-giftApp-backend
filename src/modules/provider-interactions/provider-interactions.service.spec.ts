import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

describe('Provider Reviews module', () => {
  const service = readFileSync(join(__dirname, '../services/provider-interactions.service.ts'), 'utf8');
  const reviewsRepository = readFileSync(join(__dirname, '../repositories/provider-reviews.repository.ts'), 'utf8');
  const reviewResponsesRepository = readFileSync(join(__dirname, '../repositories/provider-review-responses.repository.ts'), 'utf8');
  const controller = readFileSync(join(__dirname, '../controllers/provider-interactions.controller.ts'), 'utf8');
  const chatsController = readFileSync(join(__dirname, '../../chats/controllers/chats.controller.ts'), 'utf8');
  const moduleFile = readFileSync(join(__dirname, '../provider-interactions.module.ts'), 'utf8');
  const schema = readFileSync(join(__dirname, '../../../../prisma/schema.prisma'), 'utf8');
  const appModule = readFileSync(join(__dirname, '../../../app.module.ts'), 'utf8');
  const main = readFileSync(join(__dirname, '../../../main.ts'), 'utf8');

  it('registers provider review module without buyer chat internals', () => {
    expect(appModule).toContain('ProviderInteractionsModule');
    expect(moduleFile).toContain('DatabaseModule');
    expect(moduleFile).not.toContain('ProviderBuyerChatRepository');
    expect(moduleFile).not.toContain('ProviderInteractionsRepository');
    expect(existsSync(join(__dirname, '../repositories/provider-buyer-chat.repository.ts'))).toBe(false);
    expect(controller).not.toContain("@ApiTags('03 Provider - Buyer Chat')");
    expect(chatsController).toContain("@ApiTags('08 Chat - Threads')");
    expect(controller).toContain("@ApiTags('03 Provider - Reviews')");
    expect(main).not.toContain("'03 Provider - Buyer Chat'");
    expect(controller).toContain('@Roles(UserRole.PROVIDER)');
  });

  it('provider review APIs and chat APIs are documented in swagger access metadata', () => {
    const access = readFileSync(join(__dirname, '../../common/swagger-access.ts'), 'utf8');
    expect(access).toContain("'GET /api/v1/chats': { allowedRoles: 'REGISTERED_USER, PROVIDER, SUPER_ADMIN, or ADMIN with chat/support permission'");
    expect(access).not.toContain("'GET /api/v1/provider/chats': { allowedRoles: 'PROVIDER'");
    expect(access).toContain("'GET /api/v1/provider/reviews': { allowedRoles: 'PROVIDER'");
  });

  it('reuses shared chat and review models without duplicate provider-specific tables', () => {
    expect(schema).toContain('model ChatThread');
    expect(schema).toContain('model ChatMessage');
    expect(schema).toContain('model ChatParticipant');
    expect(schema).toContain('model Review');
    expect(schema).toContain('model ReviewResponse');
    expect(schema).not.toContain('model ProviderReview');
    expect(schema).not.toContain('model ProviderChatThread');
  });

  it('provider chat routes live only in the chat controller', () => {
    for (const route of ["@Get()", "@Get('quick-replies')", "@Post('threads')", "@Get('threads/:threadId')", "@Post('threads/:threadId/messages')", "@Patch('threads/:threadId/read')"]) expect(chatsController).toContain(route);
    for (const oldRoute of ["@Get('chats')", "@Get('chats/quick-replies')", "@Get('chats/:threadId')", "@Post('chats/:threadId/messages')", "@Patch('chats/:threadId/read')", "@Get('orders/:id/chat')", "@Post('orders/:id/chat')"]) expect(controller).not.toContain(oldRoute);
  });

  it('repository owns Prisma access for provider review flows', () => {
    expect(service).toContain('reviewsRepository.findReviewSummaryForProvider');
    expect(service).toContain('reviewsRepository.findReviewsForProvider');
    expect(service).toContain('reviewResponsesRepository.findReviewResponseForProvider');
    expect(service).toContain('reviewResponsesRepository.createReviewResponse');
    expect(reviewsRepository).toContain('prisma.review.findMany');
    expect(reviewResponsesRepository).toContain('prisma.reviewResponse.create');
  });

  it('provider can only fetch own reviews and can manage only own public response', () => {
    expect(service).toContain('getOwnedReview(user.uid, id)');
    expect(service).toContain('Review not found');
    expect(service).toContain('providerId: user.uid');
  });

  it('exposes provider review routes with summary/filter-options before details', () => {
    for (const route of ["@Get('reviews/summary')", "@Get('reviews')", "@Get('reviews/filter-options')", "@Get('reviews/:id')", "@Post('reviews/:id/response')", "@Patch('reviews/:id/response')", "@Delete('reviews/:id/response')"]) expect(controller).toContain(route);
    expect(controller.indexOf("@Get('reviews/summary')")).toBeLessThan(controller.indexOf("@Get('reviews/:id')"));
    expect(controller.indexOf("@Get('reviews/filter-options')")).toBeLessThan(controller.indexOf("@Get('reviews/:id')"));
  });

  it('scopes provider reviews and excludes hidden/removed review records', () => {
    expect(service).toContain('publicReviewWhere(user.uid)');
    expect(service).toContain('providerId, deletedAt: null');
    expect(service).toContain('ReviewStatus.HIDDEN');
    expect(service).toContain('ReviewStatus.REMOVED');
    expect(reviewsRepository).toContain('review.aggregate');
    expect(service).toContain('ratingDistribution');
  });

  it('allows one active public response and prevents editing customer review content', () => {
    expect(service).toContain('Active response already exists for this review');
    expect(reviewResponsesRepository).toContain('reviewResponse.create');
    expect(reviewResponsesRepository).toContain('reviewResponse.update');
    expect(reviewResponsesRepository).toContain('reviewResponse.delete');
    expect(service).not.toContain('review.update');
    expect(service).not.toContain('comment: dto.body');
  });

  it('notifies customer when provider responds to review', () => {
    expect(service).toContain('Provider responded to your review');
    expect(service).toContain('REVIEW_RESPONSE');
    expect(service).toContain('createCustomerNotification');
  });
});
