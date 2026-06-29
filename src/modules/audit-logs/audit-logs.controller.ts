import { Controller, Get, Param, Query, StreamableFile, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthUserContext, CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuditLogsService } from './audit-logs.service';
import { AuditLogStatsDto, ListAuditLogsDto } from './dto/audit-logs.dto';

@ApiTags('02 Admin - System Logs & Audit Trail')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
@Controller('audit-logs')
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Fetch audit log stats', description: 'SUPER_ADMIN only. Returns four numeric card values from admin audit logs.' })
  @ApiResponse({ status: 200, schema: { example: { success: true, data: { totalLogs: 1240, successCount: 1100, failedCount: 120, criticalAlerts24h: 12 }, message: 'Audit log stats fetched successfully.' } } })
  stats(@Query() query: AuditLogStatsDto) { return this.auditLogsService.stats(query); }

  @Get('export')
  @ApiOperation({ summary: 'Export audit logs CSV', description: 'SUPER_ADMIN only. Exports sanitized audit log records using the same filters as the list API.' })
  async export(@Query() query: ListAuditLogsDto): Promise<StreamableFile> {
    const file = await this.auditLogsService.export(query);
    return new StreamableFile(Buffer.from(file.content), { disposition: `attachment; filename="${file.filename}"`, type: file.contentType });
  }

  @Get()
  @ApiOperation({ summary: 'List audit logs', description: 'SUPER_ADMIN only. Supports filtering by action type, actor, status, date range, module, and source IP.' })
  @ApiResponse({ status: 200, schema: { example: { success: true, data: [{ id: 'audit_log_id', logReference: '789042', actorId: 'admin_id', actorType: 'SUPER_ADMIN', actorSnapshot: { id: 'admin_id', name: 'Sarah Chen', role: 'SUPER_ADMIN' }, targetId: 'provider_id', targetType: 'PROVIDER', action: 'PROVIDER_APPROVED', actionLabel: 'Provider Approved', module: 'Provider Management', status: 'SUCCESS', severity: 'LOW', beforeJson: null, afterJson: { status: 'approved' }, ipAddress: '192.168.1.45', createdAt: '2023-10-27T14:32:01.000Z' }], meta: { page: 1, limit: 10, total: 1, totalPages: 1 }, message: 'Audit logs fetched successfully' } } })
  list(@CurrentUser() user: AuthUserContext, @Query() query: ListAuditLogsDto) {
    return this.auditLogsService.list(user, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Fetch audit log detail', description: 'SUPER_ADMIN only. Returns only AdminAuditLog table fields.' })
  @ApiResponse({ status: 200, schema: { example: { success: true, data: { id: 'audit_log_id', logReference: '789042', actorId: 'admin_id', actorType: 'SUPER_ADMIN', actorSnapshot: { id: 'admin_id', name: 'Sarah Chen', role: 'SUPER_ADMIN' }, targetId: 'provider_id', targetType: 'PROVIDER', action: 'PROVIDER_APPROVED', actionLabel: 'Provider Approved', module: 'Provider Management', status: 'SUCCESS', severity: 'LOW', beforeJson: null, afterJson: { status: 'approved' }, ipAddress: '192.168.1.45', createdAt: '2023-10-27T14:32:01.000Z' }, message: 'Audit log details fetched successfully' } } })
  details(@Param('id') id: string) {
    return this.auditLogsService.details(id);
  }
}
