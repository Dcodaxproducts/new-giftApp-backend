import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export enum CustomerTransactionType { ALL = 'ALL', GIFT_ORDER = 'GIFT_ORDER', MONEY_GIFT = 'MONEY_GIFT', RECURRING_PAYMENT = 'RECURRING_PAYMENT', SUBSCRIPTION_PAYMENT = 'SUBSCRIPTION_PAYMENT', REFUND = 'REFUND' }
export enum CustomerTransactionStatus { ALL = 'ALL', SUCCESS = 'SUCCESS', FAILED = 'FAILED', PENDING = 'PENDING', REFUNDED = 'REFUNDED', CANCELLED = 'CANCELLED' }
export enum CustomerTransactionPaymentMethod { ALL = 'ALL', STRIPE_CARD = 'STRIPE_CARD', COD = 'COD', E_WALLET = 'E_WALLET', BANK_TRANSFER = 'BANK_TRANSFER', PLACEHOLDER = 'PLACEHOLDER' }
export enum CustomerTransactionSortBy { CREATED_AT = 'createdAt', AMOUNT = 'amount', STATUS = 'status' }
export enum CustomerTransactionSortOrder { ASC = 'ASC', DESC = 'DESC' }
export enum CustomerTransactionExportFormat { CSV = 'CSV', PDF = 'PDF' }

export class ListCustomerTransactionsDto {
  @ApiPropertyOptional({ example: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @ApiPropertyOptional({ example: 20 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) limit?: number;
  @ApiPropertyOptional({ example: 'Sarah' }) @IsOptional() @IsString() search?: string;
  @ApiPropertyOptional({ example: '2026-03-01T00:00:00.000Z' }) @IsOptional() @IsDateString() fromDate?: string;
  @ApiPropertyOptional({ example: '2026-03-31T23:59:59.999Z' }) @IsOptional() @IsDateString() toDate?: string;
  @ApiPropertyOptional({ enum: CustomerTransactionType, example: CustomerTransactionType.ALL }) @IsOptional() @IsEnum(CustomerTransactionType) type?: CustomerTransactionType;
  @ApiPropertyOptional({ enum: CustomerTransactionStatus, example: CustomerTransactionStatus.ALL }) @IsOptional() @IsEnum(CustomerTransactionStatus) status?: CustomerTransactionStatus;
  @ApiPropertyOptional({ enum: CustomerTransactionPaymentMethod, example: CustomerTransactionPaymentMethod.ALL }) @IsOptional() @IsEnum(CustomerTransactionPaymentMethod) paymentMethod?: CustomerTransactionPaymentMethod;
  @ApiPropertyOptional({ example: 10 }) @IsOptional() @Type(() => Number) @IsNumber() @Min(0) minAmount?: number;
  @ApiPropertyOptional({ example: 500 }) @IsOptional() @Type(() => Number) @IsNumber() @Min(0) maxAmount?: number;
  @ApiPropertyOptional({ enum: CustomerTransactionSortBy, example: CustomerTransactionSortBy.CREATED_AT }) @IsOptional() @IsEnum(CustomerTransactionSortBy) sortBy?: CustomerTransactionSortBy;
  @ApiPropertyOptional({ enum: CustomerTransactionSortOrder, example: CustomerTransactionSortOrder.DESC }) @IsOptional() @IsEnum(CustomerTransactionSortOrder) sortOrder?: CustomerTransactionSortOrder;
}

export class CustomerTransactionSummaryDto {
  @ApiPropertyOptional({ example: '2026-03-01T00:00:00.000Z' }) @IsOptional() @IsDateString() fromDate?: string;
  @ApiPropertyOptional({ example: '2026-03-31T23:59:59.999Z' }) @IsOptional() @IsDateString() toDate?: string;
}

export class ExportCustomerTransactionsDto extends ListCustomerTransactionsDto {
  @ApiPropertyOptional({ enum: CustomerTransactionExportFormat, example: CustomerTransactionExportFormat.CSV }) @IsOptional() @IsEnum(CustomerTransactionExportFormat) format?: CustomerTransactionExportFormat;
}

export const transactionPaymentMethods = Object.values(PaymentMethod);
