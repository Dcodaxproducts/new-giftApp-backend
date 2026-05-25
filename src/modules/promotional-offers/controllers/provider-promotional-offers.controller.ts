import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthUserContext, CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { CreateProviderOfferDto, ListProviderOffersDto, UpdatePromotionalOfferDto } from '../dto/promotional-offers.dto';
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
  @Patch(':id')
  @ApiOperation({ summary: 'Update own provider promotional offer', description: 'PROVIDER only. Updates are scoped to the authenticated provider offer. Standard offer fields preserve current update behavior; status or isActive changes are handled through this same PATCH endpoint.' })
  @ApiBody({ type: UpdatePromotionalOfferDto, examples: { updateOffer: { value: { title: 'Weekend Discount', description: 'Weekend-only campaign.', discountType: 'PERCENTAGE', discountValue: 20, startDate: '2026-06-01T00:00:00.000Z', endDate: '2026-06-03T23:59:59.000Z' } }, activateOffer: { value: { title: 'Weekend Discount', isActive: true, status: 'ACTIVE', reason: 'Provider reactivated offer.' } }, deactivateOffer: { value: { isActive: false, status: 'INACTIVE', reason: 'Provider paused offer.' } } } })
  @ApiResponse({ status: 200, description: 'Promotional offer updated successfully', schema: { example: { success: true, data: { id: 'offer_id', title: 'Weekend Discount', isActive: true, status: 'ACTIVE', approvalStatus: 'APPROVED' }, message: 'Promotional offer updated successfully' } } })
  update(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Body() dto: UpdatePromotionalOfferDto) { return this.service.updateProvider(user, id, dto); }
  @Delete(':id') delete(@CurrentUser() user: AuthUserContext, @Param('id') id: string) { return this.service.deleteProvider(user, id); }
}
