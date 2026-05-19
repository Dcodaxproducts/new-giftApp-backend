import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ChatMessageType } from '@prisma/client';
import { ChatStatus } from '../dto/chats.dto';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthUserContext } from '../../../common/decorators/current-user.decorator';
import { ChatPresenceService } from '../services/chat-presence.service';
import { ChatRealtimeService } from '../services/chat-realtime.service';

interface ThreadPayload { threadId?: string }
interface SupportPayload { supportChatId?: string }
interface TypingPayload extends ThreadPayload { orderId?: string; providerOrderId?: string }
type SupportTypingPayload = SupportPayload;
interface ChatMessagePayload extends ThreadPayload { clientMessageId?: string; messageType?: ChatMessageType; body?: string; attachmentUrls?: string[] }
interface SupportMessagePayload extends SupportPayload { clientMessageId?: string; messageType?: ChatMessageType; body?: string; attachmentUrls?: string[] }
interface ResolvePayload extends SupportPayload { comment?: string; notifyParticipant?: boolean }
interface ChatMessageResult { id: string; clientMessageId?: string | null }
interface ChatStatusResult { status: string }
interface ChatThreadContext { threadId: string; threadType: string; orderId?: string | null; providerOrderId?: string | null; customerId?: string | null; providerId?: string | null; participantId?: string | null; assignedAdminId?: string | null }
interface SupportThreadContext extends ChatThreadContext { supportChatId: string }

@WebSocketGateway({ namespace: '/chat', cors: { origin: true, credentials: true } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private readonly connectedUsers = new WeakMap<Socket, AuthUserContext>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly realtime: ChatRealtimeService,
    private readonly presence: ChatPresenceService,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    try {
      const token = this.extractToken(client);
      const payload = await this.jwtService.verifyAsync<AuthUserContext>(token, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET', 'change-me-access'),
      });
      this.connectedUsers.set(client, payload);
      const presence = this.presence.connect(client.id, payload);
      await client.join(`user:${payload.uid}`);
      await client.join(`role:${payload.role}`);
      if (presence.becameOnline) this.server.emit('chat.participant.online', { userId: payload.uid, role: payload.role, lastSeenAt: presence.lastSeenAt });
    } catch {
      this.logger.warn('Rejected unauthenticated chat socket');
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket): void {
    const presence = this.presence.disconnect(client.id);
    if (presence.becameOffline && presence.user) this.server.emit('chat.participant.offline', { userId: presence.user.uid, role: presence.user.role, lastSeenAt: presence.lastSeenAt });
    this.connectedUsers.delete(client);
  }

  @SubscribeMessage('presence.ping')
  handlePresencePing(@ConnectedSocket() client: Socket): void {
    const user = this.requireUser(client);
    const lastSeenAt = this.presence.ping(client.id) ?? new Date();
    client.emit('presence.pong', { userId: user.uid, lastSeenAt });
  }

  @SubscribeMessage('chat.join')
  async joinChat(@ConnectedSocket() client: Socket, @MessageBody() payload: ThreadPayload): Promise<void> {
    await this.withChatContext(client, payload, 'chat.error', async (user, context) => {
      await this.joinChatRooms(client, context);
      client.emit('chat.joined', context);
    });
  }

  @SubscribeMessage('chat.leave')
  async leaveChat(@ConnectedSocket() client: Socket, @MessageBody() payload: ThreadPayload): Promise<void> {
    if (!payload.threadId) return this.emitError(client, 'chat.error', 'threadId is required');
    await client.leave(`chat:${payload.threadId}`);
  }

  @SubscribeMessage('chat.typing.start')
  async startTyping(@ConnectedSocket() client: Socket, @MessageBody() payload: TypingPayload): Promise<void> {
    await this.withChatContext(client, payload, 'chat.error', (user, context) => {
      client.to(`chat:${context.threadId}`).emit('chat.typing.started', { threadId: context.threadId, userId: user.uid, role: user.role });
    });
  }

  @SubscribeMessage('chat.typing.stop')
  async stopTyping(@ConnectedSocket() client: Socket, @MessageBody() payload: TypingPayload): Promise<void> {
    await this.withChatContext(client, payload, 'chat.error', (user, context) => {
      client.to(`chat:${context.threadId}`).emit('chat.typing.stopped', { threadId: context.threadId, userId: user.uid, role: user.role });
    });
  }

  @SubscribeMessage('chat.message.send')
  async sendChatMessage(@ConnectedSocket() client: Socket, @MessageBody() payload: ChatMessagePayload): Promise<void> {
    await this.withChatContext(client, payload, 'chat.error', async (user, context) => {
      const dto = this.chatMessageDto(payload);
      const result = await this.realtime.sendMessage(user, context.threadId, dto);
      const message = result.data as ChatMessageResult;
      const eventPayload = { threadId: context.threadId, message };
      this.room(`chat:${context.threadId}`).emit('chat.message.created', eventPayload);
      this.room(`chat:${context.threadId}`).emit('chat.message.delivered', { threadId: context.threadId, messageId: message.id, clientMessageId: payload.clientMessageId ?? message.clientMessageId ?? null, deliveredAt: new Date() });
      this.room(`order:${context.orderId}`).emit('chat.thread.updated', { threadId: context.threadId, orderId: context.orderId });
      this.room(`provider-order:${context.providerOrderId}`).emit('chat.thread.updated', { threadId: context.threadId, providerOrderId: context.providerOrderId });
    });
  }

  @SubscribeMessage('chat.message.read')
  async readChatMessage(@ConnectedSocket() client: Socket, @MessageBody() payload: ThreadPayload): Promise<void> {
    await this.withChatContext(client, payload, 'chat.error', async (user, context) => {
      const result = await this.realtime.markRead(user, context.threadId);
      this.room(`chat:${context.threadId}`).emit('chat.message.read', { threadId: context.threadId, readByUserId: user.uid, role: user.role, data: result.data });
    });
  }

  @SubscribeMessage('support.join')
  async joinSupport(@ConnectedSocket() client: Socket, @MessageBody() payload: SupportPayload): Promise<void> {
    await this.withSupportContext(client, payload, async (_user, context) => {
      await client.join(`support-chat:${context.supportChatId}`);
      client.emit('support.thread.updated', context);
    });
  }

  @SubscribeMessage('support.leave')
  async leaveSupport(@ConnectedSocket() client: Socket, @MessageBody() payload: SupportPayload): Promise<void> {
    if (!payload.supportChatId) return this.emitError(client, 'support.error', 'supportChatId is required');
    await client.leave(`support-chat:${payload.supportChatId}`);
  }

  @SubscribeMessage('support.typing.start')
  async startSupportTyping(@ConnectedSocket() client: Socket, @MessageBody() payload: SupportTypingPayload): Promise<void> {
    await this.withSupportContext(client, payload, (user, context) => {
      client.to(`support-chat:${context.supportChatId}`).emit('support.typing.started', { supportChatId: context.supportChatId, userId: user.uid, role: user.role });
    });
  }

  @SubscribeMessage('support.typing.stop')
  async stopSupportTyping(@ConnectedSocket() client: Socket, @MessageBody() payload: SupportTypingPayload): Promise<void> {
    await this.withSupportContext(client, payload, (user, context) => {
      client.to(`support-chat:${context.supportChatId}`).emit('support.typing.stopped', { supportChatId: context.supportChatId, userId: user.uid, role: user.role });
    });
  }

  @SubscribeMessage('support.message.send')
  async sendSupportMessage(@ConnectedSocket() client: Socket, @MessageBody() payload: SupportMessagePayload): Promise<void> {
    await this.withSupportContext(client, payload, async (user, context) => {
      const result = await this.realtime.sendMessage(user, context.supportChatId, this.supportMessageDto(payload));
      const message = result.data as ChatMessageResult;
      this.room('support-chat:' + context.supportChatId).emit('support.message.created', { supportChatId: context.supportChatId, message });
      this.room('support-chat:' + context.supportChatId).emit('support.message.delivered', { supportChatId: context.supportChatId, messageId: message.id, clientMessageId: payload.clientMessageId ?? message.clientMessageId ?? null, deliveredAt: new Date() });
      this.room(`support-chat:${context.supportChatId}`).emit('support.thread.updated', { supportChatId: context.supportChatId });
    });
  }

  @SubscribeMessage('support.message.read')
  async readSupportMessage(@ConnectedSocket() client: Socket, @MessageBody() payload: SupportPayload): Promise<void> {
    await this.withSupportContext(client, payload, async (user, context) => {
      const result = await this.realtime.markRead(user, context.supportChatId);
      this.room(`support-chat:${context.supportChatId}`).emit('support.message.read', { supportChatId: context.supportChatId, readByUserId: user.uid, role: user.role, data: result.data });
    });
  }

  @SubscribeMessage('support.resolved')
  async resolveSupport(@ConnectedSocket() client: Socket, @MessageBody() payload: ResolvePayload): Promise<void> {
    await this.withSupportContext(client, payload, async (user, context) => {
      const result = await this.realtime.resolve(user, context.supportChatId, { status: ChatStatus.RESOLVED, comment: payload.comment, notifyParticipant: payload.notifyParticipant });
      this.room(`support-chat:${context.supportChatId}`).emit('support.status.updated', { supportChatId: context.supportChatId, status: (result.data as ChatStatusResult).status, data: result.data });
      this.room(`support-chat:${context.supportChatId}`).emit('support.thread.updated', { supportChatId: context.supportChatId });
    });
  }

  @SubscribeMessage('support.reopened')
  async reopenSupport(@ConnectedSocket() client: Socket, @MessageBody() payload: ResolvePayload): Promise<void> {
    await this.withSupportContext(client, payload, async (user, context) => {
      const result = await this.realtime.reopen(user, context.supportChatId, { status: ChatStatus.REOPENED, comment: payload.comment, notifyParticipant: payload.notifyParticipant });
      this.room(`support-chat:${context.supportChatId}`).emit('support.status.updated', { supportChatId: context.supportChatId, status: (result.data as ChatStatusResult).status, data: result.data });
      this.room(`support-chat:${context.supportChatId}`).emit('support.thread.updated', { supportChatId: context.supportChatId });
    });
  }

  private async withChatContext(client: Socket, payload: ThreadPayload, errorEvent: 'chat.error', handler: (user: AuthUserContext, context: ChatThreadContext) => void | Promise<void>): Promise<void> {
    try {
      const user = this.requireUser(client);
      if (!payload.threadId) throw new Error('threadId is required');
      const context = await this.chatContext(user, payload.threadId);
      await handler(user, context);
    } catch (error) {
      this.emitError(client, errorEvent, this.errorMessage(error));
    }
  }

  private async withSupportContext(client: Socket, payload: SupportPayload, handler: (user: AuthUserContext, context: SupportThreadContext) => void | Promise<void>): Promise<void> {
    try {
      const user = this.requireUser(client);
      if (!payload.supportChatId) throw new Error('supportChatId is required');
      const context = await this.realtime.context(user, payload.supportChatId);
      await handler(user, { ...context, supportChatId: context.threadId });
    } catch (error) {
      this.emitError(client, 'support.error', this.errorMessage(error));
    }
  }

  private async chatContext(user: AuthUserContext, threadId: string): Promise<ChatThreadContext> {
    return this.realtime.context(user, threadId);
  }

  private async joinChatRooms(client: Socket, context: ChatThreadContext): Promise<void> {
    await client.join(`chat:${context.threadId}`);
    if (context.orderId) await client.join(`order:${context.orderId}`);
    if (context.providerOrderId) await client.join(`provider-order:${context.providerOrderId}`);
  }

  private chatMessageDto(payload: ChatMessagePayload): { clientMessageId?: string; messageType: ChatMessageType; body?: string; attachmentUrls?: string[] } {
    if (!payload.messageType) throw new Error('messageType is required');
    return { clientMessageId: payload.clientMessageId, messageType: payload.messageType, body: payload.body, attachmentUrls: payload.attachmentUrls ?? [] };
  }

  private supportMessageDto(payload: SupportMessagePayload): { clientMessageId?: string; messageType: ChatMessageType; body?: string; attachmentUrls: string[] } {
    if (!payload.messageType) throw new Error('messageType is required');
    return { clientMessageId: payload.clientMessageId, messageType: payload.messageType, body: payload.body, attachmentUrls: payload.attachmentUrls ?? [] };
  }

  private requireUser(client: Socket): AuthUserContext {
    const user = this.connectedUsers.get(client);
    if (!user) throw new Error('Socket is not authenticated');
    return user;
  }

  private room(roomName: string) {
    return this.server.to(roomName);
  }

  private emitError(client: Socket, event: 'chat.error' | 'support.error', message: string): void {
    client.emit(event, { message });
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Socket request failed';
  }

  private extractToken(client: Socket): string {
    const authToken: unknown = client.handshake.auth.token;
    if (typeof authToken === 'string' && authToken) return authToken.replace(/^Bearer\s+/i, '');
    const header = client.handshake.headers.authorization;
    if (typeof header === 'string' && header) return header.replace(/^Bearer\s+/i, '');
    throw new Error('Missing socket token');
  }
}
