import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DisputeNoteVisibility, ProviderDisputeAdjustmentType, ProviderDisputeCategory, ProviderDisputeCommunicationChannel, ProviderDisputeCommunicationTargetType, ProviderDisputeEvidenceRequestTarget, ProviderDisputeRuling, ProviderDisputeSeverity, ProviderDisputeStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsISO8601, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export enum ProviderDisputeRange { TODAY = 'TODAY', LAST_7_DAYS = 'LAST_7_DAYS', LAST_30_DAYS = 'LAST_30_DAYS', QUARTERLY = 'QUARTERLY', CUSTOM = 'CUSTOM' }
export enum ProviderDisputeCategoryFilter { ALL = 'ALL', NON_DELIVERY = 'NON_DELIVERY', QUALITY_ISSUE = 'QUALITY_ISSUE', REFUND_CONFLICT = 'REFUND_CONFLICT', LATE_DELIVERY = 'LATE_DELIVERY', OTHER = 'OTHER' }
export enum ProviderDisputeSeverityFilter { ALL = 'ALL', LOW = 'LOW', MEDIUM = 'MEDIUM', HIGH = 'HIGH', CRITICAL = 'CRITICAL' }
export enum ProviderDisputeStatusFilter { ALL = 'ALL', OPEN = 'OPEN', EVIDENCE_PHASE = 'EVIDENCE_PHASE', UNDER_REVIEW = 'UNDER_REVIEW', RULING_PENDING = 'RULING_PENDING', ESCALATED = 'ESCALATED', RESOLVED = 'RESOLVED', DENIED = 'DENIED' }
export enum ProviderDisputeSortBy { CREATED_AT = 'createdAt', AMOUNT = 'amount', SEVERITY = 'severity', RISK_SCORE = 'riskScore' }
export enum SortOrder { ASC = 'ASC', DESC = 'DESC' }
export enum ExportFormat { CSV = 'CSV', PDF = 'PDF' }

export class ProviderDisputeDateRangeDto {
  @ApiPropertyOptional({ enum: ProviderDisputeRange }) @IsOptional() @IsEnum(ProviderDisputeRange) range?: ProviderDisputeRange;
  @ApiPropertyOptional() @IsOptional() @IsISO8601() fromDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsISO8601() toDate?: string;
}

export class ListProviderDisputesDto extends ProviderDisputeDateRangeDto {
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() providerId?: string;
  @ApiPropertyOptional({ enum: ProviderDisputeCategoryFilter }) @IsOptional() @IsEnum(ProviderDisputeCategoryFilter) category?: ProviderDisputeCategoryFilter;
  @ApiPropertyOptional({ enum: ProviderDisputeSeverityFilter }) @IsOptional() @IsEnum(ProviderDisputeSeverityFilter) severity?: ProviderDisputeSeverityFilter;
  @ApiPropertyOptional({ enum: ProviderDisputeStatusFilter }) @IsOptional() @IsEnum(ProviderDisputeStatusFilter) status?: ProviderDisputeStatusFilter;
  @ApiPropertyOptional({ enum: ProviderDisputeSortBy }) @IsOptional() @IsEnum(ProviderDisputeSortBy) sortBy?: ProviderDisputeSortBy;
  @ApiPropertyOptional({ enum: SortOrder }) @IsOptional() @IsEnum(SortOrder) sortOrder?: SortOrder;
}

export class RequestProviderDisputeEvidenceDto {
  @ApiProperty({ enum: ProviderDisputeEvidenceRequestTarget, example: ProviderDisputeEvidenceRequestTarget.PROVIDER }) @IsEnum(ProviderDisputeEvidenceRequestTarget) target!: ProviderDisputeEvidenceRequestTarget;
  @ApiProperty({ example: 'Please upload photographic proof of delivery and driver log.' }) @IsString() @MaxLength(2000) message!: string;
  @ApiProperty() @IsISO8601() dueAt!: string;
  @ApiPropertyOptional({ example: true }) @IsOptional() @IsBoolean() notifyTarget?: boolean;
}

export class MarkProviderDisputeEvidenceReviewedDto {
  @ApiProperty({ example: 'Provider evidence is incomplete. GPS data was submitted late and lacks photo confirmation.' }) @IsString() @MaxLength(2000) reviewerNotes!: string;
  @ApiProperty({ example: 'RULING' }) @IsString() nextStep!: string;
}

export class AddProviderDisputeNoteDto {
  @ApiProperty({ example: 'Provider failed to submit required photographic proof.' }) @IsString() @MaxLength(2000) note!: string;
  @ApiProperty({ enum: DisputeNoteVisibility, example: DisputeNoteVisibility.INTERNAL }) @IsEnum(DisputeNoteVisibility) visibility!: DisputeNoteVisibility;
}

export class ExportProviderDisputesDto {
  @ApiPropertyOptional({ enum: ProviderDisputeStatus }) @IsOptional() @IsEnum(ProviderDisputeStatus) status?: ProviderDisputeStatus;
  @ApiPropertyOptional({ enum: ProviderDisputeSeverity }) @IsOptional() @IsEnum(ProviderDisputeSeverity) severity?: ProviderDisputeSeverity;
  @ApiPropertyOptional({ enum: ProviderDisputeCategory }) @IsOptional() @IsEnum(ProviderDisputeCategory) category?: ProviderDisputeCategory;
  @ApiPropertyOptional() @IsOptional() @IsISO8601() fromDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsISO8601() toDate?: string;
  @ApiPropertyOptional({ enum: ExportFormat }) @IsOptional() @IsEnum(ExportFormat) format?: ExportFormat;
}

export class SaveProviderDisputeRulingDto {
  @ApiProperty({ enum: ProviderDisputeRuling, example: ProviderDisputeRuling.CUSTOMER_WINS_FULL_REFUND }) @IsEnum(ProviderDisputeRuling) ruling!: ProviderDisputeRuling;
  @ApiProperty({ example: 'Provider failed to provide required proof of delivery.' }) @IsString() @MaxLength(2000) rulingReason!: string;
  @ApiPropertyOptional({ example: 89.99 }) @IsOptional() @Type(() => Number) @IsNumber() @Min(0) refundAmount?: number;
  @ApiPropertyOptional({ example: true }) @IsOptional() @IsBoolean() applyPenalty?: boolean;
  @ApiPropertyOptional({ example: 25 }) @IsOptional() @Type(() => Number) @IsNumber() @Min(0) penaltyAmount?: number;
  @ApiPropertyOptional({ example: 'Repeat offense' }) @IsOptional() @IsString() @MaxLength(1000) penaltyReason?: string;
  @ApiPropertyOptional({ example: false }) @IsOptional() @IsBoolean() saveAsDraft?: boolean;
}

export class LinkProviderDisputePayoutDto {
  @ApiProperty({ enum: ProviderDisputeAdjustmentType, example: ProviderDisputeAdjustmentType.DEDUCT_FROM_NEXT_PAYOUT }) @IsEnum(ProviderDisputeAdjustmentType) adjustmentType!: ProviderDisputeAdjustmentType;
  @ApiProperty({ example: true }) @IsBoolean() confirmFinancialAccuracy!: boolean;
  @ApiPropertyOptional({ example: true }) @IsOptional() @IsBoolean() sendProviderSummary?: boolean;
}

export class FinalProviderDisputeAttestationDto {
  @ApiProperty({ example: true }) @IsBoolean() confirmFinancialLineItems!: boolean;
  @ApiPropertyOptional({ example: true }) @IsOptional() @IsBoolean() sendAutomatedFinancialSummary?: boolean;
  @ApiPropertyOptional({ example: 'All financial line items confirmed as accurate.' }) @IsOptional() @IsString() @MaxLength(2000) comment?: string;
}

export class FinalizeProviderDisputeDto {
  @ApiPropertyOptional({ example: true }) @IsOptional() @IsBoolean() notifyCustomer?: boolean;
  @ApiPropertyOptional({ example: true }) @IsOptional() @IsBoolean() notifyProvider?: boolean;
  @ApiPropertyOptional({ example: true }) @IsOptional() @IsBoolean() executeFinancialAdjustments?: boolean;
  @ApiPropertyOptional({ example: 'Final ruling confirmed and financial adjustments approved.' }) @IsOptional() @IsString() @MaxLength(2000) comment?: string;
}

export class ExportProviderDisputeResolutionLogDto {
  @ApiPropertyOptional({ enum: ExportFormat, example: ExportFormat.PDF }) @IsOptional() @IsEnum(ExportFormat) format?: ExportFormat;
}

export class ResendProviderDisputeNotificationDto {
  @ApiProperty({ enum: ProviderDisputeCommunicationTargetType, example: ProviderDisputeCommunicationTargetType.PROVIDER }) @IsEnum(ProviderDisputeCommunicationTargetType) target!: ProviderDisputeCommunicationTargetType;
  @ApiProperty({ enum: ProviderDisputeCommunicationChannel, isArray: true, example: [ProviderDisputeCommunicationChannel.EMAIL, ProviderDisputeCommunicationChannel.IN_APP] }) @IsEnum(ProviderDisputeCommunicationChannel, { each: true }) channels!: ProviderDisputeCommunicationChannel[];
  @ApiProperty({ example: 'Reminder: Your dispute resolution is available in the provider portal.' }) @IsString() @MaxLength(2000) message!: string;
}
