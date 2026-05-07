import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
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
  create(@CurrentUser() user: AuthUserContext, @Body() dto: CreateProviderInventoryItemDto) {
    return this.service.create(user, dto);
  }

  @Get(':id')
  details(@CurrentUser() user: AuthUserContext, @Param('id') id: string) {
    return this.service.details(user, id);
  }

  @Patch(':id')
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
