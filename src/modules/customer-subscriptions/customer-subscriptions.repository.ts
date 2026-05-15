import { Injectable } from '@nestjs/common';
import { CustomerSubscriptionStatus, Prisma, SubscriptionPlanStatus, SubscriptionPlanVisibility } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

export const CUSTOMER_SUBSCRIPTION_WITH_PLAN = Prisma.validator<Prisma.CustomerSubscriptionInclude>()({ plan: true });

@Injectable()
export class CustomerSubscriptionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findPublicActivePlans() {
    return this.prisma.subscriptionPlan.findMany({ where: { status: SubscriptionPlanStatus.ACTIVE, visibility: SubscriptionPlanVisibility.PUBLIC, deletedAt: null }, orderBy: [{ isPopular: 'desc' }, { monthlyPrice: 'asc' }] });
  }

  findCurrentSubscriptionForUser(userId: string) {
    return this.prisma.customerSubscription.findFirst({ where: { userId }, include: CUSTOMER_SUBSCRIPTION_WITH_PLAN, orderBy: { createdAt: 'desc' } });
  }

  findActiveSubscriptionForUser(userId: string) {
    return this.prisma.customerSubscription.findFirst({ where: { userId, status: { in: [CustomerSubscriptionStatus.ACTIVE, CustomerSubscriptionStatus.TRIALING, CustomerSubscriptionStatus.INCOMPLETE] } }, include: CUSTOMER_SUBSCRIPTION_WITH_PLAN, orderBy: { createdAt: 'desc' } });
  }

  findCurrentActionSubscriptionForUser(userId: string) {
    return this.prisma.customerSubscription.findFirst({ where: { userId, status: { in: [CustomerSubscriptionStatus.ACTIVE, CustomerSubscriptionStatus.TRIALING, CustomerSubscriptionStatus.PAST_DUE] } }, orderBy: { createdAt: 'desc' } });
  }

  findSubscriptionForUser(userId: string, id: string) {
    return this.prisma.customerSubscription.findFirst({ where: { id, userId } });
  }

  createCustomerSubscription(data: Prisma.CustomerSubscriptionUncheckedCreateInput) {
    return this.prisma.customerSubscription.create({ data });
  }

  updateCustomerSubscriptionStatus(id: string, data: Prisma.CustomerSubscriptionUpdateArgs['data']) {
    return this.prisma.customerSubscription.update({ where: { id }, data });
  }

  markSubscriptionCancelled(id: string, data: Prisma.CustomerSubscriptionUpdateArgs['data']) {
    return this.prisma.customerSubscription.update({ where: { id }, data });
  }

  reactivateSubscription(id: string) {
    return this.prisma.customerSubscription.update({ where: { id }, data: { cancelAtPeriodEnd: false, status: CustomerSubscriptionStatus.ACTIVE, isPremium: true, cancelledAt: null } });
  }

  findSubscriptionWithStripeCustomer(userId: string) {
    return this.prisma.customerSubscription.findFirst({ where: { userId, stripeCustomerId: { not: null } } });
  }

  findUserByIdOrThrow(id: string) {
    return this.prisma.user.findUniqueOrThrow({ where: { id } });
  }

  updatePlanStripeIds(id: string, data: Prisma.SubscriptionPlanUpdateArgs['data']) {
    return this.prisma.subscriptionPlan.update({ where: { id }, data });
  }

  findCouponByCode(code: string) {
    return this.prisma.coupon.findFirst({ where: { code: code.trim().toUpperCase(), isActive: true, deletedAt: null, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] } });
  }

  findSubscriptionInvoicesForUser(where: Prisma.CustomerSubscriptionInvoiceWhereInput, params: { skip: number; take: number }) {
    return this.prisma.customerSubscriptionInvoice.findMany({ where, orderBy: { createdAt: 'desc' }, skip: params.skip, take: params.take });
  }

  countSubscriptionInvoicesForUser(where: Prisma.CustomerSubscriptionInvoiceWhereInput) {
    return this.prisma.customerSubscriptionInvoice.count({ where });
  }

  findSubscriptionInvoicesAndCountForUser(where: Prisma.CustomerSubscriptionInvoiceWhereInput, params: { skip: number; take: number }) {
    return this.prisma.$transaction([
      this.prisma.customerSubscriptionInvoice.findMany({ where, orderBy: { createdAt: 'desc' }, skip: params.skip, take: params.take }),
      this.prisma.customerSubscriptionInvoice.count({ where }),
    ]);
  }

  findSubscriptionInvoiceForUser(userId: string, id: string) {
    return this.prisma.customerSubscriptionInvoice.findFirst({ where: { id, userId } });
  }

  findPlanById(id: string) {
    return this.prisma.subscriptionPlan.findFirst({ where: { id, status: SubscriptionPlanStatus.ACTIVE, visibility: SubscriptionPlanVisibility.PUBLIC, deletedAt: null } });
  }
}
