import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthUserContext, CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import {
  ExportRegisteredUsersDto,
  ListRegisteredUsersDto,
  ListUserActivityDto,
  ResetRegisteredUserPasswordDto,
  SuspendRegisteredUserDto,
  UnsuspendRegisteredUserDto,
  UpdateRegisteredUserDto,
  UpdateRegisteredUserStatusDto,
} from './dto/user-management.dto';
import { UserManagementService } from './user-management.service';

@ApiTags('User Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
@Controller('users')
export class UserManagementController {
  constructor(private readonly userManagementService: UserManagementService) {}

  @Get('export')
  @Permissions('users.export')
  async export(@Query() query: ExportRegisteredUsersDto): Promise<StreamableFile> {
    const file = await this.userManagementService.exportRegisteredUsers(query);
    return new StreamableFile(Buffer.from(file.content), {
      disposition: `attachment; filename="${file.filename}"`,
      type: file.contentType,
    });
  }

  @Get()
  @Permissions('users.read')
  @ApiOperation({ summary: 'List registered users', description: 'SUPER_ADMIN/ADMIN with users.read permission.' })
  @ApiResponse({ status: 200, description: 'Users fetched successfully', schema: { example: { success: true, data: [{ id: 'user_id', email: 'customer@example.com', firstName: 'Sarah', lastName: 'Johnson', phone: '+923001234567', role: 'REGISTERED_USER', isVerified: true, isActive: true, createdAt: '2026-05-09T10:00:00.000Z' }], meta: { page: 1, limit: 20, total: 1, totalPages: 1 }, message: 'Users fetched successfully' } } })
  list(@Query() query: ListRegisteredUsersDto): Promise<unknown> {
    return this.userManagementService.list(query);
  }

  @Get(':id')
  @Permissions('users.read')
  details(@Param('id') id: string): Promise<unknown> {
    return this.userManagementService.details(id);
  }

  @Patch(':id')
  @Permissions('users.update')
  update(
    @CurrentUser() user: AuthUserContext,
    @Param('id') id: string,
    @Body() dto: UpdateRegisteredUserDto,
  ): Promise<unknown> {
    return this.userManagementService.update(user, id, dto);
  }

  @Patch(':id/status')
  @Permissions('users.status.update')
  updateStatus(
    @CurrentUser() user: AuthUserContext,
    @Param('id') id: string,
    @Body() dto: UpdateRegisteredUserStatusDto,
  ): Promise<unknown> {
    return this.userManagementService.updateStatus(user, id, dto);
  }

  @Post(':id/suspend')
  @Permissions('users.suspend')
  suspend(
    @CurrentUser() user: AuthUserContext,
    @Param('id') id: string,
    @Body() dto: SuspendRegisteredUserDto,
  ): Promise<unknown> {
    return this.userManagementService.suspend(user, id, dto);
  }

  @Post(':id/unsuspend')
  @Permissions('users.unsuspend')
  unsuspend(
    @CurrentUser() user: AuthUserContext,
    @Param('id') id: string,
    @Body() dto: UnsuspendRegisteredUserDto,
  ): Promise<unknown> {
    return this.userManagementService.unsuspend(user, id, dto);
  }

  @Post(':id/reset-password')
  @Permissions('users.resetPassword')
  resetPassword(
    @CurrentUser() user: AuthUserContext,
    @Param('id') id: string,
    @Body() dto: ResetRegisteredUserPasswordDto,
  ): Promise<unknown> {
    return this.userManagementService.resetPassword(user, id, dto);
  }

  @Get(':id/activity')
  @Permissions('users.read')
  activity(@Param('id') id: string, @Query() query: ListUserActivityDto): Promise<unknown> {
    return this.userManagementService.activity(id, query);
  }

  @Get(':id/stats')
  @Permissions('users.read')
  stats(@Param('id') id: string): Promise<unknown> {
    return this.userManagementService.stats(id);
  }
}
