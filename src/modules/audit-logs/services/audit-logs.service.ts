import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditLogStatus, Prisma, UserRole } from '@prisma/client';
import { AuthUserContext } from '../../../common/decorators/current-user.decorator';
import { AuditLogsRepository } from '../repositories/audit-logs.repository';
import { AuditLogSortBy, AuditLogStatsDto, AuditLogStatusFilter, AuditLogUsersDto, ListAuditLogsDto, SortOrder } from '../dto/audit-logs.dto';

@Injectable()
export class AuditLogsService {
  constructor(private readonly repository: AuditLogsRepository) {}

  async stats(query: AuditLogStatsDto) {
    const where = this.where({ fromDate: query.fromDate, toDate: query.toDate });
    const criticalSince = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [totalLogs, successCount, failedCount, criticalAlerts24h, grouped] = await this.repository.getStats(where, criticalSince);
    const uptimeStatus = totalLogs ? Math.round((successCount / totalLogs) * 10000) / 100 : 100;
    const dayBuckets = new Set(grouped.map((row) => row.createdAt.toISOString().slice(0, 10)));
    const dailyAverageActions = dayBuckets.size ? Math.round(totalLogs / dayBuckets.size) : totalLogs;
    return { data: { criticalAlerts24h, dailyAverageActions, uptimeStatus, totalLogs, successCount, failedCount }, message: 'Audit log stats fetched successfully.' };
  }

  async actionTypes() {
    const rows = await this.repository.findDistinctActions();
    return { data: rows.map((row) => ({ key: row.action, label: this.label(row.action) })), message: 'Audit log action types fetched successfully.' };
  }

  async users(query: AuditLogUsersDto) {
    const limit = query.limit ?? 20;
    const where: Prisma.UserWhereInput = { role: query.role as UserRole | undefined, ...(query.search ? { OR: [{ email: { contains: query.search, mode: 'insensitive' } }, { firstName: { contains: query.search, mode: 'insensitive' } }, { lastName: { contains: query.search, mode: 'insensitive' } }] } : {}) };
    const users = await this.repository.findUsers({ where, take: limit });
    return { data: [{ id: 'system', name: 'System', email: null, role: 'SYSTEM', label: 'System Automated Action' }, ...users.map((user) => ({ id: user.id, name: this.name(user), email: user.email, role: user.role, label: `${this.name(user)}${user.adminTitle ? ` — ${user.adminTitle}` : ''}` }))], message: 'Audit log users fetched successfully.' };
  }

  async list(_user: AuthUserContext, query: ListAuditLogsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = this.where(query);
    const [items, total] = await this.repository.findManyWithCount({
      where,
      include: { actor: { select: { id: true, email: true, firstName: true, lastName: true, adminTitle: true, role: true } } },
      orderBy: { [query.sortBy ?? AuditLogSortBy.CREATED_AT]: query.sortOrder === SortOrder.ASC ? 'asc' : 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data: items.map((item) => this.listItem(item)), meta: { page, limit, total, totalPages: Math.ceil(total / limit) }, message: 'Audit logs fetched successfully' };
  }

  async details(id: string) {
    const log = await this.repository.findByIdWithActor(id);
    if (!log) throw new NotFoundException('Audit log not found');
    return { data: { id: log.id, logReference: log.logReference ?? this.logReference(log.id), eventId: log.eventId ?? this.eventId(log.id), timestamp: log.createdAt, status: log.status, category: 'AUDIT_TRAIL', actor: { id: log.actor?.id ?? null, username: log.actor?.email ?? 'system', name: log.actor ? this.name(log.actor) : (log.actorNameSnapshot ?? 'System'), role: log.actor?.role ?? log.actorType ?? 'SYSTEM' }, actionType: log.action, module: log.module ?? this.module(log.action), sourceIp: log.ipAddress, environment: log.environment ?? 'Production-Cluster-A', target: { id: log.targetId, type: log.targetType }, requestPayload: this.sanitize(log.requestPayloadJson ?? log.beforeJson), systemResponse: { statusCode: log.status === AuditLogStatus.FAILED ? 500 : 200, durationMs: log.durationMs ?? 142, message: this.responseMessage(log) }, createdAt: log.createdAt }, message: 'Audit log details fetched successfully' };
  }

  async export(query: ListAuditLogsDto) {
    const items = await this.repository.findManyForExport({ where: this.where(query), orderBy: { [query.sortBy ?? AuditLogSortBy.CREATED_AT]: query.sortOrder === SortOrder.ASC ? 'asc' : 'desc' } });
    const rows = [['Event ID', 'Log Reference', 'Timestamp', 'Actor', 'Action', 'Module', 'Source IP', 'Environment', 'Status', 'Target ID', 'Target Type'], ...items.map((item) => [item.eventId ?? this.eventId(item.id), item.logReference ?? this.logReference(item.id), item.createdAt.toISOString(), item.actor ? this.name(item.actor) : (item.actorNameSnapshot ?? 'Unknown / Guest Access'), item.action, item.module ?? this.module(item.action), item.ipAddress ?? '', item.environment ?? '', item.status, item.targetId ?? '', item.targetType ?? ''])];
    return { content: rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n'), filename: 'audit-logs.csv', contentType: 'text/csv' };
  }

  private where(query: Partial<ListAuditLogsDto>): Prisma.AdminAuditLogWhereInput {
    const status = query.status && query.status !== AuditLogStatusFilter.ALL ? query.status as AuditLogStatus : undefined;
    const from = query.fromDate ?? query.from;
    const to = query.toDate ?? query.to;
    return {
      actorId: query.actorId ?? query.userId,
      targetId: query.targetId,
      targetType: query.targetType,
      action: query.action ?? query.actionType,
      module: query.module,
      status,
      environment: query.environment,
      ipAddress: query.sourceIp,
      ...(from || to ? { createdAt: { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to) } : {}) } } : {}),
    };
  }

  private listItem(item: { id: string; eventId: string | null; logReference: string | null; createdAt: Date; actorId: string | null; actorNameSnapshot: string | null; action: string; actionLabel: string | null; module: string | null; ipAddress: string | null; environment: string | null; status: AuditLogStatus; targetId: string | null; targetType: string | null; actor: { id: string; email: string; firstName: string; lastName: string; adminTitle: string | null; role: UserRole } | null }) {
    return {
      id: item.id,
      eventId: item.eventId ?? this.eventId(item.id),
      logReference: item.logReference ?? this.logReference(item.id),
      timestamp: item.createdAt,
      actor: item.actor ? { id: item.actor.id, name: this.name(item.actor), role: item.actor.adminTitle ?? item.actor.role, avatarInitials: this.initials(item.actor) } : { id: item.actorId ?? 'system', name: item.actorNameSnapshot ?? 'Unknown / Guest Access', role: 'SYSTEM', avatarInitials: 'SY' },
      action: item.action,
      actionLabel: item.actionLabel ?? this.label(item.action),
      module: item.module ?? this.module(item.action),
      sourceIp: item.ipAddress,
      environment: item.environment ?? 'Production-Cluster-A',
      status: item.status,
      target: { id: item.targetId, type: item.targetType },
      createdAt: item.createdAt,
    };
  }

  private sanitize(value: unknown): unknown {
    if (value === undefined || value === null) return value;
    if (Array.isArray(value)) return value.map((item) => this.sanitize(item));
    if (typeof value !== 'object') return value;
    const redacted = new Set(['password', 'passwordHash', 'temporaryPassword', 'accessToken', 'refreshToken', 'authorization', 'cookie', 'stripeSecret', 'cardNumber', 'cvv', 'secretKey', 'apiKey', 'AWS_SECRET_ACCESS_KEY']);
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, val]) => [key, redacted.has(key) ? '[REDACTED]' : this.sanitize(val)]));
  }

  private label(action: string): string { return action.toLowerCase().split('_').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' '); }
  private module(action: string): string { if (action.startsWith('PROVIDER_')) return 'Provider Management'; if (action.startsWith('USER_') || action.startsWith('REGISTERED_USER_')) return 'User Management'; if (action.startsWith('ADMIN_') || action.startsWith('ROLE_')) return 'Admin Management'; if (action.startsWith('GIFT_')) return 'Gift Management'; if (action.startsWith('PAYMENT_') || action.startsWith('TRANSACTION_')) return 'Transactions'; if (action.startsWith('DISPUTE_')) return 'Dispute Manager'; if (action.startsWith('PROVIDER_DISPUTE_')) return 'Provider Disputes'; if (action.startsWith('MEDIA_')) return 'Media Upload Policy'; if (action.startsWith('REFERRAL_')) return 'Referral Settings'; if (action.startsWith('BROADCAST_')) return 'Broadcast Notifications'; if (action.startsWith('COUPON_')) return 'Coupons'; if (action.startsWith('FAILED_LOGIN') || action.startsWith('LOGIN_') || action.startsWith('SUSPICIOUS_LOGIN')) return 'Security'; return 'System'; }
  private responseMessage(log: { action: string; status: AuditLogStatus }): string { return log.status === AuditLogStatus.FAILED ? `${this.label(log.action)} failed.` : `${this.label(log.action)} completed successfully.`; }
  private name(user: { firstName: string; lastName: string }): string { return `${user.firstName} ${user.lastName}`.trim(); }
  private initials(user: { firstName: string; lastName: string }): string { return this.name(user).split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join(''); }
  private eventId(id: string): string { return `EV-${id.slice(-6).toUpperCase()}`; }
  private logReference(id: string): string { return id.slice(-6).toUpperCase(); }
}
