import { Body, Controller, Get, Param, Post, Query, StreamableFile, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthUserContext, CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { AdminProviderDisputesService } from '../services/admin-provider-disputes.service';
import { AddProviderDisputeNoteDto, ExportProviderDisputeResolutionLogDto, ExportProviderDisputesDto, FinalProviderDisputeAttestationDto, FinalizeProviderDisputeDto, LinkProviderDisputePayoutDto, ListProviderDisputesDto, MarkProviderDisputeEvidenceReviewedDto, ProviderDisputeDateRangeDto, RequestProviderDisputeEvidenceDto, ResendProviderDisputeNotificationDto, SaveProviderDisputeRulingDto } from '../dto/admin-provider-disputes.dto';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
@Controller('admin/provider-disputes')
export class AdminProviderDisputesController {
  constructor(private readonly providerDisputes: AdminProviderDisputesService) {}

  @Get('stats')
  @ApiTags('02 Admin - Provider Dispute Manager')
  @Permissions('providerDisputes.read')
  @ApiOperation({ summary: 'Fetch provider dispute dashboard stats', description: 'SUPER_ADMIN or ADMIN with providerDisputes.read. Reuses Provider Orders, Payments, Notifications, Audit Logs, and dispute patterns.' })
  @ApiResponse({ status: 200, schema: { example: { success: true, data: { criticalOpenCases: 8, evidencePhase: 3, underReview: 4, escalations: 1, resolvedThisWeek: 14, averageClosureTimeDays: 4.2, topConflictSource: { providerName: 'Acme Corp', category: 'Quality Disputes', percentOfTotal: 65 }, systemHealth: { status: 'STABLE', message: 'All nodes stable', apiLatencyMs: 42 } }, message: 'Provider dispute stats fetched successfully.' } } })
  stats(@Query() query: ProviderDisputeDateRangeDto) { return this.providerDisputes.stats(query); }

  @Get('export')
  @ApiTags('02 Admin - Provider Dispute Manager')
  @Permissions('providerDisputes.export')
  @ApiOperation({ summary: 'Export provider dispute queue', description: 'SUPER_ADMIN or ADMIN with providerDisputes.export. Does not expose card secrets or unrelated uploads.' })
  async export(@Query() query: ExportProviderDisputesDto): Promise<StreamableFile> { const file = await this.providerDisputes.export(query); return new StreamableFile(Buffer.from(file.content), { disposition: `attachment; filename="${file.filename}"`, type: file.contentType }); }

  @Get()
  @ApiTags('02 Admin - Provider Dispute Manager')
  @Permissions('providerDisputes.read')
  @ApiOperation({ summary: 'List provider dispute queue', description: 'SUPER_ADMIN or ADMIN with providerDisputes.read. Used by Provider Dispute Case Queue with filters and sorting.' })
  list(@Query() query: ListProviderDisputesDto) { return this.providerDisputes.list(query); }



  @Post(':id/finalize')
  @ApiTags('02 Admin - Provider Dispute Resolution')
  @Permissions('providerDisputes.resolve')
  @ApiOperation({ summary: 'Finalize provider dispute', description: 'SUPER_ADMIN or ADMIN with providerDisputes.resolve. Executes final refund/deduction application, updates immutable resolution state, creates financial and communication logs, and opens provider appeal window.' })
  @ApiBody({ type: FinalizeProviderDisputeDto, examples: { finalize: { value: { notifyCustomer: true, notifyProvider: true, executeFinancialAdjustments: true, comment: 'Final ruling confirmed and financial adjustments approved.' } } } })
  finalize(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Body() dto: FinalizeProviderDisputeDto) { return this.providerDisputes.finalize(user, id, dto); }

  @Get(':id/resolution')
  @ApiTags('02 Admin - Provider Dispute Resolution')
  @Permissions('providerDisputes.resolve')
  @ApiOperation({ summary: 'Fetch provider dispute resolution summary', description: 'SUPER_ADMIN or ADMIN with providerDisputes.resolve. Returns final ruling, financial execution, notification status, refund timing, and appeal window.' })
  resolution(@Param('id') id: string) { return this.providerDisputes.resolution(id); }

  @Get(':id/resolution-log/export')
  @ApiTags('02 Admin - Provider Dispute Logs')
  @Permissions('providerDisputes.logs.export')
  @ApiOperation({ summary: 'Export provider dispute resolution log', description: 'SUPER_ADMIN or ADMIN with providerDisputes.logs.export. Includes lifecycle timeline, financial audit log, communication log, ruling, and final status without Stripe/card secrets.' })
  async exportResolutionLog(@Param('id') id: string, @Query() query: ExportProviderDisputeResolutionLogDto): Promise<StreamableFile> { const file = await this.providerDisputes.exportResolutionLog(id, query); return new StreamableFile(Buffer.from(file.content), { disposition: `attachment; filename="${file.filename}"`, type: file.contentType }); }

  @Get(':id/resolution-log')
  @ApiTags('02 Admin - Provider Dispute Logs')
  @Permissions('providerDisputes.logs.read')
  @ApiOperation({ summary: 'Fetch provider dispute resolution log', description: 'SUPER_ADMIN or ADMIN with providerDisputes.logs.read. Returns lifecycle timeline, financial audit log, communication log, and performance impact snapshot.' })
  resolutionLog(@Param('id') id: string) { return this.providerDisputes.resolutionLog(id); }

  @Post(':id/notify-again')
  @ApiTags('02 Admin - Provider Dispute Resolution')
  @Permissions('providerDisputes.notify')
  @ApiOperation({ summary: 'Resend provider dispute notifications', description: 'SUPER_ADMIN or ADMIN with providerDisputes.notify. Resends email/in-app notifications, creates communication log entries, and writes a timeline event.' })
  @ApiBody({ type: ResendProviderDisputeNotificationDto, examples: { provider: { value: { target: 'PROVIDER', channels: ['EMAIL', 'IN_APP'], message: 'Reminder: Your dispute resolution is available in the provider portal.' } } } })
  notifyAgain(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Body() dto: ResendProviderDisputeNotificationDto) { return this.providerDisputes.notifyAgain(user, id, dto); }

  @Get(':id/ruling-summary')
  @ApiTags('02 Admin - Provider Dispute Rulings')
  @Permissions('providerDisputes.ruling.read')
  @ApiOperation({ summary: 'Fetch provider dispute ruling summary', description: 'SUPER_ADMIN or ADMIN with providerDisputes.ruling.read. Shows ruling options, evidence summary, and financial starting point.' })
  rulingSummary(@Param('id') id: string) { return this.providerDisputes.rulingSummary(id); }

  @Post(':id/ruling')
  @ApiTags('02 Admin - Provider Dispute Rulings')
  @Permissions('providerDisputes.ruling.create')
  @ApiOperation({ summary: 'Save provider dispute ruling', description: 'SUPER_ADMIN or ADMIN with providerDisputes.ruling.create. Stores ruling and reason, but final financial execution remains gated behind final status update/attestation.' })
  @ApiBody({ type: SaveProviderDisputeRulingDto, examples: { full: { value: { ruling: 'CUSTOMER_WINS_FULL_REFUND', rulingReason: 'Provider failed to provide required proof of delivery.', refundAmount: 89.99, applyPenalty: true, penaltyAmount: 25, penaltyReason: 'Repeat offense', saveAsDraft: false } } } })
  ruling(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Body() dto: SaveProviderDisputeRulingDto) { return this.providerDisputes.saveRuling(user, id, dto); }

  @Get(':id/financial-impact')
  @ApiTags('02 Admin - Provider Financial Adjustments')
  @Permissions('providerDisputes.financial.read')
  @ApiOperation({ summary: 'Fetch provider dispute financial impact', description: 'SUPER_ADMIN or ADMIN with providerDisputes.financial.read. Server calculates provider share, fee reversal, refund, and penalty impact.' })
  financialImpact(@Param('id') id: string) { return this.providerDisputes.financialImpact(id); }

  @Post(':id/payout-penalty-linkage')
  @ApiTags('02 Admin - Provider Financial Adjustments')
  @Permissions('providerDisputes.financial.link')
  @ApiOperation({ summary: 'Link payout and penalty adjustments', description: 'SUPER_ADMIN or ADMIN with providerDisputes.financial.link. Creates provider financial adjustment ledgers; final financial execution is still deferred.' })
  @ApiBody({ type: LinkProviderDisputePayoutDto, examples: { deduct: { value: { adjustmentType: 'DEDUCT_FROM_NEXT_PAYOUT', confirmFinancialAccuracy: true, sendProviderSummary: true } } } })
  payoutPenaltyLinkage(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Body() dto: LinkProviderDisputePayoutDto) { return this.providerDisputes.payoutPenaltyLinkage(user, id, dto); }

  @Post(':id/final-attestation')
  @ApiTags('02 Admin - Provider Financial Adjustments')
  @Permissions('providerDisputes.ruling.update')
  @ApiOperation({ summary: 'Complete final financial attestation', description: 'SUPER_ADMIN or ADMIN with providerDisputes.ruling.update. Confirms line items and marks case ready for final status update.' })
  @ApiBody({ type: FinalProviderDisputeAttestationDto, examples: { confirm: { value: { confirmFinancialLineItems: true, sendAutomatedFinancialSummary: true, comment: 'All financial line items confirmed as accurate.' } } } })
  finalAttestation(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Body() dto: FinalProviderDisputeAttestationDto) { return this.providerDisputes.finalAttestation(user, id, dto); }

  @Get(':id/evidence')
  @ApiTags('02 Admin - Provider Dispute Evidence')
  @Permissions('providerDisputes.read')
  @ApiOperation({ summary: 'Fetch provider dispute evidence exchange', description: 'SUPER_ADMIN or ADMIN with providerDisputes.read. Returns customer/provider evidence linked to providerDisputeId only, reusing Storage and media policy.' })
  evidence(@Param('id') id: string) { return this.providerDisputes.evidence(id); }

  @Post(':id/evidence/request')
  @ApiTags('02 Admin - Provider Dispute Evidence')
  @Permissions('providerDisputes.evidence.request')
  @ApiOperation({ summary: 'Request additional provider dispute evidence', description: 'SUPER_ADMIN or ADMIN with providerDisputes.evidence.request. Creates timeline and optional notifications without changing final ruling.' })
  @ApiBody({ type: RequestProviderDisputeEvidenceDto, examples: { provider: { value: { target: 'PROVIDER', message: 'Please upload photographic proof of delivery and driver log.', dueAt: '2026-04-09T18:00:00.000Z', notifyTarget: true } } } })
  requestEvidence(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Body() dto: RequestProviderDisputeEvidenceDto) { return this.providerDisputes.requestEvidence(user, id, dto); }

  @Post(':id/evidence/mark-reviewed')
  @ApiTags('02 Admin - Provider Dispute Evidence')
  @Permissions('providerDisputes.update')
  @ApiOperation({ summary: 'Mark provider dispute evidence review complete', description: 'SUPER_ADMIN or ADMIN with providerDisputes.update. Marks evidence review complete, moves case to RULING_PENDING, creates timeline and audit log.' })
  @ApiBody({ type: MarkProviderDisputeEvidenceReviewedDto, examples: { review: { value: { reviewerNotes: 'Provider evidence is incomplete. GPS data was submitted late and lacks photo confirmation.', nextStep: 'RULING' } } } })
  markReviewed(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Body() dto: MarkProviderDisputeEvidenceReviewedDto) { return this.providerDisputes.markReviewed(user, id, dto); }

  @Get(':id/timeline')
  @ApiTags('02 Admin - Provider Dispute Manager')
  @Permissions('providerDisputes.read')
  @ApiOperation({ summary: 'Fetch provider dispute timeline', description: 'SUPER_ADMIN or ADMIN with providerDisputes.read. Includes provider dispute creation, evidence submission, requests, and review actions.' })
  timeline(@Param('id') id: string) { return this.providerDisputes.timeline(id); }

  @Get(':id/notes')
  @ApiTags('02 Admin - Provider Dispute Manager')
  @Permissions('providerDisputes.read')
  @ApiOperation({ summary: 'Fetch provider dispute internal notes', description: 'SUPER_ADMIN or ADMIN with providerDisputes.read. Returns internal reviewer notes only.' })
  notes(@Param('id') id: string) { return this.providerDisputes.notes(id); }

  @Post(':id/notes')
  @ApiTags('02 Admin - Provider Dispute Manager')
  @Permissions('providerDisputes.notes.create')
  @ApiOperation({ summary: 'Add provider dispute internal note', description: 'SUPER_ADMIN or ADMIN with providerDisputes.notes.create. Creates internal note, timeline entry, and audit log.' })
  @ApiBody({ type: AddProviderDisputeNoteDto, examples: { internal: { value: { note: 'Provider failed to submit required photographic proof.', visibility: 'INTERNAL' } } } })
  addNote(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Body() dto: AddProviderDisputeNoteDto) { return this.providerDisputes.addNote(user, id, dto); }

  @Get(':id')
  @ApiTags('02 Admin - Provider Dispute Manager')
  @Permissions('providerDisputes.read')
  @ApiOperation({ summary: 'Fetch provider dispute details', description: 'SUPER_ADMIN or ADMIN with providerDisputes.read. Reuses Provider Orders, Customer Orders, Payments, Notifications, Storage, and Audit Logs. No card/payment secrets are exposed.' })
  @ApiResponse({ status: 200, schema: { example: { success: true, data: { id: 'provider_dispute_id', caseId: 'PD-2047', status: 'EVIDENCE_PHASE', priority: 'MEDIUM', category: 'NON_DELIVERY', reason: 'Missing delivery evidence', claimType: 'Non-Delivery', amount: 89.99, currency: 'PKR', provider: { id: 'provider_id', businessName: 'FreshGrocer Supplies', providerCode: 'PRV-8923', tier: 'Gold Partner', currentPayoutBalance: -127.5, disputeCount: 4, winRate: 50 }, customer: { id: 'customer_id', name: 'Michael Chen', email: 'michael@example.com' }, order: { id: 'order_id', orderNumber: 'ORD-45678' }, transaction: { id: 'transaction_id', transactionId: 'TXN-789012', grossTransaction: 89.99, providerShare: 67.49, platformFee: 22.5, refundEligible: true, eligibilityText: 'Within the standard 14-day resolution window.' }, customerStatement: 'I stayed home all day waiting for the delivery. I got a notification saying it was delivered, but nothing was at my door.', riskAlert: { enabled: true, message: 'FreshGrocer Supplies has a 60% dispute rate over the last 30 days.' }, createdAt: '2026-04-05T10:00:00.000Z' }, message: 'Provider dispute details fetched successfully.' } } })
  details(@Param('id') id: string) { return this.providerDisputes.details(id); }
}
