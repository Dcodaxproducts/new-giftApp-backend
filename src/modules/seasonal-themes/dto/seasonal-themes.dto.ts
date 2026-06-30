import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsDateString, IsInt, IsOptional, IsString, IsUrl, Max, MaxLength, Min } from 'class-validator';
import { optionalBoolean } from '../../../common/transforms/boolean.transform';

export class CreateSeasonalThemeDto {
  @ApiProperty({ example: 'Eid 2026' })
  @IsString()
  @MaxLength(120)
  name!: string;

  @ApiProperty({ example: 'https://cdn.yourdomain.com/seasonal-theme-assets/admin_1/eid-banner.png' })
  @IsUrl()
  imageUrl!: string;

  @ApiProperty({ example: '2026-03-15T00:00:00.000Z' })
  @IsDateString()
  startsAt!: string;

  @ApiProperty({ example: '2026-03-25T23:59:59.000Z' })
  @IsDateString()
  endsAt!: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateSeasonalThemeDto {
  @ApiPropertyOptional({ example: 'Eid 2026' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({ example: 'https://cdn.yourdomain.com/seasonal-theme-assets/admin_1/eid-banner.png' })
  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @ApiPropertyOptional({ example: '2026-03-15T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @ApiPropertyOptional({ example: '2026-03-25T23:59:59.000Z' })
  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class ListSeasonalThemesDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 10, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }: { value: unknown }) => optionalBoolean(value))
  isActive?: boolean;
}
