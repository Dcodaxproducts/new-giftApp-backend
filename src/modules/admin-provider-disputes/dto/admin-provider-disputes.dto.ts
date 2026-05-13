import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DisputeNoteVisibility, ProviderDisputeCategory, ProviderDisputeEvidenceRequestTarget, ProviderDisputeSeverity, ProviderDisputeStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsISO8601, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

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
