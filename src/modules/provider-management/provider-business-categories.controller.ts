import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ListProviderBusinessCategoriesDto } from './dto/provider-business-categories.dto';
import { ProviderBusinessCategoriesService } from './provider-business-categories.service';

@ApiTags('Provider Management')
@Controller('provider-business-categories')
export class ProviderBusinessCategoriesController {
  constructor(private readonly service: ProviderBusinessCategoriesService) {}

  @Get()
  list(@Query() query: ListProviderBusinessCategoriesDto) {
    return this.service.list(query);
  }
}
