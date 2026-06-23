import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthUserContext } from '../../common/decorators/current-user.decorator';

@WebSocketGateway({ namespace: '/notifications', cors: { origin: true, credentials: true } })
export class NotificationsGateway implements OnGatewayConnection {
  @WebSocketServer()
  server!: Server;
  private readonly logger = new Logger(NotificationsGateway.name);
  private readonly connectedUsers = new WeakMap<Socket, AuthUserContext>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    try {
      const token = this.extractToken(client);
      const payload = await this.jwtService.verifyAsync<AuthUserContext>(token, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET', 'change-me-access'),
      });
      this.connectedUsers.set(client, payload);
      await client.join(`user:${payload.uid}`);
      await client.join(`role:${payload.role}`);
    } catch {
      this.logger.warn('Rejected unauthenticated notification socket');
      client.disconnect(true);
    }
  }

  @SubscribeMessage('notification.read')
  handleNotificationRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { notificationId?: string },
  ): void {
    const user = this.connectedUsers.get(client);
    if (user && body.notificationId) {
      this.server.to(`user:${user.uid}`).emit('notification.read', body);
    }
  }

  emitEvent(event: string, payload: unknown): void {
    this.server.emit(event, payload);
  }

  emitToUser(userId: string, event: string, payload: unknown): void {
    this.server.to(`user:${userId}`).emit(event, payload);
  }

  private extractToken(client: Socket): string {
    const authToken: unknown = client.handshake.auth.token;
    if (typeof authToken === 'string' && authToken) {
      return authToken.replace(/^Bearer\s+/i, '');
    }
    const header = client.handshake.headers.authorization;
    if (typeof header === 'string' && header) {
      return header.replace(/^Bearer\s+/i, '');
    }
    throw new Error('Missing socket token');
  }
}
