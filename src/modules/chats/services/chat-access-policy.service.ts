import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ChatThreadStatus, ChatThreadType, Prisma, UserRole } from '@prisma/client';
import { AuthUserContext } from '../../../common/decorators/current-user.decorator';
import { ChatOrderSourceRepository } from '../repositories/chat-order-source.repository';
import { CHAT_THREAD_INCLUDE, ChatThreadRepository } from '../repositories/chat-thread.repository';

type Thread = Prisma.ChatThreadGetPayload<{ include: typeof CHAT_THREAD_INCLUDE }>;

@Injectable()
export class ChatAccessPolicyService {
  constructor(private readonly threads: ChatThreadRepository, private readonly orderSources: ChatOrderSourceRepository) {}

  async getAllowedThread(user: AuthUserContext, threadId: string): Promise<Thread> {
    const thread = await this.threads.findById(threadId);
    if (!thread) throw new NotFoundException('Chat thread not found');
    this.assertCanAccess(user, thread);
    return thread;
  }

  assertCanAccess(user: AuthUserContext, thread: Thread): void {
    if (thread.status === ChatThreadStatus.BLOCKED_BY_MODERATION) throw new ForbiddenException('Chat thread is blocked by moderation');
    if (thread.threadType === ChatThreadType.ORDER_CHAT) {
      if (user.role === UserRole.REGISTERED_USER && thread.customerId === user.uid) return;
      if (user.role === UserRole.PROVIDER && thread.providerId === user.uid) return;
      if (this.isAdmin(user) && this.hasAny(user, ['chats.read.all', 'messageModeration.read'])) return;
      throw new ForbiddenException('You cannot access this chat thread');
    }
    if (thread.threadType === ChatThreadType.SUPPORT_CHAT) {
      if ((user.role === UserRole.REGISTERED_USER || user.role === UserRole.PROVIDER) && thread.participants.some((participant) => participant.userId === user.uid && !participant.leftAt)) return;
      if (user.role === UserRole.SUPER_ADMIN) return;
      if (user.role === UserRole.STAFF && this.has(user, 'supportChats.read.all')) return;
      if (user.role === UserRole.STAFF && this.has(user, 'supportChats.read') && thread.assignedAdminId === user.uid) return;
      throw new ForbiddenException('You cannot access this support chat');
    }
    if (this.isAdmin(user) && this.hasAny(user, ['messageModeration.read', 'messageModeration.escalate'])) return;
    throw new ForbiddenException('You cannot access this chat thread');
  }

  assertCanReply(user: AuthUserContext, thread: Thread): void {
    this.assertCanAccess(user, thread);
    if (thread.threadType === ChatThreadType.SUPPORT_CHAT && this.isAdmin(user) && !this.has(user, 'supportChats.reply')) {
      throw new ForbiddenException('Your role does not have the required permission');
    }
  }

  assertCanResolve(user: AuthUserContext, thread: Thread): void {
    this.assertCanAccess(user, thread);
    if (user.role === UserRole.SUPER_ADMIN) return;
    if (user.role === UserRole.STAFF && this.has(user, 'supportChats.resolve')) return;
    throw new ForbiddenException('Your role does not have the required permission');
  }

  async assertOrderSource(user: AuthUserContext, sourceId: string, sourceType: 'CUSTOMER_ORDER' | 'PROVIDER_ORDER') {
    if (user.role === UserRole.REGISTERED_USER && sourceType === 'CUSTOMER_ORDER') {
      const order = await this.orderSources.findCustomerOrderSource(user.uid, sourceId);
      if (!order) throw new NotFoundException('Order not found');
      const providerOrder = order.providerOrders[0];
      if (!providerOrder) throw new NotFoundException('Provider order not found');
      return { orderId: order.id, providerOrderId: providerOrder.id, providerId: providerOrder.providerId, customerId: user.uid };
    }
    if (user.role === UserRole.PROVIDER && sourceType === 'PROVIDER_ORDER') {
      const providerOrder = await this.orderSources.findProviderOrderSource(user.uid, sourceId);
      if (!providerOrder) throw new NotFoundException('Provider order not found');
      return { orderId: providerOrder.orderId, providerOrderId: providerOrder.id, providerId: user.uid, customerId: providerOrder.order.userId };
    }
    throw new ForbiddenException('Your role cannot create this order chat');
  }

  has(user: AuthUserContext, permission: string): boolean {
    if (user.role === UserRole.SUPER_ADMIN) return true;
    if (!user.permissions || typeof user.permissions !== 'object' || Array.isArray(user.permissions)) return false;
    const separator = permission.indexOf('.');
    const module = permission.slice(0, separator);
    const key = permission.slice(separator + 1);
    const values = (user.permissions as Record<string, unknown>)[module];
    return Array.isArray(values) && values.includes(key);
  }

  hasAny(user: AuthUserContext, permissions: string[]): boolean {
    return permissions.some((permission) => this.has(user, permission));
  }

  isAdmin(user: AuthUserContext): boolean {
    return user.role === UserRole.SUPER_ADMIN || user.role === UserRole.STAFF;
  }
}
