import { Body, Controller, Delete, Get, Param, Patch, Post, Query, StreamableFile, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthUserContext, CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Permissions } from 'src/common/decorators/permissions.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { CreateGiftDto, ExportGiftsDto, ListGiftsDto, UpdateGiftDto } from './dto/gift-management.dto';
import { GiftManagementService } from './gift-management.service';

@ApiTags('04 Gifts - Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.STAFF)
@Controller('gifts')
export class GiftsController {
  constructor(private readonly gifts: GiftManagementService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.STAFF, UserRole.PROVIDER)
  @ApiOperation({ summary: 'Create gift with optional nested variants', description: 'SUPER_ADMIN/ADMIN with gifts.create creates ACTIVE gifts. PROVIDER creates gifts for their own account as INACTIVE. Nested variants are created in the same transaction and stored in GiftVariant.' })
  @ApiBody({ type: CreateGiftDto, examples: { withVariants: { value: { name: 'Luxury Perfume', description: 'Long-lasting premium fragrance.', categoryId: 'gift_category_id', providerId: 'provider_id', price: 99.99, currency: 'PKR', imageUrls: ['https://cdn.yourdomain.com/gift-images/perfume.png'], status: 'ACTIVE', isFeatured: false, variants: [{ name: '30ml', price: 89.99 }, { name: '50ml', price: 129.99 }] } } } })
  @ApiResponse({ status: 201, description: 'Gift created successfully', schema: { example: { success: true, data: { id: 'gift_id', name: 'Luxury Perfume', price: 99.99, currency: 'PKR', status: 'ACTIVE', variants: [{ id: 'variant_id', name: '50ml', price: 129.99 }] }, message: 'Gift created successfully' } } })
  create(@CurrentUser() user: AuthUserContext, @Body() dto: CreateGiftDto) { return this.gifts.createGift(user, dto); }

  @Get()
  @Permissions('gifts.read')
  @ApiOperation({ summary: 'List admin gifts', description: 'SUPER_ADMIN/ADMIN with gifts.read. Supports category, provider, and status filters.' })
  list(@Query() query: ListGiftsDto) { return this.gifts.listGifts(query); }

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
  @ApiOperation({ summary: 'Update admin gift, nested variants, or operational catalog status', description: "SUPER_ADMIN or ADMIN with 'gifts.update' for normal fields and 'gifts.status.update' for status changes. If replaceVariants=true, omitted variants are permanently removed." })
  @ApiBody({ type: UpdateGiftDto, examples: { upsertVariants: { value: { name: 'Luxury Perfume Updated', replaceVariants: false, variants: [{ id: 'variant_id', name: '50ml', price: 129.99 }, { name: '150ml', price: 249.99 }] } }, activateGift: { value: { status: 'ACTIVE', reason: 'Back in stock.' } }, deactivateGift: { value: { status: 'INACTIVE', reason: 'Temporarily disabled by admin.' } }, markOutOfStock: { value: { status: 'OUT_OF_STOCK', reason: 'Inventory is depleted.' } } } })
  @ApiResponse({ status: 200, description: 'Gift updated successfully', schema: { example: { success: true, data: { id: 'gift_id', name: 'Luxury Perfume Updated', status: 'ACTIVE', variants: [{ id: 'variant_id', name: '50ml', price: 129.99 }] }, message: 'Gift updated successfully' } } })
  update(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Body() dto: UpdateGiftDto) { return this.gifts.updateGift(user, id, dto); }

  @Delete(':id')
  @Permissions('gifts.delete')
  @ApiOperation({ summary: 'Delete gift', description: 'Permanently deletes the gift record.' })
  delete(@CurrentUser() user: AuthUserContext, @Param('id') id: string) { return this.gifts.deleteGift(user, id); }
}
