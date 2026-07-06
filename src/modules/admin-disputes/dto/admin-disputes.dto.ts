import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayMaxSize, IsArray, IsEnum, IsOptional, IsString, IsUrl, MinLength, ValidateIf } from 'class-validator';

export enum DisputeRange { TODAY = 'TODAY', LAST_7_DAYS = 'LAST_7_DAYS', LAST_30_DAYS = 'LAST_30_DAYS', CUSTOM = 'CUSTOM' }
export enum DisputeSortBy { CREATED_AT = 'createdAt', STATUS = 'status' }
export enum SortOrder { ASC = 'asc', DESC = 'desc' }
export enum DisputeStatusFilter { PENDING = 'PENDING', UNDER_REVIEW = 'UNDER_REVIEW', APPROVED = 'APPROVED', REJECTED = 'REJECTED' }
export enum DisputeDecisionStatus { APPROVED = 'APPROVED', REJECTED = 'REJECTED' }
export enum ProviderDisputeDecisionDto { APPROVED = 'APPROVED', REJECTED = 'REJECTED' }
export enum DisputeDecisionReasonDto { INSUFFICIENT_EVIDENCE = 'INSUFFICIENT_EVIDENCE', INVALID_CLAIM = 'INVALID_CLAIM', OUTSIDE_POLICY = 'OUTSIDE_POLICY', DUPLICATE_DISPUTE = 'DUPLICATE_DISPUTE', PROVIDER_PROOF_VALID = 'PROVIDER_PROOF_VALID', OTHER = 'OTHER' }

export class ListDisputesDto {
  @ApiPropertyOptional({ enum: DisputeRange }) @IsOptional() @IsEnum(DisputeRange) range?: DisputeRange;
  @ApiPropertyOptional({ example: '2026-07-01' }) @IsOptional() @IsString() fromDate?: string;
  @ApiPropertyOptional({ example: '2026-07-31' }) @IsOptional() @IsString() toDate?: string;
  @ApiPropertyOptional({ enum: DisputeStatusFilter }) @IsOptional() @IsEnum(DisputeStatusFilter) status?: DisputeStatusFilter;
  @ApiPropertyOptional({ example: 'order id, user email, provider email, reason' }) @IsOptional() @IsString() search?: string;
  @ApiPropertyOptional({ enum: DisputeSortBy }) @IsOptional() @IsEnum(DisputeSortBy) sortBy?: DisputeSortBy;
  @ApiPropertyOptional({ enum: SortOrder }) @IsOptional() @IsEnum(SortOrder) sortOrder?: SortOrder;
  @ApiPropertyOptional({ example: 1 }) @IsOptional() page?: number;
  @ApiPropertyOptional({ example: 20 }) @IsOptional() limit?: number;
}

export class CreateDisputeDto {
  @ApiPropertyOptional({ example: 'user_id', description: 'Admin-only manual dispute creation. Customer dispute creation derives userId from JWT.' }) @IsOptional() @IsString() userId?: string;
  @ApiPropertyOptional({ example: 'provider_id', description: 'Optional when order has one provider order; otherwise required.' }) @IsOptional() @IsString() providerId?: string;
  @ApiPropertyOptional({ example: 'order_id', description: 'Admin-only manual dispute creation. Customer dispute creation derives orderId from route param.' }) @IsOptional() @IsString() orderId?: string;
  @ApiProperty({ example: 'Product damaged' }) @IsString() @MinLength(2) reason!: string;
  @ApiProperty({ example: 'Customer reported damaged product after delivery.' }) @IsString() @MinLength(3) description!: string;
  @ApiPropertyOptional({ example: ['https://cdn.yourdomain.com/dispute-evidence/photo.png'] }) @IsOptional() @IsArray() @ArrayMaxSize(10) @IsUrl({}, { each: true }) evidenceUrls?: string[];
}

export class ReviewDisputeDto {
  @ApiProperty({ enum: DisputeDecisionStatus, example: DisputeDecisionStatus.APPROVED }) @IsEnum(DisputeDecisionStatus) status!: DisputeDecisionStatus;
  @ApiPropertyOptional({ enum: DisputeDecisionReasonDto, example: DisputeDecisionReasonDto.INSUFFICIENT_EVIDENCE }) @ValidateIf((dto: ReviewDisputeDto) => dto.status === DisputeDecisionStatus.REJECTED) @IsEnum(DisputeDecisionReasonDto) decisionReason?: DisputeDecisionReasonDto;
  @ApiPropertyOptional({ example: 'Reviewed by Super Admin.' }) @IsOptional() @IsString() adminNote?: string;
}

export class RespondDisputeDto {
  @ApiProperty({ enum: ProviderDisputeDecisionDto, example: ProviderDisputeDecisionDto.APPROVED }) @IsEnum(ProviderDisputeDecisionDto) decision!: ProviderDisputeDecisionDto;
  @ApiProperty({ example: 'Customer issue reviewed; delivery proof attached.' }) @IsString() @MinLength(3) response!: string;
  @ApiPropertyOptional({ example: ['https://cdn.yourdomain.com/provider-dispute-evidence/proof.png'] }) @IsOptional() @IsArray() @ArrayMaxSize(10) @IsUrl({}, { each: true }) evidenceUrls?: string[];
}
