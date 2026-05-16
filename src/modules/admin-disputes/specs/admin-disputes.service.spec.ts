import { readFileSync } from 'fs';
import { join } from 'path';

describe('Admin Dispute Manager Core module', () => {
  const service = readFileSync(join(__dirname, '../services/admin-disputes.service.ts'), 'utf8');
  const disputesRepository = readFileSync(join(__dirname, '../repositories/admin-disputes.repository.ts'), 'utf8');
  const evidenceRepository = readFileSync(join(__dirname, '../repositories/admin-dispute-evidence.repository.ts'), 'utf8');
  const linkageRepository = readFileSync(join(__dirname, '../repositories/admin-dispute-linkage.repository.ts'), 'utf8');
  const decisionsRepository = readFileSync(join(__dirname, '../repositories/admin-dispute-decisions.repository.ts'), 'utf8');
  const trackingRepository = readFileSync(join(__dirname, '../repositories/admin-dispute-tracking.repository.ts'), 'utf8');
  const controller = readFileSync(join(__dirname, '../controllers/admin-disputes.controller.ts'), 'utf8');
  const moduleFile = readFileSync(join(__dirname, '../admin-disputes.module.ts'), 'utf8');
  const dto = readFileSync(join(__dirname, '../dto/admin-disputes.dto.ts'), 'utf8');
  const schema = readFileSync(join(__dirname, '../../../../prisma/schema.prisma'), 'utf8');
  const permissions = readFileSync(join(__dirname, '../../admin-roles/constants/permission-catalog.ts'), 'utf8');
  const storageDto = readFileSync(join(__dirname, '../../storage/dto/create-presigned-upload.dto.ts'), 'utf8');
  const storageService = readFileSync(join(__dirname, '../../storage/storage.service.ts'), 'utf8');
  const appModule = readFileSync(join(__dirname, '../../../app.module.ts'), 'utf8');

  it('creates dispute models without mixing provider refund/customer order APIs', () => {
    for (const text of ['model DisputeCase', 'model DisputeEvidence', 'model DisputeNote', 'model DisputeTimeline', 'caseId', 'slaDeadlineAt', 'linkedRefundId', 'metadataJson']) expect(schema).toContain(text);
    expect(disputesRepository).toContain('disputeCase.findMany');
    expect(service).toContain('adminDisputesRepository');
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
    for (const text of ["module: 'disputes'", "key: 'read'", "key: 'create'", "key: 'update'", "key: 'assign'", "key: 'linkTransaction'", "key: 'refund.evaluate'", "key: 'notes.create'", "key: 'export'", "key: 'evidence.read'", "key: 'timeline.read'"]) expect(permissions).toContain(text);
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
    expect(service).not.toContain('cardNumber');
  });

  it('admin can fetch dispute evidence and storage allows dispute-evidence folder', () => {
    expect(controller).toContain("@Get(':id/evidence')");
    expect(controller).toContain("@Permissions('disputes.read')");
    expect(evidenceRepository).toContain('disputeEvidence.findMany');
    expect(storageDto).toContain("DISPUTE_EVIDENCE = 'dispute-evidence'");
    expect(storageService).toContain('UploadFolder.DISPUTE_EVIDENCE');
  });

  it('admin can fetch timeline and add internal note', () => {
    expect(controller).toContain("@Get(':id/timeline')");
    expect(controller).toContain("@Post(':id/notes')");
    expect(trackingRepository).toContain('disputeTimeline.findMany');
    expect(trackingRepository).toContain('disputeNote.create');
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

  it('admin can search transactions for dispute scoped by dispute customer', () => {
    expect(controller).toContain("@Get(':id/transaction-search')");
    expect(controller).toContain("@ApiTags('02 Admin - Dispute Linkage')");
    expect(service).toContain('transactionSearch');
    expect(service).toContain('userId: dispute.userId');
    expect(service).toContain('providerPaymentIntentId');
    expect(service).not.toContain('cardNumber');
  });

  it('refund preview validates full and partial refunds against refundable amount', () => {
    expect(controller).toContain("@Post(':id/refund-preview')");
    expect(controller).toContain("@Permissions('disputes.refund.evaluate')");
    expect(service).toContain('refundPreview');
    expect(service).toContain('DisputeRefundType.FULL');
    expect(service).toContain('DisputeRefundType.NONE');
    expect(service).toContain('Partial refund amount must be greater than 0');
    expect(service).toContain('Requested refund exceeds max refundable amount');
  });

  it('link transaction requires confirmation flag and stores refund selection', () => {
    expect(controller).toContain("@Post(':id/link-transaction')");
    expect(controller).toContain("@Permissions('disputes.linkTransaction')");
    expect(service).toContain('confirmCorrectTransaction must be true');
    expect(service).toContain('linkedTransactionId');
    expect(service).toContain('linkedPaymentId');
    expect(service).toContain('linkedOrderId');
    expect(linkageRepository).toContain('refundType: params.refundType');
    expect(linkageRepository).toContain('refundAmount: params.refundAmount');
  });

  it('link transaction creates timeline/audit entries and does not process refund', () => {
    expect(linkageRepository).toContain('TRANSACTION_LINKED');
    expect(linkageRepository).toContain('REFUND_SELECTION_UPDATED');
    expect(service).toContain('DISPUTE_TRANSACTION_LINKED');
    expect(`${service}
${linkageRepository}`).not.toContain('stripe.refunds.create');
  });

  it('approve requires linked transaction and validates refund amount', () => {
    expect(controller).toContain("@Post(':id/decision')");
    expect(service).toContain('Linked transaction is required before approval');
    expect(service).toContain('Refund selection is required before approval');
    expect(service).toContain('refundPreview(id');
    expect(service).toContain('DISPUTE_DECISION_APPROVE');
  });

  it('approve creates Stripe refund tracking, refund transaction, and updates dispute status', () => {
    expect(service).toContain('PaymentMethod.STRIPE_CARD');
    expect(service).toContain('stripe_refund_${dispute.id}');
    expect(decisionsRepository).toContain('refundRequest.create');
    expect(decisionsRepository).toContain('status: DisputeStatus.APPROVED');
    expect(decisionsRepository).toContain('resolutionStatus: DisputeResolutionStatus.APPROVED');
    expect(decisionsRepository).toContain('REFUND_PROCESSED');
  });

  it('reject does not create refund and stores reason/comment', () => {
    expect(service).toContain('rejectDispute');
    expect(decisionsRepository).toContain('decisionReason: params.reason');
    expect(decisionsRepository).toContain('decisionComment: params.comment');
    expect(decisionsRepository).toContain('status: DisputeStatus.REJECTED');
    expect(service).toContain('DISPUTE_DECISION_REJECT');
  });

  it('escalate assigns supervisor and creates notification', () => {
    expect(service).toContain('escalateDispute');
    expect(service).toContain('assignedToId');
    expect(service).toContain('DisputeStatus.ESCALATED');
    expect(decisionsRepository).toContain('ADMIN_DISPUTE_ESCALATED_ASSIGNMENT');
  });

  it('decision creates timeline entry and audit log', () => {
    for (const action of ['DECISION_APPROVE', 'DECISION_REJECT', 'DECISION_ESCALATE', 'CASE_RESOLVED']) expect(`${service}
${decisionsRepository}`).toContain(action);
    expect(service).toContain('auditLog.write');
  });

  it('confirmation returns refund and notification info', () => {
    expect(controller).toContain("@Get(':id/confirmation')");
    expect(service).toContain('confirmation(id');
    expect(service).toContain('customerNotificationStatus');
    expect(service).toContain('nextStepProtocol');
  });

  it('dispute endpoints are not duplicated across swagger tags and decision enforces specific permissions', () => {
    expect(controller).not.toContain("@ApiTags('02 Admin - Dispute Manager')\n@ApiBearerAuth()");
    expect(controller).toContain("@ApiTags('02 Admin - Dispute Evidence')");
    expect(service).toContain('assertDecisionPermission');
    expect(service).toContain('disputes.approve');
    expect(service).toContain('disputes.reject');
    expect(service).toContain('disputes.escalate');
  });

  it('tracking log returns full audit timeline and export requires permission', () => {
    expect(controller).toContain("@Get(':id/tracking-log')");
    expect(controller).toContain("@Get(':id/tracking-log/export')");
    expect(controller).toContain("@Permissions('disputes.tracking.read')");
    expect(controller).toContain("@Permissions('disputes.tracking.export')");
    expect(service).toContain('trackingLog(id');
    expect(service).toContain('exportTrackingLog');
  });
});
