import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateStaffRoleDto {
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

export class UpdateStaffRoleDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

}

export class UpdateRolePermissionsDto {
  @ApiProperty({ type: Object })
  @IsObject()
  permissions!: Record<string, string[]>;
}

export class ListStaffRolesDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

}
