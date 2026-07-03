import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DisputeStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export enum DisputeRange { TODAY = 'TODAY', LAST_7_DAYS = 'LAST_7_DAYS', LAST_30_DAYS = 'LAST_30_DAYS', CUSTOM = 'CUSTOM' }
export enum DisputeSortBy { CREATED_AT = 'createdAt', STATUS = 'status' }
export enum SortOrder { ASC = 'asc', DESC = 'desc' }

export class ListDisputesDto {
  @ApiPropertyOptional({ enum: DisputeRange }) @IsOptional() @IsEnum(DisputeRange) range?: DisputeRange;
  @ApiPropertyOptional({ example: '2026-07-01' }) @IsOptional() @IsString() fromDate?: string;
  @ApiPropertyOptional({ example: '2026-07-31' }) @IsOptional() @IsString() toDate?: string;
  @ApiPropertyOptional({ enum: DisputeStatus }) @IsOptional() @IsEnum(DisputeStatus) status?: DisputeStatus;
  @ApiPropertyOptional({ example: 'order id, user email, provider email, reason' }) @IsOptional() @IsString() search?: string;
  @ApiPropertyOptional({ enum: DisputeSortBy }) @IsOptional() @IsEnum(DisputeSortBy) sortBy?: DisputeSortBy;
  @ApiPropertyOptional({ enum: SortOrder }) @IsOptional() @IsEnum(SortOrder) sortOrder?: SortOrder;
  @ApiPropertyOptional({ example: 1 }) @IsOptional() page?: number;
  @ApiPropertyOptional({ example: 20 }) @IsOptional() limit?: number;
}

export class CreateDisputeDto {
  @ApiProperty({ example: 'user_id' }) @IsString() userId!: string;
  @ApiProperty({ example: 'provider_id' }) @IsString() providerId!: string;
  @ApiProperty({ example: 'order_id' }) @IsString() orderId!: string;
  @ApiProperty({ example: 'Product damaged' }) @IsString() @MinLength(2) reason!: string;
  @ApiProperty({ example: 'Customer reported damaged product after delivery.' }) @IsString() @MinLength(3) description!: string;
}

export class ReviewDisputeDto {
  @ApiProperty({ enum: DisputeStatus, example: DisputeStatus.APPROVED }) @IsEnum(DisputeStatus) status!: DisputeStatus;
  @ApiPropertyOptional({ example: 'Reviewed by Super Admin.' }) @IsOptional() @IsString() adminNote?: string;
}
