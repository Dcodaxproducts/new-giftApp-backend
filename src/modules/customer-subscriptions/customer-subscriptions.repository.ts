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
