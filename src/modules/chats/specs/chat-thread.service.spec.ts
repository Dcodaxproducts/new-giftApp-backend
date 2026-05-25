/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { ChatThreadStatus, ChatThreadType, UserRole } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';
import { ChatSourceKind, ChatStatus, ChatThreadKind } from '../dto/chats.dto';
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

function createService(overrides: { thread?: Record<string, unknown>; canResolve?: boolean } = {}) {
  const currentThread = overrides.thread ?? thread();
  const threads = {
    findSupportParticipantById: jest.fn().mockResolvedValue({ id: 'provider_1', role: UserRole.PROVIDER }),
    createSupportThread: jest.fn().mockResolvedValue(thread()),
    update: jest.fn().mockImplementation((_id, data) => Promise.resolve({ ...currentThread, ...data })),
  };
  const access = {
    isAdmin: jest.fn().mockReturnValue(true),
    has: jest.fn().mockReturnValue(true),
    hasAny: jest.fn().mockReturnValue(true),
    getAllowedThread: jest.fn().mockResolvedValue(currentThread),
    assertCanResolve: jest.fn().mockImplementation(() => { if (overrides.canResolve === false) throw new ForbiddenException('Your role does not have the required permission'); }),
  };
  const messages = { unreadCount: jest.fn().mockResolvedValue(0), send: jest.fn() };
  const auditLogs = { create: jest.fn().mockResolvedValue({ id: 'audit_1' }) };
  const notifications = { notifyThreadStatus: jest.fn().mockResolvedValue(undefined) };
  const service = new ChatThreadService(
    threads as never,
    access as never,
    messages as never,
    {} as never,
    { assertCompleted: jest.fn().mockResolvedValue(undefined) } as never,
    auditLogs as never,
    notifications as never,
  );
  return { service, threads, access, auditLogs, notifications };
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

  it('resolve via status works and notifies participants', async () => {
    const { service, threads, notifications } = createService();
    const result = await service.updateStatus({ uid: 'admin_1', role: UserRole.ADMIN, permissions: { supportChats: ['resolve'] } }, 'thread_1', { status: ChatStatus.RESOLVED, reason: 'ISSUE_RESOLVED', comment: 'Support issue resolved.', notifyParticipants: true });
    expect(result).toEqual(expect.objectContaining({ data: expect.objectContaining({ id: 'thread_1', status: ChatThreadStatus.RESOLVED }), message: 'Chat thread resolved successfully.' }));
    expect(threads.update).toHaveBeenCalledWith('thread_1', expect.objectContaining({ status: ChatThreadStatus.RESOLVED, resolvedBy: { connect: { id: 'admin_1' } } }));
    expect(notifications.notifyThreadStatus).toHaveBeenCalledWith(expect.objectContaining({ threadId: 'thread_1', status: ChatStatus.RESOLVED, actorId: 'admin_1', comment: 'Support issue resolved.' }));
  });

  it('reopen via status works', async () => {
    const { service, threads } = createService({ thread: { ...thread(), status: ChatThreadStatus.RESOLVED } });
    const result = await service.updateStatus({ uid: 'admin_1', role: UserRole.ADMIN, permissions: { supportChats: ['resolve'] } }, 'thread_1', { status: ChatStatus.REOPENED, reason: 'CUSTOMER_REPLIED', notifyParticipants: false });
    expect(result).toEqual(expect.objectContaining({ data: expect.objectContaining({ id: 'thread_1', status: ChatThreadStatus.REOPENED }), message: 'Chat thread reopened successfully.' }));
    expect(threads.update).toHaveBeenCalledWith('thread_1', expect.objectContaining({ status: ChatThreadStatus.REOPENED, resolvedAt: null, resolvedBy: { disconnect: true } }));
  });

  it('permission enforced for support thread resolution statuses', async () => {
    const { service } = createService({ canResolve: false });
    await expect(service.updateStatus({ uid: 'admin_1', role: UserRole.ADMIN, permissions: { supportChats: ['read'] } }, 'thread_1', { status: ChatStatus.RESOLVED })).rejects.toThrow(ForbiddenException);
  });

  it('old resolve and reopen routes are removed from Swagger', () => {
    const controller = readFileSync(join(__dirname, '../controllers/chats.controller.ts'), 'utf8');
    const openapi = JSON.parse(readFileSync(join(__dirname, '../../../../docs/generated/openapi.json'), 'utf8')) as { paths: Record<string, unknown> };
    expect(controller).toContain("@Patch('threads/:threadId/status')");
    expect(controller).not.toContain("@Post('threads/:threadId/resolve')");
    expect(controller).not.toContain("@Post('threads/:threadId/reopen')");
    expect(openapi.paths['/api/v1/chats/threads/{threadId}/status']).toBeDefined();
    expect(openapi.paths['/api/v1/chats/threads/{threadId}/resolve']).toBeUndefined();
    expect(openapi.paths['/api/v1/chats/threads/{threadId}/reopen']).toBeUndefined();
  });
});
