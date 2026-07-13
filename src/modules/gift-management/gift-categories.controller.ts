import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthUserContext, CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateGiftCategoryDto, ListGiftCategoriesDto, UpdateGiftCategoryDto } from './dto/gift-management.dto';
import { GiftManagementService } from './gift-management.service';

@ApiTags('04 Gifts - Categories')
@Controller('gift-categories')
export class GiftCategoriesController {
  constructor(private readonly gifts: GiftManagementService) { }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.STAFF)
  @Post()
  @Permissions('giftCategories.create')
  @ApiOperation({ summary: 'Create gift category', description: 'RBAC permission: giftCategories.create. Slug is auto-generated and unique.' })
  @ApiBody({ type: CreateGiftCategoryDto, examples: { create: { value: { name: 'Perfumes', description: 'Premium fragrance gifts.', imageUrl: 'https://<YOUR_PUBLIC_BUCKET_OR_CDN_URL>/gift-category-images/perfumes.png', isActive: true } } } })
  @ApiResponse({ status: 201, description: 'Gift category created successfully' })
  create(@CurrentUser() user: AuthUserContext, @Body() dto: CreateGiftCategoryDto) { return this.gifts.createCategory(user, dto); }

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'List gift categories', description: 'Public. Non-admin callers (including providers) always receive active categories only. SUPER_ADMIN/STAFF may pass isActive=true or isActive=false to see inactive categories too. Use lookup=true to get only { id, name } pairs for dropdowns (active only, no pagination).' })
  @ApiResponse({ status: 200, description: 'Gift categories fetched successfully' })
  list(@CurrentUser() user: AuthUserContext | undefined, @Query() query: ListGiftCategoriesDto) { return this.gifts.listCategories(query, user); }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.STAFF)
  @Patch(':id')
  @Permissions('giftCategories.update')
  @ApiOperation({ summary: 'Update gift category', description: 'RBAC permission: giftCategories.update. Slug is regenerated when name changes.' })
  @ApiBody({ type: UpdateGiftCategoryDto, examples: { update: { value: { imageUrl: 'https://<YOUR_PUBLIC_BUCKET_OR_CDN_URL>/gift-category-images/perfumes.png', isActive: true } } } })
  @ApiResponse({ status: 200, description: 'Gift category updated successfully' })
  update(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Body() dto: UpdateGiftCategoryDto) { return this.gifts.updateCategory(user, id, dto); }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.STAFF)
  @Delete(':id')
  @Permissions('giftCategories.delete')
  @ApiOperation({ summary: 'Delete gift category', description: 'RBAC permission: giftCategories.delete. Permanently deletes the category. Categories with attached gifts cannot be deleted; delete writes an audit log.' })
  delete(@CurrentUser() user: AuthUserContext, @Param('id') id: string) { return this.gifts.deleteCategory(user, id); }
}
