import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, Min } from 'class-validator';

export enum SortOrder { ASC = 'ASC', DESC = 'DESC' }
export enum NotificationFilterDto { ALL = 'ALL', UNREAD = 'UNREAD' }

export class ListNotificationsDto { @ApiPropertyOptional({ example: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number; @ApiPropertyOptional({ example: 10, default: 10 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) limit?: number; @ApiPropertyOptional({ enum: NotificationFilterDto, example: NotificationFilterDto.UNREAD }) @IsOptional() @IsEnum(NotificationFilterDto) filter?: NotificationFilterDto; @ApiPropertyOptional({ example: false }) @IsOptional() @Type(() => Boolean) @IsBoolean() isRead?: boolean; @ApiPropertyOptional({ example: true }) @IsOptional() @Type(() => Boolean) @IsBoolean() groupByDate?: boolean; @ApiPropertyOptional({ enum: SortOrder, example: SortOrder.DESC }) @IsOptional() @IsEnum(SortOrder) sortOrder?: SortOrder; }
