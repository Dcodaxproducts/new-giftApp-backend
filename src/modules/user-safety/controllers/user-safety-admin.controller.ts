import { Body, Controller, Get, Param, Post, Query, StreamableFile, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthUserContext, CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { ListAdminUserSafetyReportsDto, UserSafetyAdminActionDto } from '../dto/user-safety.dto';
import { UserSafetyAdminService } from '../services/user-safety-admin.service';
@ApiTags('02 Admin - User Safety Moderation') @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard) @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN) @Controller('admin/user-safety')
export class UserSafetyAdminController { constructor(private readonly service: UserSafetyAdminService) {} @Get('reports') @Permissions('userSafety.read') @ApiOperation({ summary: 'List user safety reports' }) reports(@Query() query: ListAdminUserSafetyReportsDto) { return this.service.reports(query); } @Get('reports/export') @Permissions('userSafety.export') @ApiOperation({ summary: 'Export user safety reports' }) export(@CurrentUser() user: AuthUserContext, @Query() query: ListAdminUserSafetyReportsDto): Promise<StreamableFile> { return this.service.export(user, query); } @Get('reports/:id') @Permissions('userSafety.read') @ApiOperation({ summary: 'Fetch user safety report detail' }) detail(@Param('id') id: string) { return this.service.details(id); } @Post('reports/:id/action') @Permissions('userSafety.moderate') @ApiOperation({ summary: 'Moderate user safety report' }) @ApiBody({ type: UserSafetyAdminActionDto }) action(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Body() dto: UserSafetyAdminActionDto) { return this.service.action(user, id, dto); } }
