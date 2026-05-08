import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthUserContext, CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { DeviceTokenDto, ListNotificationsDto, NotificationActionRequestDto, UpdateNotificationPreferencesDto } from './dto/broadcast-notifications.dto';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PROVIDER, UserRole.REGISTERED_USER)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'List notifications', description: 'JWT auth. Returns only notifications belonging to the logged-in account. Supports All, Unread, Birthdays, Deliveries, and New Contacts filters. No group gift notifications are supported.' })
  @ApiQuery({ name: 'page', required: false }) @ApiQuery({ name: 'limit', required: false }) @ApiQuery({ name: 'filter', required: false }) @ApiQuery({ name: 'type', required: false }) @ApiQuery({ name: 'isRead', required: false }) @ApiQuery({ name: 'groupByDate', required: false }) @ApiQuery({ name: 'sortOrder', required: false })
  @ApiResponse({ status: 200, description: 'Notifications fetched successfully' })
  list(@CurrentUser() user: AuthUserContext, @Query() query: ListNotificationsDto) { return this.notifications.list(user, query); }

  @Get('summary')
  @ApiOperation({ summary: 'Fetch notification summary', description: 'JWT auth. Counts only notifications belonging to the logged-in account.' })
  summary(@CurrentUser() user: AuthUserContext) { return this.notifications.summary(user); }

  @Get('preferences')
  @ApiOperation({ summary: 'Fetch notification preferences', description: 'JWT auth. Preferences belong only to the logged-in account.' })
  preferences(@CurrentUser() user: AuthUserContext) { return this.notifications.preferences(user); }

  @Patch('preferences')
  @ApiOperation({ summary: 'Update notification preferences', description: 'JWT auth. Push toggle does not delete device tokens. No group gift preference exists.' })
  @ApiBody({ type: UpdateNotificationPreferencesDto })
  updatePreferences(@CurrentUser() user: AuthUserContext, @Body() dto: UpdateNotificationPreferencesDto) { return this.notifications.updatePreferences(user, dto); }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all own notifications as read', description: 'JWT auth. Marks only notifications belonging to the logged-in account.' })
  markAllRead(@CurrentUser() user: AuthUserContext) { return this.notifications.markAllRead(user); }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark notification as read', description: 'JWT auth. Notification must belong to the logged-in account.' })
  markRead(@CurrentUser() user: AuthUserContext, @Param('id') id: string) { return this.notifications.markRead(user, id); }

  @Post(':id/action')
  @ApiOperation({ summary: 'Process notification action', description: 'JWT auth. Supports SEND_GIFT, REMIND_ME_LATER, VIEW_ORDER, VIEW_CONTACT. Group gift actions are not supported.' })
  @ApiBody({ type: NotificationActionRequestDto, examples: { sendGift: { value: { action: 'SEND_GIFT' } } } })
  action(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Body() dto: NotificationActionRequestDto) { return this.notifications.action(user, id, dto); }

  @Post('device-tokens')
  @ApiOperation({ summary: 'Save device token', description: 'JWT auth. Token belongs only to logged-in account. Duplicate deviceId updates existing record.' })
  @ApiBody({ type: DeviceTokenDto })
  saveDeviceToken(@CurrentUser() user: AuthUserContext, @Body() dto: DeviceTokenDto) { return this.notifications.saveDeviceToken(user, dto); }

  @Delete('device-tokens/:id')
  @ApiOperation({ summary: 'Disable device token', description: 'JWT auth. Users can disable only their own device tokens.' })
  deleteDeviceToken(@CurrentUser() user: AuthUserContext, @Param('id') id: string) { return this.notifications.deleteDeviceToken(user, id); }
}
