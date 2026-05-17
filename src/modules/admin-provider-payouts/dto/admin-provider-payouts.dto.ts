import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsISO8601, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export enum AdminProviderPayoutStatusFilter { ALL = 'ALL', PENDING = 'PENDING', PROCESSING = 'PROCESSING', COMPLETED = 'COMPLETED', FAILED = 'FAILED', ON_HOLD = 'ON_HOLD', REJECTED = 'REJECTED' }
export enum AdminProviderPayoutSortBy { createdAt = 'createdAt', amount = 'amount', status = 'status', nextPayoutDate = 'nextPayoutDate' }
export enum AdminProviderPayoutSortOrder { ASC = 'ASC', DESC = 'DESC' }
export enum AdminProviderPayoutExportFormat { CSV = 'CSV' }

export class ListAdminProviderPayoutsDto {
  @ApiPropertyOptional({ example: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @ApiPropertyOptional({ example: 20 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number;
  @ApiPropertyOptional({ example: 'TechSolutions' }) @IsOptional() @IsString() search?: string;
  @ApiPropertyOptional({ enum: AdminProviderPayoutStatusFilter }) @IsOptional() @IsEnum(AdminProviderPayoutStatusFilter) status?: AdminProviderPayoutStatusFilter;
  @ApiPropertyOptional({ example: 'provider_id' }) @IsOptional() @IsString() providerId?: string;
  @ApiPropertyOptional({ example: '2026-05-01T00:00:00.000Z' }) @IsOptional() @IsISO8601() fromDate?: string;
  @ApiPropertyOptional({ example: '2026-05-31T23:59:59.999Z' }) @IsOptional() @IsISO8601() toDate?: string;
  @ApiPropertyOptional({ enum: AdminProviderPayoutSortBy }) @IsOptional() @IsEnum(AdminProviderPayoutSortBy) sortBy?: AdminProviderPayoutSortBy;
  @ApiPropertyOptional({ enum: AdminProviderPayoutSortOrder }) @IsOptional() @IsEnum(AdminProviderPayoutSortOrder) sortOrder?: AdminProviderPayoutSortOrder;
}

export class ExportAdminProviderPayoutsDto extends ListAdminProviderPayoutsDto {
  @ApiPropertyOptional({ enum: AdminProviderPayoutExportFormat }) @IsOptional() @IsEnum(AdminProviderPayoutExportFormat) format?: AdminProviderPayoutExportFormat;
}
