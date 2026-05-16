import { Controller, Get, Param, Query, StreamableFile, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthUserContext, CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuditLogStatsDto, AuditLogUsersDto, ListAuditLogsDto } from './dto/audit-logs.dto';
import { AuditLogsService } from './audit-logs.service';

@ApiTags('02 Admin - System Logs & Audit Trail')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
@Controller('audit-logs')
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Fetch audit log stats', description: 'SUPER_ADMIN only. Returns system log summary cards and security/system metrics.' })
  @ApiResponse({ status: 200, schema: { example: { success: true, data: { criticalAlerts24h: 12, dailyAverageActions: 4200, uptimeStatus: 99.98, totalLogs: 1240, successCount: 1100, failedCount: 140 }, message: 'Audit log stats fetched successfully.' } } })
  stats(@Query() query: AuditLogStatsDto) { return this.auditLogsService.stats(query); }

  @Get('action-types')
  @ApiOperation({ summary: 'Fetch audit log action types', description: 'SUPER_ADMIN only. Returns action type dropdown options for System Logs filters.' })
  @ApiResponse({ status: 200, schema: { example: { success: true, data: [{ key: 'PROVIDER_APPROVED', label: 'Provider Approved' }, { key: 'FAILED_LOGIN_ATTEMPT', label: 'Failed Login Attempt' }], message: 'Audit log action types fetched successfully.' } } })
  actionTypes() { return this.auditLogsService.actionTypes(); }

  @Get('users')
  @ApiOperation({ summary: 'Fetch audit log user selector options', description: 'SUPER_ADMIN only. Returns actor/user selector options for System Logs filters.' })
  @ApiResponse({ status: 200, schema: { example: { success: true, data: [{ id: 'system', name: 'System', email: null, role: 'SYSTEM', label: 'System Automated Action' }, { id: 'admin_id', name: 'Sarah Chen', email: 'sarah@example.com', role: 'ADMIN', label: 'Sarah Chen — Compliance Officer' }], message: 'Audit log users fetched successfully.' } } })
  users(@Query() query: AuditLogUsersDto) { return this.auditLogsService.users(query); }

  @Get('export')
  @ApiOperation({ summary: 'Export audit logs CSV', description: 'SUPER_ADMIN only. Exports sanitized audit log records using the same filters as the list API.' })
  async export(@Query() query: ListAuditLogsDto): Promise<StreamableFile> {
    const file = await this.auditLogsService.export(query);
    return new StreamableFile(Buffer.from(file.content), { disposition: `attachment; filename="${file.filename}"`, type: file.contentType });
  }

  @Get()
  @ApiOperation({ summary: 'List audit logs', description: 'SUPER_ADMIN only. Supports filtering by action type, actor, status, date range, module, and source IP.' })
  @ApiResponse({ status: 200, schema: { example: { success: true, data: [{ id: 'audit_log_id', eventId: 'EV-90210', logReference: '789042', timestamp: '2023-10-27T14:32:01.000Z', actor: { id: 'admin_id', name: 'Sarah Chen', role: 'Compliance Officer', avatarInitials: 'SC' }, action: 'PROVIDER_APPROVED', actionLabel: 'Provider Approved', module: 'Provider Management', sourceIp: '192.168.1.45', environment: 'Production-Cluster-A', status: 'SUCCESS', target: { id: 'provider_id', type: 'PROVIDER' }, createdAt: '2023-10-27T14:32:01.000Z' }], meta: { page: 1, limit: 20, total: 1, totalPages: 1 }, message: 'Audit logs fetched successfully' } } })
  list(@CurrentUser() user: AuthUserContext, @Query() query: ListAuditLogsDto) {
    return this.auditLogsService.list(user, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Fetch audit log detail', description: 'SUPER_ADMIN only. Returns sanitized raw JSON payloads, system response preview, and technical metadata.' })
  @ApiResponse({ status: 200, schema: { example: { success: true, data: { id: 'audit_log_id', logReference: '789042', eventId: 'EV-90210', timestamp: '2023-10-27T14:32:01.000Z', status: 'SUCCESS', category: 'AUDIT_TRAIL', actor: { id: 'admin_id', username: 'super_admin_fintech', name: 'Super Admin', role: 'SUPER_ADMIN' }, actionType: 'TRANSACTION_AUTHORIZATION', module: 'Transactions', sourceIp: '192.168.1.104', environment: 'Production-Cluster-A', target: { id: 'transaction_id', type: 'TRANSACTION' }, requestPayload: { authorization: '[REDACTED]', request_id: 'req_550e8400' }, systemResponse: { statusCode: 200, durationMs: 142, message: 'Transaction authorized successfully.' }, createdAt: '2023-10-27T14:32:01.000Z' }, message: 'Audit log details fetched successfully' } } })
  details(@Param('id') id: string) {
    return this.auditLogsService.details(id);
  }
}
