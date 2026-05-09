import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthUserContext, CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateProviderInventoryItemDto, ListProviderInventoryDto, UpdateProviderAvailabilityDto, UpdateProviderInventoryItemDto } from './dto/provider-inventory.dto';
import { ProviderInventoryService } from './provider-inventory.service';

@ApiTags('Provider Inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.PROVIDER)
@Controller('provider/inventory')
export class ProviderInventoryController {
  constructor(private readonly service: ProviderInventoryService) {}

  @Get()
  list(@CurrentUser() user: AuthUserContext, @Query() query: ListProviderInventoryDto) {
    return this.service.list(user, query);
  }

  @Get('stats')
  stats(@CurrentUser() user: AuthUserContext) {
    return this.service.stats(user);
  }

  @Get('lookup')
  lookup(@CurrentUser() user: AuthUserContext) {
    return this.service.lookup(user);
  }

  @Post()
  @ApiBody({ type: CreateProviderInventoryItemDto, examples: { withVariants: { value: { name: 'Luxury Perfume', description: 'Long-lasting premium fragrance.', shortDescription: 'Premium fragrance gift.', categoryId: 'gift_category_id', price: 99.99, currency: 'PKR', stockQuantity: 50, sku: 'PERFUME-001', imageUrls: ['https://cdn.yourdomain.com/gift-images/perfume.png'], isAvailable: true, variants: [{ name: '30ml', price: 89.99, originalPrice: 119.99, stockQuantity: 10, sku: 'PERFUME-30ML', isPopular: false, isDefault: false, sortOrder: 1, isActive: true }, { name: '50ml', price: 129.99, originalPrice: 159.99, stockQuantity: 20, sku: 'PERFUME-50ML', isPopular: true, isDefault: true, sortOrder: 2, isActive: true }] } } } })
  create(@CurrentUser() user: AuthUserContext, @Body() dto: CreateProviderInventoryItemDto) {
    return this.service.create(user, dto);
  }

  @Get(':id')
  details(@CurrentUser() user: AuthUserContext, @Param('id') id: string) {
    return this.service.details(user, id);
  }

  @Patch(':id')
  @ApiBody({ type: UpdateProviderInventoryItemDto, examples: { upsertVariants: { value: { replaceVariants: false, variants: [{ id: 'variant_id', name: '50ml', price: 129.99, originalPrice: 159.99, stockQuantity: 20, sku: 'PERFUME-50ML', isPopular: true, isDefault: true, sortOrder: 2, isActive: true }, { name: '150ml', price: 249.99, originalPrice: 299.99, stockQuantity: 5, sku: 'PERFUME-150ML', isPopular: false, isDefault: false, sortOrder: 4, isActive: true }] } } } })
  update(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Body() dto: UpdateProviderInventoryItemDto) {
    return this.service.update(user, id, dto);
  }

  @Patch(':id/availability')
  updateAvailability(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Body() dto: UpdateProviderAvailabilityDto) {
    return this.service.updateAvailability(user, id, dto);
  }

  @Delete(':id')
  delete(@CurrentUser() user: AuthUserContext, @Param('id') id: string) {
    return this.service.delete(user, id);
  }
}
