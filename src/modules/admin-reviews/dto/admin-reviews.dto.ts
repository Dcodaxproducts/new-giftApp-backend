import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsISO8601, IsInt, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';
import { ReviewFlagReason, ReviewModerationAction, ReviewSeverity, ReviewStatus } from '@prisma/client';

export enum ReviewStatsRange { TODAY = 'TODAY', LAST_7_DAYS = 'LAST_7_DAYS', LAST_30_DAYS = 'LAST_30_DAYS', CUSTOM = 'CUSTOM' }
export enum FlaggedWindow { LAST_24H = 'LAST_24H', LAST_7_DAYS = 'LAST_7_DAYS', LAST_30_DAYS = 'LAST_30_DAYS' }
export enum ReviewSortBy { CREATED_AT = 'createdAt', RATING = 'rating', SEVERITY = 'severity' }
export enum ReviewExportFormat { CSV = 'CSV', PDF = 'PDF' }
export enum SortOrder { ASC = 'ASC', DESC = 'DESC' }
export enum QueueStatus { FLAGGED = 'FLAGGED', PENDING = 'PENDING' }
export enum ManualReviewModerationAction { APPROVE = 'APPROVE', HIDE = 'HIDE', REMOVE = 'REMOVE', PENALIZE = 'PENALIZE', RESTORE = 'RESTORE', MARK_SPAM = 'MARK_SPAM', MARK_FAKE = 'MARK_FAKE' }
export enum AllReviewStatus { ALL = 'ALL', PUBLISHED = 'PUBLISHED', PENDING = 'PENDING', FLAGGED = 'FLAGGED', HIDDEN = 'HIDDEN', REMOVED = 'REMOVED', PENALIZED = 'PENALIZED' }
export enum AllReviewSeverity { ALL = 'ALL', CRITICAL = 'CRITICAL', HIGH = 'HIGH', MEDIUM = 'MEDIUM', LOW = 'LOW' }

class PageDto {
  @ApiPropertyOptional({ example: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @ApiPropertyOptional({ example: 20 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number;
}

class DateRangeDto {
  @ApiPropertyOptional({ example: '2026-05-01T00:00:00.000Z' }) @IsOptional() @IsISO8601() fromDate?: string;
  @ApiPropertyOptional({ example: '2026-05-31T23:59:59.999Z' }) @IsOptional() @IsISO8601() toDate?: string;
}

export class ReviewStatsDto extends DateRangeDto {
  @ApiPropertyOptional({ enum: ReviewStatsRange, example: ReviewStatsRange.LAST_7_DAYS }) @IsOptional() @IsEnum(ReviewStatsRange) range?: ReviewStatsRange;
}

export class ListReviewsDto extends PageDto {
  @ApiPropertyOptional({ example: 'spam' }) @IsOptional() @IsString() search?: string;
  @ApiPropertyOptional({ example: 1, enum: [1, 2, 3, 4, 5] }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(5) rating?: number;
  @ApiPropertyOptional({ enum: AllReviewStatus, example: AllReviewStatus.FLAGGED }) @IsOptional() @IsEnum(AllReviewStatus) status?: AllReviewStatus;
  @ApiPropertyOptional({ enum: AllReviewSeverity, example: AllReviewSeverity.CRITICAL }) @IsOptional() @IsEnum(AllReviewSeverity) severity?: AllReviewSeverity;
  @ApiPropertyOptional() @IsOptional() @IsString() providerId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() userId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() orderId?: string;
  @ApiPropertyOptional({ example: true }) @IsOptional() @Type(() => Boolean) @IsBoolean() hasProviderResponse?: boolean;
  @ApiPropertyOptional({ example: '2026-05-01T00:00:00.000Z' }) @IsOptional() @IsISO8601() fromDate?: string;
  @ApiPropertyOptional({ example: '2026-05-31T23:59:59.999Z' }) @IsOptional() @IsISO8601() toDate?: string;
  @ApiPropertyOptional({ enum: ReviewSortBy, example: ReviewSortBy.CREATED_AT }) @IsOptional() @IsEnum(ReviewSortBy) sortBy?: ReviewSortBy;
  @ApiPropertyOptional({ enum: SortOrder, example: SortOrder.DESC }) @IsOptional() @IsEnum(SortOrder) sortOrder?: SortOrder;
}

export class FlaggedSummaryDto {
  @ApiPropertyOptional({ enum: FlaggedWindow, example: FlaggedWindow.LAST_24H }) @IsOptional() @IsEnum(FlaggedWindow) window?: FlaggedWindow;
}

export class ModerationQueueDto extends PageDto {
  @ApiPropertyOptional({ enum: AllReviewSeverity, example: AllReviewSeverity.CRITICAL }) @IsOptional() @IsEnum(AllReviewSeverity) severity?: AllReviewSeverity;
  @ApiPropertyOptional({ enum: QueueStatus, example: QueueStatus.FLAGGED }) @IsOptional() @IsEnum(QueueStatus) status?: QueueStatus;
  @ApiPropertyOptional({ enum: ReviewFlagReason, example: ReviewFlagReason.SPAM }) @IsOptional() @IsEnum(ReviewFlagReason) reason?: ReviewFlagReason;
  @ApiPropertyOptional({ enum: [ReviewSortBy.CREATED_AT, ReviewSortBy.SEVERITY], example: ReviewSortBy.CREATED_AT }) @IsOptional() @IsEnum(ReviewSortBy) sortBy?: ReviewSortBy;
  @ApiPropertyOptional({ enum: SortOrder, example: SortOrder.DESC }) @IsOptional() @IsEnum(SortOrder) sortOrder?: SortOrder;
}

export class ModerateReviewDto {
  @ApiProperty({ enum: ManualReviewModerationAction, example: ManualReviewModerationAction.APPROVE }) @IsEnum(ManualReviewModerationAction) action!: ReviewModerationAction;
  @ApiProperty({ enum: ReviewFlagReason, example: ReviewFlagReason.FALSE_POSITIVE }) @IsEnum(ReviewFlagReason) reason!: ReviewFlagReason;
  @ApiPropertyOptional({ example: 'Review checked manually and approved.' }) @IsOptional() @IsString() comment?: string;
  @ApiPropertyOptional({ example: true }) @IsOptional() @IsBoolean() notifyProvider?: boolean;
  @ApiPropertyOptional({ example: false }) @IsOptional() @IsBoolean() notifyCustomer?: boolean;
}

export class ModerationLogsDto extends PageDto {
  @ApiPropertyOptional() @IsOptional() @IsString() reviewId?: string;
  @ApiPropertyOptional({ enum: ReviewModerationAction }) @IsOptional() @IsEnum(ReviewModerationAction) action?: ReviewModerationAction;
  @ApiPropertyOptional() @IsOptional() @IsString() actorId?: string;
  @ApiPropertyOptional({ example: '2026-05-01T00:00:00.000Z' }) @IsOptional() @IsISO8601() fromDate?: string;
  @ApiPropertyOptional({ example: '2026-05-31T23:59:59.999Z' }) @IsOptional() @IsISO8601() toDate?: string;
}

export class AutoApprovalRulesDto { @ApiProperty({ example: true }) @IsBoolean() enabled!: boolean; @ApiProperty({ example: 4 }) @IsInt() @Min(1) @Max(5) minRating!: number; @ApiProperty({ example: 90 }) @IsInt() @Min(0) @Max(100) minConfidence!: number; }
export class SpamDetectionDto { @ApiProperty({ example: true }) @IsBoolean() enabled!: boolean; @ApiProperty({ example: 85 }) @IsInt() @Min(0) @Max(100) autoHideConfidenceThreshold!: number; }
export class AbuseThresholdsDto { @ApiProperty({ example: true }) @IsBoolean() enabled!: boolean; @ApiProperty({ example: 3 }) @IsInt() @Min(1) warningThreshold!: number; @ApiProperty({ example: 5 }) @IsInt() @Min(1) autoRemoveThreshold!: number; }
export class VisibilityRulesDto { @ApiProperty({ example: true }) @IsBoolean() enabled!: boolean; @ApiProperty({ example: true }) @IsBoolean() hideUntilModerated!: boolean; }
export class AutoModerationDto { @ApiProperty({ example: true }) @IsBoolean() enabled!: boolean; @ApiProperty({ example: 85 }) @IsInt() @Min(0) @Max(100) confidenceWarningThreshold!: number; }

export class UpdateReviewPoliciesDto {
  @ApiProperty({ type: AutoApprovalRulesDto }) @ValidateNested() @Type(() => AutoApprovalRulesDto) autoApprovalRules!: AutoApprovalRulesDto;
  @ApiProperty({ type: SpamDetectionDto }) @ValidateNested() @Type(() => SpamDetectionDto) spamDetection!: SpamDetectionDto;
  @ApiProperty({ type: AbuseThresholdsDto }) @ValidateNested() @Type(() => AbuseThresholdsDto) abuseThresholds!: AbuseThresholdsDto;
  @ApiProperty({ type: VisibilityRulesDto }) @ValidateNested() @Type(() => VisibilityRulesDto) visibilityRules!: VisibilityRulesDto;
  @ApiProperty({ type: AutoModerationDto }) @ValidateNested() @Type(() => AutoModerationDto) autoModeration!: AutoModerationDto;
}

export class TestReviewPolicyDto {
  @ApiProperty({ example: 'This is a fake spam review.' }) @IsString() sampleReviewText!: string;
  @ApiProperty({ example: 1 }) @IsInt() @Min(1) @Max(5) rating!: number;
}

export class ExportReviewsDto extends DateRangeDto {
  @ApiPropertyOptional({ enum: ReviewExportFormat, example: ReviewExportFormat.CSV }) @IsOptional() @IsEnum(ReviewExportFormat) format?: ReviewExportFormat;
  @ApiPropertyOptional({ enum: ReviewStatus }) @IsOptional() @IsEnum(ReviewStatus) status?: ReviewStatus;
  @ApiPropertyOptional({ enum: ReviewSeverity }) @IsOptional() @IsEnum(ReviewSeverity) severity?: ReviewSeverity;
  @ApiPropertyOptional() @IsOptional() @IsString() providerId?: string;
  @ApiPropertyOptional({ example: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(5) rating?: number;
}
