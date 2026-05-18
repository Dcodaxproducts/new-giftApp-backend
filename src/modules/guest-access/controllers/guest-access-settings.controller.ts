import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthUserContext, CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { UpdateGuestAccessSettingsDto } from '../dto/guest-access-settings.dto';
import { GuestAccessSettingsService } from '../services/guest-access-settings.service';
@ApiTags('02 Admin - Guest Access Settings') @ApiBearerAuth() @UseGuards(JwtAuthGuard,RolesGuard,PermissionsGuard) @Roles(UserRole.SUPER_ADMIN,UserRole.ADMIN) @Controller('admin/guest-access-settings')
export class GuestAccessSettingsController { constructor(private readonly service:GuestAccessSettingsService){} @Get() @Permissions('guestAccessSettings.read') @ApiOperation({summary:'Fetch guest access settings',description:'SUPER_ADMIN or ADMIN with guestAccessSettings.read.'}) get(){return this.service.get();} @Patch() @Permissions('guestAccessSettings.update') @ApiOperation({summary:'Update guest access settings',description:'SUPER_ADMIN or ADMIN with guestAccessSettings.update. Creates audit logs.'}) @ApiBody({type:UpdateGuestAccessSettingsDto}) update(@CurrentUser() user:AuthUserContext,@Body() dto:UpdateGuestAccessSettingsDto){return this.service.update(user,dto);} @Get('audit-logs') @Permissions('guestAccessSettings.read') @ApiOperation({summary:'List guest access settings audit logs',description:'SUPER_ADMIN or ADMIN with guestAccessSettings.read.'}) auditLogs(){return this.service.auditLogs();} }
