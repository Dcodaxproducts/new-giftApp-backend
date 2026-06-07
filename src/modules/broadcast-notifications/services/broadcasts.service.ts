import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Broadcast, BroadcastChannel, BroadcastPriority, BroadcastStatus, Prisma, UserRole } from '@prisma/client';
import { AuthUserContext } from '../../../common/decorators/current-user.decorator';
import { getPagination } from '../../../common/pagination/pagination.util';
import { AuditLogWriterService } from '../../../common/services/audit-log.service';
import {
  BroadcastActionDto,
  BroadcastManagementAction,
  BroadcastScheduleDto,
  BroadcastScheduleType,
  BroadcastStatusFilter,
  BroadcastTargetingDto,
  BroadcastWizardAction,
  CreateBroadcastDto,
  ListBroadcastsDto,
  ListRecipientsDto,
  RecurrenceFrequency,
  SortOrder,
  TargetingMode,
  UpdateBroadcastDto,
} from '../dto/broadcast-notifications.dto';
import { NotificationsGateway } from '../notifications.gateway';
import { BroadcastNotificationsRepository } from '../repositories/broadcast-notifications.repository';
import { BroadcastRecipientsRepository } from '../repositories/broadcast-recipients.repository';
import { BroadcastQueueService } from './broadcast-queue.service';

interface BroadcastReach {
  total: number;
  email: number;
  push: number;
  inApp: number;
  breakdown: { admins: number; providers: number; registeredUsers: number };
  excluded: { unsubscribed: number; unverifiedEmail: number; inactiveOrSuspended: number };
}

@Injectable()
export class BroadcastsService {
  constructor(
    private readonly broadcastNotificationsRepository: BroadcastNotificationsRepository,
    private readonly broadcastRecipientsRepository: BroadcastRecipientsRepository,
    private readonly auditLog: AuditLogWriterService,
    private readonly queue: BroadcastQueueService,
    private readonly gateway: NotificationsGateway,
  ) {}

  async create(user: AuthUserContext, dto: CreateBroadcastDto) {
    this.assertCreatePermission(user, dto.action);
    this.assertContent(dto.content);
    this.assertTargeting(dto.targeting);
    this.assertSchedule(dto.action, dto.schedule);

    const reach = await this.calculateReach(dto.channels, dto.targeting);
    if (dto.action === BroadcastWizardAction.ESTIMATE_REACH) {
      return { data: { estimatedReach: reach.total }, message: 'Estimated reach calculated successfully.' };
    }

    const data = this.createData(user, dto, reach);
    const broadcast = await this.broadcastNotificationsRepository.createBroadcast(data);
    const detail = this.toDetail(broadcast);
    await this.audit(user, broadcast.id, 'BROADCAST_CREATED', undefined, detail);

    if (dto.action === BroadcastWizardAction.SEND_NOW) {
      await this.queue.enqueueNow(broadcast.id);
      this.gateway.emitEvent('broadcast.processing', { broadcastId: broadcast.id, status: BroadcastStatus.PROCESSING });
      return { data: detail, message: 'Broadcast queued for immediate sending.' };
    }

    if (dto.action === BroadcastWizardAction.SCHEDULE && broadcast.scheduledAt) {
      await this.queue.enqueueScheduled(broadcast.id, broadcast.scheduledAt);
      this.gateway.emitEvent('broadcast.scheduled', detail);
      return { data: detail, message: 'Broadcast scheduled successfully.' };
    }

    this.gateway.emitEvent('broadcast.created', detail);
    return { data: detail, message: 'Broadcast draft saved successfully.' };
  }

  async list(query: ListBroadcastsDto) {
    const { page, limit, skip, take } = getPagination(query);
    const where: Prisma.BroadcastWhereInput = {
      ...(query.search ? { OR: [{ title: { contains: query.search, mode: 'insensitive' } }, { message: { contains: query.search, mode: 'insensitive' } }] } : {}),
      ...(query.status && query.status !== BroadcastStatusFilter.ALL ? { status: query.status } : {}),
      priority: query.priority,
      ...(query.channel ? { channels: { array_contains: query.channel } } : {}),
      ...(query.createdFrom || query.createdTo ? { createdAt: { ...(query.createdFrom ? { gte: new Date(query.createdFrom) } : {}), ...(query.createdTo ? { lte: new Date(query.createdTo) } : {}) } } : {}),
      ...(query.scheduledFrom || query.scheduledTo ? { scheduledAt: { ...(query.scheduledFrom ? { gte: new Date(query.scheduledFrom) } : {}), ...(query.scheduledTo ? { lte: new Date(query.scheduledTo) } : {}) } } : {}),
    };
    const [items, total] = await this.broadcastNotificationsRepository.findBroadcastsAndCount({ where, orderBy: { [query.sortBy ?? 'createdAt']: query.sortOrder === SortOrder.ASC ? 'asc' : 'desc' }, skip, take });
    return { data: items.map((item) => this.toDetail(item)), meta: { page, limit, total, totalPages: Math.ceil(total / limit) }, message: 'Broadcasts fetched successfully' };
  }

  async details(id: string) {
    const broadcast = await this.getBroadcast(id);
    return { data: this.toDetail(broadcast), message: 'Broadcast details fetched successfully' };
  }

  async update(user: AuthUserContext, id: string, dto: UpdateBroadcastDto) {
    const broadcast = await this.getBroadcast(id);
    this.assertEditable(broadcast);
    if (dto.content) this.assertContent({ ...this.toDetail(broadcast).content, ...dto.content });
    if (dto.targeting) this.assertTargeting(dto.targeting);
    if (dto.schedule) this.assertSchedule(BroadcastWizardAction.SAVE_DRAFT, dto.schedule);

    const before = this.toDetail(broadcast);
    const mergedTargeting = dto.targeting ?? this.readTargeting(broadcast.targetingJson);
    const channels = dto.channels ?? this.channels(broadcast.channels);
    const reach = dto.targeting ? await this.calculateReach(channels, dto.targeting) : undefined;
    const updated = await this.broadcastNotificationsRepository.updateBroadcast(id, {
      ...this.contentUpdate(dto.content),
      channels: dto.channels,
      priority: dto.priority,
      ...(dto.targeting ? { targetingJson: this.toJson(dto.targeting), estimatedReachJson: this.toJson(reach) } : {}),
      ...(dto.schedule ? this.scheduleUpdate(dto.schedule, broadcast.status) : {}),
      updatedBy: user.uid,
    });
    const detail = this.toDetail(updated);
    await this.audit(user, id, 'BROADCAST_UPDATED', before, detail);
    if (dto.targeting && mergedTargeting) this.gateway.emitEvent('broadcast.targeting.updated', { broadcastId: id, estimatedReach: detail.estimatedReach });
    this.gateway.emitEvent('broadcast.updated', detail);
    return { data: detail, message: 'Broadcast updated successfully.' };
  }

  async action(user: AuthUserContext, id: string, dto: BroadcastActionDto) {
    const broadcast = await this.getBroadcast(id);
    const before = this.toDetail(broadcast);

    if (dto.action === BroadcastManagementAction.CANCEL) {
      this.assertActionPermission(user, 'broadcasts.cancel');
      if (broadcast.status !== BroadcastStatus.DRAFT && broadcast.status !== BroadcastStatus.SCHEDULED && broadcast.status !== BroadcastStatus.PROCESSING) {
        throw new BadRequestException('Broadcast cannot be cancelled in its current status');
      }
      if (broadcast.status === BroadcastStatus.SCHEDULED) this.assertOutsideThirtyMinuteLock(broadcast);
      const updated = await this.broadcastNotificationsRepository.updateBroadcast(id, { status: BroadcastStatus.CANCELLED, cancelledAt: new Date(), cancelledBy: user.uid, cancelReason: dto.reason });
      await this.queue.cancel();
      const detail = this.toDetail(updated);
      await this.audit(user, id, 'BROADCAST_CANCELLED', before, detail);
      this.gateway.emitEvent('broadcast.cancelled', detail);
      return { data: detail, message: 'Broadcast cancelled successfully.' };
    }

    if (dto.action === BroadcastManagementAction.SEND_NOW) {
      this.assertActionPermission(user, 'broadcasts.send');
      if (broadcast.status !== BroadcastStatus.DRAFT && broadcast.status !== BroadcastStatus.SCHEDULED) {
        throw new BadRequestException('Only draft or scheduled broadcasts can be sent immediately');
      }
      const updated = await this.broadcastNotificationsRepository.updateBroadcast(id, { status: BroadcastStatus.PROCESSING, sendMode: 'NOW', scheduledAt: null, updatedBy: user.uid });
      await this.queue.enqueueNow(id);
      const detail = this.toDetail(updated);
      await this.audit(user, id, 'BROADCAST_SENT_NOW', before, detail);
      this.gateway.emitEvent('broadcast.processing', { broadcastId: id, status: BroadcastStatus.PROCESSING });
      return { data: detail, message: 'Broadcast queued for immediate sending.' };
    }

    throw new BadRequestException('ARCHIVE action is not supported for broadcasts');
  }

  async report(user: AuthUserContext, id: string) {
    const broadcast = await this.getBroadcast(id);
    const deliveries = await this.broadcastRecipientsRepository.findBroadcastDeliveries({ broadcastId: id });
    const summary = this.deliverySummary(deliveries);
    const channels = Object.fromEntries(Object.values(BroadcastChannel).map((channel) => [channel, this.deliverySummary(deliveries.filter((item) => item.channel === channel))]));
    const data = { broadcastId: id, status: broadcast.status, summary, channels, startedAt: broadcast.startedAt, completedAt: broadcast.completedAt };
    await this.audit(user, id, 'BROADCAST_REPORT_VIEWED', undefined, data);
    return { data, message: 'Broadcast delivery report fetched successfully' };
  }

  async recipients(id: string, query: ListRecipientsDto) {
    await this.getBroadcast(id);
    const { page, limit, skip, take } = getPagination(query);
    const where: Prisma.BroadcastDeliveryWhereInput = { broadcastId: id, channel: query.channel, status: query.status, ...(query.search ? { email: { contains: query.search, mode: 'insensitive' } } : {}) };
    const [items, total] = await this.broadcastRecipientsRepository.findDeliveriesAndCount({ where, orderBy: { createdAt: 'desc' }, skip, take });
    return { data: items.map((item) => ({ id: item.id, recipientId: item.recipientId, recipientType: item.recipientType, recipientEmail: item.email, channel: item.channel, status: item.status, failureReason: item.failureReason, sentAt: item.sentAt, deliveredAt: item.deliveredAt })), meta: { page, limit, total, totalPages: Math.ceil(total / limit) }, message: 'Broadcast recipients fetched successfully' };
  }

  private createData(user: AuthUserContext, dto: CreateBroadcastDto, reach: BroadcastReach): Prisma.BroadcastUncheckedCreateInput {
    return {
      title: dto.content.title.trim(),
      message: dto.content.message.trim(),
      imageUrl: dto.content.imageUrl,
      ctaLabel: dto.content.ctaLabel,
      ctaUrl: dto.content.ctaUrl,
      channels: dto.channels,
      priority: dto.priority ?? BroadcastPriority.NORMAL,
      status: dto.action === BroadcastWizardAction.SEND_NOW ? BroadcastStatus.PROCESSING : dto.action === BroadcastWizardAction.SCHEDULE ? BroadcastStatus.SCHEDULED : BroadcastStatus.DRAFT,
      targetingJson: this.toJson(dto.targeting),
      estimatedReachJson: this.toJson(reach),
      sendMode: dto.action === BroadcastWizardAction.SCHEDULE ? 'SCHEDULED' : 'NOW',
      scheduledAt: dto.action === BroadcastWizardAction.SCHEDULE && dto.schedule.sendAt ? new Date(dto.schedule.sendAt) : null,
      timezone: dto.schedule.timezone ?? 'UTC',
      isRecurring: dto.schedule.recurring?.enabled ?? false,
      recurrenceJson: this.recurrenceJson(dto.schedule),
      createdBy: user.uid,
    };
  }

  private contentUpdate(content: UpdateBroadcastDto['content']): Prisma.BroadcastUncheckedUpdateInput {
    if (!content) return {};
    return {
      title: content.title?.trim(),
      message: content.message?.trim(),
      imageUrl: content.imageUrl,
      ctaLabel: content.ctaLabel,
      ctaUrl: content.ctaUrl,
    };
  }

  private scheduleUpdate(schedule: BroadcastScheduleDto, currentStatus: BroadcastStatus): Prisma.BroadcastUncheckedUpdateInput {
    if (schedule.type === BroadcastScheduleType.SEND_NOW) {
      return { sendMode: 'NOW', scheduledAt: null, timezone: schedule.timezone ?? 'UTC', isRecurring: false, recurrenceJson: Prisma.JsonNull, status: currentStatus === BroadcastStatus.SCHEDULED ? BroadcastStatus.DRAFT : currentStatus };
    }
    return {
      sendMode: 'SCHEDULED',
      scheduledAt: schedule.sendAt ? new Date(schedule.sendAt) : undefined,
      timezone: schedule.timezone ?? 'UTC',
      isRecurring: schedule.recurring?.enabled ?? false,
      recurrenceJson: this.recurrenceJson(schedule),
      status: BroadcastStatus.SCHEDULED,
    };
  }

  private async calculateReach(channels: BroadcastChannel[], targeting: BroadcastTargetingDto) {
    const roles = targeting.mode === TargetingMode.SPECIFIC_ROLES && targeting.roles?.length ? targeting.roles : ['ADMIN', 'PROVIDER', 'REGISTERED_USER'];
    const where: Prisma.UserWhereInput = { role: { in: roles as UserRole[] }, deletedAt: null, deleteAfter: null, isActive: true, suspendedAt: null, ...(targeting.filters?.onlyVerifiedEmails ? { isVerified: true } : {}) };
    const { admins, providers, registeredUsers, pushTokens } = await this.broadcastRecipientsRepository.countReachByRole(where);
    const total = admins + providers + registeredUsers;
    return { total, email: channels.includes(BroadcastChannel.EMAIL) ? total : 0, push: channels.includes(BroadcastChannel.PUSH) ? pushTokens : 0, inApp: channels.includes(BroadcastChannel.IN_APP) ? total : 0, breakdown: { admins, providers, registeredUsers }, excluded: { unsubscribed: 0, unverifiedEmail: 0, inactiveOrSuspended: 0 } };
  }

  private async getBroadcast(id: string): Promise<Broadcast> {
    const broadcast = await this.broadcastNotificationsRepository.findBroadcastById(id);
    if (!broadcast) throw new NotFoundException('Broadcast not found');
    return broadcast;
  }

  private assertEditable(broadcast: Broadcast): void {
    if (broadcast.status !== BroadcastStatus.DRAFT && broadcast.status !== BroadcastStatus.SCHEDULED) throw new BadRequestException('Broadcast cannot be edited after processing starts');
    if (broadcast.status === BroadcastStatus.SCHEDULED) this.assertOutsideThirtyMinuteLock(broadcast);
  }

  private assertContent(content: { ctaLabel?: string | null; ctaUrl?: string | null }): void {
    if (content.ctaLabel && !content.ctaUrl) throw new BadRequestException('ctaUrl is required when ctaLabel is provided');
  }

  private assertTargeting(targeting: BroadcastTargetingDto): void {
    if (targeting.mode === TargetingMode.SPECIFIC_ROLES && !targeting.roles?.length) throw new BadRequestException('roles are required for SPECIFIC_ROLES targeting');
    if (targeting.filters?.location) throw new BadRequestException('LOCATION_FILTER_NOT_SUPPORTED');
  }

  private assertSchedule(action: BroadcastWizardAction, schedule: BroadcastScheduleDto): void {
    const isScheduleAction = action === BroadcastWizardAction.SCHEDULE;
    if (isScheduleAction && schedule.type !== BroadcastScheduleType.SCHEDULED) throw new BadRequestException('schedule.type must be SCHEDULED for SCHEDULE action');
    if (schedule.type === BroadcastScheduleType.SCHEDULED && !schedule.sendAt) throw new BadRequestException('sendAt is required for scheduled broadcasts');
    if (schedule.sendAt && new Date(schedule.sendAt).getTime() <= Date.now()) throw new BadRequestException('sendAt must be in the future');
    if (schedule.recurring?.enabled && !schedule.recurring.frequency) throw new BadRequestException('recurring.frequency is required when recurring is enabled');
  }

  private assertOutsideThirtyMinuteLock(broadcast: Broadcast): void {
    if (broadcast.scheduledAt && broadcast.scheduledAt.getTime() - Date.now() < 30 * 60 * 1000) throw new BadRequestException('Scheduled broadcast is locked within 30 minutes of sendAt');
  }

  private channels(value: Prisma.JsonValue): BroadcastChannel[] {
    return Array.isArray(value) ? value.filter((item): item is BroadcastChannel => Object.values(BroadcastChannel).includes(item as BroadcastChannel)) : [];
  }

  private toDetail(broadcast: Broadcast) {
    const recurring = this.readRecurring(broadcast.recurrenceJson, broadcast.isRecurring);
    return {
      id: broadcast.id,
      status: broadcast.status,
      estimatedReach: this.readEstimatedReach(broadcast.estimatedReachJson),
      content: { title: broadcast.title, message: broadcast.message, imageUrl: broadcast.imageUrl, ctaLabel: broadcast.ctaLabel, ctaUrl: broadcast.ctaUrl },
      channels: this.channels(broadcast.channels),
      priority: broadcast.priority,
      targeting: broadcast.targetingJson,
      schedule: { type: broadcast.sendMode === 'SCHEDULED' ? BroadcastScheduleType.SCHEDULED : BroadcastScheduleType.SEND_NOW, sendAt: broadcast.scheduledAt, timezone: broadcast.timezone ?? 'UTC', recurring },
      createdBy: broadcast.createdBy,
      createdAt: broadcast.createdAt,
    };
  }

  private readEstimatedReach(value: Prisma.JsonValue): number {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return 0;
    const total = (value as Record<string, unknown>).total;
    return typeof total === 'number' ? total : 0;
  }

  private readRecurring(value: Prisma.JsonValue, enabled: boolean): { enabled: boolean; frequency: RecurrenceFrequency | null } {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return { enabled, frequency: null };
    const frequency = (value as Record<string, unknown>).frequency;
    return { enabled, frequency: Object.values(RecurrenceFrequency).includes(frequency as RecurrenceFrequency) ? frequency as RecurrenceFrequency : null };
  }

  private readTargeting(value: Prisma.JsonValue): BroadcastTargetingDto | undefined {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
    return value as unknown as BroadcastTargetingDto;
  }

  private recurrenceJson(schedule: BroadcastScheduleDto): Prisma.InputJsonValue | typeof Prisma.JsonNull {
    if (!schedule.recurring?.enabled) return Prisma.JsonNull;
    return this.toJson({ frequency: schedule.recurring.frequency });
  }

  private deliverySummary(deliveries: { status: string; openedAt: Date | null; clickedAt: Date | null }[]) {
    return { targeted: deliveries.length, queued: deliveries.length, sent: deliveries.filter((d) => ['SENT', 'DELIVERED', 'OPENED', 'CLICKED'].includes(d.status)).length, delivered: deliveries.filter((d) => ['DELIVERED', 'OPENED', 'CLICKED'].includes(d.status)).length, failed: deliveries.filter((d) => d.status === 'FAILED').length, opened: deliveries.filter((d) => d.openedAt).length, clicked: deliveries.filter((d) => d.clickedAt).length };
  }

  private toJson(value: unknown): Prisma.InputJsonValue {
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
  }

  private assertCreatePermission(user: AuthUserContext, action: BroadcastWizardAction): void {
    const required = action === BroadcastWizardAction.ESTIMATE_REACH ? 'broadcasts.read' : 'broadcasts.create';
    this.assertActionPermission(user, required);
  }

  private assertActionPermission(user: AuthUserContext, permission: string): void {
    if (user.role === UserRole.SUPER_ADMIN || this.hasPermission(user, permission)) return;
    throw new ForbiddenException('Your role does not have the required broadcast permission');
  }

  private hasPermission(user: AuthUserContext, permission: string): boolean {
    if (!user.permissions || typeof user.permissions !== 'object' || Array.isArray(user.permissions)) return false;
    const [module, key] = permission.split('.');
    const values = user.permissions[module];
    return Array.isArray(values) && values.includes(key);
  }

  private async audit(user: AuthUserContext, targetId: string, action: string, beforeJson: unknown, afterJson: unknown): Promise<void> {
    await this.auditLog.write({ actorId: user.uid, actorType: user.role, targetId, targetType: 'BROADCAST', action, beforeJson, afterJson });
  }
}
