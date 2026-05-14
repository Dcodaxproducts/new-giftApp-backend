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

@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
@Controller('admin/reviews')
export class AdminReviewsController {
  constructor(private readonly reviews: AdminReviewsService) {}

  @Get('dashboard')
  @ApiTags('02 Admin - Reviews Management')
  @Permissions('reviews.read')
  @ApiOperation({ summary: 'Fetch platform review dashboard', description: 'SUPER_ADMIN or ADMIN with reviews.read. Review records are shared with provider review module.' })
  @ApiResponse({ status: 200, schema: { example: { success: true, data: { health: { averageRating: 4.62, averageRatingDelta: 0, totalReviews: 12847, newReviewsThisWeek: 842, flaggedQueueCount: 34, criticalFlaggedCount: 12, autoModeratedCount: 1203, autoModerationAccuracy: 82 }, systemWarning: { enabled: true, title: 'System Warning', message: 'Auto-moderation confidence dropped to 82%. Review recommended.', severity: 'WARNING' } }, message: 'Review dashboard fetched successfully.' } } })
  dashboard() { return this.reviews.dashboard(); }

  @Get('stats')
  @ApiTags('02 Admin - Reviews Management')
  @Permissions('reviews.read')
  stats(@Query() query: ReviewStatsDto) { return this.reviews.stats(query); }

  @Get('export')
  @ApiTags('02 Admin - Reviews Management')
  @Permissions('reviews.export')
  @ApiOperation({ summary: 'Export reviews with moderation filters', description: 'SUPER_ADMIN or ADMIN with reviews.export. Applies the same filters as GET /admin/reviews, supports CSV/PDF, and exports dashboard-safe fields only.' })
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
  @ApiTags('02 Admin - Reviews Management')
  @Permissions('reviews.read')
  @ApiOperation({ summary: 'List reviews for moderation dashboard', description: 'SUPER_ADMIN or ADMIN with reviews.read. Supports search, rating/source/status, reportedOnly, date range, and sort filters for the Reviews Moderation table.' })
  @ApiResponse({ status: 200, schema: { example: { success: true, data: [{ id: 'review_id', reviewCode: 'RV-92841', reviewer: { id: 'user_id', name: 'Sarah Miller', avatarInitials: 'SM' }, source: 'TRUSTPILOT', rating: 1, contentPreview: 'The service was absolutely terrible, I want a refund...', fullContent: 'The service was absolutely terrible...', flags: { reportCount: 12, label: '12 reports' }, status: 'PENDING', transactionId: 'TXN-49201-B', reviewDate: '2023-10-24T00:00:00.000Z' }], meta: { page: 1, limit: 20, total: 1, totalPages: 1 }, message: 'Reviews fetched successfully.' } } })
  list(@Query() query: ListReviewsDto) { return this.reviews.list(query); }

  @Get(':id')
  @ApiTags('02 Admin - Reviews Management')
  @Permissions('reviews.read')
  @ApiOperation({ summary: 'Fetch review moderation details', description: 'SUPER_ADMIN or ADMIN with reviews.read. Returns review details, flags, linked transaction, and moderation history for the details drawer/modal.' })
  @ApiResponse({ status: 200, schema: { example: { success: true, data: { id: 'review_id', reviewCode: 'RV-92841', reviewer: { id: 'user_id', name: 'David Chen', avatarUrl: 'https://cdn.yourdomain.com/user-avatars/david.png' }, source: 'GOOGLE', externalProfileUrl: 'https://example.com/profile', rating: 5, fullReviewText: 'Incredible UI and smooth experience. Highly recommend...', transactionId: 'TXN-49201-B', reviewDate: '2023-10-24T00:00:00.000Z', status: 'APPROVED', flags: { reportCount: 0, reasons: [] }, moderationHistory: [{ action: 'APPROVED', actorType: 'SYSTEM', actorName: 'System', createdAt: '2023-10-24T10:00:00.000Z' }] }, message: 'Review details fetched successfully.' } } })
  details(@Param('id') id: string) { return this.reviews.details(id); }

  @Post(':id/moderate')
  @ApiTags('02 Admin - Review Moderation')
  @Permissions('reviews.moderate')
  @ApiOperation({ summary: 'Moderate a review', description: 'SUPER_ADMIN or ADMIN with reviews.moderate/specific moderation permissions. Creates ReviewModerationLog and admin audit log. Does not physically delete reviews.' })
  @ApiBody({ type: ModerateReviewDto, examples: { hide: { value: { action: 'HIDE', reason: 'POLICY_VIOLATION', comment: 'Hidden after manual moderation.', notifyUser: false, notifyProvider: true } }, remove: { value: { action: 'REMOVE', reason: 'FAKE_REVIEW', comment: 'Removed due to fake review indicators.', notifyUser: true, notifyProvider: true } }, approve: { value: { action: 'APPROVE', reason: 'FALSE_POSITIVE', comment: 'Review checked and approved.', notifyUser: false, notifyProvider: false } } } })
  moderate(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Body() dto: ModerateReviewDto) { return this.reviews.moderate(user, id, dto); }
}
