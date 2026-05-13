import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthUserContext, CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CustomerProviderInteractionsService } from './customer-provider-interactions.service';
import { ChatDetailsDto, CreateProviderReportDto, CreateReviewDto, GetOrderChatDto, ListCustomerChatsDto, ListCustomerReviewsDto, ListProviderReportsDto, SendChatMessageDto, UpdateReviewDto } from './dto/customer-provider-interactions.dto';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.REGISTERED_USER)
@Controller('customer')
export class CustomerProviderInteractionsController {
  constructor(private readonly interactions: CustomerProviderInteractionsService) {}

  @Get('chats')
  @ApiTags('05 Customer - Provider Chat')
  @ApiOperation({ summary: 'List customer provider chats', description: 'REGISTERED_USER only. Uses shared ChatThread/ChatMessage records with provider buyer chat. Customer sees only own order threads.' })
  chats(@CurrentUser() user: AuthUserContext, @Query() query: ListCustomerChatsDto) { return this.interactions.chats(user, query); }

  @Get('chats/quick-replies')
  @ApiTags('05 Customer - Provider Chat')
  @ApiOperation({ summary: 'Fetch provider chat quick replies', description: 'REGISTERED_USER only. Declared before /customer/chats/:threadId.' })
  quickReplies() { return this.interactions.quickReplies(); }

  @Get('chats/:threadId')
  @ApiTags('05 Customer - Provider Chat')
  @ApiOperation({ summary: 'Fetch customer chat messages', description: 'REGISTERED_USER only. Thread must belong to the current customer.' })
  chatDetails(@CurrentUser() user: AuthUserContext, @Param('threadId') threadId: string, @Query() query: ChatDetailsDto) { return this.interactions.chatDetails(user, threadId, query); }

  @Post('chats/:threadId/messages')
  @ApiTags('05 Customer - Provider Chat')
  @ApiOperation({ summary: 'Send message to provider', description: 'REGISTERED_USER only. Customer can send only in own order thread. Creates provider notification and updates read receipts.' })
  @ApiBody({ type: SendChatMessageDto, examples: { text: { value: { messageType: 'TEXT', body: 'Can you confirm delivery time?', attachmentUrls: [] } }, image: { value: { messageType: 'IMAGE', attachmentUrls: ['https://cdn.yourdomain.com/chat-attachments/package.png'] } } } })
  sendMessage(@CurrentUser() user: AuthUserContext, @Param('threadId') threadId: string, @Body() dto: SendChatMessageDto) { return this.interactions.sendMessage(user, threadId, dto); }

  @Patch('chats/:threadId/read')
  @ApiTags('05 Customer - Provider Chat')
  @ApiOperation({ summary: 'Mark provider messages read', description: 'REGISTERED_USER only. Marks provider messages as read for the customer in the owned thread.' })
  markRead(@CurrentUser() user: AuthUserContext, @Param('threadId') threadId: string) { return this.interactions.markRead(user, threadId); }

  @Get('orders/:id/chat')
  @ApiTags('05 Customer - Provider Chat')
  @ApiOperation({ summary: 'Get or optionally create order chat', description: 'REGISTERED_USER only. Order must belong to the logged-in customer and have an attached provider order.' })
  getOrderChat(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Query() query: GetOrderChatDto) { return this.interactions.getOrderChat(user, id, query); }

  @Post('orders/:id/chat')
  @ApiTags('05 Customer - Provider Chat')
  @ApiOperation({ summary: 'Create order chat', description: 'REGISTERED_USER only. Reuses existing ChatThread if already created for the provider order.' })
  createOrderChat(@CurrentUser() user: AuthUserContext, @Param('id') id: string) { return this.interactions.createOrderChat(user, id); }

  @Post('orders/:id/reviews')
  @ApiTags('05 Customer - Reviews')
  @ApiOperation({ summary: 'Submit provider review for an order', description: 'REGISTERED_USER only. Uses shared Review records consumed by provider reviews and admin review management.' })
  @ApiResponse({ status: 201, schema: { example: { success: true, data: { id: 'review_id', rating: 5, comment: 'Great service and fast delivery.', status: 'PUBLISHED', providerId: 'provider_id', orderId: 'order_id', createdAt: '2026-05-11T10:00:00.000Z' }, message: 'Review submitted successfully.' } } })
  submitReview(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Body() dto: CreateReviewDto) { return this.interactions.submitReview(user, id, dto); }

  @Get('reviews')
  @ApiTags('05 Customer - Reviews')
  @ApiOperation({ summary: 'List own provider reviews', description: 'REGISTERED_USER only. Customer sees only their own non-deleted reviews.' })
  reviews(@CurrentUser() user: AuthUserContext, @Query() query: ListCustomerReviewsDto) { return this.interactions.reviews(user, query); }

  @Get('reviews/:id')
  @ApiTags('05 Customer - Reviews')
  reviewDetails(@CurrentUser() user: AuthUserContext, @Param('id') id: string) { return this.interactions.reviewDetails(user, id); }

  @Patch('reviews/:id')
  @ApiTags('05 Customer - Reviews')
  @ApiOperation({ summary: 'Update own review', description: 'REGISTERED_USER only. Cannot update deleted/removed reviews; updated content is re-run through deterministic moderation.' })
  updateReview(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Body() dto: UpdateReviewDto) { return this.interactions.updateReview(user, id, dto); }

  @Delete('reviews/:id')
  @ApiTags('05 Customer - Reviews')
  @ApiOperation({ summary: 'Soft-delete own review', description: 'REGISTERED_USER only. Does not physically delete provider response.' })
  deleteReview(@CurrentUser() user: AuthUserContext, @Param('id') id: string) { return this.interactions.deleteReview(user, id); }

  @Get('provider-report-reasons')
  @ApiTags('05 Customer - Provider Reports')
  @ApiOperation({ summary: 'Fetch provider report reasons', description: 'REGISTERED_USER only. Declared before /customer/provider-reports/:id.' })
  providerReportReasons() { return this.interactions.providerReportReasons(); }

  @Post('providers/:providerId/reports')
  @ApiTags('05 Customer - Provider Reports')
  @ApiOperation({ summary: 'Report provider', description: 'REGISTERED_USER only. Customer must have an order, chat, or review relationship with provider. Duplicate active provider/order/reason reports are blocked.' })
  reportProvider(@CurrentUser() user: AuthUserContext, @Param('providerId') providerId: string, @Body() dto: CreateProviderReportDto) { return this.interactions.reportProvider(user, providerId, dto); }

  @Get('provider-reports')
  @ApiTags('05 Customer - Provider Reports')
  providerReports(@CurrentUser() user: AuthUserContext, @Query() query: ListProviderReportsDto) { return this.interactions.providerReports(user, query); }

  @Get('provider-reports/:id')
  @ApiTags('05 Customer - Provider Reports')
  providerReportDetails(@CurrentUser() user: AuthUserContext, @Param('id') id: string) { return this.interactions.providerReportDetails(user, id); }
}
