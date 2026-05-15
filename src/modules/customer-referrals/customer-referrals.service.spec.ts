import { readFileSync } from 'fs';
import { join } from 'path';

describe('Customer referrals and rewards source safety', () => {
  const serviceSource = readFileSync(join(__dirname, 'customer-referrals.service.ts'), 'utf8');
  const referralsRepositorySource = readFileSync(join(__dirname, 'customer-referrals.repository.ts'), 'utf8');
  const rewardsRepositorySource = readFileSync(join(__dirname, 'customer-rewards.repository.ts'), 'utf8');
  const controllerSource = readFileSync(join(__dirname, 'customer-referrals.controller.ts'), 'utf8');
  const authDtoSource = readFileSync(join(__dirname, '../auth/dto/auth.dto.ts'), 'utf8');
  const authServiceSource = readFileSync(join(__dirname, '../auth/auth.service.ts'), 'utf8');
  const paymentServiceSource = readFileSync(join(__dirname, '../payments/payments.service.ts'), 'utf8');
  const schemaSource = readFileSync(join(__dirname, '../../../prisma/schema.prisma'), 'utf8');

  it('exposes registered-user customer referral and reward APIs under one Swagger tag', () => {
    expect(controllerSource).toContain("@ApiTags('05 Customer - Referrals & Rewards')");
    expect(controllerSource).toContain('@Roles(UserRole.REGISTERED_USER)');
    expect(controllerSource).toContain("@Get('referrals/summary')");
    expect(controllerSource).toContain("@Get('referrals/link')");
    expect(controllerSource).toContain("@Get('referrals/history')");
    expect(controllerSource).toContain("@Post('referrals/redeem')");
    expect(controllerSource).toContain("@Get('rewards/balance')");
    expect(controllerSource).toContain("@Get('rewards/ledger')");
    expect(controllerSource).toContain("@Get('referrals/terms')");
  });

  it('uses unique referral codes and ledger-backed reward balances', () => {
    expect(schemaSource).toContain('referralCode                        String?');
    expect(schemaSource).toContain('@unique @map("referral_code")');
    expect(schemaSource).toContain('model Referral');
    expect(schemaSource).toContain('model RewardLedger');
    expect(serviceSource).toContain('availableCredit(items');
    expect(serviceSource).not.toContain('rewardBalance                         Decimal');
  });

  it('generates referral links without exposing internal user ids', () => {
    const linkSource = serviceSource.slice(serviceSource.indexOf('async link'), serviceSource.indexOf('async history'));
    expect(linkSource).toContain('getOrCreateReferralCode(user.uid)');
    expect(linkSource).toContain('/share/${code.toLowerCase()}');
    expect(linkSource).not.toContain('/share/${user.uid}');
  });


  it('repository owns Prisma access and referral link generation remains unchanged', () => {
    expect(serviceSource).toContain('referralsRepository.findReferralSummaryForUser');
    expect(serviceSource).toContain('rewardsRepository.createRewardRedemption');
    expect(serviceSource).toContain('referralsRepository.findOrCreateReferralCode');
    expect(referralsRepositorySource).toContain('prisma.referral.findMany');
    expect(referralsRepositorySource).toContain('prisma.user.update');
    expect(rewardsRepositorySource).toContain('prisma.rewardLedger.create');
    expect(rewardsRepositorySource).toContain('prisma.rewardLedger.findMany');
  });

  it('customer can fetch own referral summary and reward balance remains ledger-derived', () => {
    expect(serviceSource).toContain('summary(user: AuthUserContext)');
    expect(serviceSource).toContain('availableCredit(ledger)');
    expect(serviceSource).toContain('rewardBalance(user.uid)');
  });

  it('history is customer-scoped and redeem cannot exceed available balance', () => {
    expect(serviceSource).toContain('const where: Prisma.ReferralWhereInput = { referrerUserId: user.uid }');
    expect(serviceSource).toContain('if (amount > balance.availableCredit)');
  });

  it('signup accepts referralCode, blocks invalid codes, and records joined referrals only after registration', () => {
    expect(authDtoSource).toContain('referralCode?: string');
    expect(authServiceSource).toContain('assertValidReferralCode(dto.referralCode)');
    expect(authServiceSource).toContain('captureSignupReferral(user.id, dto.referralCode)');
    expect(serviceSource).toContain("throw new BadRequestException('Invalid referral code')");
    expect(serviceSource).toContain("throw new BadRequestException('Self-referral is not allowed')");
    expect(serviceSource).toContain('status: ReferralStatus.JOINED');
    expect(serviceSource).not.toContain('captureSignupReferral(user.id, dto.referralCode);\n    await this.customerReferralsService?.awardReferral');
  });

  it('successful first eligible payment triggers one referral reward and duplicate rewards are skipped', () => {
    expect(paymentServiceSource).toContain('awardReferralForFirstEligiblePurchase(user.uid, payment.id, Number(updated.amount))');
    expect(paymentServiceSource).toContain('awardReferralForFirstEligiblePurchase(updated.userId, updated.id, Number(updated.amount))');
    expect(serviceSource).toContain('referral.status === ReferralStatus.REWARDED');
    expect(serviceSource).toContain('existingReward');
    expect(serviceSource).toContain('type: RewardLedgerType.EARNED');
    expect(serviceSource).toContain('status: ReferralStatus.REWARDED');
  });

  it('customer history and ledger queries are scoped to the authenticated owner', () => {
    expect(serviceSource).toContain('const where: Prisma.ReferralWhereInput = { referrerUserId: user.uid }');
    expect(rewardsRepositorySource).toContain('findRewardLedgerForUser');
    expect(serviceSource).not.toContain('referrerUserId: query.userId');
  });

  it('redemption rejects overdraws and creates a REDEEMED ledger entry', () => {
    const redeemSource = serviceSource.slice(serviceSource.indexOf('async redeem'), serviceSource.indexOf('async balance'));
    expect(redeemSource).toContain('if (amount > balance.availableCredit)');
    expect(redeemSource).toContain('Insufficient reward credit');
    expect(redeemSource).toContain('type: RewardLedgerType.REDEEMED');
    expect(redeemSource).toContain('creditRewardRedemption(user.uid, entry)');
    expect(redeemSource).toContain('Reward redeemed');
  });
});
