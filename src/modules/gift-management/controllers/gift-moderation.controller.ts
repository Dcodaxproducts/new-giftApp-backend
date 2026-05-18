import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthUserContext, CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { ApproveGiftDto, FlagGiftDto, ListGiftModerationDto, RejectGiftDto } from '../dto/gift-management.dto';
import { GiftManagementService } from '../services/gift-management.service';

@ApiTags('04 Gifts - Moderation')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
@Controller('gift-moderation')
export class GiftModerationController {
  constructor(private readonly gifts: GiftManagementService) {}

  @Get()
  @Permissions('giftModeration.read')
  @ApiOperation({ summary: 'List optional gift moderation queue', description: 'Gift Moderation is optional/admin review workflow for flagged, reported, high-risk, or admin-forced review items. Provider-created inventory does not require separate Super Admin approval by default; provider approval is the primary marketplace trust gate. Default queue returns only PENDING, FLAGGED, REJECTED, or requiresManualReview=true. Use status=APPROVED, status=NOT_REQUIRED, or includeResolved=true to view resolved/normal inventory.' })
  list(@Query() query: ListGiftModerationDto) { return this.gifts.moderationQueue(query); }

  @Patch(':id/approve')
  @Permissions('giftModeration.approve')
  @ApiOperation({ summary: 'Approve gift in optional moderation workflow', description: 'Clears manual review/hidden-by-moderation flags. This is not required for normal provider-created inventory visibility; approved active providers can publish inventory directly.' })
  approve(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Body() dto: ApproveGiftDto) { return this.gifts.approveGift(user, id, dto); }

  @Patch(':id/reject')
  @Permissions('giftModeration.reject')
  @ApiOperation({ summary: 'Reject gift in optional moderation workflow', description: 'Rejecting hides the gift from marketplace, clears manual review, sets moderationStatus=REJECTED, and writes an audit log.' })
  reject(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Body() dto: RejectGiftDto) { return this.gifts.rejectGift(user, id, dto); }

  @Patch(':id/flag')
  @Permissions('giftModeration.flag')
  @ApiOperation({ summary: 'Flag gift for manual review', description: 'Flags optional moderation case. If hideFromMarketplace=true, sets moderationStatus=FLAGGED, requiresManualReview=true, hiddenByModeration=true, and isPublished=false. If false, the gift remains visible but appears in moderation queue. Always writes an audit log.' })
  flag(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Body() dto: FlagGiftDto) { return this.gifts.flagGift(user, id, dto); }
}
