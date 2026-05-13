import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsBoolean, IsEnum, IsInt, IsISO8601, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { ChatMessageType, ProviderReportReason, ProviderReportStatus, ReviewStatus } from '@prisma/client';

export enum SortOrder { ASC = 'ASC', DESC = 'DESC' }
export enum CustomerReviewStatusFilter { ALL = 'ALL', PUBLISHED = 'PUBLISHED', PENDING = 'PENDING', FLAGGED = 'FLAGGED', HIDDEN = 'HIDDEN', REMOVED = 'REMOVED' }
export enum ProviderReportStatusFilter { ALL = 'ALL', SUBMITTED = 'SUBMITTED', UNDER_REVIEW = 'UNDER_REVIEW', RESOLVED = 'RESOLVED', REJECTED = 'REJECTED' }

export class PageDto {
  @ApiPropertyOptional({ example: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @ApiPropertyOptional({ example: 20 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number;
}

export class GetOrderChatDto { @ApiPropertyOptional({ example: true }) @IsOptional() @Type(() => Boolean) @IsBoolean() createIfMissing?: boolean; }
export class ListCustomerChatsDto extends PageDto { @ApiPropertyOptional({ example: 'Global Logistics' }) @IsOptional() @IsString() search?: string; @ApiPropertyOptional({ example: true }) @IsOptional() @Type(() => Boolean) @IsBoolean() unreadOnly?: boolean; }
export class ChatDetailsDto extends PageDto { @ApiPropertyOptional({ example: '2026-10-24T10:33:00.000Z' }) @IsOptional() @IsISO8601() before?: string; }

export class SendChatMessageDto {
  @ApiProperty({ enum: ChatMessageType, example: ChatMessageType.TEXT }) @IsEnum(ChatMessageType) messageType!: ChatMessageType;
  @ApiPropertyOptional({ example: 'Can you confirm delivery time?' }) @IsOptional() @IsString() @MaxLength(1000) body?: string;
  @ApiPropertyOptional({ type: [String], example: [] }) @IsOptional() @IsArray() @ArrayMaxSize(10) @IsString({ each: true }) attachmentUrls?: string[];
}

export class CreateReviewDto {
  @ApiProperty({ example: 'provider_id' }) @IsString() providerId!: string;
  @ApiProperty({ example: 5, minimum: 1, maximum: 5 }) @IsInt() @Min(1) @Max(5) rating!: number;
  @ApiProperty({ example: 'Great service and fast delivery. The package arrived in perfect condition.' }) @IsString() @MaxLength(500) comment!: string;
}

export class ListCustomerReviewsDto extends PageDto {
  @ApiPropertyOptional({ example: 5 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(5) rating?: number;
  @ApiPropertyOptional({ example: 'provider_id' }) @IsOptional() @IsString() providerId?: string;
  @ApiPropertyOptional({ enum: CustomerReviewStatusFilter, example: CustomerReviewStatusFilter.PUBLISHED }) @IsOptional() @IsEnum(CustomerReviewStatusFilter) status?: CustomerReviewStatusFilter;
}

export class UpdateReviewDto { @ApiPropertyOptional({ example: 4 }) @IsOptional() @IsInt() @Min(1) @Max(5) rating?: number; @ApiPropertyOptional({ example: 'Updated review text.' }) @IsOptional() @IsString() @MaxLength(500) comment?: string; }

export class CreateProviderReportDto {
  @ApiProperty({ enum: ProviderReportReason, example: ProviderReportReason.POOR_SERVICE_QUALITY }) @IsEnum(ProviderReportReason) reason!: ProviderReportReason;
  @ApiProperty({ example: 'The provider did not respond and the order was delayed.' }) @IsString() @MaxLength(1000) details!: string;
  @ApiPropertyOptional({ example: 'order_id' }) @IsOptional() @IsString() orderId?: string;
  @ApiPropertyOptional({ type: [String], example: [] }) @IsOptional() @IsArray() @ArrayMaxSize(10) @IsString({ each: true }) evidenceUrls?: string[];
}

export class ListProviderReportsDto extends PageDto { @ApiPropertyOptional({ enum: ProviderReportStatusFilter, example: ProviderReportStatusFilter.SUBMITTED }) @IsOptional() @IsEnum(ProviderReportStatusFilter) status?: ProviderReportStatusFilter; }

export { ProviderReportReason, ProviderReportStatus, ReviewStatus };
