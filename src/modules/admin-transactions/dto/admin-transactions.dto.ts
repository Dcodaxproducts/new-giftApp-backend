import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DisputePriority, DisputeReason } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsISO8601, IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export enum AdminTransactionRange { TODAY = 'TODAY', LAST_7_DAYS = 'LAST_7_DAYS', LAST_30_DAYS = 'LAST_30_DAYS', CUSTOM = 'CUSTOM' }
export enum AdminTransactionType { ALL = 'ALL', PAYMENT = 'PAYMENT', GIFT = 'GIFT', WITHDRAWAL = 'WITHDRAWAL', SUBSCRIPTION_PAYMENT = 'SUBSCRIPTION_PAYMENT', RECURRING_PAYMENT = 'RECURRING_PAYMENT', WALLET_TOP_UP = 'WALLET_TOP_UP', REFUND = 'REFUND' }
export enum AdminTransactionStatus { ALL = 'ALL', SUCCESS = 'SUCCESS', PENDING = 'PENDING', FAILED = 'FAILED', REFUNDED = 'REFUNDED', PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED' }
export enum AdminGatewayProvider { ALL = 'ALL', STRIPE = 'STRIPE', PAYPAL = 'PAYPAL', BANK_TRANSFER = 'BANK_TRANSFER', WALLET = 'WALLET', COD = 'COD' }
export enum AdminTransactionSortBy { CREATED_AT = 'createdAt', AMOUNT = 'amount', STATUS = 'status' }
export enum AdminTransactionSortOrder { ASC = 'ASC', DESC = 'DESC' }
export enum AdminTransactionExportFormat { CSV = 'CSV', PDF = 'PDF' }
export enum AdminRefundType { FULL = 'FULL', PARTIAL = 'PARTIAL' }
export enum AdminRefundReason { CUSTOMER_REQUEST = 'CUSTOMER_REQUEST', ORDER_CANCELLED = 'ORDER_CANCELLED', PRODUCT_NOT_RECEIVED = 'PRODUCT_NOT_RECEIVED', DUPLICATE_CHARGE = 'DUPLICATE_CHARGE', FRAUD_REVIEW = 'FRAUD_REVIEW', DISPUTE_RESOLUTION = 'DISPUTE_RESOLUTION', OTHER = 'OTHER' }
export enum AdminNotificationChannel { IN_APP = 'IN_APP', EMAIL = 'EMAIL', BOTH = 'BOTH' }
export enum AdminReceiptFormat { PDF = 'PDF' }

export class AdminTransactionStatsDto {
  @ApiPropertyOptional({ enum: AdminTransactionRange, example: AdminTransactionRange.LAST_30_DAYS }) @IsOptional() @IsEnum(AdminTransactionRange) range?: AdminTransactionRange;
  @ApiPropertyOptional({ example: '2026-10-01T00:00:00.000Z' }) @IsOptional() @IsISO8601() fromDate?: string;
  @ApiPropertyOptional({ example: '2026-10-31T23:59:59.999Z' }) @IsOptional() @IsISO8601() toDate?: string;
  @ApiPropertyOptional({ enum: AdminTransactionType, example: AdminTransactionType.ALL }) @IsOptional() @IsEnum(AdminTransactionType) transactionType?: AdminTransactionType;
  @ApiPropertyOptional({ enum: AdminTransactionStatus, example: AdminTransactionStatus.ALL }) @IsOptional() @IsEnum(AdminTransactionStatus) status?: AdminTransactionStatus;
}

export class ListAdminTransactionsDto extends AdminTransactionStatsDto {
  @ApiPropertyOptional({ example: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @ApiPropertyOptional({ example: 20 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number;
  @ApiPropertyOptional({ example: 'TXN-882194' }) @IsOptional() @IsString() search?: string;
  @ApiPropertyOptional({ enum: AdminGatewayProvider, example: AdminGatewayProvider.ALL }) @IsOptional() @IsEnum(AdminGatewayProvider) gatewayProvider?: AdminGatewayProvider;
  @ApiPropertyOptional({ example: 'user_id' }) @IsOptional() @IsString() userId?: string;
  @ApiPropertyOptional({ example: 'provider_id' }) @IsOptional() @IsString() providerId?: string;
  @ApiPropertyOptional({ example: 10 }) @IsOptional() @Type(() => Number) @IsNumber() @Min(0) minAmount?: number;
  @ApiPropertyOptional({ example: 5000 }) @IsOptional() @Type(() => Number) @IsNumber() @Min(0) maxAmount?: number;
  @ApiPropertyOptional({ enum: AdminTransactionSortBy, example: AdminTransactionSortBy.CREATED_AT }) @IsOptional() @IsEnum(AdminTransactionSortBy) sortBy?: AdminTransactionSortBy;
  @ApiPropertyOptional({ enum: AdminTransactionSortOrder, example: AdminTransactionSortOrder.DESC }) @IsOptional() @IsEnum(AdminTransactionSortOrder) sortOrder?: AdminTransactionSortOrder;
}

export class ExportAdminTransactionsDto extends ListAdminTransactionsDto {
  @ApiPropertyOptional({ enum: AdminTransactionExportFormat, example: AdminTransactionExportFormat.CSV }) @IsOptional() @IsEnum(AdminTransactionExportFormat) format?: AdminTransactionExportFormat;
}

export class RefundAdminTransactionDto {
  @ApiProperty({ enum: AdminRefundType, example: AdminRefundType.FULL }) @IsEnum(AdminRefundType) refundType!: AdminRefundType;
  @ApiProperty({ example: 1281.25 }) @Type(() => Number) @IsNumber() @Min(0.01) refundAmount!: number;
  @ApiProperty({ enum: AdminRefundReason, example: AdminRefundReason.CUSTOMER_REQUEST }) @IsEnum(AdminRefundReason) reason!: AdminRefundReason;
  @ApiPropertyOptional({ example: 'Refund approved by support.' }) @IsOptional() @IsString() comment?: string;
  @ApiPropertyOptional({ example: true }) @IsOptional() @IsBoolean() notifyUser?: boolean;
}

export class OpenTransactionDisputeDto {
  @ApiProperty({ enum: DisputeReason, example: DisputeReason.PRODUCT_NOT_RECEIVED }) @IsEnum(DisputeReason) reason!: DisputeReason;
  @ApiProperty({ enum: DisputePriority, example: DisputePriority.HIGH }) @IsEnum(DisputePriority) priority!: DisputePriority;
  @ApiProperty({ example: 'Dispute opened from transaction detail screen.' }) @IsString() claimDetails!: string;
  @ApiPropertyOptional({ example: 'admin_id' }) @IsOptional() @IsString() assignToId?: string;
}

export class NotifyTransactionUserDto {
  @ApiProperty({ enum: AdminNotificationChannel, example: AdminNotificationChannel.EMAIL }) @IsEnum(AdminNotificationChannel) channel!: AdminNotificationChannel;
  @ApiProperty({ example: 'Transaction update' }) @IsString() subject!: string;
  @ApiProperty({ example: 'Your transaction has been successfully processed.' }) @IsString() message!: string;
  @ApiPropertyOptional({ example: true }) @IsOptional() @IsBoolean() includeReceipt?: boolean;
}

export class TransactionReceiptDto {
  @ApiPropertyOptional({ enum: AdminReceiptFormat, example: AdminReceiptFormat.PDF }) @IsOptional() @IsEnum(AdminReceiptFormat) format?: AdminReceiptFormat;
}
