import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  findActiveUserById(userId: string) {
    return this.prisma.user.findUnique({ where: { id: userId } });
  }

  updateOwnProfile(userId: string, params: { firstName?: string; lastName?: string; phone?: string; avatarUrl?: string }) {
    return this.prisma.user.update({ where: { id: userId }, data: params });
  }

  deleteAccountCascade(userId: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.authSession.deleteMany({ where: { userId } });
      await tx.notification.deleteMany({ where: { recipientId: userId } });
      await tx.notificationDeviceToken.deleteMany({ where: { userId } });
      await tx.uploadedFile.deleteMany({ where: { ownerId: userId } });
      await tx.accountSuspension.deleteMany({ where: { accountId: userId } });
      await tx.loginAttempt.updateMany({ where: { userId }, data: { userId: null } });
      await tx.customerWishlist.deleteMany({ where: { userId } });
      await tx.cartItem.deleteMany({ where: { cart: { userId } } });
      await tx.cart.deleteMany({ where: { userId } });
      await tx.customerEventReminderJob.deleteMany({ where: { userId } });
      await tx.customerEvent.deleteMany({ where: { userId } });
      await tx.customerReminder.deleteMany({ where: { userId } });
      await tx.customerBankAccount.deleteMany({ where: { userId } });
      await tx.customerPaymentMethod.deleteMany({ where: { userId } });
      await tx.customerWalletLedger.deleteMany({ where: { userId } });
      await tx.customerWallet.deleteMany({ where: { userId } });
      await tx.rewardLedger.deleteMany({ where: { userId } });
      await tx.referral.deleteMany({ where: { OR: [{ referrerUserId: userId }, { referredUserId: userId }] } });
      await tx.customerRecurringPaymentOccurrence.deleteMany({ where: { userId } });
      await tx.customerRecurringPayment.deleteMany({ where: { userId } });
      await tx.customerContact.deleteMany({ where: { userId } });
      await tx.user.delete({ where: { id: userId } });
    });
  }

  findUserForDeletionCancel(userId: string) {
    return this.prisma.user.findUnique({ where: { id: userId } });
  }

  cancelDeletion(userId: string) {
    return this.prisma.user.update({ where: { id: userId }, data: { isActive: true, deletedAt: null, deleteAfter: null } });
  }
}
