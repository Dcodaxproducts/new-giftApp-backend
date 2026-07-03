import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AdminSystemHealthService } from './admin-system-health.service';
import { SystemHealthGraphQueryDto } from './dto/admin-system-health.dto';

@ApiTags('02 Admin - System Health Monitoring')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.STAFF)
@Controller('admin/system-health')
export class AdminSystemHealthController {
  constructor(private readonly service: AdminSystemHealthService) {}

  @Get('stats')
  @Permissions('systemHealth.read')
  @ApiOperation({ summary: 'Fetch system health summary cards', description: 'SUPER_ADMIN or ADMIN with systemHealth.read. Returns server resource usage and API reliability metrics from the current runtime.' })
  @ApiResponse({ status: 200, schema: { example: { success: true, data: { serverHealth: { cpuUsagePercent: 6.5, cpuStatus: 'HEALTHY', memory: { usedGb: 2.6, totalGb: 3.8, usagePercent: 68.4, status: 'HEALTHY' }, disk: { usedGb: 28.3, totalGb: 33.7, usagePercent: 83.9, status: 'WARNING' }, uptimeHours: 3500, uptimeStatus: 'HEALTHY' }, apiHealth: { successRatePercent: 100, failureRatePercent: 0, totalRequests: 177, averageLatencyMs: 245.59, p95LatencyMs: 606, latencyStatus: 'HEALTHY' } }, message: 'System health stats fetched successfully.' } } })
  stats() {
    return this.service.stats();
  }

  @Get('latency-graph')
  @Permissions('systemHealth.read')
  @ApiOperation({ summary: 'Fetch API latency graph', description: 'SUPER_ADMIN or ADMIN with systemHealth.read. range=DAILY returns the last 7 days, WEEKLY returns the last 8 weeks, and MONTHLY returns the last 12 months.' })
  @ApiResponse({ status: 200, schema: { example: { success: true, data: { range: 'DAILY', points: [{ label: 'Tue', averageLatencyMs: 20, p95LatencyMs: 80, totalRequests: 12, failureRatePercent: 0 }] }, message: 'System health latency graph fetched successfully.' } } })
  latencyGraph(@Query() query: SystemHealthGraphQueryDto) {
    return this.service.latencyGraph(query.range);
  }
}
