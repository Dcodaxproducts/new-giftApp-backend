import { Injectable } from '@nestjs/common';
import { Prisma, ProviderDisputeSeverity, ProviderDisputeStatus } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class AdminProviderDisputesRepository {
  constructor(private readonly prisma: PrismaService) {}

  countStats(params: { where: Prisma.ProviderDisputeCaseWhereInput; weekStart: Date }) {
    return this.prisma.$transaction([
      this.prisma.providerDisputeCase.count({ where: { ...params.where, priority: ProviderDisputeSeverity.CRITICAL, status: { in: [ProviderDisputeStatus.OPEN, ProviderDisputeStatus.EVIDENCE_PHASE, ProviderDisputeStatus.UNDER_REVIEW, ProviderDisputeStatus.RULING_PENDING, ProviderDisputeStatus.ESCALATED] } } }),
      this.prisma.providerDisputeCase.count({ where: { ...params.where, status: ProviderDisputeStatus.EVIDENCE_PHASE } }),
      this.prisma.providerDisputeCase.count({ where: { ...params.where, status: ProviderDisputeStatus.UNDER_REVIEW } }),
      this.prisma.providerDisputeCase.count({ where: { ...params.where, status: ProviderDisputeStatus.ESCALATED } }),
      this.prisma.providerDisputeCase.count({ where: { resolvedAt: { gte: params.weekStart }, status: ProviderDisputeStatus.RESOLVED } }),
      this.prisma.providerDisputeCase.findMany({ where: { resolvedAt: { not: null } }, select: { createdAt: true, resolvedAt: true }, take: 100 }),
      this.prisma.providerDisputeCase.groupBy({ by: ['providerId', 'category'], _count: { _all: true }, orderBy: { _count: { providerId: 'desc' } }, take: 1 }),
    ]);
  }

  findProviderBusinessName(id: string) {
    return this.prisma.user.findUnique({ where: { id }, select: { providerBusinessName: true } });
  }

  findDisputesAndCount<T extends Prisma.ProviderDisputeCaseFindManyArgs & { where: Prisma.ProviderDisputeCaseWhereInput }>(params: T): Promise<[Prisma.ProviderDisputeCaseGetPayload<T>[], number]> {
    return this.prisma.$transaction([
      this.prisma.providerDisputeCase.findMany(params),
      this.prisma.providerDisputeCase.count({ where: params.where }),
    ]) as Promise<[Prisma.ProviderDisputeCaseGetPayload<T>[], number]>;
  }

  countProviderDisputes(providerId: string) {
    return this.prisma.providerDisputeCase.count({ where: { providerId } });
  }

  findDispute<T extends Prisma.ProviderDisputeCaseFindUniqueArgs>(args: T): Promise<Prisma.ProviderDisputeCaseGetPayload<T> | null> {
    return this.prisma.providerDisputeCase.findUnique(args) as Promise<Prisma.ProviderDisputeCaseGetPayload<T> | null>;
  }

  exportDisputes<T extends Prisma.ProviderDisputeCaseFindManyArgs>(args: T): Promise<Prisma.ProviderDisputeCaseGetPayload<T>[]> {
    return this.prisma.providerDisputeCase.findMany(args) as Promise<Prisma.ProviderDisputeCaseGetPayload<T>[]>;
  }
}
