import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthUserContext, CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import {
  CreateStaffRoleDto,
  ListStaffRolesDto,
  UpdateStaffRoleDto,
  UpdateRolePermissionsDto,
} from './dto/staff-roles.dto';
import { StaffRolesService } from './staff-roles.service';

@ApiTags('02 Staff - Roles & Permissions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
@Controller('staff-roles')
export class StaffRolesController {
  constructor(private readonly staffRolesService: StaffRolesService) {}

  @Get()
  @ApiOperation({ description: 'Staff Roles / RBAC manages permission roles for STAFF users only. SUPER_ADMIN has full immutable access and does not depend on StaffRole permissions.' })
  list(@CurrentUser() user: AuthUserContext, @Query() query: ListStaffRolesDto) {
    return this.staffRolesService.list(user, query);
  }

  @Post()
  create(@CurrentUser() user: AuthUserContext, @Body() dto: CreateStaffRoleDto) {
    return this.staffRolesService.create(user, dto);
  }

  @Get(':id')
  details(@CurrentUser() user: AuthUserContext, @Param('id') id: string) {
    return this.staffRolesService.details(user, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUserContext,
    @Param('id') id: string,
    @Body() dto: UpdateStaffRoleDto,
  ) {
    return this.staffRolesService.update(user, id, dto);
  }

  @Delete(':id')
  delete(@CurrentUser() user: AuthUserContext, @Param('id') id: string) {
    return this.staffRolesService.delete(user, id);
  }

  @Patch(':id/permissions')
  updatePermissions(
    @CurrentUser() user: AuthUserContext,
    @Param('id') id: string,
    @Body() dto: UpdateRolePermissionsDto,
  ) {
    return this.staffRolesService.updatePermissions(user, id, dto);
  }
}
