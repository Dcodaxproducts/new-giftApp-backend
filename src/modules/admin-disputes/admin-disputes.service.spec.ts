import { readFileSync } from 'fs';
import { join } from 'path';

describe('Admin Dispute Manager Core module', () => {
  const service = readFileSync(join(__dirname, 'admin-disputes.service.ts'), 'utf8');
  const controller = readFileSync(join(__dirname, 'admin-disputes.controller.ts'), 'utf8');
  const moduleFile = readFileSync(join(__dirname, 'admin-disputes.module.ts'), 'utf8');
  const dto = readFileSync(join(__dirname, 'dto/admin-disputes.dto.ts'), 'utf8');
  const schema = readFileSync(join(__dirname, '../../../prisma/schema.prisma'), 'utf8');
  const permissions = readFileSync(join(__dirname, '../auth/permission-catalog.ts'), 'utf8');
  const storageDto = readFileSync(join(__dirname, '../storage/dto/create-presigned-upload.dto.ts'), 'utf8');
  const storageService = readFileSync(join(__dirname, '../storage/storage.service.ts'), 'utf8');
  const appModule = readFileSync(join(__dirname, '../../app.module.ts'), 'utf8');

  it('creates dispute models without mixing provider refund/customer order APIs', () => {
    for (const text of ['model DisputeCase', 'model DisputeEvidence', 'model DisputeNote', 'model DisputeTimeline', 'caseId', 'slaDeadlineAt', 'linkedRefundId', 'metadataJson']) expect(schema).toContain(text);
    expect(service).toContain('disputeCase.findMany');
    expect(service).toContain('refundEligible');
    expect(controller).not.toContain("@Controller('provider");
    expect(controller).not.toContain("@Controller('customer");
  });

  it('registers module and swagger groups', () => {
    expect(appModule).toContain('AdminDisputesModule');
    expect(moduleFile).toContain('AdminDisputesController');
    expect(controller).toContain("@ApiTags('02 Admin - Dispute Manager')");
    expect(controller).toContain("@ApiTags('02 Admin - Dispute Evidence')");
    expect(controller).toContain('SLA remaining text is computed from slaDeadlineAt');
  });

  it('adds required dispute permissions to the catalog', () => {
    for (const text of ["module: 'disputes'", "key: 'read'", "key: 'create'", "key: 'update'", "key: 'assign'", "key: 'notes.create'", "key: 'export'", "key: 'evidence.read'", "key: 'timeline.read'"]) expect(permissions).toContain(text);
  });

  it('exposes static routes before /admin/disputes/:id', () => {
    const statsIndex = controller.indexOf("@Get('stats')");
    const exportIndex = controller.indexOf("@Get('export')");
    const idIndex = controller.indexOf("@Get(':id')");
    expect(statsIndex).toBeGreaterThan(-1);
    expect(exportIndex).toBeGreaterThan(statsIndex);
    expect(exportIndex).toBeLessThan(idIndex);
  });

  it('admin can list disputes with filters', () => {
    expect(controller).toContain('@Get()');
    expect(controller).toContain('list(@Query() query: ListDisputesDto)');
    expect(service).toContain('disputeWhere(query)');
    expect(service).toContain('DisputeStatusFilter.ALL');
    expect(dto).toContain('sortBy?: DisputeSortBy');
  });

  it('admin can fetch dispute details and internal transaction data', () => {
    expect(controller).toContain("@Get(':id')");
    expect(controller).toContain("@Get(':id/internal-data')");
    expect(service).toContain('processorAuthCode');
    expect(service).toContain('transactionHistory');
    expect(service).not.toContain('card');
  });

  it('admin can fetch dispute evidence and storage allows dispute-evidence folder', () => {
    expect(controller).toContain("@Get(':id/evidence')");
    expect(controller).toContain("@Permissions('disputes.evidence.read')");
    expect(service).toContain('disputeEvidence.findMany');
    expect(storageDto).toContain("DISPUTE_EVIDENCE = 'dispute-evidence'");
    expect(storageService).toContain('UploadFolder.DISPUTE_EVIDENCE');
  });

  it('admin can fetch timeline and add internal note', () => {
    expect(controller).toContain("@Get(':id/timeline')");
    expect(controller).toContain("@Post(':id/notes')");
    expect(service).toContain('disputeTimeline.findMany');
    expect(service).toContain('disputeNote.create');
    expect(service).toContain('DISPUTE_NOTE_ADDED');
  });

  it('admin cannot access list/detail/stat APIs without disputes.read', () => {
    expect(controller).toContain("@Permissions('disputes.read')");
    expect(controller).toContain('PermissionsGuard');
    expect(controller).toContain('UserRole.SUPER_ADMIN, UserRole.ADMIN');
  });

  it('dispute export requires disputes.export', () => {
    expect(controller).toContain("@Get('export')");
    expect(controller).toContain("@Permissions('disputes.export')");
    expect(service).toContain('Case ID');
    expect(service).not.toContain('cardNumber');
  });
});
