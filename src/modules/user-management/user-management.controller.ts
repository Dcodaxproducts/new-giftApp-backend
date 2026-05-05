import { Body, Controller, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthUserContext, CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UpdateUserActiveStatusDto } from '../auth/dto/admin-auth.dto';
import { UserManagementService } from './user-management.service';

@ApiTags('User Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
@Controller('users')
export class UserManagementController {
  constructor(private readonly userManagementService: UserManagementService) {}

  @Patch(':id/active-status')
  updateActiveStatus(
    @CurrentUser() user: AuthUserContext,
    @Param('id') id: string,
    @Body() dto: UpdateUserActiveStatusDto,
  ) {
    return this.userManagementService.updateActiveStatus(user, id, dto);
  }
}
