import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthUserContext, CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { BlockMessageDto, DismissFlagDto, InternalNoteDto, ListMessageModerationDto, ReprocessMessageDto, SuspendAccountDto, WarnUserDto } from '../dto/message-moderation.dto';
import { MessageModerationService } from '../services/message-moderation.service';

@ApiTags('02 Admin - Message Moderation')
@ApiBearerAuth()
@Controller('admin/message-moderation')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
export class MessageModerationController {
  constructor(private readonly service: MessageModerationService) {}

  @Get('conversations') @Permissions('messageModeration.read') @ApiOperation({ summary: 'List flagged message moderation conversations', description: 'SUPER_ADMIN or ADMIN with messageModeration.read. Returns redacted previews only.' }) @ApiResponse({ status: 200, schema: { example: { success: true, data: [{ id: 'case_1', participant: { id: 'user_1', name: 'Alex Rivera', avatarUrl: 'https://cdn.example.com/avatar.png', externalReference: 'USR-99021' }, source: 'WHATSAPP_BUSINESS', flag: { type: 'PROFANITY', label: 'Profanity Detected', severity: 'HIGH', confidence: 0.94 }, preview: 'Hey, you are a total [REDACTED] if you think I\'m...', status: 'FLAGGED', lastMessageAt: '2026-05-18T14:02:00.000Z', timeAgo: '2m ago' }], meta: { page: 1, limit: 20, total: 12, totalPages: 1 }, message: 'Message moderation conversations fetched successfully.' } } }) list(@Query() query: ListMessageModerationDto) { return this.service.list(query); }
  @Get('stats') @Permissions('messageModeration.read') @ApiOperation({ summary: 'Fetch message moderation stats', description: 'SUPER_ADMIN or ADMIN with messageModeration.read.' }) stats() { return this.service.stats(); }
  @Get('filter-options') @Permissions('messageModeration.read') @ApiOperation({ summary: 'Fetch message moderation filter options', description: 'Sources include chat channels and external integration placeholders.' }) filterOptions() { return this.service.filterOptions(); }
  @Get('export') @Permissions('messageModeration.export') @ApiOperation({ summary: 'Export message moderation rows', description: 'SUPER_ADMIN or ADMIN with messageModeration.export. Export remains moderation-safe and redacted.' }) export(@Query() query: ListMessageModerationDto) { return this.service.export(query); }
  @Get('conversations/:id') @Permissions('messageModeration.read') @ApiOperation({ summary: 'Fetch message moderation conversation detail', description: 'Flagged harmful message body is null by default; redactedBody is always returned.' }) detail(@Param('id') id: string) { return this.service.detail(id, false); }
  @Get('conversations/:id/history') @Permissions('messageModeration.read') @ApiOperation({ summary: 'Fetch message moderation conversation history', description: 'Returns moderation case history for the same conversation.' }) history(@Param('id') id: string) { return this.service.history(id); }
  @Post('messages/:messageId/block') @Permissions('messageModeration.block') @ApiOperation({ summary: 'Block a flagged message', description: 'Creates moderation log and audit log; message is not physically deleted.' }) @ApiBody({ type: BlockMessageDto }) block(@CurrentUser() user: AuthUserContext, @Param('messageId') messageId: string, @Body() dto: BlockMessageDto) { return this.service.block(user, messageId, dto); }
  @Post('messages/:messageId/warn-user') @Permissions('messageModeration.warn') @ApiOperation({ summary: 'Warn the message sender', description: 'Creates warning notification, moderation log, and audit log when notifyUser=true.' }) @ApiBody({ type: WarnUserDto }) warn(@CurrentUser() user: AuthUserContext, @Param('messageId') messageId: string, @Body() dto: WarnUserDto) { return this.service.warn(user, messageId, dto); }
  @Post('messages/:messageId/suspend-account') @Permissions('messageModeration.suspend') @ApiOperation({ summary: 'Suspend the message sender account', description: 'Uses existing user suspension fields and refuses ADMIN/SUPER_ADMIN accounts.' }) @ApiBody({ type: SuspendAccountDto }) suspend(@CurrentUser() user: AuthUserContext, @Param('messageId') messageId: string, @Body() dto: SuspendAccountDto) { return this.service.suspend(user, messageId, dto); }
  @Post('messages/:messageId/dismiss-flag') @Permissions('messageModeration.dismiss') @ApiOperation({ summary: 'Dismiss a moderation flag', description: 'Marks case dismissed, keeps message visible, and writes moderation/audit logs.' }) @ApiBody({ type: DismissFlagDto }) dismiss(@CurrentUser() user: AuthUserContext, @Param('messageId') messageId: string, @Body() dto: DismissFlagDto) { return this.service.dismiss(user, messageId, dto); }
  @Post('messages/:messageId/note') @Permissions('messageModeration.notes.create') @ApiOperation({ summary: 'Add internal private moderation note', description: 'Internal-only note visible to admin moderation users; creates audit log.' }) @ApiBody({ type: InternalNoteDto }) note(@CurrentUser() user: AuthUserContext, @Param('messageId') messageId: string, @Body() dto: InternalNoteDto) { return this.service.note(user, messageId, dto); }
  @Post('messages/:messageId/reprocess') @Permissions('messageModeration.moderate') @ApiOperation({ summary: 'Reprocess a message through scanner', description: 'Runs deterministic scanner again and updates the moderation case.' }) @ApiBody({ type: ReprocessMessageDto }) reprocess(@CurrentUser() user: AuthUserContext, @Param('messageId') messageId: string, @Body() dto: ReprocessMessageDto) { return this.service.reprocess(user, messageId, dto); }
}
