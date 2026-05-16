import { CustomerSubscriptionStatus, Prisma, UserRole } from '@prisma/client';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  findActiveUserById(userId: string) {
    return this.prisma.user.findUnique({ where: { id: userId } });
  }

  findUserByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email }, include: { adminRole: true } });
  }

  findUserById(userId: string) {
    return this.prisma.user.findUnique({ where: { id: userId } });
  }

  updateLastLoginAt(userId: string) {
    return this.prisma.user.update({ where: { id: userId }, data: { lastLoginAt: new Date() } });
  }

  clearRefreshTokenHash(userId: string) {
    return this.prisma.user.update({ where: { id: userId }, data: { refreshTokenHash: null } });
  }

  findProviderBusinessCategory(categoryId: string) {
    return this.prisma.providerBusinessCategory.findUnique({ where: { id: categoryId } });
  }

  findExistingUserByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  createAuthUser(data: Prisma.UserUncheckedCreateInput) {
    return this.prisma.user.create({ data });
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

  findCustomerSubscriptionSummary(userId: string) {
    return this.prisma.customerSubscription.findFirst({
      where: { userId, status: { in: [CustomerSubscriptionStatus.ACTIVE, CustomerSubscriptionStatus.TRIALING, CustomerSubscriptionStatus.PAST_DUE, CustomerSubscriptionStatus.INCOMPLETE] } },
      include: { plan: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  updateCanonicalSuperAdmin(id: string, data: Prisma.UserUncheckedUpdateInput) {
    return this.prisma.user.update({ where: { id }, data });
  }

  demoteOtherSuperAdmins(canonicalSuperAdminId: string) {
    return this.prisma.user.updateMany({
      where: { role: UserRole.SUPER_ADMIN, id: { not: canonicalSuperAdminId } },
      data: { role: UserRole.ADMIN, isApproved: false, isActive: false, adminPermissions: Prisma.JsonNull, refreshTokenHash: null },
    });
  }

  upsertSystemRole(params: { name: string; slug: string; description: string; permissions: Prisma.InputJsonValue }) {
    return this.prisma.adminRole.upsert({
      where: { slug: params.slug },
      create: { name: params.name, slug: params.slug, description: params.description, permissions: params.permissions, isSystem: true, isActive: true },
      update: { name: params.name, description: params.description, permissions: params.permissions, isSystem: true, isActive: true, deletedAt: null },
    });
  }
}
