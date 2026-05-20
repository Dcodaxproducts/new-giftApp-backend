import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { ListNotificationDeliveryLogsDto } from '../dto/notification-delivery.dto';
import { NotificationDeliveryMonitoringService } from '../services/notification-delivery-monitoring.service';

@ApiTags('02 Admin - Notification Delivery Monitoring')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
@Controller('admin/notification-delivery')
export class NotificationDeliveryMonitoringController {
  constructor(private readonly monitoring: NotificationDeliveryMonitoringService) {}

  @Get('stats')
  @Permissions('notifications.read')
  @ApiOperation({ summary: 'Fetch notification delivery stats', description: 'SUPER_ADMIN or ADMIN with notifications.read.' })
  @ApiResponse({ status: 200, schema: { example: { success: true, data: { total: 12, queued: 0, delivered: 10, failed: 1, skipped: 1, retried: 2 }, message: 'Notification delivery stats fetched successfully.' } } })
  stats() { return this.monitoring.stats(); }

  @Get('logs')
  @Permissions('notifications.read')
  @ApiOperation({ summary: 'List notification delivery logs', description: 'SUPER_ADMIN or ADMIN with notifications.read.' })
  logs(@Query() query: ListNotificationDeliveryLogsDto) { return this.monitoring.logsList(query); }

  @Get('logs/:id')
  @Permissions('notifications.read')
  @ApiOperation({ summary: 'Fetch notification delivery log detail', description: 'SUPER_ADMIN or ADMIN with notifications.read.' })
  detail(@Param('id') id: string) { return this.monitoring.detail(id); }

  @Post('logs/:id/retry')
  @Permissions('notifications.delivery.retry')
  @ApiOperation({ summary: 'Retry notification delivery', description: 'SUPER_ADMIN or ADMIN with notifications.delivery.retry. Retries non-IN_APP delivery channels without duplicating the existing in-app notification.' })
  retry(@Param('id') id: string) { return this.monitoring.retry(id); }
}
