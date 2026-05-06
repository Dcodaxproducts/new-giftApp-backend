import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
} from 'class-validator';

export enum RegisteredUserStatusFilter {
  ALL = 'ALL',
  ACTIVE = 'ACTIVE',
  PENDING = 'PENDING',
  SUSPENDED = 'SUSPENDED',
  DISABLED = 'DISABLED',
}

export enum RegisteredUserSortBy {
  CREATED_AT = 'createdAt',
  FIRST_NAME = 'firstName',
  EMAIL = 'email',
  TOTAL_SPENT = 'totalSpent',
  ORDERS_COUNT = 'ordersCount',
}

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export enum RegisteredUserStatusUpdate {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  DISABLED = 'DISABLED',
}

export enum SuspensionReason {
  POLICY_VIOLATION = 'POLICY_VIOLATION',
  PAYMENT_ISSUE = 'PAYMENT_ISSUE',
  FRAUD_SUSPECTED = 'FRAUD_SUSPECTED',
  USER_REQUEST = 'USER_REQUEST',
  ABUSE_REPORT = 'ABUSE_REPORT',
  OTHER = 'OTHER',
}

export enum UserActivityType {
  LOGIN = 'LOGIN',
  PAYMENT = 'PAYMENT',
  PROFILE_UPDATE = 'PROFILE_UPDATE',
  ORDER = 'ORDER',
  SECURITY = 'SECURITY',
  ALL = 'ALL',
}

export enum ExportFormat {
  CSV = 'CSV',
  XLSX = 'XLSX',
}

export class ListRegisteredUsersDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ example: 'sarah' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: RegisteredUserStatusFilter })
  @IsOptional()
  @IsEnum(RegisteredUserStatusFilter)
  status?: RegisteredUserStatusFilter;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  registrationFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  registrationTo?: string;

  @ApiPropertyOptional({ enum: RegisteredUserSortBy })
  @IsOptional()
  @IsEnum(RegisteredUserSortBy)
  sortBy?: RegisteredUserSortBy;

  @ApiPropertyOptional({ enum: SortOrder })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder;
}

export class UpdateRegisteredUserDto {
  @ApiPropertyOptional({ example: 'Alex' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Johnson' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ example: '+15552345678' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/users/avatar.jpg' })
  @IsOptional()
  @IsUrl({ require_tld: false })
  avatarUrl?: string;

  @ApiPropertyOptional({ example: 'New York, USA' })
  @IsOptional()
  @IsString()
  location?: string;
}

export class UpdateRegisteredUserStatusDto {
  @ApiProperty({ enum: RegisteredUserStatusUpdate })
  @IsEnum(RegisteredUserStatusUpdate)
  status!: RegisteredUserStatusUpdate;

  @ApiPropertyOptional({ enum: SuspensionReason })
  @IsOptional()
  @IsEnum(SuspensionReason)
  reason?: SuspensionReason;

  @ApiPropertyOptional({ example: 'Suspicious activity detected on this account.' })
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  notifyUser?: boolean;
}

export class SuspendRegisteredUserDto {
  @ApiProperty({ enum: SuspensionReason })
  @IsEnum(SuspensionReason)
  reason!: SuspensionReason;

  @ApiPropertyOptional({ example: 'Suspicious account activity.' })
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  notifyUser?: boolean;
}

export class UnsuspendRegisteredUserDto {
  @ApiPropertyOptional({ example: 'Account reviewed and restored.' })
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  notifyUser?: boolean;
}

export class ResetRegisteredUserPasswordDto {
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  sendEmail?: boolean;
}

export class ListUserActivityDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ enum: UserActivityType })
  @IsOptional()
  @IsEnum(UserActivityType)
  type?: UserActivityType;
}

export class ExportRegisteredUsersDto {
  @ApiPropertyOptional({ example: 'sarah' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: RegisteredUserStatusFilter })
  @IsOptional()
  @IsEnum(RegisteredUserStatusFilter)
  status?: RegisteredUserStatusFilter;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  registrationFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  registrationTo?: string;

  @ApiPropertyOptional({ enum: ExportFormat })
  @IsOptional()
  @IsEnum(ExportFormat)
  format?: ExportFormat;
}
