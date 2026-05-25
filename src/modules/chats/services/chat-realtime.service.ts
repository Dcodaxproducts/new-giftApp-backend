import { Injectable } from '@nestjs/common';
import { AuthUserContext } from '../../../common/decorators/current-user.decorator';
import { SendChatThreadMessageDto, UpdateChatThreadStatusDto } from '../dto/chats.dto';
import { ChatThreadService } from './chat-thread.service';

@Injectable()
export class ChatRealtimeService {
  constructor(private readonly threads: ChatThreadService) {}

  context(user: AuthUserContext, threadId: string) {
    return this.threads.socketContext(user, threadId);
  }

  sendMessage(user: AuthUserContext, threadId: string, dto: SendChatThreadMessageDto) {
    return this.threads.sendMessage(user, threadId, dto);
  }

  markRead(user: AuthUserContext, threadId: string) {
    return this.threads.markRead(user, threadId);
  }

  resolve(user: AuthUserContext, threadId: string, dto: UpdateChatThreadStatusDto) {
    return this.threads.updateStatus(user, threadId, dto);
  }

  reopen(user: AuthUserContext, threadId: string, dto: UpdateChatThreadStatusDto) {
    return this.threads.updateStatus(user, threadId, dto);
  }
}
