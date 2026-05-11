import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NotificationRecipientType, Prisma, Referral, ReferralStatus, RewardLedgerSource, RewardLedgerType, User, UserRole } from '@prisma/client';
import { randomInt } from 'crypto';
import { AuthUserContext } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../database/prisma.service';
import { CustomerWalletService } from '../customer-wallet/customer-wallet.service';
import { ReferralSettingsService } from '../referral-settings/referral-settings.service';
import { ListReferralHistoryDto, ListRewardLedgerDto, RedeemRewardDto, ReferralHistoryStatus, RewardLedgerTypeFilter } from './dto/customer-referrals.dto';

type ReferralWithReferred = Referral & { referred: Pick<User, 'firstName' | 'lastName' | 'avatarUrl'> };

@Injectable()
export class CustomerReferralsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly customerWalletService: CustomerWalletService,
    private readonly referralSettingsService: ReferralSettingsService,
  ) {}

  async summary(user: AuthUserContext) {
    const [referrals, ledger] = await Promise.all([
      this.prisma.referral.findMany({ where: { referrerUserId: user.uid } }),
      this.prisma.rewardLedger.findMany({ where: { userId: user.uid } }),
    ]);
    const invitedFriends = referrals.length;
    const successfulStatuses: ReferralStatus[] = [ReferralStatus.QUALIFIED, ReferralStatus.REWARDED];
    const successfulReferrals = referrals.filter((item) => successfulStatuses.includes(item.status)).length;
    return {
      data: {
        invitedFriends,
        successfulReferrals,
        rewardsEarned: this.sumLedger(ledger, [RewardLedgerType.EARNED]),
        availableCredit: this.availableCredit(ledger),
        currency: ledger[0]?.currency ?? this.currency(),
        progress: {
          totalInvited: invitedFriends,
          joined: referrals.filter((item) => item.status !== ReferralStatus.PENDING).length,
          pending: referrals.filter((item) => item.status === ReferralStatus.PENDING).length,
        },
      },
      message: 'Referral summary fetched successfully.',
    };
  }

  async link(user: AuthUserContext) {
    const code = await this.getOrCreateReferralCode(user.uid);
    const baseUrl = this.shareBaseUrl();
    return {
      data: {
        referralCode: code,
        referralLink: `${baseUrl}/share/${code.toLowerCase()}`,
        shareTitle: 'Invite Friends, Earn Rewards',
        shareMessage: 'Join Gift App with my referral link and we both earn rewards after your first gift purchase.',
        rewardText: `Get ${this.formatReward()} credit after your friend's first gift purchase.`,
      },
      message: 'Referral link fetched successfully.',
    };
  }

  async history(user: AuthUserContext, query: ListReferralHistoryDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const where: Prisma.ReferralWhereInput = { referrerUserId: user.uid };
    if (query.status && query.status !== ReferralHistoryStatus.ALL) where.status = query.status;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.referral.findMany({ where, include: { referred: { select: { firstName: true, lastName: true, avatarUrl: true } } }, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      this.prisma.referral.count({ where }),
    ]);
    return { data: items.map((item) => this.toReferralHistoryItem(item)), meta: { page, limit, total, totalPages: Math.ceil(total / limit) }, message: 'Referral history fetched successfully.' };
  }

  async redeem(user: AuthUserContext, dto: RedeemRewardDto) {
    const balance = await this.rewardBalance(user.uid);
    const amount = this.money(dto.amount);
    if (amount > balance.availableCredit) throw new BadRequestException('Insufficient reward credit');
    const entry = await this.prisma.rewardLedger.create({ data: { userId: user.uid, type: RewardLedgerType.REDEEMED, amount: new Prisma.Decimal(amount), currency: balance.currency, source: RewardLedgerSource.REFERRAL, sourceId: `redeem:${user.uid}:${Date.now()}:${randomInt(1000, 9999)}`, description: `Reward redeemed to ${dto.redeemTo}.` } });
    await this.customerWalletService.creditRewardRedemption(user.uid, entry);
    await this.notify(user.uid, 'Reward redeemed', `${amount} ${balance.currency} reward credit was redeemed.`, 'REWARD_REDEEMED', { ledgerId: entry.id, redeemTo: dto.redeemTo });
    return { data: { redeemedAmount: amount, currency: balance.currency, walletBalance: amount }, message: 'Reward redeemed successfully.' };
  }

  async balance(user: AuthUserContext) {
    return { data: await this.rewardBalance(user.uid), message: 'Reward balance fetched successfully.' };
  }

  async ledger(user: AuthUserContext, query: ListRewardLedgerDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const where: Prisma.RewardLedgerWhereInput = { userId: user.uid };
    if (query.type && query.type !== RewardLedgerTypeFilter.ALL) where.type = query.type;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.rewardLedger.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      this.prisma.rewardLedger.count({ where }),
    ]);
    return { data: items.map((item) => ({ id: item.id, type: item.type, amount: Number(item.amount), currency: item.currency, source: item.source, description: item.description, createdAt: item.createdAt })), meta: { page, limit, total, totalPages: Math.ceil(total / limit) }, message: 'Reward ledger fetched successfully.' };
  }

  async terms() {
    const settings = await this.referralSettingsService.getActiveSettings();
    return { data: { title: 'Referral Terms', rewardAmount: Number(settings.referrerRewardAmount), currency: settings.rewardCurrency, qualificationRule: 'Reward is credited after your referred friend completes their first gift purchase.', terms: ['Referral rewards are available only for registered users.', "Reward is credited after the referred user's first successful purchase.", 'Cancelled or refunded orders may revoke reward eligibility.', 'Referral abuse may result in reward cancellation.'] }, message: 'Referral terms fetched successfully.' };
  }

  async assertValidReferralCode(referralCode?: string): Promise<void> {
    const code = this.normalizeCode(referralCode);
    if (!code) return;
    const referrer = await this.prisma.user.findFirst({ where: { referralCode: code, role: UserRole.REGISTERED_USER, deletedAt: null, isActive: true } });
    if (!referrer) throw new BadRequestException('Invalid referral code');
  }

  async captureSignupReferral(referredUserId: string, referralCode?: string): Promise<void> {
    const code = this.normalizeCode(referralCode);
    if (!code) return;
    const settings = await this.referralSettingsService.getActiveSettings();
    const referrer = await this.prisma.user.findFirst({ where: { referralCode: code, role: UserRole.REGISTERED_USER, deletedAt: null, isActive: true } });
    if (!referrer) throw new BadRequestException('Invalid referral code');
    if (!settings.allowSelfReferrals && referrer.id === referredUserId) throw new BadRequestException('Self-referral is not allowed');
    const existing = await this.prisma.referral.findUnique({ where: { referredUserId } });
    if (existing) return;
    const referral = await this.prisma.referral.create({ data: { referrerUserId: referrer.id, referredUserId, referralCode: referrer.referralCode ?? code, status: ReferralStatus.JOINED, rewardAmount: settings.referrerRewardAmount, currency: settings.rewardCurrency, referrerRewardAmountSnapshot: settings.referrerRewardAmount, newUserRewardAmountSnapshot: settings.newUserRewardAmount, rewardCurrencySnapshot: settings.rewardCurrency, minimumTransactionAmountSnapshot: settings.minimumTransactionAmount, expiresAt: this.referralSettingsService.expiresAt(settings), joinedAt: new Date() } });
    await this.notify(referrer.id, 'Referral joined', 'A friend joined Gift App using your referral link.', 'REFERRAL_JOINED', { referralId: referral.id, referredUserId });
  }

  async awardReferralForFirstEligiblePurchase(referredUserId: string, sourceId: string, transactionAmount = 0): Promise<void> {
    const referral = await this.prisma.referral.findUnique({ where: { referredUserId }, include: { referred: { select: { firstName: true, lastName: true } } } });
    if (!referral || referral.status === ReferralStatus.REWARDED || referral.status === ReferralStatus.EXPIRED) return;
    const settings = await this.referralSettingsService.getActiveSettings();
    if (!settings.isActive) return;
    if (referral.expiresAt && referral.expiresAt < new Date()) { await this.prisma.referral.update({ where: { id: referral.id }, data: { status: ReferralStatus.EXPIRED } }); return; }
    if (transactionAmount < Number(referral.minimumTransactionAmountSnapshot)) return;
    const existingReward = await this.prisma.rewardLedger.findFirst({ where: { userId: referral.referrerUserId, type: RewardLedgerType.EARNED, source: RewardLedgerSource.REFERRAL, sourceId: referral.id } });
    if (existingReward) return;
    const amount = Number(referral.referrerRewardAmountSnapshot || referral.rewardAmount);
    const newUserAmount = Number(referral.newUserRewardAmountSnapshot);
    const currency = referral.rewardCurrencySnapshot || referral.currency;
    const ledgers: Prisma.RewardLedgerCreateArgs[] = [
      { data: { userId: referral.referrerUserId, type: RewardLedgerType.EARNED, amount: new Prisma.Decimal(amount), currency, source: RewardLedgerSource.REFERRAL, sourceId: referral.id, description: `Reward earned from ${this.fullName(referral.referred)} referral.` } },
    ];
    if (newUserAmount > 0) ledgers.push({ data: { userId: referral.referredUserId, type: RewardLedgerType.EARNED, amount: new Prisma.Decimal(newUserAmount), currency, source: RewardLedgerSource.REFERRAL, sourceId: `${referral.id}:new-user`, description: 'New user referral reward earned.' } });
    await this.prisma.$transaction([
      this.prisma.referral.update({ where: { id: referral.id }, data: { status: ReferralStatus.REWARDED, qualifiedAt: referral.qualifiedAt ?? new Date(), rewardedAt: new Date(), rewardAmount: new Prisma.Decimal(amount), currency } }),
      ...ledgers.map((entry) => this.prisma.rewardLedger.create(entry)),
    ]);
    await this.notify(referral.referrerUserId, 'Referral reward earned', `You earned ${amount} ${currency} referral credit.`, 'REFERRAL_REWARD_EARNED', { referralId: referral.id, sourceId });
    if (newUserAmount > 0) await this.notify(referral.referredUserId, 'Referral reward earned', `You earned ${newUserAmount} ${currency} referral credit.`, 'REFERRAL_REWARD_EARNED', { referralId: referral.id, sourceId });
  }

  private async rewardBalance(userId: string) {
    const items = await this.prisma.rewardLedger.findMany({ where: { userId } });
    return { availableCredit: this.availableCredit(items), lifetimeEarned: this.sumLedger(items, [RewardLedgerType.EARNED]), lifetimeRedeemed: this.sumLedger(items, [RewardLedgerType.REDEEMED]), currency: this.currency() };
  }

  private async getOrCreateReferralCode(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== UserRole.REGISTERED_USER) throw new NotFoundException('Registered user not found');
    if (user.referralCode) return user.referralCode;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const code = this.candidateCode(user.firstName, user.lastName, attempt);
      try {
        const updated = await this.prisma.user.update({ where: { id: userId }, data: { referralCode: code } });
        return updated.referralCode ?? code;
      } catch (error) {
        if (!this.isUniqueError(error)) throw error;
      }
    }
    throw new ConflictException('Could not generate unique referral code');
  }

  private toReferralHistoryItem(item: ReferralWithReferred) {
    const referredUserName = this.fullName(item.referred);
    return { id: item.id, referredUserName, referredUserAvatarUrl: item.referred.avatarUrl, status: item.status, rewardAmount: Number(item.rewardAmount), currency: item.currency, joinedAt: item.joinedAt, rewardedAt: item.rewardedAt, displayText: `${referredUserName} Joined` };
  }

  private fullName(user: Pick<User, 'firstName' | 'lastName'>): string { return `${user.firstName} ${user.lastName}`.trim(); }
  private normalizeCode(code?: string): string | null { const value = code?.trim().toUpperCase(); return value ? value : null; }
  private candidateCode(firstName: string, lastName: string, attempt: number): string { const base = `${firstName}-${lastName.charAt(0)}`.replace(/[^A-Za-z0-9-]/g, '').toUpperCase(); return attempt === 0 ? base : `${base}-${randomInt(100, 999)}`; }
  private rewardAmount(): number { return Number(this.configService.get<string>('REFERRAL_REWARD_AMOUNT', '10')); }
  private currency(): string { return this.configService.get<string>('REFERRAL_REWARD_CURRENCY', this.configService.get<string>('STRIPE_CURRENCY', 'USD')).toUpperCase(); }
  private shareBaseUrl(): string { return this.configService.get<string>('REFERRAL_SHARE_BASE_URL', this.configService.get<string>('APP_FRONTEND_URL', 'https://giftapp.com')).replace(/\/$/, ''); }
  private formatReward(): string { return `${this.currency() === 'USD' ? '$' : ''}${this.rewardAmount()} ${this.currency() === 'USD' ? '' : this.currency()}`.trim(); }
  private sumLedger(items: { type: RewardLedgerType; amount: Prisma.Decimal }[], types: RewardLedgerType[]): number { return this.money(items.filter((item) => types.includes(item.type)).reduce((sum, item) => sum + Number(item.amount), 0)); }
  private availableCredit(items: { type: RewardLedgerType; amount: Prisma.Decimal }[]): number { return this.money(items.reduce((sum, item) => sum + (item.type === RewardLedgerType.EARNED || item.type === RewardLedgerType.ADJUSTED ? Number(item.amount) : -Number(item.amount)), 0)); }
  private money(value: number): number { return Number(value.toFixed(2)); }
  private isUniqueError(error: unknown): boolean { return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'; }
  private async notify(recipientId: string, title: string, message: string, type: string, metadata: Prisma.InputJsonObject): Promise<void> { await this.prisma.notification.create({ data: { recipientId, recipientType: NotificationRecipientType.REGISTERED_USER, title, message, type, metadataJson: metadata } }); }
}
