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

@ApiTags('Gift Categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
@Controller('gift-categories')
export class GiftCategoriesController {
  constructor(private readonly gifts: GiftManagementService) {}

  @Post()
  @Permissions('giftCategories.create')
  @ApiOperation({ summary: 'Create gift category', description: 'RBAC permission: giftCategories.create. Slug is auto-generated and unique. backgroundColor defaults to #F3E8FF; color remains a backward-compatible alias.' })
  @ApiBody({ type: CreateGiftCategoryDto, examples: { create: { value: { name: 'Perfumes', description: 'Premium fragrance gifts.', iconKey: 'perfume', backgroundColor: '#E9D5FF', imageUrl: 'https://cdn.example.com/gift-categories/perfumes.png', sortOrder: 1, isActive: true } } } })
  @ApiResponse({ status: 201, description: 'Gift category created successfully' })
  create(@CurrentUser() user: AuthUserContext, @Body() dto: CreateGiftCategoryDto) { return this.gifts.createCategory(user, dto); }

  @Get()
  @Permissions('giftCategories.read')
  @ApiOperation({ summary: 'List gift categories', description: 'RBAC permission: giftCategories.read. Returns soft-delete-filtered categories with gift counts and category media fields.' })
  @ApiResponse({ status: 200, description: 'Gift categories fetched successfully' })
  list(@Query() query: ListGiftCategoriesDto) { return this.gifts.listCategories(query); }

  @Get('stats')
  @Permissions('giftCategories.read')
  @ApiOperation({ summary: 'Fetch gift category stats', description: 'RBAC permission: giftCategories.read. Returns admin category inventory counters.' })
  stats() { return this.gifts.categoryStats(); }

  @Get(':id')
  @Permissions('giftCategories.read')
  @ApiOperation({ summary: 'Fetch gift category details', description: 'RBAC permission: giftCategories.read. Includes backgroundColor and imageUrl for customer app design support.' })
  @ApiResponse({ status: 200, description: 'Gift category details fetched successfully' })
  details(@Param('id') id: string) { return this.gifts.categoryDetails(id); }

  @Patch(':id')
  @Permissions('giftCategories.update')
  @ApiOperation({ summary: 'Update gift category', description: 'RBAC permission: giftCategories.update. Slug is regenerated when name changes. Soft-deleted categories are not updated.' })
  @ApiBody({ type: UpdateGiftCategoryDto, examples: { update: { value: { backgroundColor: '#F3E8FF', imageUrl: 'https://cdn.example.com/gift-categories/perfumes.png', isActive: true } } } })
  @ApiResponse({ status: 200, description: 'Gift category updated successfully' })
  update(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Body() dto: UpdateGiftCategoryDto) { return this.gifts.updateCategory(user, id, dto); }

  @Delete(':id')
  @Permissions('giftCategories.delete')
  @ApiOperation({ summary: 'Soft-delete gift category', description: 'RBAC permission: giftCategories.delete. Categories with attached gifts cannot be deleted; delete writes an audit log.' })
  delete(@CurrentUser() user: AuthUserContext, @Param('id') id: string) { return this.gifts.deleteCategory(user, id); }
}
