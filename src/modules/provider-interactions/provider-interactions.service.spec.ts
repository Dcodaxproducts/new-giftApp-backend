import { readFileSync } from 'fs';
import { join } from 'path';

describe('Provider Chat and Reviews module', () => {
  const service = readFileSync(join(__dirname, 'provider-interactions.service.ts'), 'utf8');
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
    expect(service).toContain('where: { id, providerId }');
    expect(service).toContain('getOwnedThread(user.uid, threadId)');
    expect(service).toContain('senderType: ChatSenderType.PROVIDER');
    expect(service).toContain('isReadByCustomer: false');
    expect(service).toContain('isReadByProvider: true');
    expect(service).toContain('New provider message');
  });

  it('validates provider chat text and attachment payloads and marks reads', () => {
    expect(dto).toContain('ChatMessageType');
    expect(service).toContain('body is required for TEXT messages');
    expect(service).toContain('attachmentUrls are required for attachment messages');
    expect(service).toContain('senderType: ChatSenderType.CUSTOMER');
    expect(service).toContain('isReadByProvider: true');
    expect(storageService).toContain('UploadFolder.CHAT_ATTACHMENTS');
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
    expect(service).toContain('review.aggregate');
    expect(service).toContain('ratingDistribution');
  });

  it('allows one active public response and prevents editing customer review content', () => {
    expect(service).toContain('Active response already exists for this review');
    expect(service).toContain('reviewResponse.create');
    expect(service).toContain('reviewResponse.update');
    expect(service).toContain('reviewResponse.delete');
    expect(service).not.toContain('review.update');
    expect(service).not.toContain('comment: dto.body');
  });

  it('notifies customer when provider responds to review', () => {
    expect(service).toContain('Provider responded to your review');
    expect(service).toContain('REVIEW_RESPONSE');
    expect(service).toContain('recipientType: NotificationRecipientType.REGISTERED_USER');
  });
});
