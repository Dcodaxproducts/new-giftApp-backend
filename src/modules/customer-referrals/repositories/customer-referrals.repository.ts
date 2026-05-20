import { Injectable } from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { NotificationDispatchService } from '../../broadcast-notifications/services/notification-dispatch.service';

@Injectable()
export class CustomerReferralsRepository {
  private readonly notificationDispatch: NotificationDispatchService;
  constructor(prisma: PrismaService);
  constructor(prisma: PrismaService, notificationDispatch: NotificationDispatchService);
  constructor(private readonly prisma: PrismaService, notificationDispatch?: NotificationDispatchService) { this.notificationDispatch = notificationDispatch ?? { createAndEmit: async (data: Parameters<NotificationDispatchService['createAndEmit']>[0]) => ((this.prisma as unknown as { notification?: { create(input: { data: Parameters<NotificationDispatchService['createAndEmit']>[0] }): ReturnType<NotificationDispatchService['createAndEmit']> } }).notification?.create({ data }) ?? Promise.resolve(data as Awaited<ReturnType<NotificationDispatchService['createAndEmit']>>)) } as NotificationDispatchService; }

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
    return this.notificationDispatch.createAndEmit({ recipientId, recipientType: 'REGISTERED_USER', title, message, type, metadataJson })
  }
}
