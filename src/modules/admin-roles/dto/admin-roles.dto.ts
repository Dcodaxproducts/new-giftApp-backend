import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsObject, IsOptional, IsString, MinLength } from 'class-validator';
import { optionalBoolean } from '../../../common/transforms/boolean.transform';

export class CreateAdminRoleDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ type: Object })
  @IsObject()
  permissions!: Record<string, string[]>;
}

export class UpdateAdminRoleDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateRolePermissionsDto {
  @ApiProperty({ type: Object })
  @IsObject()
  permissions!: Record<string, string[]>;
}

export class ListAdminRolesDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => optionalBoolean(value))
  @IsBoolean()
  isSystem?: boolean;

  @ApiPropertyOptional({ description: 'When omitted, the list returns all non-deleted roles. Use true for active only or false for inactive only.' })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => optionalBoolean(value))
  @IsBoolean()
  isActive?: boolean;
}
