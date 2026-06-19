import { Injectable } from '@nestjs/common';
import { DisputeStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AdminDisputesRepository {
  constructor(private readonly prisma: PrismaService) {}

  countStats(params: { where: Prisma.DisputeCaseWhereInput; previousWhere: Prisma.DisputeCaseWhereInput; weekStart: Date }) {
    return this.prisma.$transaction([
      this.prisma.disputeCase.count({ where: { ...params.where, status: { in: [DisputeStatus.OPEN, DisputeStatus.IN_REVIEW, DisputeStatus.ESCALATED] } } }),
      this.prisma.disputeCase.count({ where: { ...params.previousWhere, status: { in: [DisputeStatus.OPEN, DisputeStatus.IN_REVIEW, DisputeStatus.ESCALATED] } } }),
      this.prisma.disputeCase.count({ where: { ...params.where, status: { in: [DisputeStatus.OPEN, DisputeStatus.IN_REVIEW] }, assignedToId: null } }),
      this.prisma.disputeCase.count({ where: { ...params.where, status: DisputeStatus.ESCALATED } }),
      this.prisma.disputeCase.count({ where: { status: { in: [DisputeStatus.RESOLVED, DisputeStatus.REJECTED, DisputeStatus.APPROVED] }, resolvedAt: { gte: params.weekStart } } }),
      this.prisma.disputeCase.count({ where: { status: { in: [DisputeStatus.RESOLVED, DisputeStatus.REJECTED, DisputeStatus.APPROVED] }, resolvedAt: { gte: new Date(params.weekStart.getTime() - 7 * 24 * 60 * 60 * 1000), lt: params.weekStart } } }),
    ]);
  }

  findDisputesAndCount<T extends Prisma.DisputeCaseFindManyArgs & { where: Prisma.DisputeCaseWhereInput }>(params: T): Promise<[Prisma.DisputeCaseGetPayload<T>[], number]> {
    return this.prisma.$transaction([
      this.prisma.disputeCase.findMany(params),
      this.prisma.disputeCase.count({ where: params.where }),
    ]) as Promise<[Prisma.DisputeCaseGetPayload<T>[], number]>;
  }

  findDispute<T extends Prisma.DisputeCaseFindUniqueArgs>(args: T): Promise<Prisma.DisputeCaseGetPayload<T> | null> {
    return this.prisma.disputeCase.findUnique(args) as Promise<Prisma.DisputeCaseGetPayload<T> | null>;
  }

  exportDisputes<T extends Prisma.DisputeCaseFindManyArgs>(args: T): Promise<Prisma.DisputeCaseGetPayload<T>[]> {
    return this.prisma.disputeCase.findMany(args) as Promise<Prisma.DisputeCaseGetPayload<T>[]>;
  }
}
