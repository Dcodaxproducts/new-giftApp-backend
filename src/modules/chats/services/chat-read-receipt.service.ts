import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { ChatMessageRepository } from '../repositories/chat-message.repository';

@Injectable()
export class ChatReadReceiptService {
  constructor(private readonly prisma: PrismaService, private readonly messages: ChatMessageRepository) {}

  async markThreadRead(threadId: string, userId: string) {
    const unread = await this.messages.findUnreadIds({ threadId, userId });
    if (!unread.length) return;
    await this.prisma.chatMessageReadReceipt.createMany({
      data: unread.map((message) => ({ threadId, messageId: message.id, userId })),
      skipDuplicates: true,
    });
  }
}
