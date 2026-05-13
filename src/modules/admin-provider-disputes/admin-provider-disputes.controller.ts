import { Body, Controller, Get, Param, Post, Query, StreamableFile, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthUserContext, CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AdminProviderDisputesService } from './admin-provider-disputes.service';
import { AddProviderDisputeNoteDto, ExportProviderDisputesDto, ListProviderDisputesDto, MarkProviderDisputeEvidenceReviewedDto, ProviderDisputeDateRangeDto, RequestProviderDisputeEvidenceDto } from './dto/admin-provider-disputes.dto';

@ApiTags('02 Admin - Provider Dispute Manager')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
@Controller('admin/provider-disputes')
export class AdminProviderDisputesController {
  constructor(private readonly providerDisputes: AdminProviderDisputesService) {}

  @Get('stats')
  @Permissions('providerDisputes.read')
  @ApiOperation({ summary: 'Fetch provider dispute dashboard stats', description: 'SUPER_ADMIN or ADMIN with providerDisputes.read. Reuses Provider Orders, Payments, Notifications, Audit Logs, and dispute patterns.' })
  @ApiResponse({ status: 200, schema: { example: { success: true, data: { criticalOpenCases: 8, evidencePhase: 3, underReview: 4, escalations: 1, resolvedThisWeek: 14, averageClosureTimeDays: 4.2, topConflictSource: { providerName: 'Acme Corp', category: 'Quality Disputes', percentOfTotal: 65 }, systemHealth: { status: 'STABLE', message: 'All nodes stable', apiLatencyMs: 42 } }, message: 'Provider dispute stats fetched successfully.' } } })
  stats(@Query() query: ProviderDisputeDateRangeDto) { return this.providerDisputes.stats(query); }

  @Get('export')
  @Permissions('providerDisputes.export')
  @ApiOperation({ summary: 'Export provider dispute queue', description: 'SUPER_ADMIN or ADMIN with providerDisputes.export. Does not expose card secrets or unrelated uploads.' })
  async export(@Query() query: ExportProviderDisputesDto): Promise<StreamableFile> { const file = await this.providerDisputes.export(query); return new StreamableFile(Buffer.from(file.content), { disposition: `attachment; filename="${file.filename}"`, type: file.contentType }); }

  @Get()
  @Permissions('providerDisputes.read')
  @ApiOperation({ summary: 'List provider dispute queue', description: 'SUPER_ADMIN or ADMIN with providerDisputes.read. Used by Provider Dispute Case Queue with filters and sorting.' })
  list(@Query() query: ListProviderDisputesDto) { return this.providerDisputes.list(query); }

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
  @Permissions('providerDisputes.read')
  @ApiOperation({ summary: 'Fetch provider dispute timeline', description: 'SUPER_ADMIN or ADMIN with providerDisputes.read. Includes provider dispute creation, evidence submission, requests, and review actions.' })
  timeline(@Param('id') id: string) { return this.providerDisputes.timeline(id); }

  @Get(':id/notes')
  @Permissions('providerDisputes.read')
  @ApiOperation({ summary: 'Fetch provider dispute internal notes', description: 'SUPER_ADMIN or ADMIN with providerDisputes.read. Returns internal reviewer notes only.' })
  notes(@Param('id') id: string) { return this.providerDisputes.notes(id); }

  @Post(':id/notes')
  @Permissions('providerDisputes.notes.create')
  @ApiOperation({ summary: 'Add provider dispute internal note', description: 'SUPER_ADMIN or ADMIN with providerDisputes.notes.create. Creates internal note, timeline entry, and audit log.' })
  @ApiBody({ type: AddProviderDisputeNoteDto, examples: { internal: { value: { note: 'Provider failed to submit required photographic proof.', visibility: 'INTERNAL' } } } })
  addNote(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Body() dto: AddProviderDisputeNoteDto) { return this.providerDisputes.addNote(user, id, dto); }

  @Get(':id')
  @Permissions('providerDisputes.read')
  @ApiOperation({ summary: 'Fetch provider dispute details', description: 'SUPER_ADMIN or ADMIN with providerDisputes.read. Reuses Provider Orders, Customer Orders, Payments, Notifications, Storage, and Audit Logs. No card/payment secrets are exposed.' })
  @ApiResponse({ status: 200, schema: { example: { success: true, data: { id: 'provider_dispute_id', caseId: 'PD-2047', status: 'EVIDENCE_PHASE', priority: 'MEDIUM', category: 'NON_DELIVERY', reason: 'Missing delivery evidence', claimType: 'Non-Delivery', amount: 89.99, currency: 'PKR', provider: { id: 'provider_id', businessName: 'FreshGrocer Supplies', providerCode: 'PRV-8923', tier: 'Gold Partner', currentPayoutBalance: -127.5, disputeCount: 4, winRate: 50 }, customer: { id: 'customer_id', name: 'Michael Chen', email: 'michael@example.com' }, order: { id: 'order_id', orderNumber: 'ORD-45678' }, transaction: { id: 'transaction_id', transactionId: 'TXN-789012', grossTransaction: 89.99, providerShare: 67.49, platformFee: 22.5, refundEligible: true, eligibilityText: 'Within the standard 14-day resolution window.' }, customerStatement: 'I stayed home all day waiting for the delivery. I got a notification saying it was delivered, but nothing was at my door.', riskAlert: { enabled: true, message: 'FreshGrocer Supplies has a 60% dispute rate over the last 30 days.' }, createdAt: '2026-04-05T10:00:00.000Z' }, message: 'Provider dispute details fetched successfully.' } } })
  details(@Param('id') id: string) { return this.providerDisputes.details(id); }
}
