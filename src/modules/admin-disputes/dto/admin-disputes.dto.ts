import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DisputeNoteVisibility, DisputePriority, DisputeStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsISO8601, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export enum DisputeRange { TODAY = 'TODAY', LAST_7_DAYS = 'LAST_7_DAYS', LAST_30_DAYS = 'LAST_30_DAYS', CUSTOM = 'CUSTOM' }
export enum DisputeStatusFilter { ALL = 'ALL', OPEN = 'OPEN', IN_REVIEW = 'IN_REVIEW', ESCALATED = 'ESCALATED', RESOLVED = 'RESOLVED', REJECTED = 'REJECTED', APPROVED = 'APPROVED' }
export enum DisputePriorityFilter { ALL = 'ALL', LOW = 'LOW', MEDIUM = 'MEDIUM', HIGH = 'HIGH', CRITICAL = 'CRITICAL' }
export enum DisputeSortBy { CREATED_AT = 'createdAt', AMOUNT = 'amount', PRIORITY = 'priority', DAYS_OPEN = 'daysOpen' }
export enum SortOrder { ASC = 'ASC', DESC = 'DESC' }
export enum ExportFormat { CSV = 'CSV', PDF = 'PDF' }

export class DisputeDateRangeDto {
  @ApiPropertyOptional({ enum: DisputeRange }) @IsOptional() @IsEnum(DisputeRange) range?: DisputeRange;
  @ApiPropertyOptional() @IsOptional() @IsISO8601() fromDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsISO8601() toDate?: string;
}

export class ListDisputesDto extends DisputeDateRangeDto {
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
  @ApiPropertyOptional({ enum: DisputeStatusFilter }) @IsOptional() @IsEnum(DisputeStatusFilter) status?: DisputeStatusFilter;
  @ApiPropertyOptional({ enum: DisputePriorityFilter }) @IsOptional() @IsEnum(DisputePriorityFilter) priority?: DisputePriorityFilter;
  @ApiPropertyOptional({ enum: DisputeSortBy }) @IsOptional() @IsEnum(DisputeSortBy) sortBy?: DisputeSortBy;
  @ApiPropertyOptional({ enum: SortOrder }) @IsOptional() @IsEnum(SortOrder) sortOrder?: SortOrder;
}

export class AddDisputeNoteDto {
  @ApiProperty({ example: 'Customer tracking shows pending status for over 14 days.' }) @IsString() @MaxLength(2000) note!: string;
  @ApiProperty({ enum: DisputeNoteVisibility, example: DisputeNoteVisibility.INTERNAL }) @IsEnum(DisputeNoteVisibility) visibility!: DisputeNoteVisibility;
}

export class ExportDisputesDto {
  @ApiPropertyOptional({ enum: DisputeStatus }) @IsOptional() @IsEnum(DisputeStatus) status?: DisputeStatus;
  @ApiPropertyOptional({ enum: DisputePriority }) @IsOptional() @IsEnum(DisputePriority) priority?: DisputePriority;
  @ApiPropertyOptional() @IsOptional() @IsISO8601() fromDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsISO8601() toDate?: string;
  @ApiPropertyOptional({ enum: ExportFormat }) @IsOptional() @IsEnum(ExportFormat) format?: ExportFormat;
}
