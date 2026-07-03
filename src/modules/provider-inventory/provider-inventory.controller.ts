import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthUserContext, CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateProviderInventoryItemDto, ListProviderInventoryDto, UpdateProviderInventoryItemDto } from './dto/provider-inventory.dto';
import { ProviderInventoryService } from './provider-inventory.service';

@ApiTags('03 Provider - Inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.PROVIDER)
@Controller('provider/inventory')
export class ProviderInventoryController {
  constructor(private readonly service: ProviderInventoryService) {}

  @Get()
  @ApiOperation({ summary: 'List provider inventory items', description: 'PROVIDER only. Pending providers cannot access inventory. Use status to filter ACTIVE, INACTIVE, or OUT_OF_STOCK items.' })
  @ApiResponse({ status: 200, description: 'Provider inventory fetched successfully', schema: { example: { success: true, data: [{ id: 'gift_id', name: 'Luxury Perfume', price: 99.99, currency: 'PKR', status: 'ACTIVE', category: { id: 'category_id', name: 'Perfumes' }, variants: [{ id: 'variant_id', name: '50ml', price: 129.99 }] }], meta: { page: 1, limit: 10, total: 1, totalPages: 1 }, message: 'Provider inventory fetched successfully' } } })
  list(@CurrentUser() user: AuthUserContext, @Query() query: ListProviderInventoryDto) { return this.service.list(user, query); }

  @Get('stats')
  @ApiOperation({ summary: 'Fetch provider inventory stats' })
  stats(@CurrentUser() user: AuthUserContext) { return this.service.stats(user); }

  @Get('lookup')
  @ApiOperation({ summary: 'Lookup active provider inventory items', description: 'PROVIDER only.' })
  lookup(@CurrentUser() user: AuthUserContext) { return this.service.lookup(user); }

  @Post()
  @ApiOperation({ summary: 'Create provider inventory item with optional nested variants', description: 'PROVIDER only. Pending providers cannot access this module.' })
  @ApiBody({ type: CreateProviderInventoryItemDto, examples: { withVariants: { value: { name: 'Luxury Perfume', description: 'Long-lasting premium fragrance.', categoryId: 'gift_category_id', price: 99.99, currency: 'PKR', imageUrls: ['https://cdn.yourdomain.com/gift-images/perfume.png'], variants: [{ name: '30ml', price: 89.99 }, { name: '50ml', price: 129.99 }] } } } })
  @ApiResponse({ status: 201, description: 'Inventory item created successfully', schema: { example: { success: true, data: { id: 'gift_id', name: 'Luxury Perfume', price: 99.99, currency: 'PKR', status: 'ACTIVE', variants: [{ id: 'variant_id', name: '50ml', price: 129.99 }] }, message: 'Inventory item created successfully' } } })
  create(@CurrentUser() user: AuthUserContext, @Body() dto: CreateProviderInventoryItemDto) { return this.service.create(user, dto); }

  @Get(':id')
  @ApiOperation({ summary: 'Fetch own provider inventory item details' })
  @ApiResponse({ status: 200, description: 'Inventory item fetched successfully', schema: { example: { success: true, data: { id: 'gift_id', name: 'Luxury Perfume', description: 'Long-lasting premium fragrance.', price: 99.99, currency: 'PKR', status: 'ACTIVE', imageUrls: ['https://cdn.yourdomain.com/gift-images/perfume.png'], variants: [{ id: 'variant_id', name: '50ml', price: 129.99 }] }, message: 'Inventory item fetched successfully' } } })
  details(@CurrentUser() user: AuthUserContext, @Param('id') id: string) { return this.service.details(user, id); }

  @Patch(':id')
  @ApiOperation({ summary: 'Update own provider inventory item and upsert variants', description: 'Provider can update only own inventory item. Variant id must belong to the provider-owned gift. Status and availability changes go through this same PATCH endpoint.' })
  @ApiBody({ type: UpdateProviderInventoryItemDto, examples: { updateItem: { value: { name: 'Luxury Perfume', description: 'Updated premium fragrance.', replaceVariants: false, variants: [{ id: 'variant_id', name: '50ml', price: 129.99 }, { name: '150ml', price: 249.99 }] } }, activateItem: { value: { status: 'ACTIVE', isAvailable: true, reason: 'Item reactivated.' } }, deactivateItem: { value: { status: 'INACTIVE', isAvailable: false, reason: 'Item paused by provider.' } }, markOutOfStock: { value: { isAvailable: false, reason: 'Temporarily out of stock.' } } } })
  @ApiResponse({ status: 200, description: 'Inventory item updated successfully', schema: { example: { success: true, data: { id: 'gift_id', name: 'Luxury Perfume', status: 'ACTIVE', isAvailable: true, variants: [{ id: 'variant_id', name: '50ml', price: 129.99 }] }, message: 'Inventory item updated successfully' } } })
  update(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Body() dto: UpdateProviderInventoryItemDto) { return this.service.update(user, id, dto); }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete own inventory item', description: 'Permanently deletes the provider inventory item.' })
  delete(@CurrentUser() user: AuthUserContext, @Param('id') id: string) { return this.service.delete(user, id); }
}
