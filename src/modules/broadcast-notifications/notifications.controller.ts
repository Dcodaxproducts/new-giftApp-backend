import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthUserContext, CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { DeviceTokenDto, ListNotificationsDto } from './dto/broadcast-notifications.dto';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PROVIDER, UserRole.REGISTERED_USER)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  list(@CurrentUser() user: AuthUserContext, @Query() query: ListNotificationsDto) { return this.notifications.list(user, query); }

  @Patch(':id/read')
  markRead(@CurrentUser() user: AuthUserContext, @Param('id') id: string) { return this.notifications.markRead(user, id); }

  @Patch('read-all')
  markAllRead(@CurrentUser() user: AuthUserContext) { return this.notifications.markAllRead(user); }

  @Post('device-tokens')
  saveDeviceToken(@CurrentUser() user: AuthUserContext, @Body() dto: DeviceTokenDto) { return this.notifications.saveDeviceToken(user, dto); }

  @Delete('device-tokens/:id')
  deleteDeviceToken(@CurrentUser() user: AuthUserContext, @Param('id') id: string) { return this.notifications.deleteDeviceToken(user, id); }
}
