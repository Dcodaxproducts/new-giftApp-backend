import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthUserContext, CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateGiftCategoryDto, ListGiftCategoriesDto, UpdateGiftCategoryDto } from './dto/gift-management.dto';
import { GiftManagementService } from './gift-management.service';

@ApiTags('Gift Categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
@Controller('gift-categories')
export class GiftCategoriesController {
  constructor(private readonly gifts: GiftManagementService) {}

  @Post()
  @Permissions('giftCategories.create')
  create(@CurrentUser() user: AuthUserContext, @Body() dto: CreateGiftCategoryDto) { return this.gifts.createCategory(user, dto); }

  @Get()
  @Permissions('giftCategories.read')
  list(@Query() query: ListGiftCategoriesDto) { return this.gifts.listCategories(query); }

  @Get('stats')
  @Permissions('giftCategories.read')
  stats() { return this.gifts.categoryStats(); }

  @Get(':id')
  @Permissions('giftCategories.read')
  details(@Param('id') id: string) { return this.gifts.categoryDetails(id); }

  @Patch(':id')
  @Permissions('giftCategories.update')
  update(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Body() dto: UpdateGiftCategoryDto) { return this.gifts.updateCategory(user, id, dto); }

  @Delete(':id')
  @Permissions('giftCategories.delete')
  delete(@CurrentUser() user: AuthUserContext, @Param('id') id: string) { return this.gifts.deleteCategory(user, id); }
}
