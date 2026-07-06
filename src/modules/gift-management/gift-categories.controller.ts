import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthUserContext, CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateGiftCategoryDto, ListGiftCategoriesDto, UpdateGiftCategoryDto } from './dto/gift-management.dto';
import { GiftManagementService } from './gift-management.service';

@ApiTags('04 Gifts - Categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.STAFF)
@Controller('gift-categories')
export class GiftCategoriesController {
  constructor(private readonly gifts: GiftManagementService) { }

  @Post()
  @Permissions('giftCategories.create')
  @ApiOperation({ summary: 'Create gift category', description: 'RBAC permission: giftCategories.create. Slug is auto-generated and unique.' })
  @ApiBody({ type: CreateGiftCategoryDto, examples: { create: { value: { name: 'Perfumes', description: 'Premium fragrance gifts.', imageUrl: 'https://<YOUR_PUBLIC_BUCKET_OR_CDN_URL>/gift-category-images/perfumes.png', isActive: true } } } })
  @ApiResponse({ status: 201, description: 'Gift category created successfully' })
  create(@CurrentUser() user: AuthUserContext, @Body() dto: CreateGiftCategoryDto) { return this.gifts.createCategory(user, dto); }

  @Get()
  @Permissions('giftCategories.read')
  @ApiOperation({ summary: 'List gift categories', description: 'RBAC permission: giftCategories.read. By default returns all categories. Use isActive=true or isActive=false to filter by active state.' })
  @ApiResponse({ status: 200, description: 'Gift categories fetched successfully' })
  list(@Query() query: ListGiftCategoriesDto) { return this.gifts.listCategories(query); }

  @Patch(':id')
  @Permissions('giftCategories.update')
  @ApiOperation({ summary: 'Update gift category', description: 'RBAC permission: giftCategories.update. Slug is regenerated when name changes.' })
  @ApiBody({ type: UpdateGiftCategoryDto, examples: { update: { value: { imageUrl: 'https://<YOUR_PUBLIC_BUCKET_OR_CDN_URL>/gift-category-images/perfumes.png', isActive: true } } } })
  @ApiResponse({ status: 200, description: 'Gift category updated successfully' })
  update(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Body() dto: UpdateGiftCategoryDto) { return this.gifts.updateCategory(user, id, dto); }

  @Delete(':id')
  @Permissions('giftCategories.delete')
  @ApiOperation({ summary: 'Delete gift category', description: 'RBAC permission: giftCategories.delete. Permanently deletes the category. Categories with attached gifts cannot be deleted; delete writes an audit log.' })
  delete(@CurrentUser() user: AuthUserContext, @Param('id') id: string) { return this.gifts.deleteCategory(user, id); }
}
