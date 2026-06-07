import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayUnique, IsArray, IsBoolean, IsISO8601, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Max, MaxLength, Min, ValidateNested } from 'class-validator';

export class CancellationTierDto {
  @ApiProperty({ example: 5, minimum: 0 }) @Type(() => Number) @IsInt() @Min(0) daysBeforeCheckIn!: number;
  @ApiProperty({ example: 10, minimum: 0, maximum: 100 }) @Type(() => Number) @IsNumber() @Min(0) @Max(100) deductionPercent!: number;
  @ApiProperty({ example: 'Early', maxLength: 80 }) @IsString() @IsNotEmpty() @MaxLength(80) label!: string;
}

export class UpdateRefundPolicySettingsDto {
  @ApiPropertyOptional({ example: true }) @IsOptional() @IsBoolean() allowRefund?: boolean;
  @ApiPropertyOptional({ example: 'Refunds are processed according to cancellation policy.', maxLength: 1000 }) @IsOptional() @IsString() @MaxLength(1000) noteText?: string;
  @ApiPropertyOptional({ example: 30, minimum: 1, maximum: 365 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(365) refundWindowDays?: number;
  @ApiPropertyOptional({ example: 50, minimum: 0 }) @IsOptional() @Type(() => Number) @IsNumber() @Min(0) autoRefundThresholdAmount?: number;
  @ApiPropertyOptional({ type: [CancellationTierDto], example: [{ daysBeforeCheckIn: 5, deductionPercent: 10, label: 'Early' }, { daysBeforeCheckIn: 2, deductionPercent: 25, label: 'Late' }] }) @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => CancellationTierDto) cancellationTiers?: CancellationTierDto[];
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
