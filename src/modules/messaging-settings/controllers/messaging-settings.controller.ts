import { Body, Controller, Get, Patch, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { UserRole } from '@prisma/client';
import { AuthUserContext, CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { ListMessagingSettingsAuditLogsDto, MessagingSettingsResponseDto, UpdateMessagingSettingsDto } from '../dto/messaging-settings.dto';
import { MessagingSettingsService } from '../services/messaging-settings.service';

@ApiTags('02 Admin - In-App Messaging Settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.STAFF)
@Controller('admin/messaging-settings')
export class MessagingSettingsController {
  constructor(private readonly settings: MessagingSettingsService) {}

  @Get()
  @Permissions('messagingSettings.read')
  @ApiOperation({ summary: 'Fetch in-app messaging settings', description: 'SUPER_ADMIN or ADMIN with messagingSettings.read. Settings apply to future messages only; retention jobs must preserve compliance-sensitive order, dispute, and support records.' })
  @ApiResponse({ status: 200, type: MessagingSettingsResponseDto })
  get() { return this.settings.get(); }

  @Patch()
  @Permissions('messagingSettings.update')
  @ApiOperation({ summary: 'Update in-app messaging settings', description: 'SUPER_ADMIN or ADMIN with messagingSettings.update. Creates an admin audit log for every update.' })
  @ApiBody({ type: UpdateMessagingSettingsDto })
  update(@CurrentUser() user: AuthUserContext, @Body() dto: UpdateMessagingSettingsDto, @Req() request: Request) { return this.settings.update(user, dto, request.ip, request.headers['user-agent']); }

  @Get('audit-logs')
  @Permissions('messagingSettings.read')
  @ApiOperation({ summary: 'List in-app messaging settings audit logs', description: 'SUPER_ADMIN or ADMIN with messagingSettings.read.' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  auditLogs(@Query() query: ListMessagingSettingsAuditLogsDto) { return this.settings.auditLogs(query); }
}
