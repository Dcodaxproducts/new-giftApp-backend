import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RefundRejectReason, RefundRequestStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsISO8601, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export enum ProviderRefundRequestStatusFilter { ALL = 'ALL', REQUESTED = 'REQUESTED', APPROVED = 'APPROVED', REJECTED = 'REJECTED', REFUNDED = 'REFUNDED', FAILED = 'FAILED' }
export enum ProviderRefundRequestSortBy { CREATED_AT = 'createdAt', AMOUNT = 'amount', STATUS = 'status' }
export enum ProviderRefundRequestSortOrder { ASC = 'ASC', DESC = 'DESC' }

export class ListProviderRefundRequestsDto {
  @ApiPropertyOptional({ example: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @ApiPropertyOptional({ example: 20 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number;
  @ApiPropertyOptional({ enum: ProviderRefundRequestStatusFilter }) @IsOptional() @IsEnum(ProviderRefundRequestStatusFilter) status?: ProviderRefundRequestStatusFilter;
  @ApiPropertyOptional({ example: '88417' }) @IsOptional() @IsString() search?: string;
  @ApiPropertyOptional({ example: '2026-10-01T00:00:00.000Z' }) @IsOptional() @IsISO8601() fromDate?: string;
  @ApiPropertyOptional({ example: '2026-10-31T23:59:59.999Z' }) @IsOptional() @IsISO8601() toDate?: string;
  @ApiPropertyOptional({ enum: ProviderRefundRequestSortBy }) @IsOptional() @IsEnum(ProviderRefundRequestSortBy) sortBy?: ProviderRefundRequestSortBy;
  @ApiPropertyOptional({ enum: ProviderRefundRequestSortOrder }) @IsOptional() @IsEnum(ProviderRefundRequestSortOrder) sortOrder?: ProviderRefundRequestSortOrder;
}

export class ApproveProviderRefundRequestDto {
  @ApiPropertyOptional({ example: 'Refund approved after reviewing evidence.' }) @IsOptional() @IsString() comment?: string;
  @ApiProperty({ example: 45 }) @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0.01) refundAmount!: number;
  @ApiPropertyOptional({ example: true, default: true }) @IsOptional() @IsBoolean() notifyCustomer?: boolean;
}

export class RejectProviderRefundRequestDto {
  @ApiProperty({ enum: RefundRejectReason, example: RefundRejectReason.REFUND_WINDOW_EXPIRED }) @IsEnum(RefundRejectReason) reason!: RefundRejectReason;
  @ApiPropertyOptional({ example: 'The request was submitted after the allowed refund period.' }) @IsOptional() @IsString() comment?: string;
  @ApiPropertyOptional({ example: true, default: true }) @IsOptional() @IsBoolean() notifyCustomer?: boolean;
}

export const refundRequestStatuses = Object.values(RefundRequestStatus);
