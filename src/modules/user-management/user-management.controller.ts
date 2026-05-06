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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthUserContext, CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
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
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
@Controller('users')
export class UserManagementController {
  constructor(private readonly userManagementService: UserManagementService) {}

  @Get('export')
  async export(@Query() query: ExportRegisteredUsersDto): Promise<StreamableFile> {
    const file = await this.userManagementService.exportRegisteredUsers(query);
    return new StreamableFile(Buffer.from(file.content), {
      disposition: `attachment; filename="${file.filename}"`,
      type: file.contentType,
    });
  }

  @Get()
  list(@Query() query: ListRegisteredUsersDto): Promise<unknown> {
    return this.userManagementService.list(query);
  }

  @Get(':id')
  details(@Param('id') id: string): Promise<unknown> {
    return this.userManagementService.details(id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUserContext,
    @Param('id') id: string,
    @Body() dto: UpdateRegisteredUserDto,
  ): Promise<unknown> {
    return this.userManagementService.update(user, id, dto);
  }

  @Patch(':id/status')
  updateStatus(
    @CurrentUser() user: AuthUserContext,
    @Param('id') id: string,
    @Body() dto: UpdateRegisteredUserStatusDto,
  ): Promise<unknown> {
    return this.userManagementService.updateStatus(user, id, dto);
  }

  @Post(':id/suspend')
  suspend(
    @CurrentUser() user: AuthUserContext,
    @Param('id') id: string,
    @Body() dto: SuspendRegisteredUserDto,
  ): Promise<unknown> {
    return this.userManagementService.suspend(user, id, dto);
  }

  @Post(':id/unsuspend')
  unsuspend(
    @CurrentUser() user: AuthUserContext,
    @Param('id') id: string,
    @Body() dto: UnsuspendRegisteredUserDto,
  ): Promise<unknown> {
    return this.userManagementService.unsuspend(user, id, dto);
  }

  @Post(':id/reset-password')
  resetPassword(
    @CurrentUser() user: AuthUserContext,
    @Param('id') id: string,
    @Body() dto: ResetRegisteredUserPasswordDto,
  ): Promise<unknown> {
    return this.userManagementService.resetPassword(user, id, dto);
  }

  @Get(':id/activity')
  activity(@Param('id') id: string, @Query() query: ListUserActivityDto): Promise<unknown> {
    return this.userManagementService.activity(id, query);
  }

  @Get(':id/stats')
  stats(@Param('id') id: string): Promise<unknown> {
    return this.userManagementService.stats(id);
  }
}
