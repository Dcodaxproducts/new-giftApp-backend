import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthUserContext, CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { AdminReviewsService } from '../services/admin-reviews.service';
import { TestReviewPolicyDto, UpdateReviewPoliciesDto } from '../dto/admin-reviews.dto';

@ApiTags('02 Admin - Review Policies')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
@Controller('admin/review-policies')
export class ReviewPoliciesController {
  constructor(private readonly reviews: AdminReviewsService) {}

  @Get()
  @Permissions('reviewPolicies.read')
  @ApiOperation({ summary: 'Fetch review moderation policies', description: 'SUPER_ADMIN or ADMIN with reviewPolicies.read. AI moderation fields are config-only until external AI is configured.' })
  @ApiResponse({ status: 200, schema: { example: { success: true, data: { autoApprovalRules: { enabled: true, minRating: 4, minConfidence: 90 }, spamDetection: { enabled: true, autoHideConfidenceThreshold: 85 }, abuseThresholds: { enabled: true, warningThreshold: 3, autoRemoveThreshold: 5, status: 'WARNING' }, visibilityRules: { enabled: true, hideUntilModerated: true }, autoModeration: { enabled: true, confidenceWarningThreshold: 85, currentConfidence: 82 } }, message: 'Review policies fetched successfully.' } } })
  policies() { return this.reviews.policies(); }

  @Patch()
  @Permissions('reviewPolicies.update')
  @ApiOperation({ summary: 'Update review moderation policies', description: 'SUPER_ADMIN or delegated ADMIN with reviewPolicies.update. Creates an audit log and never exposes AI provider secrets.' })
  @ApiBody({ type: UpdateReviewPoliciesDto })
  update(@CurrentUser() user: AuthUserContext, @Body() dto: UpdateReviewPoliciesDto) { return this.reviews.updatePolicies(user, dto); }

  @Post('test')
  @Permissions('reviewPolicies.read')
  @ApiOperation({ summary: 'Test review policy result', description: 'Deterministic rule-based placeholder. No external AI call is made unless future configuration enables it.' })
  test(@Body() dto: TestReviewPolicyDto) { return this.reviews.testPolicy(dto); }
}
