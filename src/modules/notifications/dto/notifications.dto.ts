import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DevicePlatform } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export enum SortOrder { ASC = 'ASC', DESC = 'DESC' }
export enum NotificationFilterDto { ALL = 'ALL', UNREAD = 'UNREAD' }

export class RegisterDeviceTokenDto { @ApiProperty({ example: 'fMEP0vJqSk6...device-registration-token' }) @IsString() @IsNotEmpty() @MaxLength(4096) token!: string; @ApiProperty({ enum: DevicePlatform, example: DevicePlatform.ANDROID }) @IsEnum(DevicePlatform) platform!: DevicePlatform; @ApiPropertyOptional({ example: 'pixel-8-personal' }) @IsOptional() @IsString() @MaxLength(255) deviceId?: string; }
export class UnregisterDeviceTokenDto { @ApiProperty({ example: 'fMEP0vJqSk6...device-registration-token' }) @IsString() @IsNotEmpty() @MaxLength(4096) token!: string; }

export class ListNotificationsDto { @ApiPropertyOptional({ example: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number; @ApiPropertyOptional({ example: 10, default: 10 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) limit?: number; @ApiPropertyOptional({ enum: NotificationFilterDto, example: NotificationFilterDto.UNREAD }) @IsOptional() @IsEnum(NotificationFilterDto) filter?: NotificationFilterDto; @ApiPropertyOptional({ example: false }) @IsOptional() @Type(() => Boolean) @IsBoolean() isRead?: boolean; @ApiPropertyOptional({ example: true }) @IsOptional() @Type(() => Boolean) @IsBoolean() groupByDate?: boolean; @ApiPropertyOptional({ enum: SortOrder, example: SortOrder.DESC }) @IsOptional() @IsEnum(SortOrder) sortOrder?: SortOrder; }
