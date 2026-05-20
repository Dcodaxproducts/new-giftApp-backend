import { Injectable } from '@nestjs/common';
import { ChatMessageRepository } from '../repositories/chat-message.repository';

@Injectable()
export class ChatReadReceiptService {
  constructor(private readonly messages: ChatMessageRepository) {}

  async markThreadRead(threadId: string, userId: string) {
    const unread = await this.messages.findUnreadIds({ threadId, userId });
    if (!unread.length) return;
    await this.messages.createReadReceipts({ threadId, userId, messageIds: unread.map((message) => message.id) });
  }
}
