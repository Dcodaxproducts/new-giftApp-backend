import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../../database/prisma.service';

@ApiTags('Gift Categories')
@Controller('gift-categories/lookup')
export class GiftCategoriesLookupController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Lookup active gift categories', description: 'Public lookup under Gift Categories. Returns active category identifiers and media fields for lightweight selectors.' })
  @ApiResponse({ status: 200, description: 'Gift category lookup fetched successfully' })
  async lookup() {
    const categories = await this.prisma.giftCategory.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, slug: true, backgroundColor: true, imageUrl: true, color: true },
    });
    return {
      data: categories.map((category) => ({ ...category, backgroundColor: category.backgroundColor ?? category.color ?? '#F3E8FF' })),
      message: 'Gift category lookup fetched successfully',
    };
  }
}
