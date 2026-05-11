import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProviderOrderMessageChannel, ProviderOrderRejectReason, ProviderOrderStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsISO8601, IsOptional, IsString, Max, Min } from 'class-validator';

export enum ProviderOrderStatusFilter { ALL = 'ALL', PENDING = 'PENDING', ACCEPTED = 'ACCEPTED', PROCESSING = 'PROCESSING', PACKED = 'PACKED', READY_TO_FULFILL = 'READY_TO_FULFILL', SHIPPED = 'SHIPPED', OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY', DELIVERED = 'DELIVERED', COMPLETED = 'COMPLETED', CANCELLED = 'CANCELLED', REJECTED = 'REJECTED', REFUND_REQUESTED = 'REFUND_REQUESTED', REFUND_PROCESSING = 'REFUND_PROCESSING', REFUNDED = 'REFUNDED', REFUND_REJECTED = 'REFUND_REJECTED' }
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
export class UpdateProviderOrderStatusDto { @ApiProperty({ enum: ProviderOrderStatus, example: ProviderOrderStatus.SHIPPED }) @IsEnum(ProviderOrderStatus) status!: ProviderOrderStatus; @ApiPropertyOptional({ example: 'Package handed over to courier.' }) @IsOptional() @IsString() note?: string; @ApiPropertyOptional({ example: 'FDX-123456' }) @IsOptional() @IsString() trackingNumber?: string; @ApiPropertyOptional({ example: 'FedEx' }) @IsOptional() @IsString() carrier?: string; @ApiPropertyOptional({ example: '2026-10-26T10:00:00.000Z' }) @IsOptional() @IsISO8601() estimatedDeliveryAt?: string; }
export class FulfillProviderOrderDto { @ApiProperty({ example: '2026-04-23T14:45:00.000Z' }) @IsISO8601() dispatchAt!: string; @ApiPropertyOptional({ example: '2026-04-28T10:00:00.000Z' }) @IsOptional() @IsISO8601() estimatedDeliveryAt?: string; @ApiProperty({ example: 'Express Delivery Co.' }) @IsString() carrier!: string; @ApiProperty({ example: 'TRK-8842-4567-9023' }) @IsString() trackingNumber!: string; @ApiPropertyOptional({ example: true, default: true }) @IsOptional() @IsBoolean() notifyCustomer?: boolean; @ApiPropertyOptional({ example: 'Order dispatched successfully.' }) @IsOptional() @IsString() note?: string; }
export type ProviderChecklistCustomItem = { id?: string; label: string; isCompleted: boolean };
export class UpdateProviderOrderChecklistDto { @ApiPropertyOptional({ example: true }) @IsOptional() @IsBoolean() itemsPacked?: boolean; @ApiPropertyOptional({ example: true }) @IsOptional() @IsBoolean() giftMessageAttached?: boolean; @ApiPropertyOptional({ example: true }) @IsOptional() @IsBoolean() addressVerified?: boolean; @ApiPropertyOptional({ example: true }) @IsOptional() @IsBoolean() customerContactChecked?: boolean; @ApiPropertyOptional({ example: false }) @IsOptional() @IsBoolean() readyForCourier?: boolean; @ApiPropertyOptional({ example: [{ id: 'checklist_item_id', label: 'Include gift wrap', isCompleted: true }] }) @IsOptional() customItems?: ProviderChecklistCustomItem[]; }
export class MessageBuyerDto { @ApiProperty({ example: 'Your order is being prepared and will be shipped soon.' }) @IsString() message!: string; @ApiProperty({ enum: ProviderOrderMessageChannel, example: ProviderOrderMessageChannel.IN_APP }) @IsEnum(ProviderOrderMessageChannel) channel!: ProviderOrderMessageChannel; }
export const providerOrderStatuses = Object.values(ProviderOrderStatus);

export enum ProviderOrderHistoryStatus { ALL = 'ALL', PENDING = 'PENDING', ACCEPTED = 'ACCEPTED', PROCESSING = 'PROCESSING', PACKED = 'PACKED', READY_TO_FULFILL = 'READY_TO_FULFILL', SHIPPED = 'SHIPPED', OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY', DELIVERED = 'DELIVERED', COMPLETED = 'COMPLETED', CANCELLED = 'CANCELLED', REJECTED = 'REJECTED', REFUND_REQUESTED = 'REFUND_REQUESTED', REFUND_PROCESSING = 'REFUND_PROCESSING', REFUNDED = 'REFUNDED', REFUND_REJECTED = 'REFUND_REJECTED', DRAFT = 'DRAFT' }
export enum ProviderPerformanceRange { TODAY = 'TODAY', THIS_WEEK = 'THIS_WEEK', THIS_MONTH = 'THIS_MONTH', CUSTOM = 'CUSTOM' }
export enum ProviderRevenueRange { DAILY = 'DAILY', WEEKLY = 'WEEKLY', MONTHLY = 'MONTHLY' }
export enum ProviderOrderExportFormat { CSV = 'CSV' }

export class ProviderOrderHistoryDto { @ApiPropertyOptional({ example: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number; @ApiPropertyOptional({ example: 20 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number; @ApiPropertyOptional({ enum: ProviderOrderHistoryStatus }) @IsOptional() @IsEnum(ProviderOrderHistoryStatus) status?: ProviderOrderHistoryStatus; @ApiPropertyOptional({ example: 'ORD-88425' }) @IsOptional() @IsString() search?: string; @ApiPropertyOptional({ example: '2026-10-01T00:00:00.000Z' }) @IsOptional() @IsISO8601() fromDate?: string; @ApiPropertyOptional({ example: '2026-10-31T23:59:59.999Z' }) @IsOptional() @IsISO8601() toDate?: string; @ApiPropertyOptional({ enum: ProviderOrderSortBy }) @IsOptional() @IsEnum(ProviderOrderSortBy) sortBy?: ProviderOrderSortBy; @ApiPropertyOptional({ enum: ProviderOrderSortOrder }) @IsOptional() @IsEnum(ProviderOrderSortOrder) sortOrder?: ProviderOrderSortOrder; }
export class ProviderRecentOrdersDto { @ApiPropertyOptional({ example: 5 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50) limit?: number; }
export class ProviderPerformanceDto { @ApiPropertyOptional({ enum: ProviderPerformanceRange }) @IsOptional() @IsEnum(ProviderPerformanceRange) range?: ProviderPerformanceRange; @ApiPropertyOptional({ example: '2026-10-01T00:00:00.000Z' }) @IsOptional() @IsISO8601() fromDate?: string; @ApiPropertyOptional({ example: '2026-10-31T23:59:59.999Z' }) @IsOptional() @IsISO8601() toDate?: string; }
export class ProviderRevenueAnalyticsDto { @ApiPropertyOptional({ enum: ProviderRevenueRange }) @IsOptional() @IsEnum(ProviderRevenueRange) range?: ProviderRevenueRange; @ApiPropertyOptional({ example: '2026-10-01T00:00:00.000Z' }) @IsOptional() @IsISO8601() fromDate?: string; @ApiPropertyOptional({ example: '2026-10-31T23:59:59.999Z' }) @IsOptional() @IsISO8601() toDate?: string; }
export class ProviderOrdersExportDto { @ApiPropertyOptional({ example: 'COMPLETED' }) @IsOptional() @IsString() status?: string; @ApiPropertyOptional({ example: '2026-10-01T00:00:00.000Z' }) @IsOptional() @IsISO8601() fromDate?: string; @ApiPropertyOptional({ example: '2026-10-31T23:59:59.999Z' }) @IsOptional() @IsISO8601() toDate?: string; @ApiPropertyOptional({ enum: ProviderOrderExportFormat, example: ProviderOrderExportFormat.CSV }) @IsOptional() @IsEnum(ProviderOrderExportFormat) format?: ProviderOrderExportFormat; }
