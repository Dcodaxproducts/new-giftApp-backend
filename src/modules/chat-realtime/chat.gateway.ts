import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ChatMessageType, NotificationRecipientType, SupportChatParticipantType, UserRole } from '@prisma/client';
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
import { AuthUserContext } from '../../common/decorators/current-user.decorator';
import { CustomerProviderInteractionsService } from '../customer-provider-interactions/services/customer-provider-interactions.service';
import { ProviderInteractionsService } from '../provider-interactions/services/provider-interactions.service';
import { SupportChatService } from '../support-chat/services/support-chat.service';
import { NotificationDispatchService } from '../broadcast-notifications/services/notification-dispatch.service';
import { ChatPresenceService } from './chat-presence.service';
import { MessagingPolicyService } from '../messaging-settings/services/messaging-policy.service';

interface ThreadPayload { threadId?: string }
interface SupportPayload { supportChatId?: string }
interface TypingPayload extends ThreadPayload { orderId?: string; providerOrderId?: string }
type SupportTypingPayload = SupportPayload;
interface ChatMessagePayload extends ThreadPayload { clientMessageId?: string; messageType?: ChatMessageType; body?: string; attachmentUrls?: string[] }
interface SupportMessagePayload extends SupportPayload { clientMessageId?: string; messageType?: ChatMessageType; body?: string; attachmentUrls?: string[] }
interface ResolvePayload extends SupportPayload { comment?: string; notifyParticipant?: boolean }
interface ChatThreadContext { threadId: string; orderId: string; providerOrderId: string; customerId?: string; providerId?: string }
interface SupportThreadContext { supportChatId: string; participantId?: string; participantType?: SupportChatParticipantType; assignedAdminId?: string | null }

@WebSocketGateway({ namespace: '/chat', cors: { origin: true, credentials: true } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private readonly connectedUsers = new WeakMap<Socket, AuthUserContext>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly customerProviderInteractions: CustomerProviderInteractionsService,
    private readonly providerInteractions: ProviderInteractionsService,
    private readonly supportChats: SupportChatService,
    private readonly presence: ChatPresenceService,
    private readonly notificationDispatch: NotificationDispatchService,
    private readonly messagingPolicy: MessagingPolicyService,
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
      const result = user.role === UserRole.REGISTERED_USER
        ? await this.customerProviderInteractions.sendMessage(user, context.threadId, dto)
        : await this.providerInteractions.sendMessage(user, context.threadId, dto);
      const eventPayload = { threadId: context.threadId, message: result.data };
      this.room(`chat:${context.threadId}`).emit('chat.message.created', eventPayload);
      this.room(`chat:${context.threadId}`).emit('chat.message.delivered', { threadId: context.threadId, messageId: result.data.id, clientMessageId: payload.clientMessageId ?? result.data.clientMessageId ?? null, deliveredAt: new Date() });
      this.room(`order:${context.orderId}`).emit('chat.thread.updated', { threadId: context.threadId, orderId: context.orderId });
      this.room(`provider-order:${context.providerOrderId}`).emit('chat.thread.updated', { threadId: context.threadId, providerOrderId: context.providerOrderId });
      await this.notifyOfflineChatRecipient(user, context, result.data.body ?? 'New chat message');
    });
  }

  @SubscribeMessage('chat.message.read')
  async readChatMessage(@ConnectedSocket() client: Socket, @MessageBody() payload: ThreadPayload): Promise<void> {
    await this.withChatContext(client, payload, 'chat.error', async (user, context) => {
      const result = user.role === UserRole.REGISTERED_USER
        ? await this.customerProviderInteractions.markRead(user, context.threadId)
        : await this.providerInteractions.markRead(user, context.threadId);
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
      const result = await this.supportChats.reply(user, context.supportChatId, this.supportMessageDto(payload));
      this.room(`support-chat:${context.supportChatId}`).emit('support.message.created', { supportChatId: context.supportChatId, message: result.data });
      this.room(`support-chat:${context.supportChatId}`).emit('support.message.delivered', { supportChatId: context.supportChatId, messageId: result.data.id, clientMessageId: payload.clientMessageId ?? result.data.clientMessageId ?? null, deliveredAt: new Date() });
      this.room(`support-chat:${context.supportChatId}`).emit('support.thread.updated', { supportChatId: context.supportChatId });
      await this.notifyOfflineSupportParticipant(context, result.data.body ?? 'New support message');
    });
  }

  @SubscribeMessage('support.message.read')
  async readSupportMessage(@ConnectedSocket() client: Socket, @MessageBody() payload: SupportPayload): Promise<void> {
    await this.withSupportContext(client, payload, async (user, context) => {
      const result = await this.supportChats.markRead(user, context.supportChatId);
      this.room(`support-chat:${context.supportChatId}`).emit('support.message.read', { supportChatId: context.supportChatId, readByUserId: user.uid, role: user.role, data: result.data });
    });
  }

  @SubscribeMessage('support.resolved')
  async resolveSupport(@ConnectedSocket() client: Socket, @MessageBody() payload: ResolvePayload): Promise<void> {
    await this.withSupportContext(client, payload, async (user, context) => {
      const result = await this.supportChats.resolve(user, context.supportChatId, { comment: payload.comment, notifyParticipant: payload.notifyParticipant });
      this.room(`support-chat:${context.supportChatId}`).emit('support.status.updated', { supportChatId: context.supportChatId, status: result.data.status, data: result.data });
      this.room(`support-chat:${context.supportChatId}`).emit('support.thread.updated', { supportChatId: context.supportChatId });
    });
  }

  @SubscribeMessage('support.reopened')
  async reopenSupport(@ConnectedSocket() client: Socket, @MessageBody() payload: ResolvePayload): Promise<void> {
    await this.withSupportContext(client, payload, async (user, context) => {
      const result = await this.supportChats.reopen(user, context.supportChatId, { comment: payload.comment, notifyParticipant: payload.notifyParticipant });
      this.room(`support-chat:${context.supportChatId}`).emit('support.status.updated', { supportChatId: context.supportChatId, status: result.data.status, data: result.data });
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
      const context = await this.supportChats.getSocketThreadContext(user, payload.supportChatId);
      await handler(user, context);
    } catch (error) {
      this.emitError(client, 'support.error', this.errorMessage(error));
    }
  }

  private async chatContext(user: AuthUserContext, threadId: string): Promise<ChatThreadContext> {
    if (user.role === UserRole.REGISTERED_USER) return this.customerProviderInteractions.getSocketThreadContext(user, threadId);
    if (user.role === UserRole.PROVIDER) return this.providerInteractions.getSocketThreadContext(user, threadId);
    throw new Error('Only customers and providers can use chat events');
  }

  private async joinChatRooms(client: Socket, context: ChatThreadContext): Promise<void> {
    await client.join(`chat:${context.threadId}`);
    await client.join(`order:${context.orderId}`);
    await client.join(`provider-order:${context.providerOrderId}`);
  }

  private chatMessageDto(payload: ChatMessagePayload): { clientMessageId?: string; messageType: ChatMessageType; body?: string; attachmentUrls?: string[] } {
    if (!payload.messageType) throw new Error('messageType is required');
    return { clientMessageId: payload.clientMessageId, messageType: payload.messageType, body: payload.body, attachmentUrls: payload.attachmentUrls ?? [] };
  }

  private supportMessageDto(payload: SupportMessagePayload): { clientMessageId?: string; messageType: ChatMessageType; body?: string; attachmentUrls: string[] } {
    if (!payload.messageType) throw new Error('messageType is required');
    return { clientMessageId: payload.clientMessageId, messageType: payload.messageType, body: payload.body, attachmentUrls: payload.attachmentUrls ?? [] };
  }

  private async notifyOfflineChatRecipient(sender: AuthUserContext, context: ChatThreadContext, message: string): Promise<void> {
    const recipientId = sender.role === UserRole.REGISTERED_USER ? context.providerId : context.customerId;
    const recipientType = sender.role === UserRole.REGISTERED_USER ? NotificationRecipientType.PROVIDER : NotificationRecipientType.REGISTERED_USER;
    if (!recipientId || this.presence.isOnline(recipientId)) return;
    const delaySeconds = await this.messagingPolicy.offlineNotificationDelaySeconds();
    await this.notificationDispatch.createAndEmit({ recipientId, recipientType, title: 'New chat message', message, type: 'CHAT_MESSAGE', metadataJson: { threadId: context.threadId, orderId: context.orderId, providerOrderId: context.providerOrderId, offlineNotificationDelaySeconds: delaySeconds } });
  }

  private async notifyOfflineSupportParticipant(context: SupportThreadContext, message: string): Promise<void> {
    if (!context.participantId || !context.participantType || this.presence.isOnline(context.participantId)) return;
    const delaySeconds = await this.messagingPolicy.offlineNotificationDelaySeconds();
    await this.notificationDispatch.createAndEmit({ recipientId: context.participantId, recipientType: context.participantType === SupportChatParticipantType.PROVIDER ? NotificationRecipientType.PROVIDER : NotificationRecipientType.REGISTERED_USER, title: 'New support message', message, type: 'SUPPORT_CHAT', metadataJson: { supportChatId: context.supportChatId, offlineNotificationDelaySeconds: delaySeconds } });
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
