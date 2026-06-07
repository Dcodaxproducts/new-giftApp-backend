import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RefundRejectReason, RefundRequestStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsISO8601, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export enum ProviderRefundRequestStatusFilter { ALL = 'ALL', REQUESTED = 'REQUESTED', APPROVED = 'APPROVED', REJECTED = 'REJECTED', REFUNDED = 'REFUNDED', FAILED = 'FAILED' }
export enum ProviderRefundRequestSortBy { CREATED_AT = 'createdAt', AMOUNT = 'amount', STATUS = 'status' }
export enum ProviderRefundRequestSortOrder { ASC = 'ASC', DESC = 'DESC' }
export enum ProviderRefundRequestAction { APPROVE = 'APPROVE', REJECT = 'REJECT' }

export class ListProviderRefundRequestsDto {
  @ApiPropertyOptional({ example: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @ApiPropertyOptional({ example: 10, default: 10 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number;
  @ApiPropertyOptional({ enum: ProviderRefundRequestStatusFilter }) @IsOptional() @IsEnum(ProviderRefundRequestStatusFilter) status?: ProviderRefundRequestStatusFilter;
  @ApiPropertyOptional({ example: '88417' }) @IsOptional() @IsString() search?: string;
  @ApiPropertyOptional({ example: '2026-10-01T00:00:00.000Z' }) @IsOptional() @IsISO8601() fromDate?: string;
  @ApiPropertyOptional({ example: '2026-10-31T23:59:59.999Z' }) @IsOptional() @IsISO8601() toDate?: string;
  @ApiPropertyOptional({ enum: ProviderRefundRequestSortBy }) @IsOptional() @IsEnum(ProviderRefundRequestSortBy) sortBy?: ProviderRefundRequestSortBy;
  @ApiPropertyOptional({ enum: ProviderRefundRequestSortOrder }) @IsOptional() @IsEnum(ProviderRefundRequestSortOrder) sortOrder?: ProviderRefundRequestSortOrder;
}

export class ProviderRefundRequestActionDto {
  @ApiProperty({ enum: ProviderRefundRequestAction, example: ProviderRefundRequestAction.APPROVE }) @IsEnum(ProviderRefundRequestAction) action!: ProviderRefundRequestAction;
  @ApiPropertyOptional({ enum: RefundRejectReason, example: RefundRejectReason.NOT_COVERED_BY_POLICY, description: 'Required when action is REJECT.' }) @IsOptional() @IsEnum(RefundRejectReason) reason?: RefundRejectReason;
  @ApiPropertyOptional({ example: 'Refund approved after evidence review.' }) @IsOptional() @IsString() comment?: string;
  @ApiPropertyOptional({ example: 45, description: 'Required when action is APPROVE.' }) @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0.01) refundAmount?: number;
  @ApiPropertyOptional({ example: true, default: true }) @IsOptional() @IsBoolean() notifyCustomer?: boolean;
}

export const refundRequestStatuses = Object.values(RefundRequestStatus);
