import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { ProviderReportReason, ProviderReportStatus, ReviewStatus } from '@prisma/client';

export enum SortOrder { ASC = 'ASC', DESC = 'DESC' }
export enum CustomerReviewStatusFilter { ALL = 'ALL', PUBLISHED = 'PUBLISHED', PENDING = 'PENDING', FLAGGED = 'FLAGGED', HIDDEN = 'HIDDEN', REMOVED = 'REMOVED' }
export enum ProviderReportStatusFilter { ALL = 'ALL', SUBMITTED = 'SUBMITTED', UNDER_REVIEW = 'UNDER_REVIEW', RESOLVED = 'RESOLVED', REJECTED = 'REJECTED' }

export class PageDto {
  @ApiPropertyOptional({ example: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @ApiPropertyOptional({ example: 10, default: 10 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number;
}


export class CreateReviewDto {
  @ApiProperty({ example: 'provider_id' }) @IsString() providerId!: string;
  @ApiProperty({ example: 5, minimum: 1, maximum: 5 }) @IsInt() @Min(1) @Max(5) rating!: number;
  @ApiProperty({ example: 'Great service and fast delivery. The package arrived in perfect condition.' }) @IsString() @MaxLength(500) comment!: string;
}

export class ListCustomerReviewsDto extends PageDto {
  @ApiPropertyOptional({ example: 5 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(5) rating?: number;
  @ApiPropertyOptional({ example: 'provider_id' }) @IsOptional() @IsString() providerId?: string;
  @ApiPropertyOptional({ enum: CustomerReviewStatusFilter, example: CustomerReviewStatusFilter.PUBLISHED }) @IsOptional() @IsEnum(CustomerReviewStatusFilter) status?: CustomerReviewStatusFilter;
}

export class UpdateReviewDto { @ApiPropertyOptional({ example: 4 }) @IsOptional() @IsInt() @Min(1) @Max(5) rating?: number; @ApiPropertyOptional({ example: 'Updated review text.' }) @IsOptional() @IsString() @MaxLength(500) comment?: string; }

export class CreateProviderReportDto {
  @ApiProperty({ enum: ProviderReportReason, example: ProviderReportReason.POOR_SERVICE_QUALITY }) @IsEnum(ProviderReportReason) reason!: ProviderReportReason;
  @ApiProperty({ example: 'The provider did not respond and the order was delayed.' }) @IsString() @MaxLength(1000) details!: string;
  @ApiPropertyOptional({ example: 'order_id' }) @IsOptional() @IsString() orderId?: string;
  @ApiPropertyOptional({ type: [String], example: [] }) @IsOptional() @IsArray() @ArrayMaxSize(10) @IsString({ each: true }) evidenceUrls?: string[];
}

export class ListProviderReportsDto extends PageDto { @ApiPropertyOptional({ enum: ProviderReportStatusFilter, example: ProviderReportStatusFilter.SUBMITTED }) @IsOptional() @IsEnum(ProviderReportStatusFilter) status?: ProviderReportStatusFilter; }

export { ProviderReportReason, ProviderReportStatus, ReviewStatus };
