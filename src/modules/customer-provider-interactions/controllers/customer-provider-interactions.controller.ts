import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthUserContext, CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { CustomerProviderInteractionsService } from '../services/customer-provider-interactions.service';
import { CreateProviderReportDto, CreateReviewDto, ListCustomerReviewsDto, ListProviderReportsDto, UpdateReviewDto } from '../dto/customer-provider-interactions.dto';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.REGISTERED_USER)
@Controller('customer')
export class CustomerProviderInteractionsController {
  constructor(private readonly interactions: CustomerProviderInteractionsService) {}

  @Post('orders/:id/reviews')
  @ApiTags('05 Customer - Reviews')
  @ApiOperation({ summary: 'Submit provider review for an order', description: 'REGISTERED_USER only. Uses shared Review records consumed by provider reviews and admin review management.' })
  @ApiResponse({ status: 201, schema: { example: { success: true, data: { id: 'review_id', rating: 5, comment: 'Great service and fast delivery.', status: 'PUBLISHED', providerId: 'provider_id', orderId: 'order_id', createdAt: '2026-05-11T10:00:00.000Z' }, message: 'Review submitted successfully.' } } })
  submitReview(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Body() dto: CreateReviewDto) { return this.interactions.submitReview(user, id, dto); }

  @Get('reviews')
  @ApiTags('05 Customer - Reviews')
  @ApiOperation({ summary: 'List own provider reviews', description: 'REGISTERED_USER only. Customer sees only their own non-deleted reviews.' })
  reviews(@CurrentUser() user: AuthUserContext, @Query() query: ListCustomerReviewsDto) { return this.interactions.reviews(user, query); }

  @Get('reviews/:id')
  @ApiTags('05 Customer - Reviews')
  reviewDetails(@CurrentUser() user: AuthUserContext, @Param('id') id: string) { return this.interactions.reviewDetails(user, id); }

  @Patch('reviews/:id')
  @ApiTags('05 Customer - Reviews')
  @ApiOperation({ summary: 'Update own review', description: 'REGISTERED_USER only. Cannot update deleted/removed reviews; updated content is re-run through deterministic moderation.' })
  updateReview(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Body() dto: UpdateReviewDto) { return this.interactions.updateReview(user, id, dto); }

  @Delete('reviews/:id')
  @ApiTags('05 Customer - Reviews')
  @ApiOperation({ summary: 'Delete own review', description: 'REGISTERED_USER only. Permanently deletes the customer review record.' })
  deleteReview(@CurrentUser() user: AuthUserContext, @Param('id') id: string) { return this.interactions.deleteReview(user, id); }

  @Get('provider-report-reasons')
  @ApiTags('05 Customer - Provider Reports')
  @ApiOperation({ summary: 'Fetch provider report reasons', description: 'REGISTERED_USER only. Declared before /customer/provider-reports/:id.' })
  providerReportReasons() { return this.interactions.providerReportReasons(); }

  @Post('providers/:providerId/reports')
  @ApiTags('05 Customer - Provider Reports')
  @ApiOperation({ summary: 'Report provider', description: 'REGISTERED_USER only. Customer must have an order, chat, or review relationship with provider. Duplicate active provider/order/reason reports are blocked.' })
  reportProvider(@CurrentUser() user: AuthUserContext, @Param('providerId') providerId: string, @Body() dto: CreateProviderReportDto) { return this.interactions.reportProvider(user, providerId, dto); }

  @Get('provider-reports')
  @ApiTags('05 Customer - Provider Reports')
  providerReports(@CurrentUser() user: AuthUserContext, @Query() query: ListProviderReportsDto) { return this.interactions.providerReports(user, query); }

  @Get('provider-reports/:id')
  @ApiTags('05 Customer - Provider Reports')
  providerReportDetails(@CurrentUser() user: AuthUserContext, @Param('id') id: string) { return this.interactions.providerReportDetails(user, id); }
}
