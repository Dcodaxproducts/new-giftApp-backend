import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export enum AuditLogSortBy { CREATED_AT = 'createdAt', ACTION = 'action', STATUS = 'status' }
export enum SortOrder { ASC = 'ASC', DESC = 'DESC' }
export enum AuditLogStatusFilter { ALL = 'ALL', SUCCESS = 'SUCCESS', FAILED = 'FAILED', PENDING = 'PENDING', WARNING = 'WARNING' }

export class ListAuditLogsDto {
  @ApiPropertyOptional({ default: 1 }) @IsOptional() @Transform(({ value }) => Number(value)) @IsInt() @Min(1) page?: number;
  @ApiPropertyOptional({ default: 20, maximum: 100 }) @IsOptional() @Transform(({ value }) => Number(value)) @IsInt() @Min(1) @Max(100) limit?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() actorId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() userId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() targetId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() action?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() actionType?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() targetType?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() module?: string;
  @ApiPropertyOptional({ enum: AuditLogStatusFilter }) @IsOptional() @IsEnum(AuditLogStatusFilter) status?: AuditLogStatusFilter;
  @ApiPropertyOptional() @IsOptional() @IsString() environment?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() sourceIp?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() from?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() to?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() fromDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() toDate?: string;
  @ApiPropertyOptional({ enum: AuditLogSortBy }) @IsOptional() @IsEnum(AuditLogSortBy) sortBy?: AuditLogSortBy;
  @ApiPropertyOptional({ enum: SortOrder }) @IsOptional() @IsEnum(SortOrder) sortOrder?: SortOrder;
}

export class AuditLogStatsDto {
  @ApiPropertyOptional() @IsOptional() @IsDateString() fromDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() toDate?: string;
}

export class AuditLogUsersDto {
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() role?: string;
  @ApiPropertyOptional({ default: 20, maximum: 100 }) @IsOptional() @Transform(({ value }) => Number(value)) @IsInt() @Min(1) @Max(100) limit?: number;
}
