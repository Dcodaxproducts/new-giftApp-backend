import { Injectable } from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class CustomerReferralsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findReferralSummaryForUser(userId: string) {
    return this.prisma.referral.findMany({ where: { referrerUserId: userId } });
  }

  findReferralHistoryForUser<T extends Prisma.ReferralFindManyArgs>(args: T): Promise<Prisma.ReferralGetPayload<T>[]> {
    return this.prisma.referral.findMany(args) as Promise<Prisma.ReferralGetPayload<T>[]>;
  }

  countReferralHistoryForUser(where: Prisma.ReferralWhereInput) {
    return this.prisma.referral.count({ where });
  }

  findReferrerByCode(code: string) {
    return this.prisma.user.findFirst({ where: { referralCode: code, role: UserRole.REGISTERED_USER, deletedAt: null, isActive: true } });
  }

  findReferralByReferredUserId(referredUserId: string) {
    return this.prisma.referral.findUnique({ where: { referredUserId } });
  }

  createReferral(data: Prisma.ReferralUncheckedCreateInput) {
    return this.prisma.referral.create({ data });
  }

  findReferralForReward(referredUserId: string) {
    return this.prisma.referral.findUnique({ where: { referredUserId }, include: { referred: { select: { firstName: true, lastName: true } } } });
  }

  updateReferralStatus(id: string, data: Prisma.ReferralUpdateInput) {
    return this.prisma.referral.update({ where: { id }, data });
  }

  findOrCreateReferralCode(userId: string) {
    return this.prisma.user.findUnique({ where: { id: userId } });
  }

  setReferralCode(userId: string, referralCode: string) {
    return this.prisma.user.update({ where: { id: userId }, data: { referralCode } });
  }

  findUserById(userId: string) {
    return this.prisma.user.findUnique({ where: { id: userId } });
  }

  createNotification(recipientId: string, title: string, message: string, type: string, metadataJson: Prisma.InputJsonObject) {
    return this.prisma.notification.create({ data: { recipientId, recipientType: 'REGISTERED_USER', title, message, type, metadataJson } });
  }
}
