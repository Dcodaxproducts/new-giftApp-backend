import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GiftManagementService } from '../services/gift-management.service';

@ApiTags('04 Gifts - Categories')
@Controller('gift-categories/lookup')
export class GiftCategoriesLookupController {
  constructor(private readonly gifts: GiftManagementService) {}

  @Get()
  @ApiOperation({ summary: 'Lookup active gift categories', description: 'Public lookup under Gift Categories. Returns active category identifiers and media fields for lightweight selectors.' })
  @ApiResponse({ status: 200, description: 'Gift category lookup fetched successfully' })
  lookup() { return this.gifts.lookupActiveCategories(); }
}
