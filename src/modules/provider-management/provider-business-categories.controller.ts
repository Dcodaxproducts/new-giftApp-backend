import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthUserContext, CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
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

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  details(@Param('id') id: string) {
    return this.service.details(id);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  create(
    @CurrentUser() user: AuthUserContext,
    @Body() dto: CreateProviderBusinessCategoryDto,
  ) {
    return this.service.create(user, dto);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  update(
    @CurrentUser() user: AuthUserContext,
    @Param('id') id: string,
    @Body() dto: UpdateProviderBusinessCategoryDto,
  ) {
    return this.service.update(user, id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  delete(@CurrentUser() user: AuthUserContext, @Param('id') id: string) {
    return this.service.delete(user, id);
  }
}
