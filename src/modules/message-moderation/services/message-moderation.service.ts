import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { MessageModerationAction, MessageModerationCase, MessageModerationFlagType, MessageModerationLog, MessageModerationSeverity, MessageModerationSource, MessageModerationStatus, Prisma, UserRole } from '@prisma/client';
import { AuthUserContext } from '../../../common/decorators/current-user.decorator';
import { BlockMessageDto, DismissFlagDto, InternalNoteDto, ListMessageModerationDto, ModerationAll, ModerationSortBy, ReprocessMessageDto, SortOrder, SuspendAccountDto, WarnUserDto } from '../dto/message-moderation.dto';
import { MessageModerationRepository } from '../repositories/message-moderation.repository';
import { MessageModerationScanner } from './message-moderation-scanner.service';

type SourceMessageInput = { source: MessageModerationSource; conversationId: string; messageId: string; participantId: string; participantRole: string; participantName?: string | null; participantAvatarUrl?: string | null; externalReference?: string | null; senderId: string; senderRole: string; body?: string | null; createdAt?: Date };
type CaseWithLogs = MessageModerationCase & { logs?: MessageModerationLog[] };
type ActionMetadata = { notifyUser?: boolean; warningMessage?: string; duration?: string; suspendUntil?: string };

@Injectable()
export class MessageModerationService {
  constructor(private readonly repository: MessageModerationRepository, private readonly scanner: MessageModerationScanner) {}

  async scanCreatedMessage(input: SourceMessageInput) {
    const scan = this.scanner.scanMessage({ body: input.body });
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
      lastMessageAt: createdAt,
    });
    await this.repository.runAction((tx) => this.repository.createLog(tx, { caseId: moderationCase.id, messageId: input.messageId, action: MessageModerationAction.FLAGGED, reason: 'AUTO_SCAN', metadata: this.scanMetadata(scan) }));
    return { flagged: true, caseId: moderationCase.id };
  }

  async list(dto: ListMessageModerationDto) {
    const page = dto.page ?? 1; const limit = dto.limit ?? 20;
    const where = this.buildWhere(dto); const orderBy = this.orderBy(dto);
    const [rows, total] = await this.repository.findCasesAndCount({ where, skip: (page - 1) * limit, take: limit, orderBy });
    return { data: rows.map((row) => this.toListItem(row)), meta: { page, limit, total, totalPages: Math.ceil(total / limit) }, message: 'Message moderation conversations fetched successfully.' };
  }

  async detail(id: string, canUnmask = false) { const found = await this.repository.findCase(id); if (!found) throw new NotFoundException('Message moderation conversation not found'); return { data: this.toDetail(found, canUnmask), message: 'Message moderation conversation fetched successfully.' }; }
  async history(id: string) { const found = await this.repository.findCase(id); if (!found) throw new NotFoundException('Message moderation conversation not found'); const rows = await this.repository.findConversationHistory(found.conversationId); return { data: rows.map((row) => this.toDetail(row, false)), message: 'Message moderation history fetched successfully.' }; }
  async stats() { const rows = await this.repository.stats(); return { data: { rows }, message: 'Message moderation stats fetched successfully.' }; }
  filterOptions() { return { data: { sources: Object.values(MessageModerationSource), flagTypes: Object.values(MessageModerationFlagType), statuses: Object.values(MessageModerationStatus), severities: Object.values(MessageModerationSeverity) }, message: 'Message moderation filter options fetched successfully.' }; }
  async export(dto: ListMessageModerationDto) { const rows = await this.repository.exportRows(this.buildWhere(dto)); return { data: rows.map((row) => this.toListItem(row)), message: 'Message moderation export fetched successfully.' }; }

  block(user: AuthUserContext, messageId: string, dto: BlockMessageDto) { return this.action(user, messageId, MessageModerationStatus.BLOCKED, MessageModerationAction.BLOCK_MESSAGE, dto.reason, dto.internalNote, { notifyUser: dto.notifyUser }); }
  warn(user: AuthUserContext, messageId: string, dto: WarnUserDto) { return this.action(user, messageId, MessageModerationStatus.WARNED, MessageModerationAction.WARN_USER, dto.reason, dto.internalNote, { warningMessage: dto.warningMessage, notifyUser: dto.notifyUser }); }
  dismiss(user: AuthUserContext, messageId: string, dto: DismissFlagDto) { return this.action(user, messageId, MessageModerationStatus.DISMISSED, MessageModerationAction.DISMISS_FLAG, dto.reason, dto.internalNote); }
  note(user: AuthUserContext, messageId: string, dto: InternalNoteDto) { return this.action(user, messageId, MessageModerationStatus.UNDER_REVIEW, MessageModerationAction.ADD_NOTE, 'INTERNAL_NOTE', dto.note); }

  async suspend(user: AuthUserContext, messageId: string, dto: SuspendAccountDto) {
    const moderationCase = await this.getCaseByMessage(messageId); const target = await this.repository.findUser(moderationCase.senderId);
    if (!target) throw new NotFoundException('Message sender not found');
    if (target.role === UserRole.ADMIN || target.role === UserRole.SUPER_ADMIN) throw new ForbiddenException('Admin and Super Admin accounts cannot be suspended from message moderation.');
    await this.repository.runAction(async (tx) => { await this.repository.suspendUser(tx, { userId: target.id, actorId: user.uid, reason: dto.reason, note: dto.internalNote }); await this.repository.updateStatus(tx, messageId, MessageModerationStatus.SUSPENDED); await this.repository.createLog(tx, { caseId: moderationCase.id, messageId, action: MessageModerationAction.SUSPEND_ACCOUNT, reason: dto.reason, internalNote: dto.internalNote, actorId: user.uid, metadata: this.actionMetadata({ duration: dto.duration, suspendUntil: dto.suspendUntil, notifyUser: dto.notifyUser }) }); await this.repository.createAuditLog(tx, { actorId: user.uid, action: 'message_moderation.suspend_account', entityId: moderationCase.id }); if (dto.notifyUser) await this.repository.createNotification(tx, target.id, { title: 'Account suspended', body: 'Your account has been suspended after message moderation review.' }); });
    return { data: { messageId, status: MessageModerationStatus.SUSPENDED }, message: 'Account suspended successfully.' };
  }

  async reprocess(user: AuthUserContext, messageId: string, dto: ReprocessMessageDto) {
    const moderationCase = await this.getCaseByMessage(messageId); const scan = this.scanner.scanMessage({ body: moderationCase.rawBody ?? moderationCase.redactedBody });
    if (scan.isFlagged) await this.repository.upsertFlaggedCase({ conversationId: moderationCase.conversationId, messageId, source: moderationCase.source, participantId: moderationCase.participantId, participantRole: moderationCase.participantRole, participantName: moderationCase.participantName, participantAvatarUrl: moderationCase.participantAvatarUrl, externalReference: moderationCase.externalReference, senderId: moderationCase.senderId, senderRole: moderationCase.senderRole, rawBody: moderationCase.rawBody, redactedBody: scan.redactedBody, flagTypesJson: scan.flagTypes, keywordsJson: scan.keywords, severity: scan.severity, confidence: new Prisma.Decimal(scan.confidence), lastMessageAt: moderationCase.lastMessageAt });
    await this.repository.runAction(async (tx) => { await this.repository.createLog(tx, { caseId: moderationCase.id, messageId, action: MessageModerationAction.REPROCESS, reason: dto.reason, actorId: user.uid, metadata: this.scanMetadata(scan) }); await this.repository.createAuditLog(tx, { actorId: user.uid, action: 'message_moderation.reprocess', entityId: moderationCase.id }); });
    return { data: { messageId, isFlagged: scan.isFlagged }, message: 'Message reprocessed successfully.' };
  }

  private async action(user: AuthUserContext, messageId: string, status: MessageModerationStatus, action: MessageModerationAction, reason: string, internalNote?: string, metadata?: ActionMetadata) {
    const moderationCase = await this.getCaseByMessage(messageId);
    await this.repository.runAction(async (tx) => { await this.repository.updateStatus(tx, messageId, status); await this.repository.createLog(tx, { caseId: moderationCase.id, messageId, action, reason, internalNote, actorId: user.uid, metadata: metadata ? this.actionMetadata(metadata) : undefined }); await this.repository.createAuditLog(tx, { actorId: user.uid, action: `message_moderation.${action.toLowerCase()}`, entityId: moderationCase.id }); if (action === MessageModerationAction.WARN_USER && metadata?.notifyUser) await this.repository.createNotification(tx, moderationCase.senderId, { title: 'Message warning', body: metadata.warningMessage ?? 'Please keep conversations respectful.' }); });
    return { data: { messageId, status }, message: 'Message moderation action completed successfully.' };
  }

  private async getCaseByMessage(messageId: string) { const found = await this.repository.findCaseByMessage(messageId); if (!found) throw new NotFoundException('Message moderation case not found'); return found; }
  private buildWhere(dto: ListMessageModerationDto): Prisma.MessageModerationCaseWhereInput { const where: Prisma.MessageModerationCaseWhereInput = {}; if (this.isSource(dto.source)) where.source = dto.source; if (this.isStatus(dto.status)) where.status = dto.status; if (this.isSeverity(dto.severity)) where.severity = dto.severity; if (dto.assignedToId) where.assignedToId = dto.assignedToId; if (this.isFlagType(dto.flagType)) where.flagTypesJson = { array_contains: dto.flagType }; if (dto.search) where.OR = [{ participantName: { contains: dto.search, mode: 'insensitive' } }, { externalReference: { contains: dto.search, mode: 'insensitive' } }, { redactedBody: { contains: dto.search, mode: 'insensitive' } }]; if (dto.fromDate || dto.toDate) where.createdAt = { gte: dto.fromDate ? new Date(dto.fromDate) : undefined, lte: dto.toDate ? new Date(dto.toDate) : undefined }; return where; }
  private orderBy(dto: ListMessageModerationDto): Prisma.MessageModerationCaseOrderByWithRelationInput { const direction = dto.sortOrder === SortOrder.ASC ? 'asc' : 'desc'; if (dto.sortBy === ModerationSortBy.SEVERITY) return { severity: direction }; if (dto.sortBy === ModerationSortBy.LAST_MESSAGE_AT) return { lastMessageAt: direction }; return { createdAt: direction }; }
  private toListItem(row: MessageModerationCase) { const flagTypes = this.stringArray(row.flagTypesJson); return { id: row.id, participant: { id: row.participantId, name: row.participantName, avatarUrl: row.participantAvatarUrl, externalReference: row.externalReference }, source: row.source, flag: { type: flagTypes[0] ?? 'OTHER', label: `${flagTypes[0] ?? 'Other'} Detected`, severity: row.severity, confidence: Number(row.confidence) }, preview: row.redactedBody, status: row.status, lastMessageAt: row.lastMessageAt, timeAgo: this.timeAgo(row.lastMessageAt) }; }
  private toDetail(row: CaseWithLogs, canUnmask: boolean) { const flagTypes = this.stringArray(row.flagTypesJson); const keywords = this.stringArray(row.keywordsJson); return { id: row.id, participant: { id: row.participantId, name: row.participantName, avatarUrl: row.participantAvatarUrl, externalReference: row.externalReference, profileType: row.participantRole, status: 'ACTIVE' }, source: row.source, startedAt: row.createdAt, flagSummary: { title: `Flagged by AI: ${flagTypes.join(' & ') || 'Other'}`, description: `The system detected a ${Number(row.confidence)} confidence probability of harmful content.`, confidence: Number(row.confidence), flagTypes, keywords, flaggedAt: row.createdAt }, messages: [{ id: row.messageId, senderType: row.senderRole, body: canUnmask ? row.rawBody : null, redactedBody: row.redactedBody, isFlagged: true, flag: { type: flagTypes[0] ?? 'OTHER', severity: row.severity, confidence: Number(row.confidence), status: row.status }, createdAt: row.createdAt }], internalNotes: (row.logs ?? []).filter((log) => log.action === MessageModerationAction.ADD_NOTE).map((log) => ({ id: log.id, note: log.internalNote, actorId: log.actorId, createdAt: log.createdAt })) }; }
  private stringArray(value: Prisma.JsonValue): string[] { return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []; }
  private isSource(value?: MessageModerationSource | ModerationAll): value is MessageModerationSource { return !!value && value !== ModerationAll.ALL; }
  private isStatus(value?: MessageModerationStatus | ModerationAll): value is MessageModerationStatus { return !!value && value !== ModerationAll.ALL; }
  private isSeverity(value?: MessageModerationSeverity | ModerationAll): value is MessageModerationSeverity { return !!value && value !== ModerationAll.ALL; }
  private isFlagType(value?: MessageModerationFlagType | ModerationAll): value is MessageModerationFlagType { return !!value && value !== ModerationAll.ALL; }
  private scanMetadata(scan: { isFlagged: boolean; flagTypes: MessageModerationFlagType[]; severity: MessageModerationSeverity; confidence: number; redactedBody: string; keywords: string[] }): Prisma.InputJsonObject { return { isFlagged: scan.isFlagged, flagTypes: scan.flagTypes, severity: scan.severity, confidence: scan.confidence, redactedBody: scan.redactedBody, keywords: scan.keywords }; }
  private actionMetadata(metadata: ActionMetadata): Prisma.InputJsonObject { return { notifyUser: metadata.notifyUser ?? false, warningMessage: metadata.warningMessage ?? null, duration: metadata.duration ?? null, suspendUntil: metadata.suspendUntil ?? null }; }
  private timeAgo(date: Date) { const minutes = Math.max(0, Math.round((Date.now() - new Date(date).getTime()) / 60000)); if (minutes < 1) return 'now'; if (minutes < 60) return `${minutes}m ago`; const hours = Math.round(minutes / 60); return hours < 24 ? `${hours}h ago` : `${Math.round(hours / 24)}d ago`; }

}
