import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthUserContext, CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import {
  CreateAdminRoleDto,
  ListAdminRolesDto,
  UpdateAdminRoleDto,
  UpdateRolePermissionsDto,
} from './dto/admin-roles.dto';
import { AdminRolesService } from './admin-roles.service';

@ApiTags('02 Admin - Roles & Permissions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
@Controller('admin-roles')
export class AdminRolesController {
  constructor(private readonly adminRolesService: AdminRolesService) {}

  @Get()
  @ApiOperation({ description: 'Admin Roles / RBAC manages permission roles for ADMIN staff users only. SUPER_ADMIN has full immutable access and does not depend on AdminRole permissions.' })
  list(@CurrentUser() user: AuthUserContext, @Query() query: ListAdminRolesDto) {
    return this.adminRolesService.list(user, query);
  }

  @Post()
  create(@CurrentUser() user: AuthUserContext, @Body() dto: CreateAdminRoleDto) {
    return this.adminRolesService.create(user, dto);
  }

  @Get(':id')
  details(@CurrentUser() user: AuthUserContext, @Param('id') id: string) {
    return this.adminRolesService.details(user, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUserContext,
    @Param('id') id: string,
    @Body() dto: UpdateAdminRoleDto,
  ) {
    return this.adminRolesService.update(user, id, dto);
  }

  @Delete(':id')
  delete(@CurrentUser() user: AuthUserContext, @Param('id') id: string) {
    return this.adminRolesService.delete(user, id);
  }

  @Patch(':id/permissions')
  updatePermissions(
    @CurrentUser() user: AuthUserContext,
    @Param('id') id: string,
    @Body() dto: UpdateRolePermissionsDto,
  ) {
    return this.adminRolesService.updatePermissions(user, id, dto);
  }
}

@ApiTags('02 Admin - Roles & Permissions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
@Controller('permissions')
export class PermissionCatalogController {
  constructor(private readonly adminRolesService: AdminRolesService) {}

  @Get('catalog')
  @ApiOperation({ description: 'Read-only list of backend-supported permission keys that can be assigned to admin roles.' })
  catalog() {
    return this.adminRolesService.catalog();
  }
}
