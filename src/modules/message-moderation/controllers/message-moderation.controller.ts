import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthUserContext, CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { ListMessageModerationAuditLogsDto, ListMessageModerationDto, MessageModerationActionDto, MessageModerationHistoryDto } from '../dto/message-moderation.dto';
import { MessageModerationService } from '../services/message-moderation.service';

@ApiTags('02 Admin - Message Moderation')
@ApiBearerAuth()
@Controller('admin/message-moderation')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
export class MessageModerationController {
  constructor(private readonly service: MessageModerationService) {}

  @Get('conversations')
  @Permissions('messageModeration.read')
  @ApiOperation({ summary: 'List flagged message moderation conversations', description: 'SUPER_ADMIN or ADMIN with messageModeration.read. Supports page, limit, search, chatType, status, severity, flagReason, senderRole, participantType, assignedToAdminId, fromDate, toDate, sortBy, sortOrder.' })
  @ApiResponse({ status: 200, schema: { example: { success: true, data: [{ id: 'conversation_id', chatType: 'BUYER_PROVIDER', status: 'PENDING_REVIEW', severity: 'HIGH', flaggedMessageCount: 2, lastFlaggedAt: '2026-05-18T10:00:00.000Z', participants: [{ id: 'customer_id', type: 'REGISTERED_USER', name: 'Sarah Johnson', avatarUrl: null }, { id: 'provider_id', type: 'PROVIDER', name: 'Dcodax Gifts', avatarUrl: null }], lastMessagePreview: 'Please pay outside the platform...', flagReasons: ['OFF_PLATFORM_PAYMENT', 'AUTO_FLAG_KEYWORD'], assignedTo: null }], meta: { page: 1, limit: 20, total: 1, totalPages: 1 }, message: 'Flagged message conversations fetched successfully.' } } })
  list(@Query() query: ListMessageModerationDto) { return this.service.list(query); }

  @Get('stats') @Permissions('messageModeration.read') @ApiOperation({ summary: 'Fetch message moderation stats', description: 'SUPER_ADMIN or ADMIN with messageModeration.read. Calculated from real moderation records.' }) stats() { return this.service.stats(); }
  @Get('filter-options') @Permissions('messageModeration.read') @ApiOperation({ summary: 'Fetch message moderation filter options', description: 'SUPER_ADMIN or ADMIN with messageModeration.read.' }) filterOptions() { return this.service.filterOptions(); }
  @Get('export') @Permissions('messageModeration.export') @ApiOperation({ summary: 'Export message moderation rows', description: 'SUPER_ADMIN or ADMIN with messageModeration.export. Export contains moderation-safe redacted fields only, not full private conversation history.' }) export(@Query() query: ListMessageModerationDto) { return this.service.export(query); }

  @Get('audit-logs')
  @Permissions('messageModeration.auditLogs.read')
  @ApiOperation({ summary: 'Fetch message moderation audit logs', description: 'SUPER_ADMIN or ADMIN with messageModeration.auditLogs.read.' })
  auditLogs(@Query() query: ListMessageModerationAuditLogsDto) { return this.service.auditLogs(query); }

  @Get('conversations/:id') @Permissions('messageModeration.read') @ApiOperation({ summary: 'Fetch message moderation conversation detail', description: 'SUPER_ADMIN or ADMIN with messageModeration.read. Returns participants, flagged messages, internal notes, and action history.' }) detail(@Param('id') id: string) { return this.service.detail(id); }
  @Get('conversations/:id/history') @Permissions('messageModeration.read') @ApiOperation({ summary: 'Fetch paginated message moderation conversation history', description: 'SUPER_ADMIN or ADMIN with messageModeration.read. Defaults to paginated scoped history around flagged messages and masks sensitive payment/contact data.' }) history(@Param('id') id: string, @Query() query: MessageModerationHistoryDto) { return this.service.history(id, query); }

  @Post('messages/:messageId/action')
  @ApiOperation({ summary: 'Run message moderation action', description: "SUPER_ADMIN or ADMIN with action-specific message moderation permission. HIDE_MESSAGE, RESTORE_MESSAGE, and DISMISS_FLAG require 'messageModeration.moderate'; WARN_SENDER requires 'messageModeration.warn'; SUSPEND_SENDER requires 'messageModeration.suspend'; ADD_NOTE requires 'messageModeration.notes.create'; REPROCESS requires 'messageModeration.reprocess'; ESCALATE requires 'messageModeration.escalate'." })
  @ApiBody({ type: MessageModerationActionDto, examples: { hideMessage: { value: { action: 'HIDE_MESSAGE', reason: 'OFF_PLATFORM_PAYMENT', comment: 'Message asks the customer to pay outside the platform.', notifySender: true, notifyParticipants: true } }, restoreMessage: { value: { action: 'RESTORE_MESSAGE', reason: 'FALSE_POSITIVE', comment: 'Message was incorrectly flagged.', notifyParticipants: true } }, warnSender: { value: { action: 'WARN_SENDER', reason: 'POLICY_WARNING', comment: 'Sender warned for policy violation.', notifySender: true, severity: 'MEDIUM' } }, suspendSender: { value: { action: 'SUSPEND_SENDER', reason: 'REPEATED_POLICY_VIOLATION', comment: 'Sender suspended after repeated violations.', notifySender: true } }, dismissFlag: { value: { action: 'DISMISS_FLAG', reason: 'NOT_A_VIOLATION', comment: 'Flag dismissed after manual review.' } }, addNote: { value: { action: 'ADD_NOTE', comment: 'Internal note added for future reviews.' } }, reprocess: { value: { action: 'REPROCESS', reason: 'POLICY_UPDATED', comment: 'Re-run scanner using the current policy.' } }, escalate: { value: { action: 'ESCALATE', reason: 'SECURITY_REVIEW_REQUIRED', comment: 'Escalated for security review.', severity: 'HIGH', assignToAdminId: 'admin_id' } } } })
  @ApiResponse({ status: 200, schema: { example: { success: true, data: { messageId: 'message_id', status: 'ACTION_TAKEN' }, message: 'Message hidden successfully.' } } })
  action(@CurrentUser() user: AuthUserContext, @Param('messageId') messageId: string, @Body() dto: MessageModerationActionDto) { return this.service.action(user, messageId, dto); }
}
