import { Body, Controller, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthUserContext, CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RejectProviderDto } from '../auth/dto/admin-auth.dto';
import { ProviderManagementService } from './provider-management.service';

@ApiTags('Provider Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
@Controller('providers')
export class ProviderManagementController {
  constructor(private readonly providerManagementService: ProviderManagementService) {}

  @Patch(':id/approve')
  approve(@CurrentUser() user: AuthUserContext, @Param('id') id: string) {
    return this.providerManagementService.approve(user, id);
  }

  @Patch(':id/reject')
  reject(
    @CurrentUser() user: AuthUserContext,
    @Param('id') id: string,
    @Body() dto: RejectProviderDto,
  ) {
    return this.providerManagementService.reject(user, id, dto);
  }
}
