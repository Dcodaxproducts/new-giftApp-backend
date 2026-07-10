import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, Max, Min } from 'class-validator';

export class UpdateRefundPolicySettingsDto {
  @ApiPropertyOptional({ example: true }) @IsOptional() @IsBoolean() allowCancellation?: boolean;
  @ApiPropertyOptional({ example: 10, minimum: 0, maximum: 100 }) @IsOptional() @Type(() => Number) @IsNumber() @Min(0) @Max(100) cancellationDeductionPercent?: number;
}
