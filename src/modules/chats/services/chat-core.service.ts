import { Injectable } from '@nestjs/common';
import { AuthUserContext } from '../../../common/decorators/current-user.decorator';
import { CreateChatThreadDto, ListChatsDto, ListThreadMessagesDto, SendChatThreadMessageDto, UpdateChatThreadStatusDto } from '../dto/chats.dto';
import { ChatThreadService } from './chat-thread.service';

@Injectable()
export class ChatCoreService {
  constructor(private readonly threads: ChatThreadService) {}

  list(user: AuthUserContext, query: ListChatsDto) {
    return this.threads.list(user, query);
  }

  quickReplies(user: AuthUserContext) {
    return this.threads.quickReplies(user);
  }

  createOrGetThread(user: AuthUserContext, dto: CreateChatThreadDto) {
    return this.threads.createOrGetThread(user, dto);
  }

  threadDetails(user: AuthUserContext, threadId: string) {
    return this.threads.details(user, threadId);
  }

  messages(user: AuthUserContext, threadId: string, query: ListThreadMessagesDto) {
    return this.threads.messages(user, threadId, query);
  }

  sendMessage(user: AuthUserContext, threadId: string, dto: SendChatThreadMessageDto) {
    return this.threads.sendMessage(user, threadId, dto);
  }

  markRead(user: AuthUserContext, threadId: string) {
    return this.threads.markRead(user, threadId);
  }

  updateStatus(user: AuthUserContext, threadId: string, dto: UpdateChatThreadStatusDto) {
    return this.threads.updateStatus(user, threadId, dto);
  }

  resolve(user: AuthUserContext, threadId: string, dto: UpdateChatThreadStatusDto) {
    return this.threads.resolve(user, threadId, dto);
  }

  reopen(user: AuthUserContext, threadId: string, dto: UpdateChatThreadStatusDto) {
    return this.threads.reopen(user, threadId, dto);
  }

  auditLog(user: AuthUserContext, threadId: string) {
    return this.threads.auditLog(user, threadId);
  }
}
