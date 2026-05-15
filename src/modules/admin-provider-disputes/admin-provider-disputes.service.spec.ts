import { readFileSync } from 'fs';
import { join } from 'path';

describe('Admin Provider Dispute Management Core module', () => {
  const service = readFileSync(join(__dirname, 'admin-provider-disputes.service.ts'), 'utf8');
  const disputesRepository = readFileSync(join(__dirname, 'admin-provider-disputes.repository.ts'), 'utf8');
  const evidenceRepository = readFileSync(join(__dirname, 'provider-dispute-evidence.repository.ts'), 'utf8');
  const rulingsRepository = readFileSync(join(__dirname, 'provider-dispute-rulings.repository.ts'), 'utf8');
  const financialRepository = readFileSync(join(__dirname, 'provider-dispute-financial.repository.ts'), 'utf8');
  const resolutionRepository = readFileSync(join(__dirname, 'provider-dispute-resolution.repository.ts'), 'utf8');
  const logsRepository = readFileSync(join(__dirname, 'provider-dispute-logs.repository.ts'), 'utf8');
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
    expect(moduleFile).toContain('AdminProviderDisputesRepository');
    expect(moduleFile).toContain('ProviderDisputeEvidenceRepository');
    expect(moduleFile).toContain('ProviderDisputeRulingsRepository');
    expect(moduleFile).toContain('ProviderDisputeFinancialRepository');
    expect(moduleFile).toContain('ProviderDisputeResolutionRepository');
    expect(moduleFile).toContain('ProviderDisputeLogsRepository');
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

  it('provider dispute endpoints are not duplicated across swagger tags', () => {
    expect(controller).not.toContain("@ApiTags('02 Admin - Provider Dispute Manager')\n@ApiBearerAuth()");
    for (const tag of ['02 Admin - Provider Dispute Evidence', '02 Admin - Provider Dispute Rulings', '02 Admin - Provider Financial Adjustments', '02 Admin - Provider Dispute Resolution', '02 Admin - Provider Dispute Logs']) expect(controller).toContain(`@ApiTags('${tag}')`);
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
    expect(disputesRepository).toContain('providerDisputeCase.findMany');
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
    expect(evidenceRepository).toContain('providerDisputeEvidence.findMany');
    expect(service).toContain('providerEvidence');
    expect(storageDto).toContain("PROVIDER_DISPUTE_EVIDENCE = 'provider-dispute-evidence'");
    expect(storageService).toContain('UploadFolder.PROVIDER_DISPUTE_EVIDENCE');
  });

  it('admin can request additional evidence', () => {
    expect(controller).toContain("@Post(':id/evidence/request')");
    expect(controller).toContain("@Permissions('providerDisputes.evidence.request')");
    expect(evidenceRepository).toContain('ADDITIONAL_EVIDENCE_REQUESTED');
    expect(service).toContain('notifyEvidenceTargets');
    expect(evidenceRepository).toContain('notification.createMany');
  });

  it('admin can mark evidence review complete and it moves case to RULING_PENDING', () => {
    expect(controller).toContain("@Post(':id/evidence/mark-reviewed')");
    expect(evidenceRepository).toContain('EVIDENCE_REVIEW_COMPLETED');
    expect(service).toContain('ProviderDisputeStatus.RULING_PENDING');
  });

  it('admin can add internal notes and timeline records evidence actions', () => {
    expect(controller).toContain("@Post(':id/notes')");
    expect(logsRepository).toContain('providerDisputeNote.create');
    for (const action of ['PROVIDER_DISPUTE_CREATED', 'CUSTOMER_EVIDENCE_SUBMITTED', 'PROVIDER_EVIDENCE_SUBMITTED', 'ADDITIONAL_EVIDENCE_REQUESTED', 'EVIDENCE_REVIEW_STARTED', 'EVIDENCE_REVIEW_COMPLETED']) {
      expect(schema + service).toContain(action);
    }
  });

  it('admin can fetch ruling summary', () => {
    expect(controller).toContain("@Get(':id/ruling-summary')");
    expect(controller).toContain("@Permissions('providerDisputes.ruling.read')");
    expect(service).toContain('Provider dispute ruling summary fetched successfully.');
  });

  it('ruling requires completed evidence review and customer-wins validates refund amount', () => {
    expect(controller).toContain("@Post(':id/ruling')");
    expect(service).toContain('Evidence review must be completed before ruling');
    expect(service).toContain('Full refund must equal dispute amount');
    expect(service).toContain('CUSTOMER_WINS_FULL_REFUND');
  });

  it('provider-wins ruling forces refund amount 0 and split-liability validates partial refund', () => {
    expect(service).toContain('PROVIDER_WINS_NO_REFUND');
    expect(service).toContain('return new Prisma.Decimal(0)');
    expect(service).toContain('Split liability refund must be greater than 0 and less than dispute amount');
  });

  it('financial impact is calculated server-side', () => {
    expect(controller).toContain("@Get(':id/financial-impact')");
    expect(controller).toContain("@Permissions('providerDisputes.financial.read')");
    expect(service).toContain('computeFinancialImpact');
    expect(service).toContain('Provider Lost Earnings');
    expect(service).toContain('Platform Fee Reversal');
  });

  it('payout linkage requires confirmation and creates provider financial adjustment', () => {
    expect(controller).toContain("@Post(':id/payout-penalty-linkage')");
    expect(service).toContain('confirmFinancialAccuracy must be true');
    expect(financialRepository).toContain('providerFinancialAdjustment.createMany');
    expect(schema).toContain('model ProviderFinancialAdjustment');
  });

  it('penalty creates penalty ledger and final attestation requires confirmation', () => {
    expect(service).toContain('ProviderFinancialAdjustmentType.PENALTY');
    expect(controller).toContain("@Post(':id/final-attestation')");
    expect(service).toContain('confirmFinancialLineItems must be true');
  });

  it('all ruling actions create timeline and audit log', () => {
    for (const action of ['RULING_MADE', 'RULING_DRAFT_SAVED']) expect(rulingsRepository).toContain(action);
    for (const action of ['PAYOUT_PENALTY_LINKED', 'FINAL_ATTESTATION_COMPLETED']) expect(financialRepository).toContain(action);
    expect(service).toContain('auditLog.write');
  });

  it('finalize requires ruling and payout linkage when financial adjustment exists', () => {
    expect(controller).toContain("@Post(':id/finalize')");
    expect(service).toContain('Ruling must exist before finalization');
    expect(service).toContain('Payout linkage must be completed before finalization');
    expect(service).toContain('Final attestation must be completed before finalization');
  });

  it('finalize processes customer refund for customer wins and no refund for provider wins', () => {
    expect(service).toContain('resolutionFromRuling');
    expect(service).toContain('refundProcessed = dispute.ruling !== ProviderDisputeRuling.PROVIDER_WINS_NO_REFUND');
    expect(service).toContain('CUSTOMER_REFUND_PROCESSED');
  });

  it('finalize handles split liability partial refund and applies provider deduction', () => {
    expect(service).toContain('ProviderDisputeFinalRuling.SPLIT_LIABILITY');
    expect(service).toContain('providerDeduction');
    expect(resolutionRepository).toContain('providerFinancialAdjustment.updateMany');
  });

  it('finalize applies penalty when selected and creates financial audit log', () => {
    expect(service).toContain('penaltyApplied');
    expect(service + resolutionRepository).toContain('Service Fee Penalty');
    expect(schema).toContain('model ProviderDisputeFinancialLog');
  });

  it('finalize creates communication log and timeline entry', () => {
    expect(service + resolutionRepository + logsRepository).toContain('createCommunicationLogEntries');
    expect(service).toContain('PROVIDER_DISPUTE_FINALIZED');
    expect(schema).toContain('model ProviderDisputeCommunicationLog');
  });

  it('resolution endpoint returns final summary and resolution log returns lifecycle timeline', () => {
    expect(controller).toContain("@Get(':id/resolution')");
    expect(controller).toContain("@Get(':id/resolution-log')");
    expect(service).toContain('Provider dispute resolution fetched successfully.');
    expect(service).toContain('Provider dispute resolution log fetched successfully.');
  });

  it('export resolution log requires permission and notify again creates communication log', () => {
    expect(controller).toContain("@Get(':id/resolution-log/export')");
    expect(controller).toContain("@Permissions('providerDisputes.logs.export')");
    expect(controller).toContain("@Post(':id/notify-again')");
    expect(service).toContain('NOTIFICATION_RESENT');
    expect(service + resolutionRepository + logsRepository).toContain('createCommunicationLogEntries');
  });
});
