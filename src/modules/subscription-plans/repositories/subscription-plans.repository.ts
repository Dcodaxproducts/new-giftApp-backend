import { Injectable } from '@nestjs/common';
import { Prisma, SubscriptionPlanStatus } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class SubscriptionPlansRepository {
  constructor(private readonly prisma: PrismaService) {}

  findManyPlans(params: Prisma.SubscriptionPlanFindManyArgs) {
    return this.prisma.subscriptionPlan.findMany(params);
  }

  countPlans(where: Prisma.SubscriptionPlanWhereInput) {
    return this.prisma.subscriptionPlan.count({ where });
  }

  findPlansAndCount(params: Prisma.SubscriptionPlanFindManyArgs & { where: Prisma.SubscriptionPlanWhereInput }) {
    return this.prisma.$transaction([
      this.findManyPlans(params),
      this.countPlans(params.where),
    ]);
  }

  findPlanById(id: string) {
    return this.prisma.subscriptionPlan.findFirst({ where: { id, deletedAt: null } });
  }

  findPlanBySlug(slug: string, exceptId?: string) {
    return this.prisma.subscriptionPlan.findFirst({ where: { slug, id: exceptId ? { not: exceptId } : undefined } });
  }

  createPlan(data: Prisma.SubscriptionPlanUncheckedCreateInput) {
    return this.prisma.subscriptionPlan.create({ data });
  }

  updatePlan(id: string, data: Prisma.SubscriptionPlanUncheckedUpdateInput) {
    return this.prisma.subscriptionPlan.update({ where: { id }, data });
  }

  updatePlanStatus(id: string, data: Prisma.SubscriptionPlanUncheckedUpdateInput) {
    return this.updatePlan(id, data);
  }

  updatePlanVisibility(id: string, data: Prisma.SubscriptionPlanUncheckedUpdateInput) {
    return this.updatePlan(id, data);
  }

  deletePlan(id: string) {
    return this.prisma.subscriptionPlan.delete({ where: { id } });
  }

  clearPopular(exceptId?: string) {
    return this.prisma.subscriptionPlan.updateMany({
      where: { isPopular: true, id: exceptId ? { not: exceptId } : undefined },
      data: { isPopular: false },
    });
  }

  async countPlanStats() {
    const [totalPlans, activePlans, inactivePlans, archivedPlans] = await this.prisma.$transaction([
      this.prisma.subscriptionPlan.count({ where: { deletedAt: null } }),
      this.prisma.subscriptionPlan.count({ where: { deletedAt: null, status: SubscriptionPlanStatus.ACTIVE } }),
      this.prisma.subscriptionPlan.count({ where: { deletedAt: null, status: SubscriptionPlanStatus.INACTIVE } }),
      this.prisma.subscriptionPlan.count({ where: { status: SubscriptionPlanStatus.ARCHIVED } }),
    ]);
    return { totalPlans, activePlans, inactivePlans, archivedPlans };
  }
}
