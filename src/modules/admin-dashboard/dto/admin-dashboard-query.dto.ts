import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional } from 'class-validator';

export enum AdminDashboardRange {
  TODAY = 'TODAY',
  LAST_7_DAYS = 'LAST_7_DAYS',
  LAST_30_DAYS = 'LAST_30_DAYS',
  LAST_90_DAYS = 'LAST_90_DAYS',
  THIS_MONTH = 'THIS_MONTH',
  LAST_MONTH = 'LAST_MONTH',
  CUSTOM = 'CUSTOM',
}

export class AdminDashboardQueryDto {
  @ApiPropertyOptional({ enum: AdminDashboardRange, example: AdminDashboardRange.LAST_30_DAYS })
  @IsOptional()
  @IsEnum(AdminDashboardRange)
  range?: AdminDashboardRange;

  @ApiPropertyOptional({ example: '2026-05-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({ example: '2026-05-31T23:59:59.999Z' })
  @IsOptional()
  @IsDateString()
  toDate?: string;
}
