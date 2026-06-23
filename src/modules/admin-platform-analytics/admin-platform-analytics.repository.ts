import { Injectable } from '@nestjs/common';
import { CustomerSubscriptionStatus, PaymentStatus, Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

export const PLATFORM_ANALYTICS_PAYMENT_INCLUDE = Prisma.validator<Prisma.PaymentInclude>()({
  user: { select: { id: true, email: true, firstName: true, lastName: true } },
  order: {
    include: {
      items: { include: { gift: { select: { id: true, name: true, categoryId: true, category: { select: { id: true, name: true } } } } } },
      providerOrders: { include: { provider: { select: { id: true, providerBusinessName: true, firstName: true, lastName: true } } } },
    },
  },
  customerSubscription: { include: { plan: { select: { id: true, name: true } } } },
  refundRequests: { select: { approvedAmount: true, requestedAmount: true, status: true } },
});

export type PlatformAnalyticsPayment = Prisma.PaymentGetPayload<{ include: typeof PLATFORM_ANALYTICS_PAYMENT_INCLUDE }>;

@Injectable()
export class AdminPlatformAnalyticsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findPayments(params: { where: Prisma.PaymentWhereInput; orderBy?: Prisma.PaymentOrderByWithRelationInput; take?: number; skip?: number }) {
    return this.prisma.payment.findMany({
      where: params.where,
      include: PLATFORM_ANALYTICS_PAYMENT_INCLUDE,
      orderBy: params.orderBy ?? { createdAt: 'desc' },
      skip: params.skip,
      take: params.take,
    });
  }

  countPayments(where: Prisma.PaymentWhereInput) {
    return this.prisma.payment.count({ where });
  }

  sumSuccessfulPayments(where: Prisma.PaymentWhereInput) {
    return this.prisma.payment.aggregate({ where: { ...where, status: PaymentStatus.SUCCEEDED }, _sum: { amount: true } });
  }

  countNewSubscriptions(fromDate: Date, toDate: Date) {
    return this.prisma.customerSubscription.count({
      where: {
        createdAt: { gte: fromDate, lte: toDate },
        status: { in: [CustomerSubscriptionStatus.ACTIVE, CustomerSubscriptionStatus.TRIALING] },
      },
    });
  }

  countCancelledSubscriptions(fromDate: Date, toDate: Date) {
    return this.prisma.customerSubscription.count({
      where: {
        OR: [
          { cancelledAt: { gte: fromDate, lte: toDate } },
          { status: CustomerSubscriptionStatus.CANCELLED, updatedAt: { gte: fromDate, lte: toDate } },
        ],
      },
    });
  }

  countActiveSubscriptionsAt(date: Date) {
    return this.prisma.customerSubscription.count({
      where: {
        createdAt: { lt: date },
        status: { in: [CustomerSubscriptionStatus.ACTIVE, CustomerSubscriptionStatus.TRIALING] },
        OR: [{ cancelledAt: null }, { cancelledAt: { gte: date } }],
      },
    });
  }

  countActiveRegisteredUsers(untilDate: Date) {
    return this.prisma.user.count({
      where: {
        role: UserRole.REGISTERED_USER,
        isActive: true,
        deletedAt: null,
        createdAt: { lte: untilDate },
      },
    });
  }

}
