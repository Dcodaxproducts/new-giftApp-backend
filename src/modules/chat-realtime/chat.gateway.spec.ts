import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ChatMessageType, UserRole } from '@prisma/client';
import { Server, Socket } from 'socket.io';
import { AuthUserContext } from '../../common/decorators/current-user.decorator';
import { CustomerProviderInteractionsService } from '../customer-provider-interactions/services/customer-provider-interactions.service';
import { ProviderInteractionsService } from '../provider-interactions/services/provider-interactions.service';
import { SupportChatService } from '../support-chat/services/support-chat.service';
import { ChatGateway } from './chat.gateway';

type EmittedEvent = { event: string; payload: unknown };
type RoomEvent = { room: string; event: string; payload: unknown };
type MockSocketBundle = {
  socket: Socket;
  join: jest.Mock;
  leave: jest.Mock;
  emit: jest.Mock;
  to: jest.Mock;
  roomEmit: jest.Mock;
  disconnect: jest.Mock;
};

type CustomerChatMock = Pick<CustomerProviderInteractionsService, 'getSocketThreadContext' | 'sendMessage' | 'markRead'>;
type ProviderChatMock = Pick<ProviderInteractionsService, 'getSocketThreadContext' | 'sendMessage' | 'markRead'>;
type SupportChatMock = Pick<SupportChatService, 'getSocketThreadContext' | 'reply' | 'markRead' | 'resolve' | 'reopen'>;

const customerUser: AuthUserContext = { uid: 'customer_1', role: UserRole.REGISTERED_USER };
const otherCustomer: AuthUserContext = { uid: 'customer_2', role: UserRole.REGISTERED_USER };
const providerUser: AuthUserContext = { uid: 'provider_1', role: UserRole.PROVIDER };
const adminUser: AuthUserContext = { uid: 'admin_1', role: UserRole.ADMIN, permissions: { supportChats: ['read', 'reply', 'resolve'] } };
const context = { threadId: 'thread_1', orderId: 'order_1', providerOrderId: 'provider_order_1' };

function createGateway(user?: AuthUserContext) {
  const verifyAsync = jest.fn();
  if (user) verifyAsync.mockResolvedValue(user);
  else verifyAsync.mockRejectedValue(new Error('invalid token'));

  const customer: CustomerChatMock = {
    getSocketThreadContext: jest.fn().mockResolvedValue(context),
    sendMessage: jest.fn().mockResolvedValue({ data: { id: 'message_1', body: 'Can you confirm delivery time?' } }),
    markRead: jest.fn().mockResolvedValue({ data: { threadId: 'thread_1', isRead: true } }),
  };
  const provider: ProviderChatMock = {
    getSocketThreadContext: jest.fn().mockResolvedValue(context),
    sendMessage: jest.fn().mockResolvedValue({ data: { id: 'message_2', body: 'Your order is ready.' } }),
    markRead: jest.fn().mockResolvedValue({ data: { threadId: 'thread_1', isRead: true } }),
  };
  const support: SupportChatMock = {
    getSocketThreadContext: jest.fn().mockResolvedValue({ supportChatId: 'support_1' }),
    reply: jest.fn().mockResolvedValue({ data: { id: 'support_message_1', body: 'Checking this now.' } }),
    markRead: jest.fn().mockResolvedValue({ data: { id: 'support_1', unreadCount: 0 } }),
    resolve: jest.fn().mockResolvedValue({ data: { id: 'support_1', status: 'RESOLVED' } }),
    reopen: jest.fn().mockResolvedValue({ data: { id: 'support_1', status: 'ACTIVE' } }),
  };

  const gateway = new ChatGateway(
    { verifyAsync } as unknown as JwtService,
    { get: jest.fn().mockReturnValue('secret') } as unknown as ConfigService,
    customer as unknown as CustomerProviderInteractionsService,
    provider as unknown as ProviderInteractionsService,
    support as unknown as SupportChatService,
  );
  const serverRoomEmit = jest.fn();
  const serverTo = jest.fn().mockImplementation((room: string) => ({
    emit: (event: string, payload: unknown): void => {
      serverRoomEmit({ room, event, payload });
    },
  }));
  gateway.server = { to: serverTo } as unknown as Server;
  return { gateway, verifyAsync, customer, provider, support, serverTo, serverRoomEmit };
}

function createSocket(): MockSocketBundle {
  const emitted: EmittedEvent[] = [];
  const roomEvents: RoomEvent[] = [];
  const join = jest.fn().mockResolvedValue(undefined);
  const leave = jest.fn().mockResolvedValue(undefined);
  const emit = jest.fn().mockImplementation((event: string, payload: unknown) => emitted.push({ event, payload }));
  const roomEmit = jest.fn().mockImplementation((roomEvent: RoomEvent) => roomEvents.push(roomEvent));
  const to = jest.fn().mockImplementation((room: string) => ({
    emit: (event: string, payload: unknown): void => {
      roomEmit({ room, event, payload });
    },
  }));
  const disconnect = jest.fn();
  const socket = {
    handshake: { auth: { token: 'Bearer access_token' }, headers: {} },
    join,
    leave,
    emit,
    to,
    disconnect,
  } as unknown as Socket;
  return { socket, join, leave, emit, to, roomEmit, disconnect };
}

describe('ChatGateway', () => {
  it('rejects unauthenticated sockets', async () => {
    const { gateway } = createGateway();
    const client = createSocket();

    await gateway.handleConnection(client.socket);

    expect(client.disconnect).toHaveBeenCalledWith(true);
  });

  it('lets a customer join only an owned customer-provider chat thread', async () => {
    const { gateway, customer } = createGateway(customerUser);
    const client = createSocket();
    await gateway.handleConnection(client.socket);

    await gateway.joinChat(client.socket, { threadId: 'thread_1' });

    expect(customer.getSocketThreadContext).toHaveBeenCalledWith(customerUser, 'thread_1');
    expect(client.join).toHaveBeenCalledWith('chat:thread_1');
    expect(client.join).toHaveBeenCalledWith('order:order_1');
    expect(client.join).toHaveBeenCalledWith('provider-order:provider_order_1');
    expect(client.emit).toHaveBeenCalledWith('chat.joined', context);
  });

  it('does not let a customer join another customer thread', async () => {
    const { gateway, customer } = createGateway(otherCustomer);
    jest.mocked(customer.getSocketThreadContext).mockRejectedValueOnce(new Error('Chat thread not found'));
    const client = createSocket();
    await gateway.handleConnection(client.socket);

    await gateway.joinChat(client.socket, { threadId: 'thread_1' });

    expect(client.emit).toHaveBeenCalledWith('chat.error', { message: 'Chat thread not found' });
    expect(client.join).not.toHaveBeenCalledWith('chat:thread_1');
  });

  it('lets a provider join only an owned provider buyer chat thread', async () => {
    const { gateway, provider } = createGateway(providerUser);
    const client = createSocket();
    await gateway.handleConnection(client.socket);

    await gateway.joinChat(client.socket, { threadId: 'thread_1' });

    expect(provider.getSocketThreadContext).toHaveBeenCalledWith(providerUser, 'thread_1');
    expect(client.join).toHaveBeenCalledWith('chat:thread_1');
  });

  it('does not let a provider join another provider thread', async () => {
    const { gateway, provider } = createGateway(providerUser);
    jest.mocked(provider.getSocketThreadContext).mockRejectedValueOnce(new Error('Chat thread not found'));
    const client = createSocket();
    await gateway.handleConnection(client.socket);

    await gateway.joinChat(client.socket, { threadId: 'thread_1' });

    expect(client.emit).toHaveBeenCalledWith('chat.error', { message: 'Chat thread not found' });
  });

  it('requires admin support chat read permission for support chat joins', async () => {
    const { gateway, support } = createGateway(adminUser);
    jest.mocked(support.getSocketThreadContext).mockRejectedValueOnce(new Error('Your role does not have the required permission'));
    const client = createSocket();
    await gateway.handleConnection(client.socket);

    await gateway.joinSupport(client.socket, { supportChatId: 'support_1' });

    expect(client.emit).toHaveBeenCalledWith('support.error', { message: 'Your role does not have the required permission' });
    expect(client.join).not.toHaveBeenCalledWith('support-chat:support_1');
  });

  it('sends chat messages through the same service path as REST and emits to the thread room', async () => {
    const { gateway, customer, serverRoomEmit } = createGateway(customerUser);
    const client = createSocket();
    await gateway.handleConnection(client.socket);

    await gateway.sendChatMessage(client.socket, { threadId: 'thread_1', messageType: ChatMessageType.TEXT, body: 'Can you confirm delivery time?', attachmentUrls: [] });

    expect(customer.sendMessage).toHaveBeenCalledWith(customerUser, 'thread_1', { messageType: ChatMessageType.TEXT, body: 'Can you confirm delivery time?', attachmentUrls: [] });
    expect(serverRoomEmit).toHaveBeenCalledWith({ room: 'chat:thread_1', event: 'chat.message.created', payload: { threadId: 'thread_1', message: { id: 'message_1', body: 'Can you confirm delivery time?' } } });
  });

  it('broadcasts typing events only after authorized room validation', async () => {
    const { gateway, customer } = createGateway(customerUser);
    const client = createSocket();
    await gateway.handleConnection(client.socket);

    await gateway.startTyping(client.socket, { threadId: 'thread_1' });

    expect(customer.getSocketThreadContext).toHaveBeenCalledWith(customerUser, 'thread_1');
    expect(client.roomEmit).toHaveBeenCalledWith({ room: 'chat:thread_1', event: 'chat.typing.started', payload: { threadId: 'thread_1', userId: 'customer_1', role: UserRole.REGISTERED_USER } });
  });

  it('does not broadcast typing events when room validation fails', async () => {
    const { gateway, customer } = createGateway(customerUser);
    jest.mocked(customer.getSocketThreadContext).mockRejectedValueOnce(new Error('Chat thread not found'));
    const client = createSocket();
    await gateway.handleConnection(client.socket);

    await gateway.startTyping(client.socket, { threadId: 'thread_1' });

    expect(client.roomEmit).not.toHaveBeenCalled();
    expect(client.emit).toHaveBeenCalledWith('chat.error', { message: 'Chat thread not found' });
  });

  it('updates read state through the REST service method and emits a read receipt', async () => {
    const { gateway, provider, serverRoomEmit } = createGateway(providerUser);
    const client = createSocket();
    await gateway.handleConnection(client.socket);

    await gateway.readChatMessage(client.socket, { threadId: 'thread_1' });

    expect(provider.markRead).toHaveBeenCalledWith(providerUser, 'thread_1');
    expect(serverRoomEmit).toHaveBeenCalledWith({ room: 'chat:thread_1', event: 'chat.message.read', payload: { threadId: 'thread_1', readByUserId: 'provider_1', role: UserRole.PROVIDER, data: { threadId: 'thread_1', isRead: true } } });
  });

  it('emits support message events through support chat service persistence', async () => {
    const { gateway, support, serverRoomEmit } = createGateway(adminUser);
    const client = createSocket();
    await gateway.handleConnection(client.socket);

    await gateway.sendSupportMessage(client.socket, { supportChatId: 'support_1', messageType: ChatMessageType.TEXT, body: 'Checking this now.', attachmentUrls: [] });

    expect(support.reply).toHaveBeenCalledWith(adminUser, 'support_1', { messageType: ChatMessageType.TEXT, body: 'Checking this now.', attachmentUrls: [] });
    expect(serverRoomEmit).toHaveBeenCalledWith({ room: 'support-chat:support_1', event: 'support.message.created', payload: { supportChatId: 'support_1', message: { id: 'support_message_1', body: 'Checking this now.' } } });
  });
});
