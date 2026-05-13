import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthUserContext, CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { GetProviderOrderChatDto, ListProviderChatsDto, ListProviderReviewsDto, ProviderChatDetailsDto, ReviewResponseDto, SendProviderChatMessageDto } from './dto/provider-interactions.dto';
import { ProviderInteractionsService } from './provider-interactions.service';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.PROVIDER)
@Controller('provider')
export class ProviderInteractionsController {
  constructor(private readonly interactions: ProviderInteractionsService) {}

  @Get('chats')
  @ApiTags('03 Provider - Buyer Chat')
  @ApiOperation({ summary: 'List provider buyer chats', description: 'PROVIDER only. Uses shared ChatThread/ChatMessage records with customer provider chat. Provider sees only own provider-order threads.' })
  chats(@CurrentUser() user: AuthUserContext, @Query() query: ListProviderChatsDto) { return this.interactions.chats(user, query); }

  @Get('chats/quick-replies')
  @ApiTags('03 Provider - Buyer Chat')
  @ApiOperation({ summary: 'Fetch provider buyer chat quick replies', description: 'PROVIDER only. Declared before /provider/chats/:threadId.' })
  quickReplies() { return this.interactions.quickReplies(); }

  @Get('chats/:threadId')
  @ApiTags('03 Provider - Buyer Chat')
  @ApiOperation({ summary: 'Fetch provider buyer chat messages', description: 'PROVIDER only. Thread must belong to the authenticated provider.' })
  chatDetails(@CurrentUser() user: AuthUserContext, @Param('threadId') threadId: string, @Query() query: ProviderChatDetailsDto) { return this.interactions.chatDetails(user, threadId, query); }

  @Post('chats/:threadId/messages')
  @ApiTags('03 Provider - Buyer Chat')
  @ApiOperation({ summary: 'Send chat message to buyer', description: 'PROVIDER only. Provider can send only in own provider order thread. Creates customer notification and updates read receipts.' })
  @ApiBody({ type: SendProviderChatMessageDto, examples: { text: { value: { messageType: 'TEXT', body: 'Your order is ready for shipping.', attachmentUrls: [] } }, image: { value: { messageType: 'IMAGE', attachmentUrls: ['https://cdn.yourdomain.com/chat-attachments/package.png'] } } } })
  sendMessage(@CurrentUser() user: AuthUserContext, @Param('threadId') threadId: string, @Body() dto: SendProviderChatMessageDto) { return this.interactions.sendMessage(user, threadId, dto); }

  @Patch('chats/:threadId/read')
  @ApiTags('03 Provider - Buyer Chat')
  @ApiOperation({ summary: 'Mark buyer messages read', description: 'PROVIDER only. Marks customer messages as read for provider in an owned thread.' })
  markRead(@CurrentUser() user: AuthUserContext, @Param('threadId') threadId: string) { return this.interactions.markRead(user, threadId); }

  @Get('orders/:id/chat')
  @ApiTags('03 Provider - Buyer Chat')
  @ApiOperation({ summary: 'Get or optionally create provider order chat', description: 'PROVIDER only. Provider order must belong to logged-in provider. Reuses existing thread if present.' })
  getOrderChat(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Query() query: GetProviderOrderChatDto) { return this.interactions.getOrderChat(user, id, query); }

  @Post('orders/:id/chat')
  @ApiTags('03 Provider - Buyer Chat')
  @ApiOperation({ summary: 'Create provider order chat', description: 'PROVIDER only. Creates or returns shared ChatThread for an owned provider order.' })
  createOrderChat(@CurrentUser() user: AuthUserContext, @Param('id') id: string) { return this.interactions.createOrderChat(user, id); }

  @Get('reviews/summary')
  @ApiTags('03 Provider - Reviews')
  @ApiOperation({ summary: 'Fetch provider rating summary', description: 'PROVIDER only. Uses shared Review records visible to provider/customer/admin modules.' })
  @ApiResponse({ status: 200, schema: { example: { success: true, data: { averageRating: 4.8, reviewCount: 128, distribution: { '5': 80, '4': 12, '3': 5, '2': 2, '1': 1 } }, message: 'Review summary fetched successfully.' } } })
  reviewSummary(@CurrentUser() user: AuthUserContext) { return this.interactions.reviewSummary(user); }

  @Get('reviews/filter-options')
  @ApiTags('03 Provider - Reviews')
  @ApiOperation({ summary: 'Fetch provider review filter options', description: 'PROVIDER only. Declared before /provider/reviews/:id.' })
  filterOptions() { return this.interactions.filterOptions(); }

  @Get('reviews')
  @ApiTags('03 Provider - Reviews')
  @ApiOperation({ summary: 'List provider reviews', description: 'PROVIDER only. Shows only reviews for own provider account/orders and excludes hidden/removed reviews.' })
  reviews(@CurrentUser() user: AuthUserContext, @Query() query: ListProviderReviewsDto) { return this.interactions.reviews(user, query); }

  @Get('reviews/:id')
  @ApiTags('03 Provider - Reviews')
  reviewDetails(@CurrentUser() user: AuthUserContext, @Param('id') id: string) { return this.interactions.reviewDetails(user, id); }

  @Post('reviews/:id/response')
  @ApiTags('03 Provider - Reviews')
  @ApiOperation({ summary: 'Post public review response', description: 'PROVIDER only. Provider can respond only to own review. Only one active public response per review.' })
  createResponse(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Body() dto: ReviewResponseDto) { return this.interactions.createResponse(user, id, dto); }

  @Patch('reviews/:id/response')
  @ApiTags('03 Provider - Reviews')
  @ApiOperation({ summary: 'Update public review response', description: 'PROVIDER only. Updates only provider’s own active response; customer review content is never modified.' })
  updateResponse(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Body() dto: ReviewResponseDto) { return this.interactions.updateResponse(user, id, dto); }

  @Delete('reviews/:id/response')
  @ApiTags('03 Provider - Reviews')
  @ApiOperation({ summary: 'Soft-delete public review response', description: 'PROVIDER only. Soft-deletes own response and does not delete the original customer review.' })
  deleteResponse(@CurrentUser() user: AuthUserContext, @Param('id') id: string) { return this.interactions.deleteResponse(user, id); }
}
