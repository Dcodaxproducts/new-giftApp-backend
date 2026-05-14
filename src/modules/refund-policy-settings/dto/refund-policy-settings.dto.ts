import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayUnique, IsArray, IsBoolean, IsISO4217CurrencyCode, IsISO8601, IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdateRefundPolicySettingsDto {
  @ApiProperty({ example: 30, minimum: 1, maximum: 365 }) @Type(() => Number) @IsInt() @Min(1) @Max(365) refundWindowDays!: number;
  @ApiProperty({ example: 50, minimum: 0 }) @Type(() => Number) @IsNumber() @Min(0) autoRefundThresholdAmount!: number;
  @ApiProperty({ example: 'PKR' }) @IsISO4217CurrencyCode() currency!: string;
  @ApiProperty({ example: true }) @IsBoolean() autoApproveSmallRefunds!: boolean;
  @ApiProperty({ example: 15, minimum: 0 }) @Type(() => Number) @IsNumber() @Min(0) smallRefundAutoApproveAmount!: number;
  @ApiProperty({ example: ['category_electronics', 'category_apparel', 'category_home_decor'], type: [String] }) @IsArray() @ArrayUnique() @IsString({ each: true }) eligibleCategoryIds!: string[];
}

export class ListRefundPolicyAuditLogsDto {
  @ApiPropertyOptional({ example: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @ApiPropertyOptional({ example: 20 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number;
  @ApiPropertyOptional({ example: '2026-05-01T00:00:00.000Z' }) @IsOptional() @IsISO8601() fromDate?: string;
  @ApiPropertyOptional({ example: '2026-05-31T23:59:59.999Z' }) @IsOptional() @IsISO8601() toDate?: string;
}

export class RefundEligibilityInputDto {
  @ApiProperty({ example: '2026-05-01T10:00:00.000Z' }) @IsISO8601() deliveredAt!: string;
  @ApiProperty({ example: 15, minimum: 0 }) @Type(() => Number) @IsNumber() @Min(0) requestedAmount!: number;
  @ApiProperty({ example: 50, minimum: 0 }) @Type(() => Number) @IsNumber() @Min(0) remainingRefundableAmount!: number;
  @ApiProperty({ example: ['category_electronics'], type: [String] }) @IsArray() @ArrayUnique() @IsString({ each: true }) categoryIds!: string[];
  @ApiPropertyOptional({ example: true }) @IsOptional() @IsBoolean() paymentRefundable?: boolean;
  @ApiPropertyOptional({ example: false }) @IsOptional() @IsBoolean() riskFlagged?: boolean;
}
