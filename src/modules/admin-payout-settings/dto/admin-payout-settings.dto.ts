import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AdminPayoutSchedule } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsISO4217CurrencyCode, IsISO8601, IsInt, IsNumber, IsOptional, IsString, Matches, Max, MaxLength, Min } from 'class-validator';

export class UpdateAdminPayoutSettingsDto {
  @ApiProperty({ example: 5, minimum: 0, maximum: 100 }) @Type(() => Number) @IsNumber() @Min(0) @Max(100) platformRatePercent!: number;
  @ApiProperty({ example: 100, minimum: 0 }) @Type(() => Number) @IsNumber() @Min(0) minimumPayoutThreshold!: number;
  @ApiProperty({ example: 'USD' }) @IsISO4217CurrencyCode() currency!: string;
  @ApiProperty({ enum: AdminPayoutSchedule, example: AdminPayoutSchedule.MONTHLY_LAST_DAY }) @IsEnum(AdminPayoutSchedule) payoutSchedule!: AdminPayoutSchedule;
  @ApiProperty({ example: '00:00', pattern: '^([01]\\d|2[0-3]):[0-5]\\d$' }) @Matches(/^([01]\d|2[0-3]):[0-5]\d$/) payoutTimeUtc!: string;
  @ApiProperty({ example: true }) @IsBoolean() autoPayoutEnabled!: boolean;
}

export class UpsertCommissionTierDto {
  @ApiProperty({ example: 'Gold Elite', maxLength: 80 }) @IsString() @MaxLength(80) name!: string;
  @ApiProperty({ example: 10, minimum: 0, maximum: 100 }) @Type(() => Number) @IsNumber() @Min(0) @Max(100) commissionRatePercent!: number;
  @ApiProperty({ example: 15000, minimum: 0 }) @Type(() => Number) @IsNumber() @Min(0) orderVolumeThreshold!: number;
  @ApiProperty({ example: 3, minimum: 1 }) @Type(() => Number) @IsInt() @Min(1) sortOrder!: number;
  @ApiProperty({ example: true }) @IsBoolean() isActive!: boolean;
}

export class ListPayoutSettingsAuditLogsDto {
  @ApiPropertyOptional({ example: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @ApiPropertyOptional({ example: 20 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number;
  @ApiPropertyOptional({ example: '2026-05-01T00:00:00.000Z' }) @IsOptional() @IsISO8601() fromDate?: string;
  @ApiPropertyOptional({ example: '2026-05-31T23:59:59.999Z' }) @IsOptional() @IsISO8601() toDate?: string;
}
