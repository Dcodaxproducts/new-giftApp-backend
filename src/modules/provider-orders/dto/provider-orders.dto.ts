import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsISO8601, IsOptional, IsString, Max, Min } from 'class-validator';

export enum ProviderOrderStatusFilter { ALL = 'ALL', PENDING = 'PENDING', ACCEPTED = 'ACCEPTED', PROCESSING = 'PROCESSING', SHIPPED = 'SHIPPED', DELIVERED = 'DELIVERED', COMPLETED = 'COMPLETED', CANCELLED = 'CANCELLED', REJECTED = 'REJECTED' }
export enum ProviderOrderSortBy { CREATED_AT = 'createdAt', AMOUNT = 'amount', STATUS = 'status' }
export enum ProviderOrderSortOrder { ASC = 'ASC', DESC = 'DESC' }

export class ListProviderOrdersDto {
  @ApiPropertyOptional({ example: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @ApiPropertyOptional({ example: 10, default: 10 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number;
  @ApiPropertyOptional({ enum: ProviderOrderStatusFilter, example: ProviderOrderStatusFilter.PENDING }) @IsOptional() @IsEnum(ProviderOrderStatusFilter) status?: ProviderOrderStatusFilter;
  @ApiPropertyOptional({ example: 'ORD-10293' }) @IsOptional() @IsString() search?: string;
  @ApiPropertyOptional({ example: '2026-10-01T00:00:00.000Z' }) @IsOptional() @IsISO8601() fromDate?: string;
  @ApiPropertyOptional({ example: '2026-10-31T23:59:59.999Z' }) @IsOptional() @IsISO8601() toDate?: string;
  @ApiPropertyOptional({ enum: ProviderOrderSortBy }) @IsOptional() @IsEnum(ProviderOrderSortBy) sortBy?: ProviderOrderSortBy;
  @ApiPropertyOptional({ enum: ProviderOrderSortOrder }) @IsOptional() @IsEnum(ProviderOrderSortOrder) sortOrder?: ProviderOrderSortOrder;
}

export class ProviderOrdersSummaryDto {
  @ApiPropertyOptional({ example: '2026-10-01T00:00:00.000Z' }) @IsOptional() @IsISO8601() fromDate?: string;
  @ApiPropertyOptional({ example: '2026-10-31T23:59:59.999Z' }) @IsOptional() @IsISO8601() toDate?: string;
}

export class UpdateProviderOrderStatusDto {
  @ApiProperty({ enum: OrderStatus, example: OrderStatus.ACCEPTED }) @IsEnum(OrderStatus) status!: OrderStatus;
  @ApiPropertyOptional({ example: 'Out of stock', description: 'Required when status is REJECTED' }) @IsOptional() @IsString() reason?: string;
}
export const providerOrderStatuses = Object.values(OrderStatus);

export enum ProviderOrderHistoryStatus { ALL = 'ALL', PENDING = 'PENDING', ACCEPTED = 'ACCEPTED', PROCESSING = 'PROCESSING', SHIPPED = 'SHIPPED', DELIVERED = 'DELIVERED', COMPLETED = 'COMPLETED', CANCELLED = 'CANCELLED', REJECTED = 'REJECTED' }
export enum ProviderPerformanceRange { TODAY = 'TODAY', THIS_WEEK = 'THIS_WEEK', THIS_MONTH = 'THIS_MONTH', CUSTOM = 'CUSTOM' }
export enum ProviderRevenueRange { DAILY = 'DAILY', WEEKLY = 'WEEKLY', MONTHLY = 'MONTHLY' }
export enum ProviderOrderExportFormat { CSV = 'CSV' }

export class ProviderOrderHistoryDto { @ApiPropertyOptional({ example: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number; @ApiPropertyOptional({ example: 10, default: 10 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number; @ApiPropertyOptional({ enum: ProviderOrderHistoryStatus }) @IsOptional() @IsEnum(ProviderOrderHistoryStatus) status?: ProviderOrderHistoryStatus; @ApiPropertyOptional({ example: 'ORD-88425' }) @IsOptional() @IsString() search?: string; @ApiPropertyOptional({ example: '2026-10-01T00:00:00.000Z' }) @IsOptional() @IsISO8601() fromDate?: string; @ApiPropertyOptional({ example: '2026-10-31T23:59:59.999Z' }) @IsOptional() @IsISO8601() toDate?: string; @ApiPropertyOptional({ enum: ProviderOrderSortBy }) @IsOptional() @IsEnum(ProviderOrderSortBy) sortBy?: ProviderOrderSortBy; @ApiPropertyOptional({ enum: ProviderOrderSortOrder }) @IsOptional() @IsEnum(ProviderOrderSortOrder) sortOrder?: ProviderOrderSortOrder; }
export class ProviderRecentOrdersDto { @ApiPropertyOptional({ example: 10, default: 10 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50) limit?: number; }
export class ProviderPerformanceDto { @ApiPropertyOptional({ enum: ProviderPerformanceRange }) @IsOptional() @IsEnum(ProviderPerformanceRange) range?: ProviderPerformanceRange; @ApiPropertyOptional({ example: '2026-10-01T00:00:00.000Z' }) @IsOptional() @IsISO8601() fromDate?: string; @ApiPropertyOptional({ example: '2026-10-31T23:59:59.999Z' }) @IsOptional() @IsISO8601() toDate?: string; }
export class ProviderRevenueAnalyticsDto { @ApiPropertyOptional({ enum: ProviderRevenueRange }) @IsOptional() @IsEnum(ProviderRevenueRange) range?: ProviderRevenueRange; @ApiPropertyOptional({ example: '2026-10-01T00:00:00.000Z' }) @IsOptional() @IsISO8601() fromDate?: string; @ApiPropertyOptional({ example: '2026-10-31T23:59:59.999Z' }) @IsOptional() @IsISO8601() toDate?: string; }
export class ProviderOrdersExportDto { @ApiPropertyOptional({ example: 'COMPLETED' }) @IsOptional() @IsString() status?: string; @ApiPropertyOptional({ example: '2026-10-01T00:00:00.000Z' }) @IsOptional() @IsISO8601() fromDate?: string; @ApiPropertyOptional({ example: '2026-10-31T23:59:59.999Z' }) @IsOptional() @IsISO8601() toDate?: string; @ApiPropertyOptional({ enum: ProviderOrderExportFormat, example: ProviderOrderExportFormat.CSV }) @IsOptional() @IsEnum(ProviderOrderExportFormat) format?: ProviderOrderExportFormat; }
