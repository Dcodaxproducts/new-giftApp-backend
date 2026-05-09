import { Body, Controller, Delete, Get, Param, Patch, Post, Query, StreamableFile, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthUserContext, CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateGiftDto, ExportGiftsDto, ListGiftsDto, UpdateGiftDto, UpdateGiftStatusDto } from './dto/gift-management.dto';
import { GiftManagementService } from './gift-management.service';

@ApiTags('Gift Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
@Controller('gifts')
export class GiftsController {
  constructor(private readonly gifts: GiftManagementService) {}

  @Post()
  @Permissions('gifts.create')
  @ApiOperation({ summary: 'Create admin gift with optional nested variants', description: 'SUPER_ADMIN/ADMIN with gifts.create. Nested variants are created in the same transaction and stored in GiftVariant.' })
  @ApiBody({ type: CreateGiftDto, examples: { withVariants: { value: { name: 'Luxury Perfume', description: 'Long-lasting premium fragrance.', shortDescription: 'Premium fragrance gift.', categoryId: 'gift_category_id', providerId: 'provider_id', price: 99.99, currency: 'PKR', stockQuantity: 50, sku: 'PERFUME-001', imageUrls: ['https://cdn.yourdomain.com/gift-images/perfume.png'], isPublished: true, isFeatured: false, tags: ['perfume', 'luxury'], moderationStatus: 'APPROVED', variants: [{ name: '30ml', price: 89.99, originalPrice: 119.99, stockQuantity: 10, sku: 'PERFUME-30ML', isPopular: false, isDefault: false, sortOrder: 1, isActive: true }, { name: '50ml', price: 129.99, originalPrice: 159.99, stockQuantity: 20, sku: 'PERFUME-50ML', isPopular: true, isDefault: true, sortOrder: 2, isActive: true }] } } } })
  @ApiResponse({ status: 201, description: 'Gift created successfully', schema: { example: { success: true, data: { id: 'gift_id', name: 'Luxury Perfume', price: 99.99, currency: 'PKR', stockQuantity: 50, sku: 'PERFUME-001', variants: [{ id: 'variant_id', name: '50ml', price: 129.99, originalPrice: 159.99, stockQuantity: 20, sku: 'PERFUME-50ML', isPopular: true, isDefault: true, sortOrder: 2, isActive: true }] }, message: 'Gift created successfully' } } })
  create(@CurrentUser() user: AuthUserContext, @Body() dto: CreateGiftDto) { return this.gifts.createGift(user, dto); }

  @Get()
  @Permissions('gifts.read')
  @ApiOperation({ summary: 'List admin gifts', description: 'SUPER_ADMIN/ADMIN with gifts.read. Supports category/provider/status/moderation filters.' })
  list(@Query() query: ListGiftsDto) { return this.gifts.listGifts(query); }

  @Get('stats')
  @Permissions('gifts.read')
  @ApiOperation({ summary: 'Fetch gift inventory stats' })
  stats() { return this.gifts.giftStats(); }

  @Get('export')
  @Permissions('gifts.export')
  @ApiOperation({ summary: 'Export gift inventory' })
  async export(@Query() query: ExportGiftsDto): Promise<StreamableFile> {
    const file = await this.gifts.exportGifts(query);
    return new StreamableFile(Buffer.from(file.content), { disposition: `attachment; filename="${file.filename}"`, type: file.contentType });
  }

  @Get(':id')
  @Permissions('gifts.read')
  @ApiOperation({ summary: 'Fetch admin gift details with variants' })
  details(@Param('id') id: string) { return this.gifts.giftDetails(id); }

  @Patch(':id')
  @Permissions('gifts.update')
  @ApiOperation({ summary: 'Update admin gift and upsert nested variants', description: 'If replaceVariants=true, omitted variants are soft-deleted. Only one default variant is allowed.' })
  @ApiBody({ type: UpdateGiftDto, examples: { upsertVariants: { value: { name: 'Luxury Perfume Updated', replaceVariants: false, variants: [{ id: 'variant_id', name: '50ml', price: 129.99, originalPrice: 159.99, stockQuantity: 20, sku: 'PERFUME-50ML', isPopular: true, isDefault: true, sortOrder: 2, isActive: true }, { name: '150ml', price: 249.99, originalPrice: 299.99, stockQuantity: 5, sku: 'PERFUME-150ML', isPopular: false, isDefault: false, sortOrder: 4, isActive: true }] } } } })
  @ApiResponse({ status: 200, description: 'Gift updated successfully', schema: { example: { success: true, data: { id: 'gift_id', name: 'Luxury Perfume Updated', variants: [{ id: 'variant_id', name: '50ml', price: 129.99, originalPrice: 159.99, stockQuantity: 20, sku: 'PERFUME-50ML', isDefault: true, isActive: true }] }, message: 'Gift updated successfully' } } })
  update(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Body() dto: UpdateGiftDto) { return this.gifts.updateGift(user, id, dto); }

  @Patch(':id/status')
  @Permissions('gifts.status.update')
  @ApiOperation({ summary: 'Update gift status' })
  updateStatus(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Body() dto: UpdateGiftStatusDto) { return this.gifts.updateGiftStatus(user, id, dto); }

  @Delete(':id')
  @Permissions('gifts.delete')
  @ApiOperation({ summary: 'Soft-delete gift' })
  delete(@CurrentUser() user: AuthUserContext, @Param('id') id: string) { return this.gifts.deleteGift(user, id); }
}
