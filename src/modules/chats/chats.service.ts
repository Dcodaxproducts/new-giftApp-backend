import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { SenderType, UserRole } from '@prisma/client';
import { AuthUserContext } from '../../common/decorators/current-user.decorator';
import { ChatsRepository } from './chats.repository';
import { ListConversationsDto, ListMessagesDto, SendMessageDto, StartConversationDto } from './dto/chats.dto';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ChatsService {
  constructor(
    private readonly repo: ChatsRepository,
    private readonly prisma: PrismaService,
  ) {}

  async listConversations(user: AuthUserContext, dto: ListConversationsDto) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;
    const result = await this.repo.findConversationsByUser(user.uid, page, limit);

    const conversationsWithUnread = await Promise.all(
      result.conversations.map(async (c) => {
        const unreadCount = await this.repo.getUnreadCount(c.id, user.uid);
        return { ...c, unreadCount };
      }),
    );

    return { success: true, data: { ...result, conversations: conversationsWithUnread } };
  }

  async startConversation(user: AuthUserContext, dto: StartConversationDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      select: { id: true, userId: true, providerId: true },
    });

    if (!order) throw new NotFoundException('Order not found.');

    const isCustomer = order.userId === user.uid;
    const isProvider = order.providerId === user.uid;
    if (!isCustomer && !isProvider) throw new ForbiddenException('You are not part of this order.');

    const conversation = await this.repo.findOrCreateConversation(order.id, order.userId, order.providerId);

    if (dto.initialMessage) {
      const senderType = isProvider ? SenderType.PROVIDER : SenderType.USER;
      await this.repo.createMessage(conversation.id, user.uid, senderType, dto.initialMessage);
    }

    return { success: true, data: conversation, message: 'Conversation ready.' };
  }

  async getConversation(user: AuthUserContext, conversationId: string) {
    const conversation = await this.repo.findConversationById(conversationId);
    if (!conversation) throw new NotFoundException('Conversation not found.');
    this.assertAccess(user, conversation);

    const unreadCount = await this.repo.getUnreadCount(conversationId, user.uid);
    return { success: true, data: { ...conversation, unreadCount } };
  }

  async getMessages(user: AuthUserContext, conversationId: string, dto: ListMessagesDto) {
    const conversation = await this.repo.findConversationById(conversationId);
    if (!conversation) throw new NotFoundException('Conversation not found.');
    this.assertAccess(user, conversation);

    const page = dto.page ?? 1;
    const limit = dto.limit ?? 50;
    const result = await this.repo.findMessages(conversationId, page, limit);
    return { success: true, data: result };
  }

  async sendMessage(user: AuthUserContext, conversationId: string, dto: SendMessageDto) {
    if (!dto.content && !dto.attachmentUrl) throw new BadRequestException('Message must have content or attachment.');

    const conversation = await this.repo.findConversationById(conversationId);
    if (!conversation) throw new NotFoundException('Conversation not found.');
    this.assertAccess(user, conversation);

    const senderType = conversation.providerId === user.uid ? SenderType.PROVIDER : SenderType.USER;
    const message = await this.repo.createMessage(conversationId, user.uid, senderType, dto.content, dto.attachmentUrl);

    return { success: true, data: message, message: 'Message sent.' };
  }

  async markAsRead(user: AuthUserContext, conversationId: string) {
    const conversation = await this.repo.findConversationById(conversationId);
    if (!conversation) throw new NotFoundException('Conversation not found.');
    this.assertAccess(user, conversation);

    const result = await this.repo.markMessagesAsRead(conversationId, user.uid);
    return { success: true, data: { markedCount: result.count }, message: 'Messages marked as read.' };
  }

  private assertAccess(user: AuthUserContext, conversation: { userId: string; providerId: string }) {
    if (conversation.userId !== user.uid && conversation.providerId !== user.uid) {
      throw new ForbiddenException('You do not have access to this conversation.');
    }
  }
}
