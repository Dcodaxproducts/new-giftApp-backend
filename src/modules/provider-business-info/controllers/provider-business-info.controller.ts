import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthUserContext, CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { UpdateProviderBusinessInfoDto } from '../dto/provider-business-info.dto';
import { ProviderBusinessInfoService } from '../services/provider-business-info.service';
@ApiTags('03 Provider - Business Info')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.PROVIDER)
@Controller('provider/business-info')
export class ProviderBusinessInfoController { constructor(private readonly businessInfo: ProviderBusinessInfoService) {} @Get() @ApiOperation({ summary: 'Fetch own provider business information', description: 'PROVIDER only. providerId is derived from JWT.' }) get(@CurrentUser() user: AuthUserContext) { return this.businessInfo.get(user); } @Patch() @ApiOperation({ summary: 'Update own provider business information', description: 'PROVIDER only. Cannot set approvalStatus/isActive; material business changes require verification review.' }) update(@CurrentUser() user: AuthUserContext, @Body() dto: UpdateProviderBusinessInfoDto) { return this.businessInfo.update(user, dto); } }
