import { Body, Controller, Delete, Get, Param, Patch, Post, Query, StreamableFile, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthUserContext, CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { AdminPromotionalOfferActionDto, CreateAdminOfferDto, ListPromotionalOffersDto, UpdatePromotionalOfferDto } from '../dto/promotional-offers.dto';
import { PromotionalOffersService } from '../services/promotional-offers.service';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
@Controller('promotional-offers')
export class PromotionalOffersManagementController {
  constructor(private readonly service: PromotionalOffersService) {}

  @Get('stats') @ApiTags('02 Admin - Promotional Offers Management') @Permissions('promotionalOffers.read') stats() { return this.service.stats(); }
  @Get('export') @ApiTags('02 Admin - Promotional Offers Management') @Permissions('promotionalOffers.export') async export(@CurrentUser() user: AuthUserContext, @Query() query: ListPromotionalOffersDto): Promise<StreamableFile> { const file = await this.service.export(user, query); return new StreamableFile(Buffer.from(file.content), { disposition: `attachment; filename="${file.filename}"`, type: file.contentType }); }
  @Get() @ApiTags('02 Admin - Promotional Offers Management') @Permissions('promotionalOffers.read') @ApiOperation({ summary: 'List promotional offers', description: 'By default returns all non-deleted promotional offers. Use status to filter ACTIVE, INACTIVE, SCHEDULED, EXPIRED, PENDING, or REJECTED offers.' }) list(@Query() query: ListPromotionalOffersDto) { return this.service.listAdmin(query); }
  @Post() @ApiTags('02 Admin - Promotional Offers Management') @Permissions('promotionalOffers.create') create(@CurrentUser() user: AuthUserContext, @Body() dto: CreateAdminOfferDto) { return this.service.createAdmin(user, dto); }
  @Get(':id') @ApiTags('02 Admin - Promotional Offers Management') @Permissions('promotionalOffers.read') details(@Param('id') id: string) { return this.service.adminDetails(id); }
  @Patch(':id') @ApiTags('02 Admin - Promotional Offers Management') @Permissions('promotionalOffers.update') update(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Body() dto: UpdatePromotionalOfferDto) { return this.service.updateAdmin(user, id, dto); }
  @Post(':id/action') @ApiTags('02 Admin - Promotional Offers Management')
  @ApiOperation({ summary: 'Run promotional offer admin action', description: "SUPER_ADMIN or ADMIN with action-specific promotional offer permission. APPROVE requires 'promotionalOffers.approve'; REJECT requires 'promotionalOffers.reject'; ACTIVATE and DEACTIVATE require 'promotionalOffers.status.update'." })
  @ApiBody({ type: AdminPromotionalOfferActionDto, examples: { approve: { value: { action: 'APPROVE', comment: 'Offer meets campaign rules.', notifyProvider: true } }, reject: { value: { action: 'REJECT', reason: 'INVALID_DISCOUNT', comment: 'Discount exceeds allowed campaign threshold.', notifyProvider: true } }, activate: { value: { action: 'ACTIVATE', comment: 'Offer is ready for publication.', notifyProvider: true } }, deactivate: { value: { action: 'DEACTIVATE', reason: 'OTHER', comment: 'Offer paused by admin.', notifyProvider: true } } } })
  @ApiResponse({ status: 200, description: 'Promotional offer action completed successfully', schema: { example: { success: true, data: { id: 'offer_id', approvalStatus: 'APPROVED', status: 'ACTIVE', isActive: true }, message: 'Promotional offer approved successfully' } } })
  action(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Body() dto: AdminPromotionalOfferActionDto) { return this.service.action(user, id, dto); }
  @Delete(':id') @ApiTags('02 Admin - Promotional Offers Management') @Permissions('promotionalOffers.delete') delete(@CurrentUser() user: AuthUserContext, @Param('id') id: string) { return this.service.deleteAdmin(user, id); }
}
