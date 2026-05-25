import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthUserContext, CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { GiftModerationActionDto, ListGiftModerationDto } from '../dto/gift-management.dto';
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

  @Post(':id/action')
  @ApiOperation({ summary: 'Run gift moderation action', description: "SUPER_ADMIN or ADMIN with action-specific gift moderation permission. APPROVE requires 'giftModeration.approve'; REJECT requires 'giftModeration.reject'; FLAG requires 'giftModeration.flag'." })
  @ApiBody({ type: GiftModerationActionDto, examples: { approve: { value: { action: 'APPROVE', comment: 'Gift content meets marketplace policy.', notifyProvider: true } }, reject: { value: { action: 'REJECT', reason: 'POLICY_VIOLATION', comment: 'Listing violates marketplace content policy.', notifyProvider: true } }, flagAndHide: { value: { action: 'FLAG', reason: 'POLICY_CONCERN', comment: 'Hide while policy team reviews images.', hideFromMarketplace: true, notifyProvider: true } }, flagReviewOnly: { value: { action: 'FLAG', reason: 'NEEDS_MANUAL_REVIEW', comment: 'Keep visible but queue for manual review.', hideFromMarketplace: false, notifyProvider: false } } } })
  @ApiResponse({ status: 200, description: 'Gift moderation action completed successfully', schema: { example: { success: true, data: { id: 'gift_id', moderationStatus: 'FLAGGED', isPublished: false, hiddenByModeration: true }, message: 'Gift flagged successfully' } } })
  action(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Body() dto: GiftModerationActionDto) { return this.gifts.moderationAction(user, id, dto); }
}
