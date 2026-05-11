import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsISO8601, IsObject, IsOptional, Max, Min, ValidateNested } from 'class-validator';

export class AllowedFileTypesDto {
  @ApiProperty({ example: true }) @IsBoolean() jpeg!: boolean;
  @ApiProperty({ example: true }) @IsBoolean() jpg!: boolean;
  @ApiProperty({ example: true }) @IsBoolean() png!: boolean;
  @ApiProperty({ example: false }) @IsBoolean() gif!: boolean;
  @ApiProperty({ example: true }) @IsBoolean() mp4!: boolean;
  @ApiProperty({ example: true }) @IsBoolean() mov!: boolean;
  @ApiProperty({ example: true }) @IsBoolean() mp3!: boolean;
  @ApiProperty({ example: false }) @IsBoolean() wav!: boolean;
  @ApiProperty({ example: false }) @IsBoolean() svg!: boolean;
}

export class UpdateMediaUploadPolicyDto {
  @ApiProperty({ type: AllowedFileTypesDto }) @IsObject() @ValidateNested() @Type(() => AllowedFileTypesDto) allowedFileTypes!: AllowedFileTypesDto;
  @ApiProperty({ example: 10, minimum: 1, maximum: 50 }) @IsInt() @Min(1) @Max(50) maxImageSizeMb!: number;
  @ApiProperty({ example: 500, minimum: 1, maximum: 1024 }) @IsInt() @Min(1) @Max(1024) maxVideoSizeMb!: number;
  @ApiProperty({ example: 50, minimum: 1, maximum: 200 }) @IsInt() @Min(1) @Max(200) maxAudioSizeMb!: number;
  @ApiProperty({ example: true }) @IsBoolean() scanUploads!: boolean;
  @ApiProperty({ example: true }) @IsBoolean() blockSvgUploads!: boolean;
}

export class ListMediaUploadPolicyAuditLogsDto {
  @ApiPropertyOptional({ example: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @ApiPropertyOptional({ example: 20 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number;
  @ApiPropertyOptional({ example: '2026-05-01T00:00:00.000Z' }) @IsOptional() @IsISO8601() fromDate?: string;
  @ApiPropertyOptional({ example: '2026-05-31T23:59:59.999Z' }) @IsOptional() @IsISO8601() toDate?: string;
}
