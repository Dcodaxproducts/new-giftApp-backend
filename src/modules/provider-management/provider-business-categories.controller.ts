import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthUserContext, CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateProviderBusinessCategoryDto, ListProviderBusinessCategoriesDto, UpdateProviderBusinessCategoryDto } from './dto/provider-business-categories.dto';
import { ProviderBusinessCategoriesService } from './provider-business-categories.service';

@ApiTags('Provider Management')
@Controller('provider-business-categories')
export class ProviderBusinessCategoriesController {
  constructor(private readonly service: ProviderBusinessCategoriesService) {}

  @Get()
  list(@Query() query: ListProviderBusinessCategoriesDto) {
    return this.service.list(query);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Permissions('providerBusinessCategories.create')
  @Post()
  create(@CurrentUser() user: AuthUserContext, @Body() dto: CreateProviderBusinessCategoryDto) {
    return this.service.create(user, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Permissions('providerBusinessCategories.read')
  @Get(':id')
  details(@Param('id') id: string) {
    return this.service.details(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Permissions('providerBusinessCategories.update')
  @Patch(':id')
  update(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Body() dto: UpdateProviderBusinessCategoryDto) {
    return this.service.update(user, id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Permissions('providerBusinessCategories.delete')
  @Delete(':id')
  delete(@CurrentUser() user: AuthUserContext, @Param('id') id: string) {
    return this.service.delete(user, id);
  }
}
