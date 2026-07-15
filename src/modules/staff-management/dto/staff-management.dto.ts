import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEmail, IsEnum, IsInt, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';

export enum AdminStatusFilter {
  ACTIVE = 'ACTIVE',
  DISABLED = 'DISABLED',
  ALL = 'ALL',
}

export enum SortOrderDto {
  ASC = 'ASC',
  DESC = 'DESC',
}

export enum AdminSortByDto {
  createdAt = 'createdAt',
  firstName = 'firstName',
  email = 'email',
}

export class ListAdminsDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 10, maximum: 100 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  roleId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  role?: string;

  @ApiPropertyOptional({ enum: AdminStatusFilter })
  @IsOptional()
  @IsEnum(AdminStatusFilter)
  status?: AdminStatusFilter;

  @ApiPropertyOptional({ enum: AdminSortByDto })
  @IsOptional()
  @IsEnum(AdminSortByDto)
  sortBy?: AdminSortByDto;

  @ApiPropertyOptional({ enum: SortOrderDto })
  @IsOptional()
  @IsEnum(SortOrderDto)
  sortOrder?: SortOrderDto;
}

export class CreateAdminDto {
  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  firstName!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  lastName!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({
    description: 'StaffRole ID that controls this STAFF user permissions.',
    example: 'staff_role_id',
  })
  @IsString()
  @MinLength(1)
  roleId!: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateAdminDto {
  @ApiPropertyOptional({ example: 'staff.updated@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ minLength: 8 })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  roleId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 'Staff account re-enabled.' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class ResetAdminPasswordDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(8)
  temporaryPassword?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  generateTemporaryPassword?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  mustChangePassword?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  sendEmail?: boolean;
}
