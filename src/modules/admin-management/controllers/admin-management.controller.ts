import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthUserContext, CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import {
  CreateAdminDto,
  ListAdminsDto,
  PermanentlyDeleteAdminDto,
  ResetAdminPasswordDto,
  UpdateAdminActiveStatusDto,
  UpdateAdminDto,
} from '../dto/admin-management.dto';
import { AdminManagementService } from '../services/admin-management.service';

@ApiTags('02 Admin - Staff Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
@Controller('admins')
export class AdminManagementController {
  constructor(private readonly adminManagementService: AdminManagementService) {}

  @Post()
  @ApiOperation({
    summary: 'Create admin staff user',
    description: 'Creates an ADMIN staff user under Super Admin. The roleId field is the AdminRole ID that controls this staff user\'s permissions. This endpoint cannot create SUPER_ADMIN, REGISTERED_USER, PROVIDER, or GUEST_USER accounts.',
  })
  @ApiBody({
    schema: {
      example: {
        email: 'staff@example.com',
        temporaryPassword: 'Temp@123456',
        generateTemporaryPassword: false,
        mustChangePassword: true,
        firstName: 'Operations',
        lastName: 'Staff',
        phone: '+15550000002',
        title: 'Operations Manager',
        roleId: 'admin_role_id',
        avatarUrl: 'https://cdn.yourdomain.com/admin-avatars/staff.png',
        isActive: true,
        sendInviteEmail: true,
      },
    },
  })
  create(@CurrentUser() user: AuthUserContext, @Body() dto: CreateAdminDto) {
    return this.adminManagementService.create(user, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List admin staff users', description: 'SUPER_ADMIN only. Returns User.role = ADMIN staff accounts only; SUPER_ADMIN accounts are intentionally excluded.' })
  @ApiResponse({ status: 200, description: 'Admins fetched successfully', schema: { example: { success: true, data: [{ id: 'admin_id', firstName: 'Operations', lastName: 'Staff', fullName: 'Operations Staff', email: 'staff@example.com', phone: '+15550000002', role: { id: 'admin_role_id', name: 'Gift Manager', slug: 'gift-manager' }, isActive: true, isVerified: true, createdAt: '2026-05-09T10:00:00.000Z', lastLoginAt: null }], meta: { page: 1, limit: 10, total: 1, totalPages: 1 }, message: 'Admins fetched successfully' } } })
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


  @Delete(':id')
  @ApiOperation({
    summary: 'Permanently delete admin staff user',
    description: 'DANGER: This endpoint permanently deletes an ADMIN staff account from the database. This is not a soft delete. Use only from Super Admin danger zone screens. SUPER_ADMIN accounts and self-delete are blocked.',
  })
  @ApiResponse({ status: 200, description: 'Admin staff user permanently deleted successfully', schema: { example: { success: true, data: { deletedAdminId: 'admin_id' }, message: 'Admin staff user permanently deleted successfully.' } } })
  permanentlyDelete(
    @CurrentUser() user: AuthUserContext,
    @Param('id') id: string,
    @Body() dto: PermanentlyDeleteAdminDto,
  ) {
    return this.adminManagementService.permanentlyDelete(user, id, dto);
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
