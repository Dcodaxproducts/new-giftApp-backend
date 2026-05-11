import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProviderOrderRejectReason, ProviderOrderStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsISO8601, IsOptional, IsString, Max, Min } from 'class-validator';

export enum ProviderOrderStatusFilter { ALL = 'ALL', PENDING = 'PENDING', ACCEPTED = 'ACCEPTED', PROCESSING = 'PROCESSING', PACKED = 'PACKED', SHIPPED = 'SHIPPED', DELIVERED = 'DELIVERED', COMPLETED = 'COMPLETED', CANCELLED = 'CANCELLED', REJECTED = 'REJECTED', REFUNDED = 'REFUNDED' }
export enum ProviderOrderSortBy { CREATED_AT = 'createdAt', AMOUNT = 'amount', STATUS = 'status' }
export enum ProviderOrderSortOrder { ASC = 'ASC', DESC = 'DESC' }

export class ListProviderOrdersDto {
  @ApiPropertyOptional({ example: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @ApiPropertyOptional({ example: 20 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number;
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

export class AcceptProviderOrderDto { @ApiPropertyOptional({ example: 'Order accepted and will be processed shortly.' }) @IsOptional() @IsString() note?: string; }
export class RejectProviderOrderDto { @ApiProperty({ enum: ProviderOrderRejectReason, example: ProviderOrderRejectReason.OUT_OF_STOCK }) @IsEnum(ProviderOrderRejectReason) reason!: ProviderOrderRejectReason; @ApiPropertyOptional({ example: 'The selected size is currently unavailable.' }) @IsOptional() @IsString() comment?: string; }
export const providerOrderStatuses = Object.values(ProviderOrderStatus);
