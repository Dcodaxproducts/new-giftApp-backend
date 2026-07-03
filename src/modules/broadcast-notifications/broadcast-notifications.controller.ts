import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthUserContext, CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateBroadcastDto } from './dto/broadcast-notifications.dto';
import { BroadcastNotificationsService } from './broadcast-notifications.service';

const baseBroadcastPayload = {
  title: 'Maintenance Notice',
  message: 'Type your message here...',
  audience: 'ALL_USERS',
};

@ApiTags('06 Broadcast Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.STAFF)
@Controller('broadcasts')
export class BroadcastNotificationsController {
  constructor(private readonly broadcasts: BroadcastNotificationsService) {}

  @Post()
  @Permissions('broadcasts.create')
  @ApiOperation({
    summary: 'Create broadcast notification',
    description: 'Creates a broadcast notification record. Request body accepts only title, message, and audience.',
  })
  @ApiBody({
    type: CreateBroadcastDto,
    examples: {
      allUsers: { value: baseBroadcastPayload },
      providers: { value: { ...baseBroadcastPayload, audience: 'PROVIDER' } },
      users: { value: { ...baseBroadcastPayload, audience: 'USER' } },
    },
  })
  create(@CurrentUser() user: AuthUserContext, @Body() dto: CreateBroadcastDto) {
    return this.broadcasts.create(user, dto);
  }
}
