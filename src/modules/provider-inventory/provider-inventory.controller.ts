import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthUserContext, CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateProviderInventoryItemDto, ListProviderInventoryDto, UpdateProviderAvailabilityDto, UpdateProviderInventoryItemDto } from './dto/provider-inventory.dto';
import { ProviderInventoryService } from './provider-inventory.service';

@ApiTags('03 Provider - Inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.PROVIDER)
@Controller('provider/inventory')
export class ProviderInventoryController {
  constructor(private readonly service: ProviderInventoryService) {}

  @Get()
  @ApiOperation({ summary: 'List provider inventory items', description: 'PROVIDER only. Pending providers cannot access inventory. Provider inventory items do not require separate admin approval; visibility depends on approved/active provider plus item active, available, in stock, and not deleted.' })
  @ApiResponse({ status: 200, description: 'Provider inventory fetched successfully', schema: { example: { success: true, data: [{ id: 'gift_id', name: 'Luxury Perfume', price: 99.99, currency: 'PKR', stockQuantity: 50, status: 'ACTIVE', moderationStatus: 'NOT_REQUIRED', isAvailable: true, category: { id: 'category_id', name: 'Perfumes' }, variants: [{ id: 'variant_id', name: '50ml', price: 129.99, stockQuantity: 20, isDefault: true }] }], meta: { page: 1, limit: 20, total: 1, totalPages: 1 }, message: 'Provider inventory fetched successfully' } } })
  list(@CurrentUser() user: AuthUserContext, @Query() query: ListProviderInventoryDto) { return this.service.list(user, query); }

  @Get('stats')
  @ApiOperation({ summary: 'Fetch provider inventory stats' })
  stats(@CurrentUser() user: AuthUserContext) { return this.service.stats(user); }

  @Get('lookup')
  @ApiOperation({ summary: 'Lookup active provider inventory items', description: 'PROVIDER only. Gift moderation approval is not required for provider inventory lookup.' })
  lookup(@CurrentUser() user: AuthUserContext) { return this.service.lookup(user); }

  @Post()
  @ApiOperation({ summary: 'Create provider inventory item with optional nested variants', description: 'PROVIDER only. Pending providers cannot access this module. Provider inventory items do not require separate admin approval; approved active providers can create active, available inventory directly.' })
  @ApiBody({ type: CreateProviderInventoryItemDto, examples: { withVariants: { value: { name: 'Luxury Perfume', description: 'Long-lasting premium fragrance.', shortDescription: 'Premium fragrance gift.', categoryId: 'gift_category_id', price: 99.99, currency: 'PKR', stockQuantity: 50, sku: 'PERFUME-001', imageUrls: ['https://cdn.yourdomain.com/gift-images/perfume.png'], isAvailable: true, variants: [{ name: '30ml', price: 89.99, originalPrice: 119.99, stockQuantity: 10, sku: 'PERFUME-30ML', isPopular: false, isDefault: false, sortOrder: 1, isActive: true }, { name: '50ml', price: 129.99, originalPrice: 159.99, stockQuantity: 20, sku: 'PERFUME-50ML', isPopular: true, isDefault: true, sortOrder: 2, isActive: true }] } } } })
  @ApiResponse({ status: 201, description: 'Inventory item created successfully', schema: { example: { success: true, data: { id: 'gift_id', name: 'Luxury Perfume', price: 99.99, currency: 'PKR', stockQuantity: 50, status: 'ACTIVE', moderationStatus: 'NOT_REQUIRED', variants: [{ id: 'variant_id', name: '50ml', price: 129.99, originalPrice: 159.99, stockQuantity: 20, sku: 'PERFUME-50ML', isDefault: true, isActive: true }] }, message: 'Inventory item created successfully' } } })
  create(@CurrentUser() user: AuthUserContext, @Body() dto: CreateProviderInventoryItemDto) { return this.service.create(user, dto); }

  @Get(':id')
  @ApiOperation({ summary: 'Fetch own provider inventory item details' })
  @ApiResponse({ status: 200, description: 'Inventory item fetched successfully', schema: { example: { success: true, data: { id: 'gift_id', name: 'Luxury Perfume', description: 'Long-lasting premium fragrance.', price: 99.99, currency: 'PKR', stockQuantity: 50, status: 'ACTIVE', moderationStatus: 'NOT_REQUIRED', imageUrls: ['https://cdn.yourdomain.com/gift-images/perfume.png'], variants: [{ id: 'variant_id', name: '50ml', price: 129.99, originalPrice: 159.99, stockQuantity: 20, sku: 'PERFUME-50ML', isDefault: true, isActive: true }] }, message: 'Inventory item fetched successfully' } } })
  details(@CurrentUser() user: AuthUserContext, @Param('id') id: string) { return this.service.details(user, id); }

  @Patch(':id')
  @ApiOperation({ summary: 'Update own provider inventory item and upsert variants', description: 'Variant id must belong to the provider-owned gift. Price, name, media, and variant changes do not reset provider inventory to pending moderation.' })
  @ApiBody({ type: UpdateProviderInventoryItemDto, examples: { upsertVariants: { value: { replaceVariants: false, variants: [{ id: 'variant_id', name: '50ml', price: 129.99, originalPrice: 159.99, stockQuantity: 20, sku: 'PERFUME-50ML', isPopular: true, isDefault: true, sortOrder: 2, isActive: true }, { name: '150ml', price: 249.99, originalPrice: 299.99, stockQuantity: 5, sku: 'PERFUME-150ML', isPopular: false, isDefault: false, sortOrder: 4, isActive: true }] } } } })
  @ApiResponse({ status: 200, description: 'Inventory item updated successfully', schema: { example: { success: true, data: { id: 'gift_id', name: 'Luxury Perfume', variants: [{ id: 'variant_id', name: '50ml', price: 129.99, stockQuantity: 20, isDefault: true, isActive: true }] }, message: 'Inventory item updated successfully' } } })
  update(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Body() dto: UpdateProviderInventoryItemDto) { return this.service.update(user, id, dto); }

  @Patch(':id/availability')
  @ApiOperation({ summary: 'Update own inventory availability' })
  updateAvailability(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Body() dto: UpdateProviderAvailabilityDto) { return this.service.updateAvailability(user, id, dto); }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete own inventory item' })
  delete(@CurrentUser() user: AuthUserContext, @Param('id') id: string) { return this.service.delete(user, id); }
}
