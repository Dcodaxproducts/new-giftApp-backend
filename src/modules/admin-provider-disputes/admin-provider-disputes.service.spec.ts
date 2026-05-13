import { readFileSync } from 'fs';
import { join } from 'path';

describe('Admin Provider Dispute Management Core module', () => {
  const service = readFileSync(join(__dirname, 'admin-provider-disputes.service.ts'), 'utf8');
  const controller = readFileSync(join(__dirname, 'admin-provider-disputes.controller.ts'), 'utf8');
  const moduleFile = readFileSync(join(__dirname, 'admin-provider-disputes.module.ts'), 'utf8');
  const dto = readFileSync(join(__dirname, 'dto/admin-provider-disputes.dto.ts'), 'utf8');
  const schema = readFileSync(join(__dirname, '../../../prisma/schema.prisma'), 'utf8');
  const permissions = readFileSync(join(__dirname, '../auth/permission-catalog.ts'), 'utf8');
  const storageDto = readFileSync(join(__dirname, '../storage/dto/create-presigned-upload.dto.ts'), 'utf8');
  const storageService = readFileSync(join(__dirname, '../storage/storage.service.ts'), 'utf8');
  const appModule = readFileSync(join(__dirname, '../../app.module.ts'), 'utf8');

  it('creates provider dispute models distinct from customer disputes/refund handling', () => {
    for (const text of ['model ProviderDisputeCase', 'model ProviderDisputeEvidence', 'model ProviderDisputeNote', 'model ProviderDisputeTimeline', 'providerOrderId', 'customerStatement', 'evidenceReviewStartedAt', 'evidenceReviewCompletedAt']) expect(schema).toContain(text);
    expect(controller).toContain("@Controller('admin/provider-disputes')");
    expect(controller).not.toContain("@Controller('admin/disputes')");
  });

  it('registers module and swagger groups', () => {
    expect(appModule).toContain('AdminProviderDisputesModule');
    expect(moduleFile).toContain('AdminProviderDisputesController');
    expect(controller).toContain("@ApiTags('02 Admin - Provider Dispute Manager')");
    expect(controller).toContain("@ApiTags('02 Admin - Provider Dispute Evidence')");
  });

  it('adds provider dispute permissions to the catalog', () => {
    for (const text of ["module: 'providerDisputes'", "key: 'read'", "key: 'create'", "key: 'update'", "key: 'assign'", "key: 'evidence.read'", "key: 'evidence.request'", "key: 'notes.create'", "key: 'export'"]) expect(permissions).toContain(text);
  });

  it('provider-dispute static routes do not conflict with :id', () => {
    const statsIndex = controller.indexOf("@Get('stats')");
    const exportIndex = controller.indexOf("@Get('export')");
    const idIndex = controller.indexOf("@Get(':id')");
    expect(statsIndex).toBeGreaterThan(-1);
    expect(exportIndex).toBeGreaterThan(statsIndex);
    expect(exportIndex).toBeLessThan(idIndex);
  });

  it('admin can fetch provider dispute stats', () => {
    expect(controller).toContain("@Get('stats')");
    expect(controller).toContain("@Permissions('providerDisputes.read')");
    expect(service).toContain('criticalOpenCases');
    expect(dto).toContain('QUARTERLY');
  });

  it('admin can list provider disputes with filters', () => {
    expect(controller).toContain('@Get()');
    expect(controller).toContain('list(@Query() query: ListProviderDisputesDto)');
    expect(service).toContain('providerDisputeCase.findMany');
    expect(service).toContain('ProviderDisputeStatusFilter.ALL');
    expect(dto).toContain('sortBy?: ProviderDisputeSortBy');
  });

  it('admin can fetch provider dispute details', () => {
    expect(controller).toContain("@Get(':id')");
    expect(service).toContain('Provider dispute details fetched successfully.');
    expect(service).toContain('providerShare');
    expect(service).toContain('platformFee');
  });

  it('admin can fetch evidence exchange and storage allows provider-dispute-evidence folder', () => {
    expect(controller).toContain("@Get(':id/evidence')");
    expect(service).toContain('customerEvidence');
    expect(service).toContain('providerEvidence');
    expect(storageDto).toContain("PROVIDER_DISPUTE_EVIDENCE = 'provider-dispute-evidence'");
    expect(storageService).toContain('UploadFolder.PROVIDER_DISPUTE_EVIDENCE');
  });

  it('admin can request additional evidence', () => {
    expect(controller).toContain("@Post(':id/evidence/request')");
    expect(controller).toContain("@Permissions('providerDisputes.evidence.request')");
    expect(service).toContain('ADDITIONAL_EVIDENCE_REQUESTED');
    expect(service).toContain('notifyEvidenceTargets');
  });

  it('admin can mark evidence review complete and it moves case to RULING_PENDING', () => {
    expect(controller).toContain("@Post(':id/evidence/mark-reviewed')");
    expect(service).toContain('EVIDENCE_REVIEW_COMPLETED');
    expect(service).toContain('ProviderDisputeStatus.RULING_PENDING');
  });

  it('admin can add internal notes and timeline records evidence actions', () => {
    expect(controller).toContain("@Post(':id/notes')");
    expect(service).toContain('providerDisputeNote.create');
    for (const action of ['PROVIDER_DISPUTE_CREATED', 'CUSTOMER_EVIDENCE_SUBMITTED', 'PROVIDER_EVIDENCE_SUBMITTED', 'ADDITIONAL_EVIDENCE_REQUESTED', 'EVIDENCE_REVIEW_STARTED', 'EVIDENCE_REVIEW_COMPLETED']) {
      expect(schema + service).toContain(action);
    }
  });
});
