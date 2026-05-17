import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayNotEmpty, ArrayUnique, IsArray, IsBoolean, IsEnum, IsISO8601, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export enum AdminProviderPayoutStatusFilter { ALL = 'ALL', PENDING = 'PENDING', PROCESSING = 'PROCESSING', COMPLETED = 'COMPLETED', FAILED = 'FAILED', ON_HOLD = 'ON_HOLD', REJECTED = 'REJECTED' }
export enum AdminProviderPayoutSortBy { createdAt = 'createdAt', amount = 'amount', status = 'status', nextPayoutDate = 'nextPayoutDate' }
export enum AdminProviderPayoutSortOrder { ASC = 'ASC', DESC = 'DESC' }
export enum AdminProviderPayoutExportFormat { CSV = 'CSV' }
export enum AdminProviderPayoutHoldReason { BANK_VERIFICATION_PENDING = 'BANK_VERIFICATION_PENDING', COMPLIANCE_REVIEW = 'COMPLIANCE_REVIEW', PROVIDER_DOCUMENTS_REQUIRED = 'PROVIDER_DOCUMENTS_REQUIRED', OTHER = 'OTHER' }
export enum AdminProviderPayoutRejectReason { INVALID_BANK_ACCOUNT = 'INVALID_BANK_ACCOUNT', FRAUD_RISK = 'FRAUD_RISK', COMPLIANCE_REJECTED = 'COMPLIANCE_REJECTED', PROVIDER_INELIGIBLE = 'PROVIDER_INELIGIBLE', OTHER = 'OTHER' }

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

export class ApproveProviderPayoutDto {
  @ApiPropertyOptional({ example: 'Approved after verification.', maxLength: 500 }) @IsOptional() @IsString() @MaxLength(500) comment?: string;
  @ApiProperty({ example: true }) @IsBoolean() notifyProvider!: boolean;
}

export class HoldProviderPayoutDto {
  @ApiProperty({ enum: AdminProviderPayoutHoldReason, example: AdminProviderPayoutHoldReason.BANK_VERIFICATION_PENDING }) @IsEnum(AdminProviderPayoutHoldReason) reason!: AdminProviderPayoutHoldReason;
  @ApiPropertyOptional({ example: 'Bank verification required.', maxLength: 500 }) @IsOptional() @IsString() @MaxLength(500) comment?: string;
  @ApiProperty({ example: true }) @IsBoolean() notifyProvider!: boolean;
}

export class RejectProviderPayoutDto {
  @ApiProperty({ enum: AdminProviderPayoutRejectReason, example: AdminProviderPayoutRejectReason.INVALID_BANK_ACCOUNT }) @IsEnum(AdminProviderPayoutRejectReason) reason!: AdminProviderPayoutRejectReason;
  @ApiPropertyOptional({ example: 'Bank details are invalid.', maxLength: 500 }) @IsOptional() @IsString() @MaxLength(500) comment?: string;
  @ApiProperty({ example: true }) @IsBoolean() notifyProvider!: boolean;
}

export class BulkApproveProviderPayoutsDto {
  @ApiProperty({ example: ['payout_id_1', 'payout_id_2'], type: [String] }) @IsArray() @ArrayNotEmpty() @ArrayUnique() @IsString({ each: true }) payoutIds!: string[];
  @ApiPropertyOptional({ example: 'Bulk approved after review.', maxLength: 500 }) @IsOptional() @IsString() @MaxLength(500) comment?: string;
  @ApiProperty({ example: true }) @IsBoolean() notifyProvider!: boolean;
}
