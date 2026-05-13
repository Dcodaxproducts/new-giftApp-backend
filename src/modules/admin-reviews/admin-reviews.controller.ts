import { Body, Controller, Get, Param, Post, Query, StreamableFile, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthUserContext, CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AdminReviewsService } from './admin-reviews.service';
import { ExportReviewsDto, FlaggedSummaryDto, ListReviewsDto, ModerateReviewDto, ModerationLogsDto, ModerationQueueDto, ReviewStatsDto } from './dto/admin-reviews.dto';

@ApiTags('02 Admin - Reviews Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
@Controller('admin/reviews')
export class AdminReviewsController {
  constructor(private readonly reviews: AdminReviewsService) {}

  @Get('dashboard')
  @Permissions('reviews.read')
  @ApiOperation({ summary: 'Fetch platform review dashboard', description: 'SUPER_ADMIN or ADMIN with reviews.read. Review records are shared with provider review module.' })
  @ApiResponse({ status: 200, schema: { example: { success: true, data: { health: { averageRating: 4.62, averageRatingDelta: 0, totalReviews: 12847, newReviewsThisWeek: 842, flaggedQueueCount: 34, criticalFlaggedCount: 12, autoModeratedCount: 1203, autoModerationAccuracy: 82 }, systemWarning: { enabled: true, title: 'System Warning', message: 'Auto-moderation confidence dropped to 82%. Review recommended.', severity: 'WARNING' } }, message: 'Review dashboard fetched successfully.' } } })
  dashboard() { return this.reviews.dashboard(); }

  @Get('stats')
  @Permissions('reviews.read')
  stats(@Query() query: ReviewStatsDto) { return this.reviews.stats(query); }

  @Get('export')
  @Permissions('reviews.export')
  async export(@Query() query: ExportReviewsDto): Promise<StreamableFile> { const file = await this.reviews.export(query); return new StreamableFile(Buffer.from(file.content), { disposition: `attachment; filename="${file.filename}"`, type: file.contentType }); }

  @Get('flagged-summary')
  @ApiTags('02 Admin - Review Moderation')
  @Permissions('reviews.read')
  flaggedSummary(@Query() query: FlaggedSummaryDto) { return this.reviews.flaggedSummary(query); }

  @Get('moderation-queue')
  @ApiTags('02 Admin - Review Moderation')
  @Permissions('reviews.moderate')
  moderationQueue(@Query() query: ModerationQueueDto) { return this.reviews.moderationQueue(query); }

  @Get('moderation-logs')
  @ApiTags('02 Admin - Review Moderation')
  @Permissions('reviewModerationLogs.read')
  moderationLogs(@Query() query: ModerationLogsDto) { return this.reviews.moderationLogs(query); }

  @Get()
  @Permissions('reviews.read')
  list(@Query() query: ListReviewsDto) { return this.reviews.list(query); }

  @Get(':id')
  @Permissions('reviews.read')
  details(@Param('id') id: string) { return this.reviews.details(id); }

  @Post(':id/moderate')
  @ApiTags('02 Admin - Review Moderation')
  @Permissions('reviews.moderate')
  @ApiOperation({ summary: 'Moderate a review', description: 'SUPER_ADMIN or ADMIN with reviews.moderate/specific moderation permissions. Creates ReviewModerationLog and admin audit log. Does not physically delete reviews.' })
  @ApiBody({ type: ModerateReviewDto, examples: { approve: { value: { action: 'APPROVE', reason: 'FALSE_POSITIVE', comment: 'Review checked manually and approved.', notifyProvider: true, notifyCustomer: false } }, remove: { value: { action: 'REMOVE', reason: 'POLICY_VIOLATION', comment: 'Violates review policy.', notifyProvider: true, notifyCustomer: true } } } })
  moderate(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Body() dto: ModerateReviewDto) { return this.reviews.moderate(user, id, dto); }
}
