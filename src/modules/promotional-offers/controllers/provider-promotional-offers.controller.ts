import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthUserContext, CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { CreateProviderOfferDto, ListProviderOffersDto, UpdateOfferStatusDto, UpdatePromotionalOfferDto } from '../dto/promotional-offers.dto';
import { PromotionalOffersService } from '../services/promotional-offers.service';

@ApiTags('03 Provider - Promotional Offers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.PROVIDER)
@Controller('provider/offers')
export class ProviderPromotionalOffersController {
  constructor(private readonly service: PromotionalOffersService) {}

  @Get() list(@CurrentUser() user: AuthUserContext, @Query() query: ListProviderOffersDto) { return this.service.listProvider(user, query); }
  @Post() create(@CurrentUser() user: AuthUserContext, @Body() dto: CreateProviderOfferDto) { return this.service.createProvider(user, dto); }
  @Get(':id') details(@CurrentUser() user: AuthUserContext, @Param('id') id: string) { return this.service.providerDetails(user, id); }
  @Patch(':id') update(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Body() dto: UpdatePromotionalOfferDto) { return this.service.updateProvider(user, id, dto); }
  @Patch(':id/status') status(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Body() dto: UpdateOfferStatusDto) { return this.service.updateProviderStatus(user, id, dto); }
  @Delete(':id') delete(@CurrentUser() user: AuthUserContext, @Param('id') id: string) { return this.service.deleteProvider(user, id); }
}
