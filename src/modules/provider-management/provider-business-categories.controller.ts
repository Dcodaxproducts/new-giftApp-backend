import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthUserContext, CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateProviderBusinessCategoryDto, ListProviderBusinessCategoriesDto, UpdateProviderBusinessCategoryDto } from './dto/provider-business-categories.dto';
import { ProviderBusinessCategoriesService } from './provider-business-categories.service';

@ApiTags('02 Admin - Provider Business Categories')
@Controller('provider-business-categories')
export class ProviderBusinessCategoriesController {
  constructor(private readonly service: ProviderBusinessCategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'List provider business categories', description: 'Public/provider-signup dropdown. Returns active provider business categories.' })
  list(@Query() query: ListProviderBusinessCategoriesDto) {
    return this.service.list(query);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Permissions('providerBusinessCategories.create')
  @Post()
  @ApiOperation({ summary: 'Create provider business category', description: 'SUPER_ADMIN or ADMIN with providerBusinessCategories.create permission only.' })
  create(@CurrentUser() user: AuthUserContext, @Body() dto: CreateProviderBusinessCategoryDto) {
    return this.service.create(user, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Permissions('providerBusinessCategories.read')
  @Get(':id')
  @ApiOperation({ summary: 'Fetch provider business category details', description: 'SUPER_ADMIN or ADMIN with providerBusinessCategories.read permission only.' })
  details(@Param('id') id: string) {
    return this.service.details(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Permissions('providerBusinessCategories.update')
  @Patch(':id')
  @ApiOperation({ summary: 'Update provider business category', description: 'SUPER_ADMIN or ADMIN with providerBusinessCategories.update permission only.' })
  update(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Body() dto: UpdateProviderBusinessCategoryDto) {
    return this.service.update(user, id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Permissions('providerBusinessCategories.delete')
  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete provider business category', description: 'SUPER_ADMIN or ADMIN with providerBusinessCategories.delete permission. Soft delete only; refuses deletion when active providers are attached.' })
  delete(@CurrentUser() user: AuthUserContext, @Param('id') id: string) {
    return this.service.delete(user, id);
  }
}
