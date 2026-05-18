import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { MessageModerationAction, MessageModerationCase, MessageModerationEscalation, MessageModerationFlagType, MessageModerationLog, MessageModerationSeverity, MessageModerationSource, MessageModerationStatus, NotificationRecipientType, Prisma, User, UserRole } from '@prisma/client';
import { AuthUserContext } from '../../../common/decorators/current-user.decorator';
import { NotificationDispatchService } from '../../broadcast-notifications/services/notification-dispatch.service';
import { ProviderLifecycleAction, ProviderLifecycleReason } from '../../provider-management/dto/provider-management.dto';
import { ProviderManagementService } from '../../provider-management/services/provider-management.service';
import { SuspensionReason } from '../../user-management/dto/user-management.dto';
import { UserManagementService } from '../../user-management/services/user-management.service';
import { BlockMessageDto, DismissFlagDto, EscalateMessageDto, InternalNoteDto, ListMessageModerationAuditLogsDto, ListMessageModerationDto, MessageModerationChatType, MessageModerationHistoryDto, MessageModerationQueueStatus, ModerationAll, ModerationSortBy, ReprocessMessageDto, RestoreMessageDto, ScannerMode, SortOrder, SuspendAccountDto, SuspensionScope, WarnUserDto } from '../dto/message-moderation.dto';
import { MessageModerationRepository } from '../repositories/message-moderation.repository';
import { MessageModerationScanner } from './message-moderation-scanner.service';

type SourceMessageInput = { source: MessageModerationSource; conversationId: string; messageId: string; participantId: string; participantRole: string; participantName?: string | null; participantAvatarUrl?: string | null; externalReference?: string | null; senderId: string; senderRole: string; body?: string | null; createdAt?: Date; moderationHint?: ScanResult };
type ScanResult = { isFlagged: boolean; flagTypes: MessageModerationFlagType[]; severity: MessageModerationSeverity; confidence: number; redactedBody: string; keywords: string[] };
type CaseWithLogs = MessageModerationCase & { logs?: MessageModerationLog[]; escalations?: MessageModerationEscalation[] };
type Sender = Pick<User, 'id' | 'role' | 'firstName' | 'lastName' | 'email' | 'avatarUrl' | 'providerBusinessName'>;

@Injectable()
export class MessageModerationService {
  constructor(
    private readonly repository: MessageModerationRepository,
    private readonly scanner: MessageModerationScanner,
    private readonly userManagementService: UserManagementService,
    private readonly providerManagementService: ProviderManagementService,
    private readonly notificationDispatch: NotificationDispatchService,
  ) {}

  async scanCreatedMessage(input: SourceMessageInput) {
    const baseScan = this.scanner.scanMessage({ body: input.body });
    const scan = input.moderationHint?.isFlagged ? this.mergeScan(baseScan, input.moderationHint) : baseScan;
    if (!scan.isFlagged) return { flagged: false };
    const createdAt = input.createdAt ?? new Date();
    const moderationCase = await this.repository.upsertFlaggedCase({
      conversationId: input.conversationId,
      messageId: input.messageId,
      source: input.source,
      participantId: input.participantId,
      participantRole: input.participantRole,
      participantName: input.participantName ?? null,
      participantAvatarUrl: input.participantAvatarUrl ?? null,
      externalReference: input.externalReference ?? null,
      senderId: input.senderId,
      senderRole: input.senderRole,
      rawBody: input.body ?? null,
      redactedBody: scan.redactedBody,
      flagTypesJson: scan.flagTypes,
      keywordsJson: scan.keywords,
      severity: scan.severity,
      confidence: new Prisma.Decimal(scan.confidence),
      status: MessageModerationStatus.PENDING_REVIEW,
      lastMessageAt: createdAt,
    });
    await this.repository.runAction((tx) => this.repository.createLog(tx, { caseId: moderationCase.id, messageId: input.messageId, action: MessageModerationAction.FLAGGED, reason: 'AUTO_SCAN', metadata: this.scanMetadata(scan) }));
    return { flagged: true, caseId: moderationCase.id };
  }

  async list(dto: ListMessageModerationDto) {
    const page = dto.page ?? 1; const limit = dto.limit ?? 20;
    const [rows, total] = await this.repository.findCasesAndCount({ where: this.buildWhere(dto), skip: (page - 1) * limit, take: limit, orderBy: this.orderBy(dto) });
    return { data: rows.map((row) => this.toListItem(row)), meta: { page, limit, total, totalPages: Math.ceil(total / limit) }, message: 'Flagged message conversations fetched successfully.' };
  }

  async detail(id: string) { const found = await this.repository.findCase(id); if (!found) throw new NotFoundException('Message moderation conversation not found'); return { data: this.toDetail(found), message: 'Message moderation conversation fetched successfully.' }; }

  async history(id: string, dto: MessageModerationHistoryDto) {
    const found = await this.repository.findCase(id); if (!found) throw new NotFoundException('Message moderation conversation not found');
    const page = dto.page ?? 1; const limit = dto.limit ?? 20;
    const [rows, total] = await Promise.all([this.repository.findConversationCases(found.conversationId, { skip: (page - 1) * limit, take: limit }), this.repository.countConversationCases(found.conversationId)]);
    return { data: rows.map((row) => ({ messageId: row.messageId, body: this.maskSensitive(row.redactedBody), isFlagged: true, flagReasons: this.stringArray(row.flagTypesJson), severity: row.severity, status: this.queueStatus(row.status), createdAt: row.createdAt })), meta: { page, limit, total, totalPages: Math.ceil(total / limit) }, message: 'Message moderation history fetched successfully.' };
  }

  async stats() { const rows = await this.repository.stats(); return { data: { rows }, message: 'Message moderation stats fetched successfully.' }; }
  filterOptions() { return { data: { chatTypes: Object.values(MessageModerationChatType), statuses: Object.values(MessageModerationQueueStatus), flagReasons: Object.values(MessageModerationFlagType), severities: Object.values(MessageModerationSeverity), senderRoles: ['REGISTERED_USER', 'PROVIDER'] }, message: 'Message moderation filter options fetched successfully.' }; }
  async export(dto: ListMessageModerationDto) { const rows = await this.repository.exportRows(this.buildWhere(dto)); return { data: rows.map((row) => ({ id: row.id, messageId: row.messageId, conversationId: row.conversationId, chatType: this.chatType(row.source), status: this.queueStatus(row.status), severity: row.severity, flagReasons: this.stringArray(row.flagTypesJson), preview: this.maskSensitive(row.redactedBody), senderRole: row.senderRole, lastFlaggedAt: row.lastMessageAt })), message: 'Message moderation export fetched successfully.' }; }

  async auditLogs(dto: ListMessageModerationAuditLogsDto) {
    const page = dto.page ?? 1; const limit = dto.limit ?? 20;
    const where = this.auditWhere(dto);
    const [rows, total] = await this.repository.auditLogs({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: dto.sortOrder === SortOrder.ASC ? 'asc' : 'desc' } });
    return { data: rows.map((row) => this.toAuditLog(row)), meta: { page, limit, total, totalPages: Math.ceil(total / limit) }, message: 'Message moderation audit logs fetched successfully.' };
  }

  async block(user: AuthUserContext, messageId: string, dto: BlockMessageDto) {
    const moderationCase = await this.getCaseByMessage(messageId);
    const now = new Date();
    await this.repository.runAction(async (tx) => {
      const updated = await this.repository.updateMessageVisibility(tx, messageId, user.uid, true);
      if (!updated) throw new NotFoundException('Message not found');
      await this.repository.updateStatus(tx, messageId, MessageModerationStatus.ACTION_TAKEN);
      await this.repository.createLog(tx, { caseId: moderationCase.id, messageId, action: MessageModerationAction.HIDE_MESSAGE, reason: dto.reason, internalNote: dto.comment ?? dto.internalNote, actorId: user.uid, metadata: { before: { visibilityStatus: 'VISIBLE' }, after: { visibilityStatus: 'HIDDEN_BY_MODERATION' }, notifyParticipants: dto.notifyParticipants ?? dto.notifyUser ?? false } });
      await this.audit(tx, user.uid, moderationCase.id, 'MESSAGE_HIDDEN', messageId, moderationCase.conversationId, { visibilityStatus: 'VISIBLE' }, { visibilityStatus: 'HIDDEN_BY_MODERATION' });
    });
    return { data: { messageId, visibilityStatus: 'HIDDEN_BY_MODERATION', hiddenByModeration: true, hiddenAt: now, hiddenByAdminId: user.uid }, message: 'Message hidden successfully.' };
  }

  async restore(user: AuthUserContext, messageId: string, dto: RestoreMessageDto) {
    const moderationCase = await this.getCaseByMessage(messageId);
    if (!new Set<MessageModerationStatus>([MessageModerationStatus.ACTION_TAKEN, MessageModerationStatus.BLOCKED, MessageModerationStatus.RESOLVED]).has(moderationCase.status)) throw new BadRequestException('Only hidden/moderated messages can be restored.');
    const restoredAt = new Date();
    await this.repository.runAction(async (tx) => {
      const updated = await this.repository.updateMessageVisibility(tx, messageId, user.uid, false);
      if (!updated) throw new NotFoundException('Message not found');
      await this.repository.updateStatus(tx, messageId, MessageModerationStatus.RESOLVED);
      await this.repository.createLog(tx, { caseId: moderationCase.id, messageId, action: MessageModerationAction.RESTORE_MESSAGE, reason: dto.reason, internalNote: dto.comment, actorId: user.uid, metadata: { notifyParticipants: dto.notifyParticipants ?? false } });
      await this.audit(tx, user.uid, moderationCase.id, 'MESSAGE_RESTORED', messageId, moderationCase.conversationId, { visibilityStatus: 'HIDDEN_BY_MODERATION' }, { visibilityStatus: 'VISIBLE' });
    });
    return { data: { messageId, visibilityStatus: 'VISIBLE', hiddenByModeration: false, restoredAt }, message: 'Message restored successfully.' };
  }

  async warn(user: AuthUserContext, messageId: string, dto: WarnUserDto) {
    const moderationCase = await this.getCaseByMessage(messageId); const sender = await this.resolveSender(moderationCase);
    await this.repository.runAction(async (tx) => {
      await this.repository.updateStatus(tx, messageId, MessageModerationStatus.WARNED);
      await this.repository.createLog(tx, { caseId: moderationCase.id, messageId, action: MessageModerationAction.WARN_USER, reason: dto.reason, internalNote: dto.comment ?? dto.internalNote, actorId: user.uid, metadata: { senderId: sender.id, senderRole: sender.role, warningSeverity: dto.warningSeverity } });
      await this.audit(tx, user.uid, moderationCase.id, 'SENDER_WARNED', messageId, moderationCase.conversationId, { status: this.queueStatus(moderationCase.status) }, { status: 'ACTION_TAKEN', warningSeverity: dto.warningSeverity });
    });
    if (dto.notifySender ?? dto.notifyUser) await this.notifySender(sender, 'Message warning', dto.warningMessage ?? 'Please keep all payments and communication inside the platform.', messageId);
    return { data: { messageId, senderId: sender.id, senderRole: sender.role, warningSeverity: dto.warningSeverity }, message: 'Message sender warned successfully.' };
  }

  async suspend(user: AuthUserContext, messageId: string, dto: SuspendAccountDto) {
    const moderationCase = await this.getCaseByMessage(messageId); const sender = await this.resolveSender(moderationCase);
    if (sender.id === user.uid) throw new ForbiddenException('Admins cannot suspend themselves from message moderation.');
    if (sender.role === UserRole.ADMIN || sender.role === UserRole.SUPER_ADMIN) throw new ForbiddenException('Admin and Super Admin accounts cannot be suspended from message moderation.');
    if ((dto.suspensionScope ?? SuspensionScope.ACCOUNT) === SuspensionScope.ACCOUNT) {
      if (sender.role === UserRole.PROVIDER) await this.providerManagementService.updateStatus(user, sender.id, { action: ProviderLifecycleAction.SUSPEND, reason: ProviderLifecycleReason.POLICY_VIOLATION, comment: dto.comment ?? dto.internalNote, notifyProvider: dto.notifySender ?? dto.notifyUser });
      else await this.userManagementService.suspend(user, sender.id, { reason: SuspensionReason.POLICY_VIOLATION, comment: dto.comment ?? dto.internalNote, notifyUser: dto.notifySender ?? dto.notifyUser });
    }
    await this.repository.runAction(async (tx) => {
      await this.repository.updateStatus(tx, messageId, MessageModerationStatus.SUSPENDED);
      await this.repository.createLog(tx, { caseId: moderationCase.id, messageId, action: MessageModerationAction.SUSPEND_ACCOUNT, reason: dto.reason, internalNote: dto.comment ?? dto.internalNote, actorId: user.uid, metadata: { senderId: sender.id, senderRole: sender.role, suspensionScope: dto.suspensionScope, durationDays: dto.durationDays } });
      await this.audit(tx, user.uid, moderationCase.id, 'SENDER_SUSPENDED', messageId, moderationCase.conversationId, { status: this.queueStatus(moderationCase.status) }, { status: 'ACTION_TAKEN', suspensionScope: dto.suspensionScope });
    });
    if (dto.notifySender ?? dto.notifyUser) await this.notifySender(sender, 'Account suspended', 'Your account has been suspended after message moderation review.', messageId);
    return { data: { messageId, status: MessageModerationStatus.SUSPENDED, senderId: sender.id, senderRole: sender.role }, message: 'Message sender account suspended successfully.' };
  }

  dismiss(user: AuthUserContext, messageId: string, dto: DismissFlagDto) { return this.simpleAction(user, messageId, MessageModerationStatus.DISMISSED, MessageModerationAction.DISMISS_FLAG, 'FLAG_DISMISSED', dto.reason, dto.comment ?? dto.internalNote, 'Message moderation flag dismissed successfully.'); }
  note(user: AuthUserContext, messageId: string, dto: InternalNoteDto) { return this.simpleAction(user, messageId, MessageModerationStatus.UNDER_REVIEW, MessageModerationAction.ADD_NOTE, 'INTERNAL_NOTE_CREATED', 'INTERNAL_NOTE', dto.note, 'Internal moderation note created successfully.'); }

  async reprocess(user: AuthUserContext, messageId: string, dto: ReprocessMessageDto) {
    const moderationCase = await this.getCaseByMessage(messageId); const scan = this.scanner.scanMessage({ body: moderationCase.rawBody ?? moderationCase.redactedBody });
    if (scan.isFlagged) await this.repository.upsertFlaggedCase({ conversationId: moderationCase.conversationId, messageId, source: moderationCase.source, participantId: moderationCase.participantId, participantRole: moderationCase.participantRole, participantName: moderationCase.participantName, participantAvatarUrl: moderationCase.participantAvatarUrl, externalReference: moderationCase.externalReference, senderId: moderationCase.senderId, senderRole: moderationCase.senderRole, rawBody: moderationCase.rawBody, redactedBody: scan.redactedBody, flagTypesJson: scan.flagTypes, keywordsJson: scan.keywords, severity: scan.severity, confidence: new Prisma.Decimal(scan.confidence), status: MessageModerationStatus.PENDING_REVIEW, lastMessageAt: moderationCase.lastMessageAt });
    await this.repository.runAction(async (tx) => { await this.repository.createLog(tx, { caseId: moderationCase.id, messageId, action: MessageModerationAction.REPROCESS, reason: dto.comment ?? dto.reason ?? dto.scannerMode ?? ScannerMode.CURRENT_POLICY, actorId: user.uid, metadata: { ...this.scanMetadata(scan), scannerMode: dto.scannerMode ?? ScannerMode.CURRENT_POLICY } }); await this.audit(tx, user.uid, moderationCase.id, 'MESSAGE_REPROCESSED', messageId, moderationCase.conversationId, { severity: moderationCase.severity }, { severity: scan.severity, isFlagged: scan.isFlagged }); });
    return { data: { messageId, isFlagged: scan.isFlagged, severity: scan.severity }, message: 'Message reprocessed successfully.' };
  }

  async escalate(user: AuthUserContext, messageId: string, dto: EscalateMessageDto) {
    const moderationCase = await this.getCaseByMessage(messageId); let escalationId = '';
    await this.repository.runAction(async (tx) => {
      const escalation = await this.repository.createEscalation(tx, { caseId: moderationCase.id, messageId, conversationId: moderationCase.conversationId, escalationType: dto.escalationType, priority: dto.priority, reason: dto.reason, assignedToAdminId: dto.assignToAdminId, createdByAdminId: user.uid });
      escalationId = escalation.id;
      await this.repository.updateStatus(tx, messageId, MessageModerationStatus.ESCALATED);
      await this.repository.createLog(tx, { caseId: moderationCase.id, messageId, action: MessageModerationAction.ESCALATE_MESSAGE, reason: dto.reason, actorId: user.uid, metadata: { escalationId, escalationType: dto.escalationType, priority: dto.priority, assignedToAdminId: dto.assignToAdminId } });
      await this.audit(tx, user.uid, moderationCase.id, 'MESSAGE_ESCALATED', messageId, moderationCase.conversationId, { status: this.queueStatus(moderationCase.status) }, { status: 'ESCALATED', escalationId });
    });
    if (dto.notifyAssignedAdmin && dto.assignToAdminId) await this.notificationDispatch.createAndEmit({ recipientId: dto.assignToAdminId, recipientType: NotificationRecipientType.ADMIN, title: 'Message moderation escalation', message: 'A flagged message was escalated for your review.', type: 'MESSAGE_MODERATION_ESCALATION', metadataJson: { messageId, escalationId } });
    return { data: { messageId, escalationId, status: 'ESCALATED', assignedToAdminId: dto.assignToAdminId ?? null }, message: 'Message escalated successfully.' };
  }

  private async simpleAction(user: AuthUserContext, messageId: string, status: MessageModerationStatus, action: MessageModerationAction, auditAction: string, reason: string, note: string | undefined, message: string) { const moderationCase = await this.getCaseByMessage(messageId); await this.repository.runAction(async (tx) => { await this.repository.updateStatus(tx, messageId, status); await this.repository.createLog(tx, { caseId: moderationCase.id, messageId, action, reason, internalNote: note, actorId: user.uid }); await this.audit(tx, user.uid, moderationCase.id, auditAction, messageId, moderationCase.conversationId, { status: this.queueStatus(moderationCase.status) }, { status: this.queueStatus(status) }); }); return { data: { messageId, status }, message }; }
  private async getCaseByMessage(messageId: string) { const found = await this.repository.findCaseByMessage(messageId); if (!found) throw new NotFoundException('Message moderation case not found'); return found; }
  private async resolveSender(moderationCase: MessageModerationCase): Promise<Sender> { const sender = await this.repository.findUser(moderationCase.senderId); if (!sender) throw new NotFoundException('Message sender not found'); return sender; }
  private async notifySender(sender: Sender, title: string, body: string, messageId: string) { await this.notificationDispatch.createAndEmit({ recipientId: sender.id, recipientType: sender.role === UserRole.PROVIDER ? NotificationRecipientType.PROVIDER : NotificationRecipientType.REGISTERED_USER, title, message: body, type: 'MESSAGE_MODERATION', metadataJson: { messageId } }); }
  private async audit(tx: Parameters<Parameters<MessageModerationRepository['runAction']>[0]>[0], actorId: string, caseId: string, action: string, messageId: string, conversationId: string, before: Prisma.InputJsonObject, after: Prisma.InputJsonObject) { await this.repository.createAuditLog(tx, { actorId, action: `message_moderation.${action.toLowerCase()}`, entityId: caseId, metadata: { action, messageId, conversationId, before, after } }); }
  private buildWhere(dto: ListMessageModerationDto): Prisma.MessageModerationCaseWhereInput { const where: Prisma.MessageModerationCaseWhereInput = {}; const source = dto.chatType ? this.sourceFromChatType(dto.chatType) : dto.source; if (this.isSource(source)) where.source = source; if (dto.status) where.status = this.statusFromQueue(dto.status); if (dto.severity) where.severity = dto.severity; if (dto.assignedToAdminId ?? dto.assignedToId) where.assignedToId = dto.assignedToAdminId ?? dto.assignedToId; const flag = dto.flagReason ?? dto.flagType; if (this.isFlagType(flag)) where.flagTypesJson = { array_contains: flag }; if (dto.senderRole) where.senderRole = dto.senderRole; if (dto.participantType) where.participantRole = dto.participantType; if (dto.search) where.OR = [{ participantName: { contains: dto.search, mode: 'insensitive' } }, { externalReference: { contains: dto.search, mode: 'insensitive' } }, { redactedBody: { contains: dto.search, mode: 'insensitive' } }]; if (dto.fromDate || dto.toDate) where.createdAt = { gte: dto.fromDate ? new Date(dto.fromDate) : undefined, lte: dto.toDate ? new Date(dto.toDate) : undefined }; return where; }
  private auditWhere(dto: ListMessageModerationAuditLogsDto): Prisma.MessageModerationLogWhereInput { return { ...(dto.messageId ? { messageId: dto.messageId } : {}), ...(dto.actorAdminId ? { actorId: dto.actorAdminId } : {}), ...(dto.action ? { action: dto.action as MessageModerationAction } : {}), ...(dto.conversationId ? { case: { conversationId: dto.conversationId } } : {}), ...(dto.fromDate || dto.toDate ? { createdAt: { gte: dto.fromDate ? new Date(dto.fromDate) : undefined, lte: dto.toDate ? new Date(dto.toDate) : undefined } } : {}) }; }
  private orderBy(dto: ListMessageModerationDto): Prisma.MessageModerationCaseOrderByWithRelationInput { const direction = dto.sortOrder === SortOrder.ASC ? 'asc' : 'desc'; if (dto.sortBy === ModerationSortBy.SEVERITY) return { severity: direction }; if (dto.sortBy === ModerationSortBy.LAST_MESSAGE_AT) return { lastMessageAt: direction }; return { createdAt: direction }; }
  private toListItem(row: CaseWithLogs) { const flagReasons = this.stringArray(row.flagTypesJson); return { id: row.conversationId, chatType: this.chatType(row.source), status: this.queueStatus(row.status), severity: row.severity, flaggedMessageCount: 1, lastFlaggedAt: row.lastMessageAt, participants: [{ id: row.participantId, type: row.participantRole, name: row.participantName, avatarUrl: row.participantAvatarUrl }, { id: row.senderId, type: row.senderRole, name: row.senderRole, avatarUrl: null }], lastMessagePreview: this.maskSensitive(row.redactedBody), flagReasons, assignedTo: row.assignedToId }; }
  private toDetail(row: CaseWithLogs) { const flagReasons = this.stringArray(row.flagTypesJson); return { id: row.conversationId, chatType: this.chatType(row.source), status: this.queueStatus(row.status), severity: row.severity, participants: [{ id: row.participantId, type: row.participantRole, name: row.participantName, email: null, avatarUrl: row.participantAvatarUrl }, { id: row.senderId, type: row.senderRole, name: row.senderRole, email: null, avatarUrl: null }], flaggedMessages: [{ id: row.messageId, sender: { id: row.senderId, type: row.senderRole, name: row.senderRole }, body: this.maskSensitive(row.redactedBody), messageType: 'TEXT', flagReasons, severity: row.severity, visibilityStatus: ['BLOCKED', 'ACTION_TAKEN'].includes(row.status) ? 'HIDDEN_BY_MODERATION' : 'VISIBLE', hiddenByModeration: ['BLOCKED', 'ACTION_TAKEN'].includes(row.status), createdAt: row.createdAt }], internalNotes: (row.logs ?? []).filter((log) => log.action === MessageModerationAction.ADD_NOTE).map((log) => ({ id: log.id, note: log.internalNote, actorId: log.actorId, createdAt: log.createdAt })), actionHistory: (row.logs ?? []).filter((log) => log.action !== MessageModerationAction.ADD_NOTE).map((log) => ({ id: log.id, action: log.action, actorId: log.actorId, reason: log.reason, createdAt: log.createdAt })) }; }
  private toAuditLog(row: MessageModerationLog & { case: MessageModerationCase }) { const meta = this.objectJson(row.metadataJson); return { id: row.id, action: row.action, messageId: row.messageId, conversationId: row.case.conversationId, actor: { id: row.actorId, name: null, role: 'ADMIN' }, before: this.objectJson(meta.before), after: this.objectJson(meta.after), createdAt: row.createdAt }; }
  private stringArray(value: Prisma.JsonValue): string[] { return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []; }
  private objectJson(value: Prisma.JsonValue | undefined): Prisma.JsonObject { return value && typeof value === 'object' && !Array.isArray(value) ? value : {}; }
  private isSource(value?: MessageModerationSource | ModerationAll): value is MessageModerationSource { return !!value && value !== ModerationAll.ALL; }
  private isFlagType(value?: MessageModerationFlagType | ModerationAll): value is MessageModerationFlagType { return !!value && value !== ModerationAll.ALL; }
  private scanMetadata(scan: ScanResult): Prisma.InputJsonObject { return { isFlagged: scan.isFlagged, flagTypes: scan.flagTypes, severity: scan.severity, confidence: scan.confidence, redactedBody: scan.redactedBody, keywords: scan.keywords }; }
  private mergeScan(base: ScanResult, hint: ScanResult) { const flagTypes = [...new Set([...base.flagTypes, ...hint.flagTypes])]; const keywords = [...new Set([...base.keywords, ...hint.keywords])]; return { isFlagged: base.isFlagged || hint.isFlagged, flagTypes, severity: hint.severity, confidence: Math.max(base.confidence, hint.confidence), redactedBody: hint.redactedBody || base.redactedBody, keywords }; }
  private sourceFromChatType(type: MessageModerationChatType): MessageModerationSource { if (type === MessageModerationChatType.SUPPORT_CHAT) return MessageModerationSource.ADMIN_SUPPORT_CHAT; if (type === MessageModerationChatType.SYSTEM_REVIEW) return MessageModerationSource.IN_APP_CHAT; return MessageModerationSource.CUSTOMER_PROVIDER_CHAT; }
  private chatType(source: MessageModerationSource): MessageModerationChatType { if (source === MessageModerationSource.ADMIN_SUPPORT_CHAT) return MessageModerationChatType.SUPPORT_CHAT; if (source === MessageModerationSource.CUSTOMER_PROVIDER_CHAT || source === MessageModerationSource.PROVIDER_BUYER_CHAT) return MessageModerationChatType.BUYER_PROVIDER; return MessageModerationChatType.SYSTEM_REVIEW; }
  private statusFromQueue(status: MessageModerationQueueStatus): MessageModerationStatus { const map: Record<MessageModerationQueueStatus, MessageModerationStatus> = { PENDING_REVIEW: MessageModerationStatus.PENDING_REVIEW, ACTION_TAKEN: MessageModerationStatus.ACTION_TAKEN, DISMISSED: MessageModerationStatus.DISMISSED, ESCALATED: MessageModerationStatus.ESCALATED, RESOLVED: MessageModerationStatus.RESOLVED }; return map[status]; }
  private queueStatus(status: MessageModerationStatus): MessageModerationQueueStatus { if (status === MessageModerationStatus.DISMISSED) return MessageModerationQueueStatus.DISMISSED; if (status === MessageModerationStatus.ESCALATED) return MessageModerationQueueStatus.ESCALATED; if (status === MessageModerationStatus.RESOLVED) return MessageModerationQueueStatus.RESOLVED; if (new Set<MessageModerationStatus>([MessageModerationStatus.BLOCKED, MessageModerationStatus.WARNED, MessageModerationStatus.SUSPENDED, MessageModerationStatus.ACTION_TAKEN]).has(status)) return MessageModerationQueueStatus.ACTION_TAKEN; return MessageModerationQueueStatus.PENDING_REVIEW; }
  private maskSensitive(text: string | null): string { return (text ?? '').replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, '[REDACTED_EMAIL]').replace(/\+?\d[\d\s().-]{7,}\d/g, '[REDACTED_PHONE]').replace(/\b\d{12,19}\b/g, '[REDACTED_CARD]'); }
}
