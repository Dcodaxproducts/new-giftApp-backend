import { Body, Controller, Get, Param, Post, Query, StreamableFile, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthUserContext, CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AdminDisputesService } from './admin-disputes.service';
import { AddDisputeNoteDto, DisputeDateRangeDto, ExportDisputesDto, ListDisputesDto } from './dto/admin-disputes.dto';

@ApiTags('02 Admin - Dispute Manager')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
@Controller('admin/disputes')
export class AdminDisputesController {
  constructor(private readonly disputes: AdminDisputesService) {}

  @Get('stats')
  @Permissions('disputes.read')
  @ApiOperation({ summary: 'Fetch dispute dashboard stats', description: 'SUPER_ADMIN or ADMIN with disputes.read. Supports TODAY, LAST_7_DAYS, LAST_30_DAYS, and CUSTOM ranges.' })
  @ApiResponse({ status: 200, schema: { example: { success: true, data: { openCases: 12, openCasesDelta: 2, awaitingAction: 5, escalated: 2, resolvedThisWeek: 24, resolvedDeltaPercent: 12, currency: 'PKR' }, message: 'Dispute stats fetched successfully.' } } })
  stats(@Query() query: DisputeDateRangeDto) { return this.disputes.stats(query); }

  @Get('export')
  @Permissions('disputes.export')
  @ApiOperation({ summary: 'Export dispute cases', description: 'SUPER_ADMIN or ADMIN with disputes.export. Sensitive card/payment secrets are never exported.' })
  async export(@Query() query: ExportDisputesDto): Promise<StreamableFile> { const file = await this.disputes.export(query); return new StreamableFile(Buffer.from(file.content), { disposition: `attachment; filename="${file.filename}"`, type: file.contentType }); }

  @Get()
  @Permissions('disputes.read')
  @ApiOperation({ summary: 'List dispute queue', description: 'SUPER_ADMIN or ADMIN with disputes.read. Used by Dispute & Refund Cases queue with filters and sorting.' })
  list(@Query() query: ListDisputesDto) { return this.disputes.list(query); }

  @Get(':id/evidence')
  @ApiTags('02 Admin - Dispute Evidence')
  @Permissions('disputes.evidence.read')
  @ApiOperation({ summary: 'Fetch dispute evidence', description: 'SUPER_ADMIN or ADMIN with disputes.evidence.read. Returns only evidence rows linked to this dispute, from customer/admin uploads in dispute-evidence folder.' })
  @ApiResponse({ status: 200, schema: { example: { success: true, data: [{ id: 'evidence_id', fileName: 'Order confirmation.pdf', fileUrl: 'https://cdn.yourdomain.com/dispute-evidence/order-confirmation.pdf', contentType: 'application/pdf', uploadedBy: 'CUSTOMER', createdAt: '2026-04-05T09:30:00.000Z' }], message: 'Dispute evidence fetched successfully.' } } })
  evidence(@Param('id') id: string) { return this.disputes.evidence(id); }

  @Get(':id/timeline')
  @Permissions('disputes.timeline.read')
  @ApiOperation({ summary: 'Fetch dispute timeline', description: 'SUPER_ADMIN or ADMIN with disputes.timeline.read. Returns timeline preview events in chronological order.' })
  timeline(@Param('id') id: string) { return this.disputes.timeline(id); }

  @Get(':id/internal-data')
  @Permissions('disputes.read')
  @ApiOperation({ summary: 'Fetch internal transaction data', description: 'SUPER_ADMIN or ADMIN with disputes.read. Includes payment status, refund eligibility, auth code, and order/provider transaction history without card secrets.' })
  internalData(@Param('id') id: string) { return this.disputes.internalData(id); }

  @Post(':id/notes')
  @Permissions('disputes.notes.create')
  @ApiOperation({ summary: 'Add internal dispute note', description: 'SUPER_ADMIN or ADMIN with disputes.notes.create. Notes are internal-only and create audit/timeline entries.' })
  @ApiBody({ type: AddDisputeNoteDto, examples: { internal: { value: { note: 'Customer tracking shows pending status for over 14 days. Investigating merchant log.', visibility: 'INTERNAL' } } } })
  addNote(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Body() dto: AddDisputeNoteDto) { return this.disputes.addNote(user, id, dto); }

  @Get(':id/notes')
  @Permissions('disputes.read')
  @ApiOperation({ summary: 'Fetch internal dispute notes', description: 'SUPER_ADMIN or ADMIN with disputes.read. Returns internal notes only.' })
  notes(@Param('id') id: string) { return this.disputes.notes(id); }

  @Get(':id')
  @Permissions('disputes.read')
  @ApiOperation({ summary: 'Fetch dispute details and evidence review summary', description: 'SUPER_ADMIN or ADMIN with disputes.read. SLA remaining text is computed from slaDeadlineAt; approaching deadline is true within 24 hours.' })
  @ApiResponse({ status: 200, schema: { example: { success: true, data: { id: 'dispute_id', caseId: 'DSP-1024', status: 'IN_REVIEW', priority: 'HIGH', reason: 'PRODUCT_NOT_RECEIVED', amount: 129.99, currency: 'PKR', sla: { deadlineAt: '2026-04-12T10:00:00.000Z', remainingText: '22h 14m remaining', isApproachingDeadline: true }, customer: { id: 'customer_id', name: 'Jane Doe', email: 'jane.doe@example.com' }, transaction: { id: 'transaction_id', transactionId: 'TXN-789012', paymentStatus: 'CAPTURED', processorAuthCode: 'AUTH-9921-X', amount: 129.99, currency: 'PKR' }, refund: { eligible: true, eligibleReason: 'Within refund window', maxRefundAmount: 129.99 }, claimDetails: 'Item never arrived. Tracking shows delivered but not at my address.', createdAt: '2026-04-05T09:15:00.000Z', lastUpdatedAt: '2026-04-08T11:45:00.000Z' }, message: 'Dispute details fetched successfully.' } } })
  details(@Param('id') id: string) { return this.disputes.details(id); }
}
