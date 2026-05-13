import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsBoolean, IsEnum, IsInt, IsISO8601, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { ChatMessageType } from '@prisma/client';

export enum ProviderReviewSortBy { CREATED_AT = 'createdAt', RATING = 'rating' }
export enum SortOrder { ASC = 'ASC', DESC = 'DESC' }

export class PageDto {
  @ApiPropertyOptional({ example: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @ApiPropertyOptional({ example: 20 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number;
}

export class GetProviderOrderChatDto { @ApiPropertyOptional({ example: true }) @IsOptional() @Type(() => Boolean) @IsBoolean() createIfMissing?: boolean; }
export class ListProviderChatsDto extends PageDto { @ApiPropertyOptional({ example: 'John' }) @IsOptional() @IsString() search?: string; @ApiPropertyOptional({ example: true }) @IsOptional() @Type(() => Boolean) @IsBoolean() unreadOnly?: boolean; }
export class ProviderChatDetailsDto extends PageDto { @ApiPropertyOptional({ example: '2026-10-24T10:33:00.000Z' }) @IsOptional() @IsISO8601() before?: string; }

export class SendProviderChatMessageDto {
  @ApiProperty({ enum: ChatMessageType, example: ChatMessageType.TEXT }) @IsEnum(ChatMessageType) messageType!: ChatMessageType;
  @ApiPropertyOptional({ example: 'Your order is ready for shipping.' }) @IsOptional() @IsString() @MaxLength(1000) body?: string;
  @ApiPropertyOptional({ type: [String], example: [] }) @IsOptional() @IsArray() @ArrayMaxSize(10) @IsString({ each: true }) attachmentUrls?: string[];
}

export class ListProviderReviewsDto extends PageDto {
  @ApiPropertyOptional({ example: 5 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(5) rating?: number;
  @ApiPropertyOptional({ example: true }) @IsOptional() @Type(() => Boolean) @IsBoolean() hasResponse?: boolean;
  @ApiPropertyOptional({ example: 'packaging' }) @IsOptional() @IsString() search?: string;
  @ApiPropertyOptional({ enum: ProviderReviewSortBy, example: ProviderReviewSortBy.CREATED_AT }) @IsOptional() @IsEnum(ProviderReviewSortBy) sortBy?: ProviderReviewSortBy;
  @ApiPropertyOptional({ enum: SortOrder, example: SortOrder.DESC }) @IsOptional() @IsEnum(SortOrder) sortOrder?: SortOrder;
}

export class ReviewResponseDto { @ApiProperty({ example: 'Thank you for your kind words, Sarah. We are happy you loved the packaging.' }) @IsString() @MaxLength(1000) body!: string; }
