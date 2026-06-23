import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

export enum SystemHealthGraphRange {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
}

export class SystemHealthGraphQueryDto {
  @ApiPropertyOptional({ enum: SystemHealthGraphRange, example: SystemHealthGraphRange.DAILY })
  @IsOptional()
  @IsEnum(SystemHealthGraphRange)
  range?: SystemHealthGraphRange;
}
