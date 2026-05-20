import { BadRequestException } from '@nestjs/common';
import { ChatThreadStatus, ChatThreadType, UserRole } from '@prisma/client';
import { ChatSourceKind, ChatThreadKind } from '../dto/chats.dto';
import { ChatThreadService } from '../services/chat-thread.service';

const now = new Date();

function thread(participantRole: UserRole = UserRole.PROVIDER) {
  return {
    id: 'thread_1',
    threadType: ChatThreadType.SUPPORT_CHAT,
    sourceType: 'SUPPORT',
    sourceId: 'thread_1',
    status: ChatThreadStatus.OPEN,
    subject: 'Order support',
    orderId: null,
    providerOrderId: null,
    providerId: participantRole === UserRole.PROVIDER ? 'provider_1' : null,
    customerId: participantRole === UserRole.REGISTERED_USER ? 'user_1' : null,
    assignedAdminId: 'admin_1',
    lastMessageAt: null,
    createdAt: now,
    updatedAt: now,
    order: null,
    providerOrder: null,
    provider: null,
    customer: null,
    assignedAdmin: null,
    lastMessage: null,
    participants: [
      {
        role: participantRole,
        leftAt: null,
        userId: participantRole === UserRole.PROVIDER ? 'provider_1' : 'user_1',
        user: {
          id: participantRole === UserRole.PROVIDER ? 'provider_1' : 'user_1',
          role: participantRole,
          firstName: 'Participant',
          lastName: 'One',
          avatarUrl: null,
          providerBusinessName: participantRole === UserRole.PROVIDER ? 'Provider Shop' : null,
          isActive: true,
        },
      },
    ],
  };
}

function createService() {
  const threads = {
    findSupportParticipantById: jest.fn().mockResolvedValue({ id: 'provider_1', role: UserRole.PROVIDER }),
    createSupportThread: jest.fn().mockResolvedValue(thread()),
  };
  const access = {
    isAdmin: jest.fn().mockReturnValue(true),
    has: jest.fn().mockReturnValue(true),
  };
  const messages = { unreadCount: jest.fn().mockResolvedValue(0), send: jest.fn() };
  const service = new ChatThreadService(
    threads as never,
    access as never,
    messages as never,
    {} as never,
    { assertCompleted: jest.fn().mockResolvedValue(undefined) } as never,
    {} as never,
  );
  return { service, threads };
}

describe('ChatThreadService', () => {
  it('derives admin support chat participantRole from participantId', async () => {
    const { service, threads } = createService();

    await service.createOrGetThread(
      { uid: 'admin_1', role: UserRole.ADMIN, permissions: { supportChats: ['reply'] } },
      { threadType: ChatThreadKind.SUPPORT_CHAT, sourceType: ChatSourceKind.SUPPORT, participantId: 'provider_1', subject: 'Order support' },
    );

    expect(threads.findSupportParticipantById).toHaveBeenCalledWith('provider_1');
    expect(threads.createSupportThread).toHaveBeenCalledWith(expect.objectContaining({ participantId: 'provider_1', participantRole: UserRole.PROVIDER, assignedAdminId: 'admin_1' }));
  });

  it('rejects participantRole when it conflicts with participantId', async () => {
    const { service } = createService();

    await expect(service.createOrGetThread(
      { uid: 'admin_1', role: UserRole.ADMIN, permissions: { supportChats: ['reply'] } },
      { threadType: ChatThreadKind.SUPPORT_CHAT, sourceType: ChatSourceKind.SUPPORT, participantId: 'provider_1', participantRole: UserRole.REGISTERED_USER },
    )).rejects.toThrow(BadRequestException);
  });
});
