import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsISO8601, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Max, MaxLength, Min, ValidateNested } from 'class-validator';

export class CancellationTierDto {
  @ApiProperty({ example: 30, minimum: 0 }) @Type(() => Number) @IsInt() @Min(0) daysBeforeDelivery!: number;
  @ApiProperty({ example: 10, minimum: 0, maximum: 100 }) @Type(() => Number) @IsNumber() @Min(0) @Max(100) deductionPercent!: number;
  @ApiProperty({ example: 'Early Cancellation', maxLength: 80 }) @IsString() @IsNotEmpty() @MaxLength(80) label!: string;
}

export class UpdateRefundPolicySettingsDto {
  @ApiPropertyOptional({ example: true }) @IsOptional() @IsBoolean() allowRefund?: boolean;
  @ApiPropertyOptional({ type: [CancellationTierDto], example: [{ daysBeforeDelivery: 30, deductionPercent: 50, label: 'Early Cancellation' }] }) @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => CancellationTierDto) cancellationTiers?: CancellationTierDto[];
}

export class RefundEligibilityInputDto {
  @ApiProperty({ example: '2026-05-01T10:00:00.000Z' }) @IsISO8601() deliveredAt!: string;
  @ApiProperty({ example: 15, minimum: 0 }) @Type(() => Number) @IsNumber() @Min(0) requestedAmount!: number;
  @ApiProperty({ example: 50, minimum: 0 }) @Type(() => Number) @IsNumber() @Min(0) remainingRefundableAmount!: number;
  @ApiPropertyOptional({ example: true }) @IsOptional() @IsBoolean() paymentRefundable?: boolean;
  @ApiPropertyOptional({ example: false }) @IsOptional() @IsBoolean() riskFlagged?: boolean;
}
