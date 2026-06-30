import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { UserRole } from '@prisma/client';
import { AuthUserContext, CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateSeasonalThemeDto, ListSeasonalThemesDto, UpdateSeasonalThemeDto } from './dto/seasonal-themes.dto';
import { SeasonalThemesService } from './seasonal-themes.service';

@ApiTags('02 Admin - Seasonal Themes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
@Controller('admin/seasonal-themes')
export class SeasonalThemesAdminController {
  constructor(private readonly seasonalThemes: SeasonalThemesService) {}

  @Get()
  @Permissions('seasonalThemes.read')
  @ApiOperation({ summary: 'List seasonal themes', description: 'SUPER_ADMIN or ADMIN with seasonalThemes.read.' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'isActive', required: false })
  list(@Query() query: ListSeasonalThemesDto) { return this.seasonalThemes.list(query); }

  @Post()
  @Permissions('seasonalThemes.create')
  @ApiOperation({ summary: 'Create seasonal theme', description: 'SUPER_ADMIN or ADMIN with seasonalThemes.create. imageUrl must reference a completed seasonal-theme-assets upload. Active theme date ranges cannot overlap.' })
  @ApiBody({ type: CreateSeasonalThemeDto })
  @ApiResponse({ status: 201, schema: { example: { success: true, data: { id: 'theme_id', name: 'Eid 2026', imageUrl: 'https://cdn.yourdomain.com/seasonal-theme-assets/admin_1/eid.png', startsAt: '2026-03-15T00:00:00.000Z', endsAt: '2026-03-25T23:59:59.000Z', isActive: true }, message: 'Seasonal theme created successfully.' } } })
  create(@CurrentUser() user: AuthUserContext, @Body() dto: CreateSeasonalThemeDto, @Req() request: Request) { return this.seasonalThemes.create(user, dto, request.ip); }

  @Get(':id')
  @Permissions('seasonalThemes.read')
  @ApiOperation({ summary: 'Fetch seasonal theme', description: 'SUPER_ADMIN or ADMIN with seasonalThemes.read.' })
  details(@Param('id') id: string) { return this.seasonalThemes.details(id); }

  @Patch(':id')
  @Permissions('seasonalThemes.update')
  @ApiOperation({ summary: 'Update seasonal theme', description: 'SUPER_ADMIN or ADMIN with seasonalThemes.update. Active theme date ranges cannot overlap.' })
  @ApiBody({ type: UpdateSeasonalThemeDto })
  update(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Body() dto: UpdateSeasonalThemeDto, @Req() request: Request) { return this.seasonalThemes.update(user, id, dto, request.ip); }

  @Delete(':id')
  @Permissions('seasonalThemes.delete')
  @ApiOperation({ summary: 'Delete seasonal theme', description: 'SUPER_ADMIN or ADMIN with seasonalThemes.delete.' })
  delete(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Req() request: Request) { return this.seasonalThemes.delete(user, id, request.ip); }
}

@ApiTags('10 Public - Seasonal Themes')
@Controller('seasonal-themes')
export class SeasonalThemesPublicController {
  constructor(private readonly seasonalThemes: SeasonalThemesService) {}

  @Get('active')
  @ApiOperation({ summary: 'Fetch active seasonal theme', description: 'Returns the single active seasonal theme for the current date, or null when no theme is active.' })
  @ApiResponse({ status: 200, schema: { example: { success: true, data: { id: 'theme_id', name: 'Eid 2026', imageUrl: 'https://cdn.yourdomain.com/seasonal-theme-assets/admin_1/eid.png', startsAt: '2026-03-15T00:00:00.000Z', endsAt: '2026-03-25T23:59:59.000Z', isActive: true }, message: 'Active seasonal theme fetched successfully.' } } })
  active() { return this.seasonalThemes.active(); }
}
