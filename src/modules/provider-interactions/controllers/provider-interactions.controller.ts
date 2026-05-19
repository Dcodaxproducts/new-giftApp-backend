import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthUserContext, CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { ListProviderReviewsDto, ReviewResponseDto } from '../dto/provider-interactions.dto';
import { ProviderInteractionsService } from '../services/provider-interactions.service';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.PROVIDER)
@Controller('provider')
export class ProviderInteractionsController {
  constructor(private readonly interactions: ProviderInteractionsService) {}

  @Get('reviews/summary')
  @ApiTags('03 Provider - Reviews')
  @ApiOperation({ summary: 'Fetch provider rating summary', description: 'PROVIDER only. Uses shared Review records visible to provider/customer/admin modules.' })
  @ApiResponse({ status: 200, schema: { example: { success: true, data: { averageRating: 4.8, reviewCount: 128, distribution: { '5': 80, '4': 12, '3': 5, '2': 2, '1': 1 } }, message: 'Review summary fetched successfully.' } } })
  reviewSummary(@CurrentUser() user: AuthUserContext) { return this.interactions.reviewSummary(user); }

  @Get('reviews/filter-options')
  @ApiTags('03 Provider - Reviews')
  @ApiOperation({ summary: 'Fetch provider review filter options', description: 'PROVIDER only. Declared before /provider/reviews/:id.' })
  filterOptions() { return this.interactions.filterOptions(); }

  @Get('reviews')
  @ApiTags('03 Provider - Reviews')
  @ApiOperation({ summary: 'List provider reviews', description: 'PROVIDER only. Shows only reviews for own provider account/orders and excludes hidden/removed reviews.' })
  reviews(@CurrentUser() user: AuthUserContext, @Query() query: ListProviderReviewsDto) { return this.interactions.reviews(user, query); }

  @Get('reviews/:id')
  @ApiTags('03 Provider - Reviews')
  reviewDetails(@CurrentUser() user: AuthUserContext, @Param('id') id: string) { return this.interactions.reviewDetails(user, id); }

  @Post('reviews/:id/response')
  @ApiTags('03 Provider - Reviews')
  @ApiOperation({ summary: 'Post public review response', description: 'PROVIDER only. Provider can respond only to own review. Only one active public response per review.' })
  createResponse(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Body() dto: ReviewResponseDto) { return this.interactions.createResponse(user, id, dto); }

  @Patch('reviews/:id/response')
  @ApiTags('03 Provider - Reviews')
  @ApiOperation({ summary: 'Update public review response', description: 'PROVIDER only. Updates only provider’s own active response; customer review content is never modified.' })
  updateResponse(@CurrentUser() user: AuthUserContext, @Param('id') id: string, @Body() dto: ReviewResponseDto) { return this.interactions.updateResponse(user, id, dto); }

  @Delete('reviews/:id/response')
  @ApiTags('03 Provider - Reviews')
  @ApiOperation({ summary: 'Delete public review response', description: "PROVIDER only. Deletes only the provider's own response and does not delete the original customer review." })
  deleteResponse(@CurrentUser() user: AuthUserContext, @Param('id') id: string) { return this.interactions.deleteResponse(user, id); }
}
