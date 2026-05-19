import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthUserContext, CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { ChatCoreService } from '../services/chat-core.service';
import { CreateChatThreadDto, ListChatsDto, ListThreadMessagesDto, SendChatThreadMessageDto, UpdateChatThreadStatusDto } from '../dto/chats.dto';

@ApiTags('08 Chat - Unified Threads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.REGISTERED_USER, UserRole.PROVIDER, UserRole.SUPER_ADMIN, UserRole.ADMIN)
@Controller('chats')
export class ChatsController {
  constructor(private readonly chats: ChatCoreService) {}

  @Get()
  @ApiOperation({ summary: 'List chat threads', description: 'Role-aware list for customer order chats, provider buyer chats, support chats, and admin-visible support/moderation chat views.' })
  list(@CurrentUser() user: AuthUserContext, @Query() query: ListChatsDto) {
    return this.chats.list(user, query);
  }

  @Get('quick-replies')
  @ApiOperation({ summary: 'Fetch role-aware chat quick replies' })
  quickReplies(@CurrentUser() user: AuthUserContext) {
    return this.chats.quickReplies(user);
  }

  @Post('threads')
  @ApiOperation({ summary: 'Create or get a chat thread' })
  @ApiBody({ type: CreateChatThreadDto })
  createOrGetThread(@CurrentUser() user: AuthUserContext, @Body() dto: CreateChatThreadDto) {
    return this.chats.createOrGetThread(user, dto);
  }

  @Get('threads/:threadId')
  @ApiOperation({ summary: 'Fetch chat thread details' })
  @ApiParam({ name: 'threadId' })
  threadDetails(@CurrentUser() user: AuthUserContext, @Param('threadId') threadId: string) {
    return this.chats.threadDetails(user, threadId);
  }

  @Get('threads/:threadId/messages')
  @ApiOperation({ summary: 'Fetch chat thread messages' })
  messages(@CurrentUser() user: AuthUserContext, @Param('threadId') threadId: string, @Query() query: ListThreadMessagesDto) {
    return this.chats.messages(user, threadId, query);
  }

  @Post('threads/:threadId/messages')
  @ApiOperation({ summary: 'Send a chat message' })
  @ApiBody({ type: SendChatThreadMessageDto })
  sendMessage(@CurrentUser() user: AuthUserContext, @Param('threadId') threadId: string, @Body() dto: SendChatThreadMessageDto) {
    return this.chats.sendMessage(user, threadId, dto);
  }

  @Patch('threads/:threadId/read')
  @ApiOperation({ summary: 'Mark a chat thread as read' })
  markRead(@CurrentUser() user: AuthUserContext, @Param('threadId') threadId: string) {
    return this.chats.markRead(user, threadId);
  }

  @Patch('threads/:threadId/status')
  @ApiOperation({ summary: 'Update chat thread status' })
  @ApiBody({ type: UpdateChatThreadStatusDto })
  updateStatus(@CurrentUser() user: AuthUserContext, @Param('threadId') threadId: string, @Body() dto: UpdateChatThreadStatusDto) {
    return this.chats.updateStatus(user, threadId, dto);
  }

  @Post('threads/:threadId/resolve')
  @ApiOperation({ summary: 'Resolve a support chat thread' })
  @ApiBody({ type: UpdateChatThreadStatusDto })
  resolve(@CurrentUser() user: AuthUserContext, @Param('threadId') threadId: string, @Body() dto: UpdateChatThreadStatusDto) {
    return this.chats.resolve(user, threadId, dto);
  }

  @Post('threads/:threadId/reopen')
  @ApiOperation({ summary: 'Reopen a support chat thread' })
  @ApiBody({ type: UpdateChatThreadStatusDto })
  reopen(@CurrentUser() user: AuthUserContext, @Param('threadId') threadId: string, @Body() dto: UpdateChatThreadStatusDto) {
    return this.chats.reopen(user, threadId, dto);
  }

  @Get('threads/:threadId/audit-log')
  @ApiOperation({ summary: 'Fetch chat thread audit log' })
  auditLog(@CurrentUser() user: AuthUserContext, @Param('threadId') threadId: string) {
    return this.chats.auditLog(user, threadId);
  }
}
