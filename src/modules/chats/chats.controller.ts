import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthUserContext, CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ChatsService } from './chats.service';
import { ListConversationsDto, ListMessagesDto, SendMessageDto, StartConversationDto } from './dto/chats.dto';

@ApiTags('08 Chat - Conversations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.REGISTERED_USER, UserRole.PROVIDER)
@Controller('chats')
export class ChatsController {
  constructor(private readonly chats: ChatsService) {}

  @Get()
  @ApiOperation({ summary: 'List conversations', description: 'Lists all order-based conversations for the authenticated user (buyer or provider).' })
  list(@CurrentUser() user: AuthUserContext, @Query() query: ListConversationsDto) {
    return this.chats.listConversations(user, query);
  }

  @Post()
  @ApiOperation({ summary: 'Start or get conversation', description: 'Creates a new conversation for an order or returns existing one. Only buyer and provider of the order can start a conversation.' })
  @ApiBody({ type: StartConversationDto })
  start(@CurrentUser() user: AuthUserContext, @Body() dto: StartConversationDto) {
    return this.chats.startConversation(user, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get conversation details' })
  @ApiParam({ name: 'id', description: 'Conversation ID' })
  details(@CurrentUser() user: AuthUserContext, @Param('id') id: string) {
    return this.chats.getConversation(user, id);
  }

  @Get(':id/messages')
  @ApiOperation({ summary: 'Get conversation messages', description: 'Returns paginated messages for a conversation, newest first.' })
  @ApiParam({ name: 'id', description: 'Conversation ID' })
  messages(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Query() query: ListMessagesDto) {
    return this.chats.getMessages(user, id, query);
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Send a message', description: 'Send a text message or attachment in a conversation.' })
  @ApiParam({ name: 'id', description: 'Conversation ID' })
  @ApiBody({ type: SendMessageDto })
  send(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Body() dto: SendMessageDto) {
    return this.chats.sendMessage(user, id, dto);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark conversation as read', description: 'Marks all unread messages from the other party as read.' })
  @ApiParam({ name: 'id', description: 'Conversation ID' })
  markRead(@CurrentUser() user: AuthUserContext, @Param('id') id: string) {
    return this.chats.markAsRead(user, id);
  }
}
