import { readFileSync } from 'fs';
import { join } from 'path';

describe('Provider Chat and Reviews module', () => {
  const service = readFileSync(join(__dirname, 'provider-interactions.service.ts'), 'utf8');
  const chatRepository = readFileSync(join(__dirname, 'provider-buyer-chat.repository.ts'), 'utf8');
  const interactionsRepository = readFileSync(join(__dirname, 'provider-interactions.repository.ts'), 'utf8');
  const reviewsRepository = readFileSync(join(__dirname, 'provider-reviews.repository.ts'), 'utf8');
  const reviewResponsesRepository = readFileSync(join(__dirname, 'provider-review-responses.repository.ts'), 'utf8');
  const controller = readFileSync(join(__dirname, 'provider-interactions.controller.ts'), 'utf8');
  const moduleFile = readFileSync(join(__dirname, 'provider-interactions.module.ts'), 'utf8');
  const dto = readFileSync(join(__dirname, 'dto/provider-interactions.dto.ts'), 'utf8');
  const schema = readFileSync(join(__dirname, '../../../prisma/schema.prisma'), 'utf8');
  const appModule = readFileSync(join(__dirname, '../../app.module.ts'), 'utf8');
  const main = readFileSync(join(__dirname, '../../main.ts'), 'utf8');
  const storageService = readFileSync(join(__dirname, '../storage/storage.service.ts'), 'utf8');

  it('registers provider interaction module and Swagger groups', () => {
    expect(appModule).toContain('ProviderInteractionsModule');
    expect(moduleFile).toContain('JwtModule.register({})');
    expect(controller).toContain("@ApiTags('03 Provider - Buyer Chat')");
    expect(controller).toContain("@ApiTags('03 Provider - Reviews')");
    expect(main).toContain("'03 Provider - Buyer Chat'");
    expect(main).toContain("'03 Provider - Reviews'");
    expect(controller).toContain('@Roles(UserRole.PROVIDER)');
  });

  it('provider chat/review APIs are provider-only in swagger access metadata', () => {
    const access = readFileSync(join(__dirname, '../../swagger-access.ts'), 'utf8');
    expect(access).toContain("'GET /api/v1/provider/chats': { allowedRoles: 'PROVIDER'");
    expect(access).toContain("'GET /api/v1/provider/reviews': { allowedRoles: 'PROVIDER'");
  });

  it('reuses shared chat and review models without duplicate provider-specific tables', () => {
    expect(schema).toContain('model ChatThread');
    expect(schema).toContain('model ChatMessage');
    expect(schema).toContain('model Review');
    expect(schema).toContain('model ReviewResponse');
    expect(schema).not.toContain('model ProviderReview');
    expect(schema).not.toContain('model ProviderChatThread');
  });

  it('exposes provider chat routes with quick replies before thread details', () => {
    for (const route of ["@Get('chats')", "@Get('chats/quick-replies')", "@Get('chats/:threadId')", "@Post('chats/:threadId/messages')", "@Patch('chats/:threadId/read')", "@Get('orders/:id/chat')", "@Post('orders/:id/chat')"]) expect(controller).toContain(route);
    expect(controller.indexOf("@Get('chats/quick-replies')")).toBeLessThan(controller.indexOf("@Get('chats/:threadId')"));
  });

  it('enforces provider order/thread ownership for chats and creates buyer notifications', () => {
    expect(service).toContain('getOwnedProviderOrder(user.uid, providerOrderId)');
    expect(service).toContain('getOwnedThread(user.uid, threadId)');
    expect(interactionsRepository).toContain('findProviderOrderForChat');
    expect(chatRepository).toContain('findThreadForProvider');
    expect(chatRepository).toContain('createChatMessage');
    expect(service).toContain('isReadByCustomer: false');
    expect(service).toContain('isReadByProvider: true');
    expect(service).toContain('New provider message');
  });

  it('validates provider chat text and attachment payloads and marks reads', () => {
    expect(dto).toContain('ChatMessageType');
    expect(service).toContain('body is required for TEXT messages');
    expect(service).toContain('attachmentUrls are required for attachment messages');
    expect(chatRepository).toContain('senderType: ChatSenderType.CUSTOMER');
    expect(chatRepository).toContain('isReadByProvider: true');
    expect(storageService).toContain('UploadFolder.CHAT_ATTACHMENTS');
  });


  it('repository owns Prisma access for provider buyer chat flows', () => {
    expect(service).toContain('buyerChatRepository.findChatsForProvider');
    expect(service).toContain('buyerChatRepository.findThreadForProvider');
    expect(service).toContain('buyerChatRepository.findOrCreateThreadForProviderOrder');
    expect(service).toContain('buyerChatRepository.markThreadReadForProvider');
    expect(chatRepository).toContain('prisma.chatThread.findMany');
    expect(chatRepository).toContain('prisma.chatMessage.create');
  });

  it('provider can only access own order chat and cannot message unrelated customers', () => {
    expect(service).toContain('getOwnedProviderOrder(user.uid, providerOrderId)');
    expect(service).toContain('getOwnedThread(user.uid, threadId)');
    expect(service).toContain('Provider order not found');
    expect(service).toContain('Chat thread not found');
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
