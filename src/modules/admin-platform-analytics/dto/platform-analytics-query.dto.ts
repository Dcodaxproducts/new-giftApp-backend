import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export enum PlatformAnalyticsRange {
  TODAY = 'TODAY',
  LAST_7_DAYS = 'LAST_7_DAYS',
  LAST_30_DAYS = 'LAST_30_DAYS',
  LAST_90_DAYS = 'LAST_90_DAYS',
  CUSTOM = 'CUSTOM',
}

export enum PlatformAnalyticsTransactionStatus {
  ALL = 'ALL',
  COMPLETED = 'COMPLETED',
  PENDING = 'PENDING',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export enum PlatformAnalyticsSortBy {
  CREATED_AT = 'createdAt',
  AMOUNT = 'amount',
  STATUS = 'status',
}

export enum PlatformAnalyticsSortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export enum PlatformAnalyticsReportFormat {
  CSV = 'CSV',
  XLSX = 'XLSX',
  PDF = 'PDF',
}

export class PlatformAnalyticsSummaryQueryDto {
  @ApiPropertyOptional({ enum: PlatformAnalyticsRange, example: PlatformAnalyticsRange.LAST_30_DAYS })
  @IsOptional()
  @IsEnum(PlatformAnalyticsRange)
  range?: PlatformAnalyticsRange;

  @ApiPropertyOptional({ example: '2026-05-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({ example: '2026-05-31T23:59:59.999Z' })
  @IsOptional()
  @IsDateString()
  toDate?: string;

  @ApiPropertyOptional({ example: 'gift_category_id' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ example: 'provider_id' })
  @IsOptional()
  @IsString()
  providerId?: string;

  @ApiPropertyOptional({ example: 'alex.rivera@gmail.com' })
  @IsOptional()
  @IsString()
  search?: string;
}

export class PlatformAnalyticsTransactionsQueryDto extends PlatformAnalyticsSummaryQueryDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ enum: PlatformAnalyticsTransactionStatus, example: PlatformAnalyticsTransactionStatus.COMPLETED })
  @IsOptional()
  @IsEnum(PlatformAnalyticsTransactionStatus)
  status?: PlatformAnalyticsTransactionStatus;

  @ApiPropertyOptional({ example: 'Pro' })
  @IsOptional()
  @IsString()
  plan?: string;

  @ApiPropertyOptional({ enum: PlatformAnalyticsSortBy, example: PlatformAnalyticsSortBy.CREATED_AT })
  @IsOptional()
  @IsEnum(PlatformAnalyticsSortBy)
  sortBy?: PlatformAnalyticsSortBy;

  @ApiPropertyOptional({ enum: PlatformAnalyticsSortOrder, example: PlatformAnalyticsSortOrder.DESC })
  @IsOptional()
  @IsEnum(PlatformAnalyticsSortOrder)
  sortOrder?: PlatformAnalyticsSortOrder;
}

export class PlatformAnalyticsReportQueryDto extends PlatformAnalyticsSummaryQueryDto {
  @ApiPropertyOptional({ enum: PlatformAnalyticsReportFormat, example: PlatformAnalyticsReportFormat.CSV })
  @IsOptional()
  @IsEnum(PlatformAnalyticsReportFormat)
  format?: PlatformAnalyticsReportFormat;

  @ApiPropertyOptional({ enum: PlatformAnalyticsTransactionStatus, example: PlatformAnalyticsTransactionStatus.COMPLETED })
  @IsOptional()
  @IsEnum(PlatformAnalyticsTransactionStatus)
  status?: PlatformAnalyticsTransactionStatus;
}
