import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ChatMessageType, MessageVisibilityStatus, Prisma, UserRole } from '@prisma/client';
import { AuthUserContext } from '../../common/decorators/current-user.decorator';
import { CustomerProviderInteractionsService } from '../customer-provider-interactions/services/customer-provider-interactions.service';
import { ProviderInteractionsService } from '../provider-interactions/services/provider-interactions.service';
import { SupportChatStatusFilter } from '../support-chat/dto/support-chat.dto';
import { SupportChatService } from '../support-chat/services/support-chat.service';
import { ChatsRepository, UNIFIED_ORDER_THREAD_INCLUDE } from './chats.repository';
import { CreateChatThreadDto, ListChatsDto, ListThreadMessagesDto, SendUnifiedChatMessageDto, UnifiedChatSourceType, UnifiedChatStatus, UnifiedChatThreadType, UpdateChatThreadStatusDto } from './dto/chats.dto';

type Envelope<T> = { data: T; meta?: unknown; message: string };
type UnifiedOrderThread = Prisma.ChatThreadGetPayload<{ include: typeof UNIFIED_ORDER_THREAD_INCLUDE }>;

@Injectable()
export class ChatsService {
  constructor(
    private readonly customerChats: CustomerProviderInteractionsService,
    private readonly providerChats: ProviderInteractionsService,
    private readonly supportChats: SupportChatService,
    private readonly chatsRepository: ChatsRepository,
  ) {}

  async list(user: AuthUserContext, query: ListChatsDto): Promise<Envelope<unknown>> {
    if (this.isAdmin(user)) {
      if (query.threadType === UnifiedChatThreadType.ORDER_CHAT || query.sourceType === UnifiedChatSourceType.CUSTOMER_ORDER || query.sourceType === UnifiedChatSourceType.PROVIDER_ORDER) {
        this.assertAnyPermission(user, ['chats.read.all', 'messageModeration.read']);
        return this.adminOrderThreads(query);
      }
      this.assertPermission(user, 'supportChats.read');
      return this.supportChats.list(user, this.adminSupportListQuery(query));
    }

    if (query.threadType === UnifiedChatThreadType.SUPPORT_CHAT || query.sourceType === UnifiedChatSourceType.SUPPORT) {
      return this.supportChats.listForParticipant(user, this.supportListQuery(query));
    }

    if (user.role === UserRole.REGISTERED_USER) return this.customerChats.chats(user, query);
    if (user.role === UserRole.PROVIDER) return this.providerChats.chats(user, query);
    throw new ForbiddenException('Your role does not have access to chats');
  }

  quickReplies(user: AuthUserContext): Envelope<unknown> {
    if (user.role === UserRole.PROVIDER) return this.providerChats.quickReplies();
    if (user.role === UserRole.REGISTERED_USER) return this.customerChats.quickReplies();
    return {
      data: [
        { key: 'CHECKING_NOW', label: 'Checking now', message: 'I am checking this issue now.' },
        { key: 'THANKS_FOR_WAITING', label: 'Thanks for waiting', message: 'Thanks for waiting. I will update you shortly.' },
        { key: 'RESOLVED', label: 'Resolved', message: 'This issue has been resolved.' },
      ],
      message: 'Quick replies fetched successfully.',
    };
  }

  async createOrGetThread(user: AuthUserContext, dto: CreateChatThreadDto): Promise<Envelope<unknown>> {
    if (dto.threadType === UnifiedChatThreadType.ORDER_CHAT) return this.createOrGetOrderThread(user, dto);
    if (dto.threadType === UnifiedChatThreadType.SUPPORT_CHAT) return this.createOrGetSupportThread(user, dto);
    if (dto.threadType === UnifiedChatThreadType.MODERATION_REVIEW) {
      this.assertAnyPermission(user, ['messageModeration.read', 'messageModeration.escalate']);
      throw new BadRequestException('Moderation review threads are created by message moderation actions');
    }
    throw new BadRequestException('Unsupported chat thread type');
  }

  async threadDetails(user: AuthUserContext, threadId: string): Promise<Envelope<unknown>> {
    if (user.role === UserRole.REGISTERED_USER) return this.withSupportFallback(() => this.customerChats.chatDetails(user, threadId, {}), () => this.supportChats.participantDetails(user, threadId));
    if (user.role === UserRole.PROVIDER) return this.withSupportFallback(() => this.providerChats.chatDetails(user, threadId, {}), () => this.supportChats.participantDetails(user, threadId));
    return this.adminThreadDetails(user, threadId, {});
  }

  async messages(user: AuthUserContext, threadId: string, query: ListThreadMessagesDto): Promise<Envelope<unknown>> {
    if (user.role === UserRole.REGISTERED_USER) return this.withSupportFallback(() => this.customerChats.chatDetails(user, threadId, query), () => this.supportChats.participantDetails(user, threadId));
    if (user.role === UserRole.PROVIDER) return this.withSupportFallback(() => this.providerChats.chatDetails(user, threadId, query), () => this.supportChats.participantDetails(user, threadId));
    return this.adminThreadDetails(user, threadId, query);
  }

  async sendMessage(user: AuthUserContext, threadId: string, dto: SendUnifiedChatMessageDto): Promise<Envelope<unknown>> {
    if (user.role === UserRole.REGISTERED_USER) return this.withSupportFallback(() => this.customerChats.sendMessage(user, threadId, dto), () => this.supportChats.participantReply(user, threadId, this.supportMessageDto(dto)));
    if (user.role === UserRole.PROVIDER) return this.withSupportFallback(() => this.providerChats.sendMessage(user, threadId, dto), () => this.supportChats.participantReply(user, threadId, this.supportMessageDto(dto)));
    this.assertPermission(user, 'supportChats.reply');
    return this.supportChats.reply(user, threadId, this.supportMessageDto(dto));
  }

  async markRead(user: AuthUserContext, threadId: string): Promise<Envelope<unknown>> {
    if (user.role === UserRole.REGISTERED_USER) return this.withSupportFallback(() => this.customerChats.markRead(user, threadId), () => this.supportChats.markParticipantRead(user, threadId));
    if (user.role === UserRole.PROVIDER) return this.withSupportFallback(() => this.providerChats.markRead(user, threadId), () => this.supportChats.markParticipantRead(user, threadId));
    this.assertPermission(user, 'supportChats.read');
    return this.supportChats.markRead(user, threadId);
  }

  async updateStatus(user: AuthUserContext, threadId: string, dto: UpdateChatThreadStatusDto): Promise<Envelope<unknown>> {
    if (dto.status === UnifiedChatStatus.RESOLVED) return this.resolve(user, threadId, dto);
    if (dto.status === UnifiedChatStatus.ACTIVE || dto.status === UnifiedChatStatus.REOPENED) return this.reopen(user, threadId, dto);
    throw new BadRequestException('Only ACTIVE, REOPENED, and RESOLVED status updates are supported');
  }

  async resolve(user: AuthUserContext, threadId: string, dto: Pick<UpdateChatThreadStatusDto, 'comment' | 'notifyParticipant'>): Promise<Envelope<unknown>> {
    this.assertPermission(user, 'supportChats.resolve');
    return this.supportChats.resolve(user, threadId, dto);
  }

  async reopen(user: AuthUserContext, threadId: string, dto: Pick<UpdateChatThreadStatusDto, 'comment' | 'notifyParticipant'>): Promise<Envelope<unknown>> {
    this.assertPermission(user, 'supportChats.resolve');
    return this.supportChats.reopen(user, threadId, dto);
  }

  auditLog(user: AuthUserContext, threadId: string): Envelope<unknown> {
    this.assertPermission(user, 'supportChats.read');
    return { data: { threadId, events: [] }, message: 'Chat audit log fetched successfully.' };
  }

  private async createOrGetOrderThread(user: AuthUserContext, dto: CreateChatThreadDto): Promise<Envelope<unknown>> {
    if (!dto.sourceId) throw new BadRequestException('sourceId is required for order chats');
    if (user.role === UserRole.REGISTERED_USER && dto.sourceType === UnifiedChatSourceType.CUSTOMER_ORDER) {
      return dto.createIfMissing === false
        ? this.customerChats.getOrderChat(user, dto.sourceId, { createIfMissing: false })
        : this.customerChats.createOrderChat(user, dto.sourceId);
    }
    if (user.role === UserRole.PROVIDER && dto.sourceType === UnifiedChatSourceType.PROVIDER_ORDER) {
      return dto.createIfMissing === false
        ? this.providerChats.getOrderChat(user, dto.sourceId, { createIfMissing: false })
        : this.providerChats.createOrderChat(user, dto.sourceId);
    }
    throw new ForbiddenException('Your role cannot create this order chat');
  }

  private async createOrGetSupportThread(user: AuthUserContext, dto: CreateChatThreadDto): Promise<Envelope<unknown>> {
    if (this.isAdmin(user)) {
      this.assertPermission(user, 'supportChats.reply');
      if (!dto.participantId || !dto.participantRole) throw new BadRequestException('participantId and participantRole are required for admin support chats');
      return this.supportChats.createForParticipant({
        participantId: dto.participantId,
        participantRole: dto.participantRole,
        subject: dto.subject,
        initialMessage: dto.initialMessage,
        attachmentUrls: dto.attachmentUrls ?? [],
        adminUser: user,
      });
    }
    if (user.role === UserRole.REGISTERED_USER || user.role === UserRole.PROVIDER) {
      return this.supportChats.createForCurrentParticipant(user, {
        subject: dto.subject,
        initialMessage: dto.initialMessage,
        attachmentUrls: dto.attachmentUrls ?? [],
      });
    }
    throw new ForbiddenException('Your role cannot create support chats');
  }

  private supportListQuery(query: ListChatsDto) {
    return {
      page: query.page,
      limit: query.limit,
      search: query.search,
      unreadOnly: query.unreadOnly,
      assignedToAdminId: query.assignedToAdminId,
      sourceId: query.sourceId,
      status: query.status,
    };
  }

  private adminSupportListQuery(query: ListChatsDto) {
    return {
      page: query.page,
      limit: query.limit,
      search: query.search,
      unreadOnly: query.unreadOnly,
      status: query.status === UnifiedChatStatus.RESOLVED ? SupportChatStatusFilter.RESOLVED : query.status === UnifiedChatStatus.ACTIVE || query.status === UnifiedChatStatus.REOPENED ? SupportChatStatusFilter.ACTIVE : undefined,
    };
  }

  private supportMessageDto(dto: SendUnifiedChatMessageDto): { clientMessageId?: string; messageType: ChatMessageType; body?: string; attachmentUrls: string[] } {
    return { clientMessageId: dto.clientMessageId, messageType: dto.messageType, body: dto.body, attachmentUrls: dto.attachmentUrls ?? [] };
  }

  private async adminOrderThreads(query: ListChatsDto): Promise<Envelope<unknown>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.ChatThreadWhereInput = {
      ...(query.sourceId ? { OR: [{ id: query.sourceId }, { orderId: query.sourceId }, { providerOrderId: query.sourceId }] } : {}),
      ...(query.participantId && query.participantRole === UserRole.REGISTERED_USER ? { customerId: query.participantId } : {}),
      ...(query.participantId && query.participantRole === UserRole.PROVIDER ? { providerId: query.participantId } : {}),
      ...(query.search ? { OR: [{ order: { orderNumber: { contains: query.search, mode: 'insensitive' } } }, { customer: { firstName: { contains: query.search, mode: 'insensitive' } } }, { customer: { lastName: { contains: query.search, mode: 'insensitive' } } }, { provider: { providerBusinessName: { contains: query.search, mode: 'insensitive' } } }] } : {}),
    };
    const [items, total] = await Promise.all([
      this.chatsRepository.findOrderThreads({ where, skip: (page - 1) * limit, take: limit }),
      this.chatsRepository.countOrderThreads(where),
    ]);
    return { data: items.map((thread) => this.orderThreadItem(thread)), meta: { page, limit, total, totalPages: Math.ceil(total / limit) }, message: 'Chat threads fetched successfully.' };
  }

  private async adminOrderThreadDetails(user: AuthUserContext, threadId: string, query: ListThreadMessagesDto): Promise<Envelope<unknown>> {
    this.assertAnyPermission(user, ['chats.read.all', 'messageModeration.read']);
    const thread = await this.chatsRepository.findOrderThreadById(threadId);
    if (!thread) throw new NotFoundException('Chat thread not found');
    const page = query.page ?? 1;
    const limit = query.limit ?? 30;
    const messages = await this.chatsRepository.findOrderThreadMessages({ threadId, before: query.before, skip: (page - 1) * limit, take: limit });
    return { data: { thread: this.orderThreadItem(thread), messages: messages.reverse().map((message) => this.orderMessageItem(message)) }, message: 'Chat thread fetched successfully.' };
  }

  private async adminThreadDetails(user: AuthUserContext, threadId: string, query: ListThreadMessagesDto): Promise<Envelope<unknown>> {
    if (user.role === UserRole.SUPER_ADMIN || this.hasPermission(user, 'supportChats.read')) {
      return this.withOrderInspectionFallback(() => this.supportChats.details(user, threadId), () => this.adminOrderThreadDetails(user, threadId, query));
    }
    return this.adminOrderThreadDetails(user, threadId, query);
  }

  private orderThreadItem(thread: UnifiedOrderThread) {
    return {
      id: thread.id,
      threadType: UnifiedChatThreadType.ORDER_CHAT,
      sourceType: UnifiedChatSourceType.PROVIDER_ORDER,
      sourceId: thread.providerOrderId,
      status: UnifiedChatStatus.ACTIVE,
      subject: `Order ${thread.order.orderNumber}`,
      participants: [
        { id: thread.customer.id, role: UserRole.REGISTERED_USER, name: `${thread.customer.firstName} ${thread.customer.lastName}`.trim(), avatarUrl: thread.customer.avatarUrl },
        { id: thread.provider.id, role: UserRole.PROVIDER, name: thread.provider.providerBusinessName ?? `${thread.provider.firstName} ${thread.provider.lastName}`.trim(), avatarUrl: thread.provider.avatarUrl },
      ],
      lastMessage: thread.lastMessage ? { id: thread.lastMessage.id, bodyPreview: thread.lastMessage.body, createdAt: thread.lastMessage.createdAt } : null,
      unreadCount: 0,
      createdAt: thread.createdAt,
      updatedAt: thread.updatedAt,
    };
  }

  private orderMessageItem(message: { id: string; clientMessageId: string | null; senderId: string; senderType: string; body: string | null; messageType: ChatMessageType; attachmentUrlsJson: Prisma.JsonValue; visibilityStatus: MessageVisibilityStatus; hiddenByModeration: boolean; createdAt: Date }) {
    const hidden = message.hiddenByModeration || message.visibilityStatus === MessageVisibilityStatus.HIDDEN_BY_MODERATION;
    return {
      id: message.id,
      clientMessageId: message.clientMessageId,
      sender: { id: message.senderId, role: message.senderType },
      messageType: message.messageType,
      body: hidden ? 'This message was removed by moderation.' : message.body,
      attachmentUrls: hidden ? [] : this.stringArray(message.attachmentUrlsJson),
      visibilityStatus: message.visibilityStatus,
      hiddenByModeration: hidden,
      createdAt: message.createdAt,
    };
  }

  private isAdmin(user: AuthUserContext): boolean {
    return user.role === UserRole.SUPER_ADMIN || user.role === UserRole.ADMIN;
  }

  private assertPermission(user: AuthUserContext, permission: string): void {
    if (user.role === UserRole.SUPER_ADMIN) return;
    if (user.role !== UserRole.ADMIN || !this.hasPermission(user, permission)) {
      throw new ForbiddenException('Your role does not have the required permission');
    }
  }

  private assertAnyPermission(user: AuthUserContext, permissions: string[]): void {
    if (user.role === UserRole.SUPER_ADMIN) return;
    if (user.role !== UserRole.ADMIN || !permissions.some((permission) => this.hasPermission(user, permission))) {
      throw new ForbiddenException('Your role does not have the required permission');
    }
  }

  private hasPermission(user: AuthUserContext, permission: string): boolean {
    if (!user.permissions || typeof user.permissions !== 'object' || Array.isArray(user.permissions)) return false;
    const separator = permission.indexOf('.');
    const module = permission.slice(0, separator);
    const key = permission.slice(separator + 1);
    const values = (user.permissions as Record<string, unknown>)[module];
    return Array.isArray(values) && values.includes(key);
  }

  private async withSupportFallback(primary: () => Promise<Envelope<unknown>>, fallback: () => Promise<Envelope<unknown>>): Promise<Envelope<unknown>> {
    try {
      return await primary();
    } catch (error) {
      if (error instanceof NotFoundException) return fallback();
      throw error;
    }
  }

  private async withOrderInspectionFallback(primary: () => Promise<Envelope<unknown>>, fallback: () => Promise<Envelope<unknown>>): Promise<Envelope<unknown>> {
    try {
      return await primary();
    } catch (error) {
      if (error instanceof NotFoundException) return fallback();
      throw error;
    }
  }

  private stringArray(value: Prisma.JsonValue): string[] {
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
  }
}
