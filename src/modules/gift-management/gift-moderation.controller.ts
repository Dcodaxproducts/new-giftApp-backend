import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthUserContext, CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ApproveGiftDto, FlagGiftDto, ListGiftModerationDto, RejectGiftDto } from './dto/gift-management.dto';
import { GiftManagementService } from './gift-management.service';

@ApiTags('04 Gifts - Moderation')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
@Controller('gift-moderation')
export class GiftModerationController {
  constructor(private readonly gifts: GiftManagementService) {}

  @Get()
  @Permissions('giftModeration.read')
  list(@Query() query: ListGiftModerationDto) { return this.gifts.moderationQueue(query); }

  @Patch(':id/approve')
  @Permissions('giftModeration.approve')
  approve(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Body() dto: ApproveGiftDto) { return this.gifts.approveGift(user, id, dto); }

  @Patch(':id/reject')
  @Permissions('giftModeration.reject')
  reject(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Body() dto: RejectGiftDto) { return this.gifts.rejectGift(user, id, dto); }

  @Patch(':id/flag')
  @Permissions('giftModeration.flag')
  flag(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Body() dto: FlagGiftDto) { return this.gifts.flagGift(user, id, dto); }
}
