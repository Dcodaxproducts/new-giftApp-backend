import { readFileSync } from 'fs';
import { join } from 'path';

describe('Customer Provider Interaction module', () => {
  const service = readFileSync(join(__dirname, 'customer-provider-interactions.service.ts'), 'utf8');
  const controller = readFileSync(join(__dirname, 'customer-provider-interactions.controller.ts'), 'utf8');
  const moduleFile = readFileSync(join(__dirname, 'customer-provider-interactions.module.ts'), 'utf8');
  const dto = readFileSync(join(__dirname, 'dto/customer-provider-interactions.dto.ts'), 'utf8');
  const schema = readFileSync(join(__dirname, '../../../prisma/schema.prisma'), 'utf8');
  const storageDto = readFileSync(join(__dirname, '../storage/dto/create-presigned-upload.dto.ts'), 'utf8');
  const storageService = readFileSync(join(__dirname, '../storage/storage.service.ts'), 'utf8');
  const appModule = readFileSync(join(__dirname, '../../app.module.ts'), 'utf8');
  const main = readFileSync(join(__dirname, '../../main.ts'), 'utf8');

  it('registers customer provider interaction module and Swagger groups', () => {
    expect(appModule).toContain('CustomerProviderInteractionsModule');
    expect(moduleFile).toContain('CustomerProviderInteractionsController');
    expect(controller).toContain("@ApiTags('05 Customer - Provider Chat')");
    expect(controller).toContain("@ApiTags('05 Customer - Reviews')");
    expect(controller).toContain("@ApiTags('05 Customer - Provider Reports')");
    expect(main).toContain("'05 Customer - Provider Chat'");
    expect(main).toContain("'05 Customer - Reviews'");
    expect(main).toContain("'05 Customer - Provider Reports'");
  });

  it('uses shared chat/review models and creates provider report model', () => {
    expect(schema).toContain('model ChatThread');
    expect(schema).toContain('model ChatMessage');
    expect(schema).toContain('model Review');
    expect(schema).toContain('model ReviewResponse');
    expect(schema).toContain('model ProviderReport');
    expect(schema).toContain('ProviderReportReason');
    expect(schema).toContain('ProviderReportStatus');
  });

  it('exposes required customer chat routes with quick replies before :threadId', () => {
    for (const route of ["@Get('chats')", "@Get('chats/quick-replies')", "@Get('chats/:threadId')", "@Post('chats/:threadId/messages')", "@Patch('chats/:threadId/read')", "@Get('orders/:id/chat')", "@Post('orders/:id/chat')"]) expect(controller).toContain(route);
    expect(controller.indexOf("@Get('chats/quick-replies')")).toBeLessThan(controller.indexOf("@Get('chats/:threadId')"));
    expect(controller).toContain('@Roles(UserRole.REGISTERED_USER)');
  });

  it('enforces order ownership and provider order ownership for chat creation and messaging', () => {
    expect(service).toContain('getOwnedOrder(user.uid, orderId)');
    expect(service).toContain('providerOrderId: providerOrder.id');
    expect(service).toContain('getOwnedThread(user.uid, threadId)');
    expect(service).toContain('senderType: ChatSenderType.CUSTOMER');
    expect(service).toContain('isReadByCustomer: true');
    expect(service).toContain('isReadByProvider: false');
    expect(service).toContain('CHAT_MESSAGE');
  });

  it('validates chat message payloads and marks customer-owned chats read', () => {
    expect(dto).toContain('ChatMessageType');
    expect(service).toContain('body is required for TEXT messages');
    expect(service).toContain('attachmentUrls are required for attachment messages');
    expect(service).toContain('senderType: ChatSenderType.PROVIDER');
    expect(service).toContain('isReadByCustomer: true');
  });

  it('exposes customer review CRUD routes and blocks duplicate provider order reviews', () => {
    for (const route of ["@Post('orders/:id/reviews')", "@Get('reviews')", "@Get('reviews/:id')", "@Patch('reviews/:id')", "@Delete('reviews/:id')"]) expect(controller).toContain(route);
    expect(service).toContain('Only delivered or completed orders can be reviewed');
    expect(service).toContain('You have already reviewed this provider order');
    expect(service).toContain('deletedAt: new Date()');
    expect(service).not.toContain('review.delete');
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

  it('creates customer/admin notifications for provider reports and provider notifications for chat/reviews', () => {
    expect(service).toContain('Provider report submitted');
    expect(service).toContain('PROVIDER_REPORT_ADMIN');
    expect(service).toContain('New customer message');
    expect(service).toContain('New provider review');
  });

  it('adds provider report evidence upload folder for registered users', () => {
    expect(storageDto).toContain("PROVIDER_REPORT_EVIDENCE = 'provider-report-evidence'");
    expect(storageService).toContain('UploadFolder.PROVIDER_REPORT_EVIDENCE');
    expect(storageService).toContain('Registered users can upload only allowed customer files');
  });
});
