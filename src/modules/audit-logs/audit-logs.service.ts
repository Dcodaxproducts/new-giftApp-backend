import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuthUserContext } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../database/prisma.service';
import { AuditLogSortBy, ListAuditLogsDto, SortOrder } from '../auth/dto/audit-logs.dto';

@Injectable()
export class AuditLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(_user: AuthUserContext, query: ListAuditLogsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = this.where(query);
    const [items, total] = await this.prisma.$transaction([
      this.prisma.adminAuditLog.findMany({
        where,
        include: { actor: { select: { id: true, email: true, firstName: true, lastName: true } } },
        orderBy: { [query.sortBy ?? AuditLogSortBy.CREATED_AT]: query.sortOrder === SortOrder.ASC ? 'asc' : 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.adminAuditLog.count({ where }),
    ]);
    return { data: items, meta: { page, limit, total, totalPages: Math.ceil(total / limit) }, message: 'Audit logs fetched successfully' };
  }

  async details(id: string) {
    const log = await this.prisma.adminAuditLog.findUnique({ where: { id }, include: { actor: { select: { id: true, email: true, firstName: true, lastName: true } } } });
    if (!log) throw new NotFoundException('Audit log not found');
    return { data: log, message: 'Audit log fetched successfully' };
  }

  async export(query: ListAuditLogsDto) {
    const items = await this.prisma.adminAuditLog.findMany({ where: this.where(query), include: { actor: { select: { email: true } } }, orderBy: { [query.sortBy ?? AuditLogSortBy.CREATED_AT]: query.sortOrder === SortOrder.ASC ? 'asc' : 'desc' }, take: 10000 });
    const rows = [['ID', 'Actor', 'Target ID', 'Target Type', 'Action', 'Created At'], ...items.map((item) => [item.id, item.actor?.email ?? item.actorId ?? '', item.targetId ?? '', item.targetType ?? '', item.action, item.createdAt.toISOString()])];
    return { content: rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(',')).join('\n'), filename: 'audit-logs.csv', contentType: 'text/csv' };
  }

  private where(query: ListAuditLogsDto): Prisma.AdminAuditLogWhereInput {
    return {
      actorId: query.actorId,
      targetId: query.targetId,
      targetType: query.targetType ?? query.module,
      action: query.action,
      ...(query.from || query.to ? { createdAt: { ...(query.from ? { gte: new Date(query.from) } : {}), ...(query.to ? { lte: new Date(query.to) } : {}) } } : {}),
    };
  }
}
