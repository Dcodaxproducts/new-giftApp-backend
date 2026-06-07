import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { ChatThreadStatus, ChatThreadType, Prisma, UserRole } from '@prisma/client';
import { AuthUserContext } from '../../../common/decorators/current-user.decorator';
import { ChatAccessPolicyService } from './chat-access-policy.service';
import { ChatAttachmentPolicyService } from './chat-attachment-policy.service';
import { ChatMessageService } from './chat-message.service';
import { ChatNotificationService } from './chat-notification.service';
import { ChatReadReceiptService } from './chat-read-receipt.service';
import { CHAT_THREAD_INCLUDE, ChatThreadRepository } from '../repositories/chat-thread.repository';
import { ChatAuditLogRepository } from '../repositories/chat-audit-log.repository';
import { ChatSortBy, ChatSortOrder, ChatSourceKind, ChatStatus, ChatThreadKind, CreateChatThreadDto, ListChatsDto, ListThreadMessagesDto, SendChatThreadMessageDto, UpdateChatThreadStatusDto } from '../dto/chats.dto';
import { getPagination } from '../../../common/pagination/pagination.util';

type Thread = Prisma.ChatThreadGetPayload<{ include: typeof CHAT_THREAD_INCLUDE }>;
type Envelope<T> = { data: T; meta?: unknown; message: string };

@Injectable()
export class ChatThreadService {
  constructor(
    private readonly threads: ChatThreadRepository,
    private readonly access: ChatAccessPolicyService,
    private readonly messagesService: ChatMessageService,
    private readonly receipts: ChatReadReceiptService,
    private readonly attachments: ChatAttachmentPolicyService,
    private readonly auditLogs: ChatAuditLogRepository,
    private readonly notifications: ChatNotificationService,
  ) {}

  async list(user: AuthUserContext, query: ListChatsDto): Promise<Envelope<unknown>> {
    const { page, limit, skip, take } = getPagination(query);
    const where = this.listWhere(user, query);
    const [items, total] = await Promise.all([
      this.threads.findMany({ where, include: CHAT_THREAD_INCLUDE, orderBy: this.orderBy(query), skip, take }),
      this.threads.count(where),
    ]);
    const data = await Promise.all(items.map((thread) => this.threadItem(thread, user.uid)));
    const filtered = query.unreadOnly ? data.filter((item) => item.unreadCount > 0) : data;
    return { data: filtered, meta: { page, limit, total: query.unreadOnly ? filtered.length : total, totalPages: Math.ceil((query.unreadOnly ? filtered.length : total) / limit) }, message: 'Chat threads fetched successfully.' };
  }

  quickReplies(user: AuthUserContext): Envelope<unknown> {
    if (user.role === UserRole.PROVIDER) return { data: [{ key: 'TRACKING_INFO', label: 'Tracking info?', message: 'Your tracking information will be shared shortly.' }, { key: 'ESTIMATED_ARRIVAL', label: 'Estimated arrival?', message: 'Your order is expected to arrive soon. We will keep you updated.' }, { key: 'CONFIRM_DELIVERY', label: 'Confirm delivery', message: 'Please confirm once your order has been delivered.' }], message: 'Quick replies fetched successfully.' };
    if (user.role === UserRole.REGISTERED_USER) return { data: [{ key: 'TRACKING_INFO', label: 'Tracking info?', message: 'Can you please share the tracking information?' }, { key: 'ESTIMATED_ARRIVAL', label: 'Estimated arrival?', message: 'When is my order expected to arrive?' }, { key: 'CONFIRM_DELIVERY', label: 'Confirm delivery', message: 'Can you confirm if the order has been delivered?' }], message: 'Quick replies fetched successfully.' };
    return { data: [{ key: 'CHECKING_NOW', label: 'Checking now', message: 'I am checking this issue now.' }, { key: 'THANKS_FOR_WAITING', label: 'Thanks for waiting', message: 'Thanks for waiting. I will update you shortly.' }, { key: 'RESOLVED', label: 'Resolved', message: 'This issue has been resolved.' }], message: 'Quick replies fetched successfully.' };
  }

  async createOrGetThread(user: AuthUserContext, dto: CreateChatThreadDto): Promise<Envelope<unknown>> {
    if (dto.threadType === ChatThreadKind.ORDER_CHAT) return this.createOrGetOrderThread(user, dto);
    if (dto.threadType === ChatThreadKind.SUPPORT_CHAT) return this.createSupportThread(user, dto);
    if (dto.threadType === ChatThreadKind.MODERATION_REVIEW) throw new BadRequestException('Moderation review threads are created by message moderation actions');
    throw new BadRequestException('Unsupported chat thread type');
  }

  async details(user: AuthUserContext, threadId: string): Promise<Envelope<unknown>> {
    const thread = await this.access.getAllowedThread(user, threadId);
    return { data: await this.threadDetails(thread, user.uid), message: 'Chat thread fetched successfully.' };
  }

  async messages(user: AuthUserContext, threadId: string, query: ListThreadMessagesDto): Promise<Envelope<unknown>> {
    await this.access.getAllowedThread(user, threadId);
    return this.messagesService.list(user, threadId, query);
  }

  async sendMessage(user: AuthUserContext, threadId: string, dto: SendChatThreadMessageDto): Promise<Envelope<unknown>> {
    const thread = await this.access.getAllowedThread(user, threadId);
    this.access.assertCanReply(user, thread);
    return this.messagesService.send(user, thread, dto);
  }

  async markRead(user: AuthUserContext, threadId: string): Promise<Envelope<unknown>> {
    const thread = await this.access.getAllowedThread(user, threadId);
    await this.receipts.markThreadRead(threadId, user.uid);
    if (thread.threadType === ChatThreadType.ORDER_CHAT && (user.role === UserRole.REGISTERED_USER || user.role === UserRole.PROVIDER)) {
      await this.messagesService.markLegacyOrderRead(threadId, user.role);
    }
    return { data: { threadId, isRead: true, unreadCount: 0 }, message: 'Chat marked as read.' };
  }

  async updateStatus(user: AuthUserContext, threadId: string, dto: UpdateChatThreadStatusDto): Promise<Envelope<unknown>> {
    const thread = await this.access.getAllowedThread(user, threadId);
    this.assertCanUpdateStatus(user, thread, dto.status);
    const status = this.statusFor(dto.status);
    const updated = await this.threads.update(threadId, { status, ...this.statusResolutionData(user, dto.status) });
    const notifyParticipants = dto.notifyParticipants ?? dto.notifyParticipant ?? true;
    await this.auditLogs.create({ threadId, actorId: user.uid, action: this.statusAuditAction(dto.status), metadataJson: { status: dto.status, reason: dto.reason, comment: dto.comment, notifyParticipants } });
    if (notifyParticipants) await this.notifications.notifyThreadStatus({ threadId, status: dto.status, actorId: user.uid, participants: thread.participants, comment: dto.comment });
    return { data: { id: updated.id, status: updated.status }, message: this.statusMessage(dto.status) };
  }

  private assertCanUpdateStatus(user: AuthUserContext, thread: Thread, status: ChatStatus): void {
    if ((status === ChatStatus.RESOLVED || status === ChatStatus.REOPENED) && thread.threadType === ChatThreadType.SUPPORT_CHAT) {
      this.access.assertCanResolve(user, thread);
      return;
    }
    if (status === ChatStatus.BLOCKED_BY_MODERATION) {
      if (this.access.isAdmin(user) && this.access.hasAny(user, ['messageModeration.moderate', 'chats.moderate'])) return;
      throw new ForbiddenException('Your role does not have the required permission');
    }
  }

  private statusFor(status: ChatStatus): ChatThreadStatus {
    return status;
  }

  private statusResolutionData(user: AuthUserContext, status: ChatStatus): Prisma.ChatThreadUpdateInput {
    if (status === ChatStatus.RESOLVED) return { resolvedAt: new Date(), resolvedBy: { connect: { id: user.uid } } };
    if (status === ChatStatus.ACTIVE || status === ChatStatus.REOPENED) return { resolvedAt: null, resolvedBy: { disconnect: true } };
    return {};
  }

  private statusAuditAction(status: ChatStatus): string {
    if (status === ChatStatus.RESOLVED) return 'chat.thread.resolved';
    if (status === ChatStatus.REOPENED || status === ChatStatus.ACTIVE) return 'chat.thread.reopened';
    if (status === ChatStatus.ARCHIVED) return 'chat.thread.archived';
    return 'chat.thread.blocked_by_moderation';
  }

  private statusMessage(status: ChatStatus): string {
    if (status === ChatStatus.RESOLVED) return 'Chat thread resolved successfully.';
    if (status === ChatStatus.REOPENED || status === ChatStatus.ACTIVE) return 'Chat thread reopened successfully.';
    if (status === ChatStatus.ARCHIVED) return 'Chat thread archived successfully.';
    return 'Chat thread blocked by moderation successfully.';
  }

  async auditLog(user: AuthUserContext, threadId: string): Promise<Envelope<unknown>> {
    await this.access.getAllowedThread(user, threadId);
    const rows = await this.auditLogs.findForThread(threadId);
    return { data: { threadId, events: rows.map((row) => ({ id: row.id, action: row.action, actor: row.actor, metadata: row.metadataJson, createdAt: row.createdAt })) }, message: 'Chat audit log fetched successfully.' };
  }

  async socketContext(user: AuthUserContext, threadId: string) {
    const thread = await this.access.getAllowedThread(user, threadId);
    return {
      threadId: thread.id,
      threadType: thread.threadType,
      sourceType: thread.sourceType,
      orderId: thread.orderId,
      providerOrderId: thread.providerOrderId,
      customerId: thread.customerId,
      providerId: thread.providerId,
      participantId: this.supportParticipant(thread)?.id,
      participantRole: this.supportParticipant(thread)?.role,
      assignedAdminId: thread.assignedAdminId,
    };
  }

  private async createOrGetOrderThread(user: AuthUserContext, dto: CreateChatThreadDto): Promise<Envelope<unknown>> {
    if (!dto.sourceId) throw new BadRequestException('sourceId is required for order chats');
    const sourceType = dto.sourceType === ChatSourceKind.CUSTOMER_ORDER ? 'CUSTOMER_ORDER' : dto.sourceType === ChatSourceKind.PROVIDER_ORDER ? 'PROVIDER_ORDER' : null;
    if (!sourceType) throw new BadRequestException('sourceType must be CUSTOMER_ORDER or PROVIDER_ORDER for order chats');
    const source = await this.access.assertOrderSource(user, dto.sourceId, sourceType);
    const existing = await this.threads.findByProviderOrderId(source.providerOrderId);
    if (existing && dto.createIfMissing === false) return { data: await this.threadItem(existing, user.uid), message: 'Order chat fetched successfully.' };
    const thread = existing ?? await this.threads.upsertOrderThread(source);
    return { data: await this.threadItem(thread, user.uid), message: 'Order chat fetched successfully.' };
  }

  private async createSupportThread(user: AuthUserContext, dto: CreateChatThreadDto): Promise<Envelope<unknown>> {
    const participant = await this.supportParticipantInput(user, dto);
    await this.attachments.assertCompleted(dto.attachmentUrls ?? [], 'support-chat-attachments');
    const thread = await this.threads.createSupportThread(participant);
    if (dto.initialMessage?.trim() || dto.attachmentUrls?.length) {
      await this.messagesService.send(user, thread, { messageType: 'TEXT', body: dto.initialMessage, attachmentUrls: dto.attachmentUrls ?? [] });
      const updated = await this.threads.findById(thread.id);
      return { data: await this.threadItem(updated ?? thread, user.uid), message: 'Support chat created successfully.' };
    }
    return { data: await this.threadItem(thread, user.uid), message: 'Support chat created successfully.' };
  }

  private async supportParticipantInput(user: AuthUserContext, dto: CreateChatThreadDto): Promise<{ participantId: string; participantRole: 'REGISTERED_USER' | 'PROVIDER'; subject?: string; assignedAdminId?: string }> {
    if (this.access.isAdmin(user)) {
      if (!this.access.has(user, 'supportChats.reply')) throw new ForbiddenException('Your role does not have the required permission');
      if (!dto.participantId) throw new BadRequestException('participantId is required for admin support chats');
      const participant = await this.threads.findSupportParticipantById(dto.participantId);
      if (!participant) throw new BadRequestException('participantId must belong to an active registered user or provider');
      const participantRole = participant.role === UserRole.PROVIDER ? UserRole.PROVIDER : UserRole.REGISTERED_USER;
      if (dto.participantRole && dto.participantRole !== participantRole) throw new BadRequestException('participantRole does not match participantId');
      return { participantId: participant.id, participantRole, subject: dto.subject, assignedAdminId: user.uid };
    }
    if (user.role === UserRole.REGISTERED_USER || user.role === UserRole.PROVIDER) return { participantId: user.uid, participantRole: user.role, subject: dto.subject };
    throw new ForbiddenException('Your role cannot create support chats');
  }

  private listWhere(user: AuthUserContext, query: ListChatsDto): Prisma.ChatThreadWhereInput {
    const where: Prisma.ChatThreadWhereInput = {};
    if (query.threadType) where.threadType = query.threadType;
    if (query.sourceType) where.sourceType = query.sourceType;
    if (query.sourceId) where.OR = [{ id: query.sourceId }, { sourceId: query.sourceId }, { orderId: query.sourceId }, { providerOrderId: query.sourceId }];
    if (query.status) where.status = query.status;
    if (query.assignedToAdminId) where.assignedAdminId = query.assignedToAdminId;
    if (query.participantId) where.participants = { some: { userId: query.participantId, leftAt: null } };
    if (user.role === UserRole.REGISTERED_USER) where.participants = { some: { userId: user.uid, leftAt: null } };
    if (user.role === UserRole.PROVIDER) where.participants = { some: { userId: user.uid, leftAt: null } };
    if (user.role === UserRole.ADMIN && !this.access.has(user, 'supportChats.read.all')) {
      where.OR = [...(where.OR ?? []), { assignedAdminId: user.uid }, ...(this.access.has(user, 'messageModeration.read') ? [{ threadType: ChatThreadType.ORDER_CHAT }] : [])];
    }
    if (query.search?.trim()) {
      const search: Prisma.ChatThreadWhereInput[] = [{ subject: { contains: query.search, mode: 'insensitive' } }, { order: { orderNumber: { contains: query.search, mode: 'insensitive' } } }, { customer: { firstName: { contains: query.search, mode: 'insensitive' } } }, { customer: { lastName: { contains: query.search, mode: 'insensitive' } } }, { provider: { providerBusinessName: { contains: query.search, mode: 'insensitive' } } }];
      where.AND = [...(Array.isArray(where.AND) ? where.AND : []), { OR: search }];
    }
    return where;
  }

  private orderBy(query: ListChatsDto): Prisma.ChatThreadOrderByWithRelationInput {
    const direction = query.sortOrder === ChatSortOrder.ASC ? 'asc' : 'desc';
    if (query.sortBy === ChatSortBy.CREATED_AT) return { createdAt: direction };
    if (query.sortBy === ChatSortBy.LAST_MESSAGE_AT) return { lastMessageAt: direction };
    return { updatedAt: direction };
  }

  private async threadDetails(thread: Thread, viewerId: string) {
    return { ...(await this.threadItem(thread, viewerId)), assignedAdmin: thread.assignedAdmin ? { id: thread.assignedAdmin.id, name: this.name(thread.assignedAdmin), role: thread.assignedAdmin.role } : null };
  }

  private async threadItem(thread: Thread, viewerId: string) {
    const participant = this.supportParticipant(thread);
    return {
      id: thread.id,
      threadType: thread.threadType,
      sourceType: thread.sourceType,
      sourceId: thread.sourceId ?? thread.providerOrderId ?? thread.orderId,
      status: thread.status,
      subject: thread.subject ?? (thread.order ? `Order ${thread.order.orderNumber}` : 'Support Ticket'),
      orderNumber: thread.order?.orderNumber,
      participants: thread.participants.map((item) => ({ id: item.user.id, role: item.user.role, name: this.participantName(item.user), avatarUrl: item.user.avatarUrl })),
      participant: participant ? { id: participant.id, role: participant.role, name: participant.name, avatarUrl: participant.avatarUrl } : null,
      provider: thread.provider ? { id: thread.provider.id, businessName: this.participantName(thread.provider), avatarUrl: thread.provider.avatarUrl, isOnline: thread.provider.isActive } : null,
      customer: thread.customer ? { id: thread.customer.id, name: this.name(thread.customer), avatarUrl: thread.customer.avatarUrl, isOnline: thread.customer.isActive } : null,
      lastMessage: thread.lastMessage ? { id: thread.lastMessage.id, bodyPreview: thread.lastMessage.body, createdAt: thread.lastMessage.createdAt } : null,
      lastMessageAt: thread.lastMessageAt,
      unreadCount: await this.messagesService.unreadCount(thread.id, viewerId),
      createdAt: thread.createdAt,
      updatedAt: thread.updatedAt,
    };
  }

  private supportParticipant(thread: Thread): { id: string; role: UserRole; name: string; avatarUrl: string | null } | null {
    const participant = thread.participants.find((item) => item.role === 'REGISTERED_USER' || item.role === 'PROVIDER');
    return participant ? { id: participant.user.id, role: participant.user.role, name: this.participantName(participant.user), avatarUrl: participant.user.avatarUrl } : null;
  }

  private participantName(user: { providerBusinessName?: string | null; firstName: string; lastName: string }): string {
    return user.providerBusinessName ?? this.name(user);
  }

  private name(user: { firstName: string; lastName: string }): string {
    return `${user.firstName} ${user.lastName}`.trim();
  }
}
