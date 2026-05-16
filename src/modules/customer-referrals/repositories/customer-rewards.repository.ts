import { Injectable } from '@nestjs/common';
import { Prisma, RewardLedgerType } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class CustomerRewardsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findRewardLedgerForUser(userId: string) {
    return this.prisma.rewardLedger.findMany({ where: { userId } });
  }

  findRewardLedgerPageForUser(args: Prisma.RewardLedgerFindManyArgs) {
    return this.prisma.rewardLedger.findMany(args);
  }

  countRewardLedgerForUser(where: Prisma.RewardLedgerWhereInput) {
    return this.prisma.rewardLedger.count({ where });
  }

  sumRewardBalanceForUser(userId: string) {
    return this.prisma.rewardLedger.findMany({ where: { userId } });
  }

  createRewardRedemption(data: Prisma.RewardLedgerUncheckedCreateInput) {
    return this.prisma.rewardLedger.create({ data });
  }

  findExistingReferralReward(userId: string, sourceId: string) {
    return this.prisma.rewardLedger.findFirst({ where: { userId, type: RewardLedgerType.EARNED, source: 'REFERRAL', sourceId } });
  }

  createReferralRewardEntries(referralUpdate: Prisma.ReferralUpdateArgs, ledgers: Prisma.RewardLedgerCreateArgs[]) {
    return this.prisma.$transaction([
      this.prisma.referral.update(referralUpdate),
      ...ledgers.map((entry) => this.prisma.rewardLedger.create(entry)),
    ]);
  }
}
