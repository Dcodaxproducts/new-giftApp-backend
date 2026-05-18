import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthUserContext, CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { BlockMessageDto, DismissFlagDto, EscalateMessageDto, InternalNoteDto, ListMessageModerationAuditLogsDto, ListMessageModerationDto, MessageModerationHistoryDto, ReprocessMessageDto, RestoreMessageDto, SuspendAccountDto, WarnUserDto } from '../dto/message-moderation.dto';
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

  @Post('messages/:messageId/block')
  @Permissions('messageModeration.moderate')
  @ApiOperation({ summary: 'Hide a flagged message from chat participants', description: 'SUPER_ADMIN or ADMIN with messageModeration.moderate. Hide a flagged message from chat participants. Does not block the sender account. Internally records HIDE_MESSAGE and never physically deletes chat messages.' })
  @ApiBody({ type: BlockMessageDto })
  block(@CurrentUser() user: AuthUserContext, @Param('messageId') messageId: string, @Body() dto: BlockMessageDto) { return this.service.block(user, messageId, dto); }

  @Post('messages/:messageId/restore')
  @Permissions('messageModeration.moderate')
  @ApiOperation({ summary: 'Restore a hidden moderated message', description: 'SUPER_ADMIN or ADMIN with messageModeration.moderate. Restores a message previously hidden by moderation and writes moderation/audit logs.' })
  @ApiBody({ type: RestoreMessageDto })
  restore(@CurrentUser() user: AuthUserContext, @Param('messageId') messageId: string, @Body() dto: RestoreMessageDto) { return this.service.restore(user, messageId, dto); }

  @Post('messages/:messageId/warn-user')
  @Permissions('messageModeration.warn')
  @ApiOperation({ summary: 'Warn message sender', description: 'SUPER_ADMIN or ADMIN with messageModeration.warn. Warn the message sender. Sender may be registered user or provider. Does not expose internal notes to sender.' })
  @ApiBody({ type: WarnUserDto })
  warn(@CurrentUser() user: AuthUserContext, @Param('messageId') messageId: string, @Body() dto: WarnUserDto) { return this.service.warn(user, messageId, dto); }

  @Post('messages/:messageId/suspend-account')
  @Permissions('messageModeration.suspend')
  @ApiOperation({ summary: 'Suspend message sender account', description: 'SUPER_ADMIN or ADMIN with messageModeration.suspend. Suspends the message sender account using the correct registered-user/provider lifecycle service. Admin and Super Admin accounts cannot be suspended here.' })
  @ApiBody({ type: SuspendAccountDto })
  suspend(@CurrentUser() user: AuthUserContext, @Param('messageId') messageId: string, @Body() dto: SuspendAccountDto) { return this.service.suspend(user, messageId, dto); }

  @Post('messages/:messageId/dismiss-flag') @Permissions('messageModeration.moderate') @ApiOperation({ summary: 'Dismiss a moderation flag', description: 'SUPER_ADMIN or ADMIN with messageModeration.moderate. Marks flag as false-positive/no-action and keeps the message visible.' }) @ApiBody({ type: DismissFlagDto }) dismiss(@CurrentUser() user: AuthUserContext, @Param('messageId') messageId: string, @Body() dto: DismissFlagDto) { return this.service.dismiss(user, messageId, dto); }
  @Post('messages/:messageId/note') @Permissions('messageModeration.notes.create') @ApiOperation({ summary: 'Add internal private moderation note', description: 'SUPER_ADMIN or ADMIN with messageModeration.notes.create. Internal-only note is never visible to customer/provider participants.' }) @ApiBody({ type: InternalNoteDto }) note(@CurrentUser() user: AuthUserContext, @Param('messageId') messageId: string, @Body() dto: InternalNoteDto) { return this.service.note(user, messageId, dto); }
  @Post('messages/:messageId/reprocess') @Permissions('messageModeration.reprocess') @ApiOperation({ summary: 'Reprocess a message through scanner', description: 'SUPER_ADMIN or ADMIN with messageModeration.reprocess. Re-runs the content scanner using current policy and stores scanner result snapshot without duplicating active flags for the same reason.' }) @ApiBody({ type: ReprocessMessageDto }) reprocess(@CurrentUser() user: AuthUserContext, @Param('messageId') messageId: string, @Body() dto: ReprocessMessageDto) { return this.service.reprocess(user, messageId, dto); }
  @Post('messages/:messageId/escalate') @Permissions('messageModeration.escalate') @ApiOperation({ summary: 'Escalate a flagged message', description: 'SUPER_ADMIN or ADMIN with messageModeration.escalate. Escalates a flagged message to support, security, or dispute review.' }) @ApiBody({ type: EscalateMessageDto }) escalate(@CurrentUser() user: AuthUserContext, @Param('messageId') messageId: string, @Body() dto: EscalateMessageDto) { return this.service.escalate(user, messageId, dto); }
}
