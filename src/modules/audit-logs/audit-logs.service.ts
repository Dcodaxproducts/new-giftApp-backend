import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditLogSeverity, AuditLogStatus, Prisma } from '@prisma/client';
import { AuthUserContext } from '../../common/decorators/current-user.decorator';
import { getPagination } from '../../common/pagination/pagination.util';
import { AuditLogsRepository } from './audit-logs.repository';
import { AuditLogSortBy, AuditLogStatsDto, AuditLogStatusFilter, ListAuditLogsDto, SortOrder } from './dto/audit-logs.dto';

@Injectable()
export class AuditLogsService {
  constructor(private readonly repository: AuditLogsRepository) {}

  async stats(query: AuditLogStatsDto) {
    const where = this.where({ fromDate: query.fromDate, toDate: query.toDate });
    const criticalSince = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [totalLogs, successCount, failedCount, criticalAlerts24h] = await this.repository.getStats(where, criticalSince);

    return {
      data: {
        totalLogs,
        successCount,
        failedCount,
        criticalAlerts24h,
      },
      message: 'Audit log stats fetched successfully.',
    };
  }

  async list(_user: AuthUserContext, query: ListAuditLogsDto) {
    const { page, limit, skip, take } = getPagination(query);
    const where = this.where(query);
    const [items, total] = await this.repository.findManyWithCount({
      where,
      orderBy: { [query.sortBy ?? AuditLogSortBy.CREATED_AT]: query.sortOrder === SortOrder.ASC ? 'asc' : 'desc' },
      skip, take,
    });
    return { data: items.map((item) => this.tableRow(item)), meta: { page, limit, total, totalPages: Math.ceil(total / limit) }, message: 'Audit logs fetched successfully' };
  }

  async details(id: string) {
    const log = await this.repository.findByIdWithActor(id);
    if (!log) throw new NotFoundException('Audit log not found');
    return { data: this.tableRow(log), message: 'Audit log details fetched successfully' };
  }

  async export(query: ListAuditLogsDto) {
    const items = await this.repository.findManyForExport({ where: this.where(query), orderBy: { [query.sortBy ?? AuditLogSortBy.CREATED_AT]: query.sortOrder === SortOrder.ASC ? 'asc' : 'desc' } });
    const rows = [
      ['ID', 'Log Reference', 'Actor ID', 'Actor Type', 'Actor Snapshot', 'Target ID', 'Target Type', 'Action', 'Action Label', 'Module', 'Status', 'Severity', 'Before JSON', 'After JSON', 'IP Address', 'Created At'],
      ...items.map((item) => [
        item.id,
        item.logReference ?? '',
        item.actorId ?? '',
        item.actorType ?? '',
        JSON.stringify(item.actorSnapshot ?? null),
        item.targetId ?? '',
        item.targetType ?? '',
        item.action,
        item.actionLabel ?? '',
        item.module ?? '',
        item.status,
        item.severity,
        JSON.stringify(item.beforeJson ?? null),
        JSON.stringify(item.afterJson ?? null),
        item.ipAddress ?? '',
        item.createdAt.toISOString(),
      ]),
    ];
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
      ipAddress: query.sourceIp,
      ...(from || to ? { createdAt: { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to) } : {}) } } : {}),
    };
  }

  private tableRow(item: { id: string; logReference: string | null; actorId: string | null; actorType: string | null; actorSnapshot: Prisma.JsonValue | null; targetId: string | null; targetType: string | null; action: string; actionLabel: string | null; module: string | null; status: AuditLogStatus; severity: AuditLogSeverity; beforeJson: Prisma.JsonValue | null; afterJson: Prisma.JsonValue | null; ipAddress: string | null; createdAt: Date }) {
    return {
      id: item.id,
      logReference: item.logReference,
      actorId: item.actorId,
      actorType: item.actorType,
      actorSnapshot: item.actorSnapshot,
      targetId: item.targetId,
      targetType: item.targetType,
      action: item.action,
      actionLabel: item.actionLabel,
      module: item.module,
      status: item.status,
      severity: item.severity,
      beforeJson: item.beforeJson,
      afterJson: item.afterJson,
      ipAddress: item.ipAddress,
      createdAt: item.createdAt,
    };
  }
}
