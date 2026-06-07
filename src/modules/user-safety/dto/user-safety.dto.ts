import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserSafetyAdminAction, UserSafetyReportReason, UserSafetyReportStatus, UserSafetySourceType } from '@prisma/client';
import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsBoolean, IsEnum, IsInt, IsOptional, IsString, IsUrl, Max, MaxLength, Min } from 'class-validator';

export class CreateUserReportDto {
  @ApiProperty({ enum: UserSafetyReportReason }) @IsEnum(UserSafetyReportReason) reason!: UserSafetyReportReason;
  @ApiProperty({ example: 'User sent inappropriate messages.' }) @IsString() @MaxLength(2000) details!: string;
  @ApiProperty({ enum: UserSafetySourceType }) @IsEnum(UserSafetySourceType) sourceType!: UserSafetySourceType;
  @ApiPropertyOptional({ example: 'thread_id' }) @IsOptional() @IsString() sourceId?: string;
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() @ArrayMaxSize(10) @IsUrl({ require_tld: false }, { each: true }) evidenceUrls?: string[];
  @ApiPropertyOptional({ example: true }) @IsOptional() @IsBoolean() blockUser?: boolean;
}
export class ListUserReportsDto { @ApiPropertyOptional({ example: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number; @ApiPropertyOptional({ example: 10, default: 10 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number; @ApiPropertyOptional({ enum: UserSafetyReportStatus }) @IsOptional() @IsEnum(UserSafetyReportStatus) status?: UserSafetyReportStatus; }
export class ListBlockedUsersDto { @ApiPropertyOptional({ example: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number; @ApiPropertyOptional({ example: 10, default: 10 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number; }
export class ListAdminUserSafetyReportsDto extends ListUserReportsDto { @ApiPropertyOptional({ enum: UserSafetyReportReason }) @IsOptional() @IsEnum(UserSafetyReportReason) reason?: UserSafetyReportReason; @ApiPropertyOptional() @IsOptional() @IsString() search?: string; }
export class UserSafetyAdminActionDto { @ApiProperty({ enum: UserSafetyAdminAction }) @IsEnum(UserSafetyAdminAction) action!: UserSafetyAdminAction; @ApiProperty({ example: 'HARASSMENT_CONFIRMED' }) @IsString() @MaxLength(120) reason!: string; @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(2000) comment?: string; @ApiPropertyOptional() @IsOptional() @IsBoolean() notifyReporter?: boolean; @ApiPropertyOptional() @IsOptional() @IsBoolean() notifyReportedUser?: boolean; }
