import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthUserContext, CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ListNotificationsDto, RegisterDeviceTokenDto, UnregisterDeviceTokenDto } from './dto/notifications.dto';
import { NotificationsService } from './notifications.service';

@ApiTags('06 Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.STAFF, UserRole.PROVIDER, UserRole.REGISTERED_USER)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'List notifications', description: 'JWT auth. Returns only notifications belonging to the logged-in account. Supports All and Unread filters.' })
  @ApiQuery({ name: 'page', required: false }) @ApiQuery({ name: 'limit', required: false }) @ApiQuery({ name: 'filter', required: false }) @ApiQuery({ name: 'isRead', required: false }) @ApiQuery({ name: 'groupByDate', required: false }) @ApiQuery({ name: 'sortOrder', required: false })
  @ApiResponse({ status: 200, description: 'Notifications fetched successfully', schema: { example: { success: true, data: [{ id: 'notification_id', title: 'Payment successful', message: 'Your payment was completed successfully.', isRead: false, createdAt: '2026-05-09T10:00:00.000Z' }], meta: { page: 1, limit: 10, total: 1, totalPages: 1 }, message: 'Notifications fetched successfully' } } })
  list(@CurrentUser() user: AuthUserContext, @Query() query: ListNotificationsDto) { return this.notifications.list(user, query); }

  @Get('summary')
  @ApiOperation({ summary: 'Fetch notification summary', description: 'JWT auth. Counts only notifications belonging to the logged-in account.' })
  @ApiResponse({ status: 200, description: 'Notification summary fetched successfully', schema: { example: { success: true, data: { total: 12, unread: 3 }, message: 'Notification summary fetched successfully' } } })
  summary(@CurrentUser() user: AuthUserContext) { return this.notifications.summary(user); }

  @Post('device-tokens')
  @ApiOperation({ summary: 'Register a device for push notifications', description: 'JWT auth. The device is always bound to the logged-in account. Safe to call on every app start and whenever Firebase rotates the token: re-sending the same token updates the existing device instead of creating a duplicate. A token already registered to another account is reassigned to the logged-in account, so a shared device never receives the previous owner notifications.' })
  @ApiResponse({ status: 201, description: 'Device registered for push notifications', schema: { example: { success: true, data: { id: 'device_token_id', platform: 'ANDROID' }, message: 'Device registered for push notifications' } } })
  registerDeviceToken(@CurrentUser() user: AuthUserContext, @Body() dto: RegisterDeviceTokenDto) { return this.notifications.registerDeviceToken(user, dto); }

  @Delete('device-tokens')
  @ApiOperation({ summary: 'Unregister a device from push notifications', description: 'JWT auth. Call on logout so the signed-out device stops receiving push. Removes only the supplied token, so other devices signed in to the same account keep receiving notifications.' })
  @ApiResponse({ status: 200, description: 'Device unregistered from push notifications', schema: { example: { success: true, data: null, message: 'Device unregistered from push notifications' } } })
  unregisterDeviceToken(@CurrentUser() user: AuthUserContext, @Body() dto: UnregisterDeviceTokenDto) { return this.notifications.unregisterDeviceToken(user, dto); }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all own notifications as read', description: 'JWT auth. Marks only notifications belonging to the logged-in account.' })
  markAllRead(@CurrentUser() user: AuthUserContext) { return this.notifications.markAllRead(user); }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark notification as read', description: 'JWT auth. Notification must belong to the logged-in account.' })
  markRead(@CurrentUser() user: AuthUserContext, @Param('id') id: string) { return this.notifications.markRead(user, id); }

}
