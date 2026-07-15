import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthUserContext, CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import {
  CreateAdminDto,
  ListAdminsDto,
  ResetAdminPasswordDto,
  UpdateAdminDto,
} from './dto/staff-management.dto';
import { StaffManagementService } from './staff-management.service';

@ApiTags('02 Staff Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
@Controller('staff')
export class StaffManagementController {
  constructor(private readonly staffManagementService: StaffManagementService) {}

  @Post()
  @ApiOperation({
    summary: 'Create staff user',
    description: 'Creates a STAFF user under Super Admin. The roleId field is the StaffRole ID that controls this staff user\'s permissions. This endpoint cannot create SUPER_ADMIN, REGISTERED_USER, or PROVIDER accounts.',
  })
  @ApiBody({
    schema: {
      example: {
        email: 'staff@example.com',
        password: 'Temp@123456',
        firstName: 'Operations',
        lastName: 'Staff',
        phone: '+15550000002',
        roleId: 'STAFF_ROLE_id',
        isActive: true,
      },
    },
  })
  create(@CurrentUser() user: AuthUserContext, @Body() dto: CreateAdminDto) {
    return this.staffManagementService.create(user, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List staff users', description: 'SUPER_ADMIN only. Returns User.role = STAFF accounts only; SUPER_ADMIN accounts are intentionally excluded.' })
  @ApiResponse({ status: 200, description: 'Staff fetched successfully', schema: { example: { success: true, data: [{ id: 'staff_id', firstName: 'Operations', lastName: 'Staff', fullName: 'Operations Staff', email: 'staff@example.com', phone: '+15550000002', role: { id: 'STAFF_ROLE_id', name: 'Gift Manager', slug: 'gift-manager' }, status: 'APPROVED', createdAt: '2026-05-09T10:00:00.000Z', lastLoginAt: null }], meta: { page: 1, limit: 10, total: 1, totalPages: 1 }, message: 'Staff fetched successfully' } } })
  list(@CurrentUser() user: AuthUserContext, @Query() query: ListAdminsDto) {
    return this.staffManagementService.list(user, query);
  }

  @Get(':id')
  details(@CurrentUser() user: AuthUserContext, @Param('id') id: string) {
    return this.staffManagementService.details(user, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update staff profile or active status', description: 'SUPER_ADMIN only. Updates STAFF profile, role assignment, and active/inactive status in one endpoint. Password updates are handled only by the dedicated password endpoint. SUPER_ADMIN self-disable and SUPER_ADMIN role updates are blocked.' })
  @ApiBody({ type: UpdateAdminDto, examples: { updateStaffProfile: { value: { firstName: 'Operations', lastName: 'Staff', roleId: 'STAFF_ROLE_id' } }, activateStaff: { value: { isActive: true, reason: 'Staff account re-enabled.' } }, deactivateStaff: { value: { isActive: false, reason: 'Staff account disabled after access review.' } } } })
  @ApiResponse({ status: 200, description: 'Staff updated successfully', schema: { example: { success: true, data: { id: 'staff_id', firstName: 'Operations', lastName: 'Staff', role: { id: 'STAFF_ROLE_id', name: 'Gift Manager' }, status: 'APPROVED' }, message: 'Staff updated successfully' } } })
  update(
    @CurrentUser() user: AuthUserContext,
    @Param('id') id: string,
    @Body() dto: UpdateAdminDto,
  ) {
    return this.staffManagementService.update(user, id, dto);
  }


  @Delete(':id')
  @ApiOperation({
    summary: 'Permanently delete staff user',
    description: 'DANGER: This endpoint permanently deletes a STAFF account from the database. This is not a soft delete. Use only from Super Admin danger zone screens. SUPER_ADMIN accounts and self-delete are blocked.',
  })
  @ApiResponse({ status: 200, description: 'Staff user permanently deleted successfully', schema: { example: { success: true, data: { deletedStaffId: 'staff_id' }, message: 'Staff user permanently deleted successfully.' } } })
  permanentlyDelete(
    @CurrentUser() user: AuthUserContext,
    @Param('id') id: string,
  ) {
    return this.staffManagementService.permanentlyDelete(user, id);
  }

  @Patch(':id/password')
  resetPassword(
    @CurrentUser() user: AuthUserContext,
    @Param('id') id: string,
    @Body() dto: ResetAdminPasswordDto,
  ) {
    return this.staffManagementService.resetPassword(user, id, dto);
  }
}
