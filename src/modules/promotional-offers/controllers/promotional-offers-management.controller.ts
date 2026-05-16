import { Body, Controller, Delete, Get, Param, Patch, Post, Query, StreamableFile, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthUserContext, CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { ApproveOfferDto, CreateAdminOfferDto, ListPromotionalOffersDto, RejectOfferDto, UpdateOfferStatusDto, UpdatePromotionalOfferDto } from '../dto/promotional-offers.dto';
import { PromotionalOffersService } from '../services/promotional-offers.service';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
@Controller('promotional-offers')
export class PromotionalOffersManagementController {
  constructor(private readonly service: PromotionalOffersService) {}

  @Get('stats') @ApiTags('02 Admin - Promotional Offers Management') @Permissions('promotionalOffers.read') stats() { return this.service.stats(); }
  @Get('export') @ApiTags('02 Admin - Promotional Offers Management') @Permissions('promotionalOffers.export') async export(@CurrentUser() user: AuthUserContext, @Query() query: ListPromotionalOffersDto): Promise<StreamableFile> { const file = await this.service.export(user, query); return new StreamableFile(Buffer.from(file.content), { disposition: `attachment; filename="${file.filename}"`, type: file.contentType }); }
  @Get() @ApiTags('02 Admin - Promotional Offers Management') @Permissions('promotionalOffers.read') list(@Query() query: ListPromotionalOffersDto) { return this.service.listAdmin(query); }
  @Post() @ApiTags('02 Admin - Promotional Offers Management') @Permissions('promotionalOffers.create') create(@CurrentUser() user: AuthUserContext, @Body() dto: CreateAdminOfferDto) { return this.service.createAdmin(user, dto); }
  @Get(':id') @ApiTags('02 Admin - Promotional Offers Management') @Permissions('promotionalOffers.read') details(@Param('id') id: string) { return this.service.adminDetails(id); }
  @Patch(':id') @ApiTags('02 Admin - Promotional Offers Management') @Permissions('promotionalOffers.update') update(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Body() dto: UpdatePromotionalOfferDto) { return this.service.updateAdmin(user, id, dto); }
  @Patch(':id/approve') @ApiTags('02 Admin - Promotional Offers Management') @Permissions('promotionalOffers.approve') approve(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Body() dto: ApproveOfferDto) { return this.service.approve(user, id, dto); }
  @Patch(':id/reject') @ApiTags('02 Admin - Promotional Offers Management') @Permissions('promotionalOffers.reject') reject(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Body() dto: RejectOfferDto) { return this.service.reject(user, id, dto); }
  @Patch(':id/status') @ApiTags('02 Admin - Promotional Offers Management') @Permissions('promotionalOffers.status.update') status(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Body() dto: UpdateOfferStatusDto) { return this.service.updateAdminStatus(user, id, dto); }
  @Delete(':id') @ApiTags('02 Admin - Promotional Offers Management') @Permissions('promotionalOffers.delete') delete(@CurrentUser() user: AuthUserContext, @Param('id') id: string) { return this.service.deleteAdmin(user, id); }
}
