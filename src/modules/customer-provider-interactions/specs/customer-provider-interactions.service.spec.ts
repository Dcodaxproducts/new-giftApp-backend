import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

describe('Customer Provider Interaction module', () => {
  const service = readFileSync(join(__dirname, '../services/customer-provider-interactions.service.ts'), 'utf8');
  const controller = readFileSync(join(__dirname, '../controllers/customer-provider-interactions.controller.ts'), 'utf8');
  const moduleFile = readFileSync(join(__dirname, '../customer-provider-interactions.module.ts'), 'utf8');
  const chatsController = readFileSync(join(__dirname, '../../chats/controllers/chats.controller.ts'), 'utf8');
  const customerReviewsRepository = readFileSync(join(__dirname, '../repositories/customer-reviews.repository.ts'), 'utf8');
  const customerProviderReportsRepository = readFileSync(join(__dirname, '../repositories/customer-provider-reports.repository.ts'), 'utf8');
  const customerProviderInteractionsRepository = readFileSync(join(__dirname, '../repositories/customer-provider-interactions.repository.ts'), 'utf8');
  const schema = readFileSync(join(__dirname, '../../../../prisma/schema.prisma'), 'utf8');
  const storageDto = readFileSync(join(__dirname, '../../storage/dto/create-presigned-upload.dto.ts'), 'utf8');
  const storageService = readFileSync(join(__dirname, '../../storage/storage.service.ts'), 'utf8');
  const appModule = readFileSync(join(__dirname, '../../../app.module.ts'), 'utf8');
  const main = readFileSync(join(__dirname, '../../../main.ts'), 'utf8');

  it('registers customer provider interaction reviews/reports without chat internals', () => {
    expect(appModule).toContain('CustomerProviderInteractionsModule');
    expect(appModule).toContain('ChatsModule');
    expect(moduleFile).toContain('CustomerProviderInteractionsController');
    expect(moduleFile).not.toContain('CustomerChatsRepository');
    expect(moduleFile).toContain('CustomerProviderReportsRepository');
    expect(moduleFile).toContain('CustomerProviderInteractionsRepository');
    expect(existsSync(join(__dirname, '../repositories/customer-chats.repository.ts'))).toBe(false);
    expect(controller).not.toContain("@ApiTags('05 Customer - Provider Chat')");
    expect(chatsController).toContain("@ApiTags('08 Chat - Unified Threads')");
    expect(controller).toContain("@ApiTags('05 Customer - Reviews')");
    expect(controller).toContain("@ApiTags('05 Customer - Provider Reports')");
    expect(main).not.toContain("'05 Customer - Provider Chat'");
  });

  it('uses shared chat/review models and creates provider report model', () => {
    expect(schema).toContain('model ChatThread');
    expect(schema).toContain('model ChatMessage');
    expect(schema).toContain('model ChatParticipant');
    expect(schema).toContain('model Review');
    expect(schema).toContain('model ReviewResponse');
    expect(schema).toContain('model ProviderReport');
  });

  it('customer chat routes live only in the chat controller', () => {
    for (const route of ["@Get()", "@Get('quick-replies')", "@Post('threads')", "@Get('threads/:threadId')", "@Get('threads/:threadId/messages')", "@Post('threads/:threadId/messages')", "@Patch('threads/:threadId/read')"]) expect(chatsController).toContain(route);
    for (const oldRoute of ["@Get('chats')", "@Get('chats/quick-replies')", "@Get('chats/:threadId')", "@Post('chats/:threadId/messages')", "@Patch('chats/:threadId/read')", "@Get('orders/:id/chat')", "@Post('orders/:id/chat')"]) expect(controller).not.toContain(oldRoute);
    expect(chatsController).toContain('UserRole.REGISTERED_USER');
  });

  it('exposes customer review CRUD routes and blocks duplicate provider order reviews', () => {
    for (const route of ["@Post('orders/:id/reviews')", "@Get('reviews')", "@Get('reviews/:id')", "@Patch('reviews/:id')", "@Delete('reviews/:id')"]) expect(controller).toContain(route);
    expect(service).toContain('Only delivered or completed orders can be reviewed');
    expect(service).toContain('You have already reviewed this provider order');
    expect(service).toContain('deleteReview(id)');
    expect(customerReviewsRepository).toContain('review.delete');
  });

  it('connects customer reviews to admin/provider moderation and notifications', () => {
    expect(service).toContain('ReviewModerationActorType.SYSTEM');
    expect(service).toContain('ReviewModerationAction.AUTO_APPROVED');
    expect(service).toContain('ReviewModerationAction.AUTO_FLAGGED');
    expect(service).toContain('PROVIDER_REVIEW');
    expect(service).toContain('detectedCategoriesJson');
  });

  it('exposes provider report reasons before provider report details and validates relationships', () => {
    for (const route of ["@Get('provider-report-reasons')", "@Post('providers/:providerId/reports')", "@Get('provider-reports')", "@Get('provider-reports/:id')"]) expect(controller).toContain(route);
    expect(controller.indexOf("@Get('provider-report-reasons')")).toBeLessThan(controller.indexOf("@Get('provider-reports/:id')"));
    expect(service).toContain('assertProviderRelationship');
    expect(service).toContain('You can report only providers you have interacted with');
    expect(service).toContain('An active report for this provider/order/reason already exists');
  });

  it('creates customer/admin notifications for provider reports', () => {
    expect(customerProviderReportsRepository).toContain('Provider report submitted');
    expect(customerProviderReportsRepository).toContain('PROVIDER_REPORT_ADMIN');
    expect(service).toContain('New provider review');
  });

  it('customer-provider-interactions.service.ts no longer imports PrismaService or uses this.prisma', () => {
    expect(service).not.toContain('PrismaService');
    expect(service).not.toContain('this.prisma');
    expect(customerProviderReportsRepository).toContain('constructor(prisma: PrismaService)');
    expect(customerProviderInteractionsRepository).toContain('constructor(private readonly prisma: PrismaService)');
  });

  it('adds provider report evidence upload folder for registered users', () => {
    expect(storageDto).toContain("PROVIDER_REPORT_EVIDENCE = 'provider-report-evidence'");
    expect(storageService).toContain('UploadFolder.PROVIDER_REPORT_EVIDENCE');
    expect(storageService).toContain('Registered users can upload only allowed customer files');
  });
});
