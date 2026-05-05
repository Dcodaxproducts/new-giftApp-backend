import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthUserContext, CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import {
  CreateAdminDto,
  ListAdminsDto,
  ResetAdminPasswordDto,
  UpdateAdminActiveStatusDto,
  UpdateAdminDto,
} from '../auth/dto/admin-management.dto';
import { AdminManagementService } from './admin-management.service';

@ApiTags('Admin Staff Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
@Controller('admins')
export class AdminManagementController {
  constructor(private readonly adminManagementService: AdminManagementService) {}

  @Post()
  create(@CurrentUser() user: AuthUserContext, @Body() dto: CreateAdminDto) {
    return this.adminManagementService.create(user, dto);
  }

  @Get()
  list(@CurrentUser() user: AuthUserContext, @Query() query: ListAdminsDto) {
    return this.adminManagementService.list(user, query);
  }

  @Get(':id')
  details(@CurrentUser() user: AuthUserContext, @Param('id') id: string) {
    return this.adminManagementService.details(user, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUserContext,
    @Param('id') id: string,
    @Body() dto: UpdateAdminDto,
  ) {
    return this.adminManagementService.update(user, id, dto);
  }

  @Patch(':id/active-status')
  updateActiveStatus(
    @CurrentUser() user: AuthUserContext,
    @Param('id') id: string,
    @Body() dto: UpdateAdminActiveStatusDto,
  ) {
    return this.adminManagementService.updateActiveStatus(user, id, dto);
  }

  @Patch(':id/password')
  resetPassword(
    @CurrentUser() user: AuthUserContext,
    @Param('id') id: string,
    @Body() dto: ResetAdminPasswordDto,
  ) {
    return this.adminManagementService.resetPassword(user, id, dto);
  }
}
