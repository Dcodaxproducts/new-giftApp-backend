import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
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
import { ChatsService } from './chats.service';

interface JoinPayload { conversationId: string }
interface MessagePayload { conversationId: string; content?: string; attachmentUrl?: string }
interface TypingPayload { conversationId: string }

@WebSocketGateway({ namespace: '/chat', cors: { origin: true, credentials: true } })
export class ChatsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;

  private readonly logger = new Logger(ChatsGateway.name);
  private readonly connectedUsers = new WeakMap<Socket, AuthUserContext>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly chats: ChatsService,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    try {
      const token = this.extractToken(client);
      const payload = await this.jwtService.verifyAsync<AuthUserContext>(token, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET', 'change-me-access'),
      });
      this.connectedUsers.set(client, payload);
      await client.join(`user:${payload.uid}`);
    } catch {
      this.logger.warn('Rejected unauthenticated chat socket');
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket): void {
    this.connectedUsers.delete(client);
  }

  @SubscribeMessage('chat.join')
  async joinChat(@ConnectedSocket() client: Socket, @MessageBody() payload: JoinPayload): Promise<void> {
    try {
      const user = this.requireUser(client);
      await this.chats.getConversation(user, payload.conversationId);
      await client.join(`conversation:${payload.conversationId}`);
      client.emit('chat.joined', { conversationId: payload.conversationId });
    } catch (error) {
      client.emit('chat.error', { message: error instanceof Error ? error.message : 'Failed to join' });
    }
  }

  @SubscribeMessage('chat.leave')
  async leaveChat(@ConnectedSocket() client: Socket, @MessageBody() payload: JoinPayload): Promise<void> {
    await client.leave(`conversation:${payload.conversationId}`);
  }

  @SubscribeMessage('chat.message.send')
  async sendMessage(@ConnectedSocket() client: Socket, @MessageBody() payload: MessagePayload): Promise<void> {
    try {
      const user = this.requireUser(client);
      const result = await this.chats.sendMessage(user, payload.conversationId, {
        content: payload.content,
        attachmentUrl: payload.attachmentUrl,
      });
      this.server.to(`conversation:${payload.conversationId}`).emit('chat.message.created', {
        conversationId: payload.conversationId,
        message: result.data,
      });
    } catch (error) {
      client.emit('chat.error', { message: error instanceof Error ? error.message : 'Failed to send message' });
    }
  }

  @SubscribeMessage('chat.message.read')
  async readMessages(@ConnectedSocket() client: Socket, @MessageBody() payload: JoinPayload): Promise<void> {
    try {
      const user = this.requireUser(client);
      await this.chats.markAsRead(user, payload.conversationId);
      this.server.to(`conversation:${payload.conversationId}`).emit('chat.message.read', {
        conversationId: payload.conversationId,
        readByUserId: user.uid,
      });
    } catch (error) {
      client.emit('chat.error', { message: error instanceof Error ? error.message : 'Failed to mark read' });
    }
  }

  @SubscribeMessage('chat.typing.start')
  handleTypingStart(@ConnectedSocket() client: Socket, @MessageBody() payload: TypingPayload): void {
    const user = this.connectedUsers.get(client);
    if (user) client.to(`conversation:${payload.conversationId}`).emit('chat.typing.started', { conversationId: payload.conversationId, userId: user.uid });
  }

  @SubscribeMessage('chat.typing.stop')
  handleTypingStop(@ConnectedSocket() client: Socket, @MessageBody() payload: TypingPayload): void {
    const user = this.connectedUsers.get(client);
    if (user) client.to(`conversation:${payload.conversationId}`).emit('chat.typing.stopped', { conversationId: payload.conversationId, userId: user.uid });
  }

  private requireUser(client: Socket): AuthUserContext {
    const user = this.connectedUsers.get(client);
    if (!user) throw new Error('Socket is not authenticated');
    return user;
  }

  private extractToken(client: Socket): string {
    const authToken: unknown = client.handshake.auth.token;
    if (typeof authToken === 'string' && authToken) return authToken.replace(/^Bearer\s+/i, '');
    const header = client.handshake.headers.authorization;
    if (typeof header === 'string' && header) return header.replace(/^Bearer\s+/i, '');
    throw new Error('Missing socket token');
  }
}
