import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthUserContext, CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { CustomerReferralsService } from '../services/customer-referrals.service';
import { ListReferralHistoryDto, ListRewardLedgerDto, RedeemRewardDto, ReferralHistoryStatus, RewardLedgerTypeFilter } from '../dto/customer-referrals.dto';

@ApiTags('05 Customer - Referrals & Rewards')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.REGISTERED_USER)
@Controller('customer')
export class CustomerReferralsController {
  constructor(private readonly referrals: CustomerReferralsService) {}

  @Get('referrals/summary')
  @ApiOperation({ summary: 'Fetch own referral reward summary', description: 'REGISTERED_USER only. Customers can view only their own referral progress and ledger-derived balances.' })
  @ApiResponse({ status: 200, schema: { example: { success: true, data: { invitedFriends: 3, successfulReferrals: 2, rewardsEarned: 20, availableCredit: 20, currency: 'USD', progress: { totalInvited: 3, joined: 2, pending: 1 } }, message: 'Referral summary fetched successfully.' } } })
  summary(@CurrentUser() user: AuthUserContext) { return this.referrals.summary(user); }

  @Get('referrals/link')
  @ApiOperation({ summary: 'Fetch own referral link', description: 'Generates a unique customer referral code when missing. The link never exposes internal user IDs.' })
  @ApiResponse({ status: 200, schema: { example: { success: true, data: { referralCode: 'SARAH-M', referralLink: 'https://giftapp.com/share/sarah-m', shareTitle: 'Invite Friends, Earn Rewards', shareMessage: 'Join Gift App with my referral link and we both earn rewards after your first gift purchase.', rewardText: "Get $10 credit after your friend's first gift purchase." }, message: 'Referral link fetched successfully.' } } })
  link(@CurrentUser() user: AuthUserContext) { return this.referrals.link(user); }

  @Get('referrals/history')
  @ApiOperation({ summary: 'List own referral history', description: 'REGISTERED_USER only. History is scoped to referrals created by the logged-in customer.' })
  @ApiQuery({ name: 'status', enum: ReferralHistoryStatus, required: false })
  history(@CurrentUser() user: AuthUserContext, @Query() query: ListReferralHistoryDto) { return this.referrals.history(user, query); }

  @Post('referrals/redeem')
  @ApiOperation({ summary: 'Redeem own available reward credit', description: 'Creates a REDEEMED reward ledger entry. Redemption cannot exceed ledger-derived available credit.' })
  @ApiResponse({ status: 201, schema: { example: { success: true, data: { redeemedAmount: 20, currency: 'USD', walletBalance: 20 }, message: 'Reward redeemed successfully.' } } })
  redeem(@CurrentUser() user: AuthUserContext, @Body() dto: RedeemRewardDto) { return this.referrals.redeem(user, dto); }

  @Get('rewards/balance')
  @ApiOperation({ summary: 'Fetch own reward balance', description: 'Balance is calculated from RewardLedger entries, not a mutable user balance field.' })
  @ApiResponse({ status: 200, schema: { example: { success: true, data: { availableCredit: 20, lifetimeEarned: 20, lifetimeRedeemed: 0, currency: 'USD' }, message: 'Reward balance fetched successfully.' } } })
  balance(@CurrentUser() user: AuthUserContext) { return this.referrals.balance(user); }

  @Get('rewards/ledger')
  @ApiOperation({ summary: 'List own reward ledger', description: 'REGISTERED_USER only. Returns ledger entries owned by the logged-in customer.' })
  @ApiQuery({ name: 'type', enum: RewardLedgerTypeFilter, required: false })
  ledger(@CurrentUser() user: AuthUserContext, @Query() query: ListRewardLedgerDto) { return this.referrals.ledger(user, query); }

  @Get('referrals/terms')
  @ApiOperation({ summary: 'Fetch referral terms', description: 'Returns config/env based customer referral terms for the mobile app.' })
  @ApiResponse({ status: 200, schema: { example: { success: true, data: { title: 'Referral Terms', rewardAmount: 10, currency: 'USD', qualificationRule: 'Reward is credited after your referred friend completes their first gift purchase.', terms: ['Referral rewards are available only for registered users.', "Reward is credited after the referred user's first successful purchase.", 'Cancelled or refunded orders may revoke reward eligibility.', 'Referral abuse may result in reward cancellation.'] }, message: 'Referral terms fetched successfully.' } } })
  terms() { return this.referrals.terms(); }
}
