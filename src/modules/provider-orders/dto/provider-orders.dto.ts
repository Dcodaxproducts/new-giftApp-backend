import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProviderOrderMessageChannel, ProviderOrderRejectReason, ProviderOrderStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsISO8601, IsOptional, IsString, Max, Min } from 'class-validator';

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
export class UpdateProviderOrderStatusDto { @ApiProperty({ enum: ProviderOrderStatus, example: ProviderOrderStatus.SHIPPED }) @IsEnum(ProviderOrderStatus) status!: ProviderOrderStatus; @ApiPropertyOptional({ example: 'Package handed over to courier.' }) @IsOptional() @IsString() note?: string; @ApiPropertyOptional({ example: 'FDX-123456' }) @IsOptional() @IsString() trackingNumber?: string; @ApiPropertyOptional({ example: 'FedEx' }) @IsOptional() @IsString() carrier?: string; @ApiPropertyOptional({ example: '2026-10-26T10:00:00.000Z' }) @IsOptional() @IsISO8601() estimatedDeliveryAt?: string; }
export type ProviderChecklistCustomItem = { id?: string; label: string; isCompleted: boolean };
export class UpdateProviderOrderChecklistDto { @ApiPropertyOptional({ example: true }) @IsOptional() @IsBoolean() itemsPacked?: boolean; @ApiPropertyOptional({ example: true }) @IsOptional() @IsBoolean() giftMessageAttached?: boolean; @ApiPropertyOptional({ example: true }) @IsOptional() @IsBoolean() addressVerified?: boolean; @ApiPropertyOptional({ example: true }) @IsOptional() @IsBoolean() customerContactChecked?: boolean; @ApiPropertyOptional({ example: false }) @IsOptional() @IsBoolean() readyForCourier?: boolean; @ApiPropertyOptional({ example: [{ id: 'checklist_item_id', label: 'Include gift wrap', isCompleted: true }] }) @IsOptional() customItems?: ProviderChecklistCustomItem[]; }
export class MessageBuyerDto { @ApiProperty({ example: 'Your order is being prepared and will be shipped soon.' }) @IsString() message!: string; @ApiProperty({ enum: ProviderOrderMessageChannel, example: ProviderOrderMessageChannel.IN_APP }) @IsEnum(ProviderOrderMessageChannel) channel!: ProviderOrderMessageChannel; }
export const providerOrderStatuses = Object.values(ProviderOrderStatus);
