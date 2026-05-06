import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../../database/prisma.service';

@ApiTags('Gift Categories')
@Controller('gift-categories')
export class GiftCategoriesLookupController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('lookup')
  async lookup() {
    const categories = await this.prisma.giftCategory.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    });
    return {
      data: categories,
      message: 'Gift category lookup fetched successfully',
    };
  }
}
