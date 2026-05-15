import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Broadcast, BroadcastChannel, BroadcastPriority, BroadcastStatus, Prisma, UserRole } from '@prisma/client';
import { AuthUserContext } from '../../common/decorators/current-user.decorator';
import { AuditLogWriterService } from '../../common/services/audit-log.service';
import { BroadcastNotificationsRepository } from './broadcast-notifications.repository';
import { BroadcastRecipientsRepository } from './broadcast-recipients.repository';
import { BroadcastQueueService } from './broadcast-queue.service';
import { NotificationsGateway } from './notifications.gateway';
import {
  BroadcastStatusFilter,
  BroadcastTargetingDto,
  CancelBroadcastDto,
  CreateBroadcastDto,
  EstimateReachDto,
  ListBroadcastsDto,
  ListRecipientsDto,
  ScheduleBroadcastDto,
  SendMode,
  SortOrder,
  TargetingMode,
  UpdateBroadcastDto,
} from './dto/broadcast-notifications.dto';

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
    const broadcast = await this.broadcastNotificationsRepository.createBroadcast({ title: dto.title.trim(), message: dto.message.trim(), imageUrl: dto.imageUrl, ctaLabel: dto.ctaLabel, ctaUrl: dto.ctaUrl, channels: dto.channels, priority: dto.priority ?? BroadcastPriority.NORMAL, status: BroadcastStatus.DRAFT, createdBy: user.uid });
    await this.audit(user.uid, broadcast.id, 'BROADCAST_CREATED', undefined, this.toDetail(broadcast));
    this.gateway.emitEvent('broadcast.created', this.toDetail(broadcast));
    return { data: this.toDetail(broadcast), message: 'Broadcast draft created successfully' };
  }

  async list(query: ListBroadcastsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const where: Prisma.BroadcastWhereInput = {
      ...(query.search ? { OR: [{ title: { contains: query.search, mode: 'insensitive' } }, { message: { contains: query.search, mode: 'insensitive' } }] } : {}),
      ...(query.status && query.status !== BroadcastStatusFilter.ALL ? { status: query.status } : {}),
      priority: query.priority,
      ...(query.channel ? { channels: { array_contains: query.channel } } : {}),
      ...(query.createdFrom || query.createdTo ? { createdAt: { ...(query.createdFrom ? { gte: new Date(query.createdFrom) } : {}), ...(query.createdTo ? { lte: new Date(query.createdTo) } : {}) } } : {}),
      ...(query.scheduledFrom || query.scheduledTo ? { scheduledAt: { ...(query.scheduledFrom ? { gte: new Date(query.scheduledFrom) } : {}), ...(query.scheduledTo ? { lte: new Date(query.scheduledTo) } : {}) } } : {}),
    };
    const [items, total] = await this.broadcastNotificationsRepository.findBroadcastsAndCount({ where, orderBy: { [query.sortBy ?? 'createdAt']: query.sortOrder === SortOrder.ASC ? 'asc' : 'desc' }, skip: (page - 1) * limit, take: limit });
    return { data: items.map((item) => this.toDetail(item)), meta: { page, limit, total, totalPages: Math.ceil(total / limit) }, message: 'Broadcasts fetched successfully' };
  }

  async details(id: string) {
    const broadcast = await this.getBroadcast(id);
    return { data: this.toDetail(broadcast), message: 'Broadcast details fetched successfully' };
  }

  async update(user: AuthUserContext, id: string, dto: UpdateBroadcastDto) {
    const broadcast = await this.getBroadcast(id);
    this.assertEditable(broadcast);
    const before = this.toDetail(broadcast);
    const updated = await this.broadcastNotificationsRepository.updateBroadcast(id, { title: dto.title?.trim(), message: dto.message?.trim(), imageUrl: dto.imageUrl, ctaLabel: dto.ctaLabel, ctaUrl: dto.ctaUrl, channels: dto.channels, priority: dto.priority, updatedBy: user.uid });
    await this.audit(user.uid, id, 'BROADCAST_UPDATED', before, this.toDetail(updated));
    this.gateway.emitEvent('broadcast.updated', this.toDetail(updated));
    return { data: this.toDetail(updated), message: 'Broadcast updated successfully' };
  }

  async estimateReach(dto: EstimateReachDto) {
    const data = await this.calculateReach(dto.channels, dto.targeting);
    return { data, message: 'Estimated reach calculated successfully' };
  }

  async updateTargeting(user: AuthUserContext, id: string, dto: BroadcastTargetingDto) {
    const broadcast = await this.getBroadcast(id);
    this.assertEditable(broadcast);
    const channels = this.channels(broadcast.channels);
    const reach = await this.calculateReach(channels, dto);
    const updated = await this.broadcastNotificationsRepository.updateBroadcastTargeting(id, {
      targetingJson: this.toJson(dto),
      estimatedReachJson: this.toJson(reach),
      updatedBy: user.uid,
    });
    await this.audit(user.uid, id, 'BROADCAST_TARGETING_UPDATED', this.toDetail(broadcast), this.toDetail(updated));
    return { data: this.toDetail(updated), message: 'Broadcast targeting updated successfully' };
  }

  async schedule(user: AuthUserContext, id: string, dto: ScheduleBroadcastDto) {
    const broadcast = await this.getBroadcast(id);
    this.assertEditable(broadcast);
    this.assertSchedulePermission(user, dto.sendMode);
    if (dto.sendMode === SendMode.NOW) {
      const updated = await this.broadcastNotificationsRepository.scheduleBroadcast(id, { sendMode: 'NOW', status: BroadcastStatus.PROCESSING, updatedBy: user.uid });
      await this.audit(user.uid, id, 'BROADCAST_SENT_NOW', this.toDetail(broadcast), this.toDetail(updated));
      await this.queue.enqueueNow(id);
      this.gateway.emitEvent('broadcast.processing', { broadcastId: id, status: BroadcastStatus.PROCESSING });
      return { data: this.toDetail(updated), message: 'Broadcast queued for immediate sending' };
    }

    if (!dto.scheduledAt) throw new BadRequestException('scheduledAt is required');
    const scheduledAt = new Date(dto.scheduledAt);
    if (scheduledAt.getTime() <= Date.now()) throw new BadRequestException('scheduledAt cannot be in the past');
    const updated = await this.broadcastNotificationsRepository.scheduleBroadcast(id, { sendMode: 'SCHEDULED', status: BroadcastStatus.SCHEDULED, scheduledAt, timezone: dto.timezone ?? 'UTC', isRecurring: dto.isRecurring ?? false, recurrenceJson: dto.recurrence, updatedBy: user.uid });
    await this.audit(user.uid, id, 'BROADCAST_SCHEDULED', this.toDetail(broadcast), this.toDetail(updated));
    await this.queue.enqueueScheduled(id, scheduledAt);
    this.gateway.emitEvent('broadcast.scheduled', this.toDetail(updated));
    return { data: this.toDetail(updated), message: 'Broadcast scheduled successfully' };
  }

  async cancel(user: AuthUserContext, id: string, dto: CancelBroadcastDto) {
    const broadcast = await this.getBroadcast(id);
    if (broadcast.status !== BroadcastStatus.SCHEDULED) throw new BadRequestException('Only scheduled broadcasts can be cancelled');
    this.assertOutsideThirtyMinuteLock(broadcast);
    const updated = await this.broadcastNotificationsRepository.cancelBroadcast(id, { status: BroadcastStatus.CANCELLED, cancelledAt: new Date(), cancelledBy: user.uid, cancelReason: dto.reason });
    await this.queue.cancel();
    await this.audit(user.uid, id, 'BROADCAST_CANCELLED', this.toDetail(broadcast), this.toDetail(updated));
    this.gateway.emitEvent('broadcast.cancelled', this.toDetail(updated));
    return { data: this.toDetail(updated), message: 'Broadcast cancelled successfully' };
  }

  async report(user: AuthUserContext, id: string) {
    const broadcast = await this.getBroadcast(id);
    const deliveries = await this.broadcastRecipientsRepository.findBroadcastDeliveries({ broadcastId: id });
    const summary = this.deliverySummary(deliveries);
    const channels = Object.fromEntries(Object.values(BroadcastChannel).map((channel) => [channel, this.deliverySummary(deliveries.filter((item) => item.channel === channel))]));
    const data = { broadcastId: id, status: broadcast.status, summary, channels, startedAt: broadcast.startedAt, completedAt: broadcast.completedAt };
    await this.audit(user.uid, id, 'BROADCAST_REPORT_VIEWED', undefined, data);
    return { data, message: 'Broadcast delivery report fetched successfully' };
  }

  async recipients(id: string, query: ListRecipientsDto) {
    await this.getBroadcast(id);
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const where: Prisma.BroadcastDeliveryWhereInput = { broadcastId: id, channel: query.channel, status: query.status, ...(query.search ? { email: { contains: query.search, mode: 'insensitive' } } : {}) };
    const [items, total] = await this.broadcastRecipientsRepository.findDeliveriesAndCount({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit });
    return { data: items.map((item) => ({ id: item.id, recipientId: item.recipientId, recipientType: item.recipientType, recipientEmail: item.email, channel: item.channel, status: item.status, failureReason: item.failureReason, sentAt: item.sentAt, deliveredAt: item.deliveredAt })), meta: { page, limit, total, totalPages: Math.ceil(total / limit) }, message: 'Broadcast recipients fetched successfully' };
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
  private assertOutsideThirtyMinuteLock(broadcast: Broadcast): void { if (broadcast.scheduledAt && broadcast.scheduledAt.getTime() - Date.now() < 30 * 60 * 1000) throw new BadRequestException('Scheduled broadcast is locked within 30 minutes of scheduledAt'); }
  private channels(value: Prisma.JsonValue): BroadcastChannel[] { return Array.isArray(value) ? value.filter((item): item is BroadcastChannel => Object.values(BroadcastChannel).includes(item as BroadcastChannel)) : []; }
  private toDetail(broadcast: Broadcast) { return { id: broadcast.id, title: broadcast.title, message: broadcast.message, imageUrl: broadcast.imageUrl, ctaLabel: broadcast.ctaLabel, ctaUrl: broadcast.ctaUrl, channels: this.channels(broadcast.channels), priority: broadcast.priority, status: broadcast.status, targeting: broadcast.targetingJson, estimatedReach: broadcast.estimatedReachJson, schedule: { sendMode: broadcast.sendMode, scheduledAt: broadcast.scheduledAt, timezone: broadcast.timezone, isRecurring: broadcast.isRecurring, recurrence: broadcast.recurrenceJson }, createdBy: broadcast.createdBy, createdAt: broadcast.createdAt }; }
  private deliverySummary(deliveries: { status: string; openedAt: Date | null; clickedAt: Date | null }[]) { return { targeted: deliveries.length, queued: deliveries.length, sent: deliveries.filter((d) => ['SENT', 'DELIVERED', 'OPENED', 'CLICKED'].includes(d.status)).length, delivered: deliveries.filter((d) => ['DELIVERED', 'OPENED', 'CLICKED'].includes(d.status)).length, failed: deliveries.filter((d) => d.status === 'FAILED').length, opened: deliveries.filter((d) => d.openedAt).length, clicked: deliveries.filter((d) => d.clickedAt).length }; }
  private toJson(value: unknown): Prisma.InputJsonValue {
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
  }

  private assertSchedulePermission(user: AuthUserContext, sendMode: SendMode): void {
    const required = sendMode === SendMode.NOW ? 'broadcasts.send' : 'broadcasts.schedule';
    if (user.role === UserRole.SUPER_ADMIN || this.hasPermission(user, required)) return;
    throw new ForbiddenException('Your role does not have the required broadcast permission');
  }

  private hasPermission(user: AuthUserContext, permission: string): boolean {
    if (!user.permissions || typeof user.permissions !== 'object' || Array.isArray(user.permissions)) return false;
    const [module, key] = permission.split('.');
    const values = user.permissions[module];
    return Array.isArray(values) && values.includes(key);
  }

  private async audit(actorId: string, targetId: string, action: string, beforeJson: unknown, afterJson: unknown): Promise<void> { await this.auditLog.write({ actorId, targetId, targetType: 'BROADCAST', action, beforeJson, afterJson }); }
}
