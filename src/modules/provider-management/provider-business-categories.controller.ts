import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ProviderBusinessCategoriesService } from './provider-business-categories.service';

@ApiTags('Provider Management')
@Controller('provider-business-categories')
export class ProviderBusinessCategoriesController {
  constructor(private readonly service: ProviderBusinessCategoriesService) {}

  @Get()
  list() {
    return this.service.list();
  }
}
