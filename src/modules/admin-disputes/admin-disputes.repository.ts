import { Injectable } from '@nestjs/common';
import { DisputeStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

export const DISPUTE_INCLUDE = Prisma.validator<Prisma.DisputeInclude>()({
  user: { select: { id: true, firstName: true, lastName: true, email: true } },
  provider: { select: { id: true, firstName: true, lastName: true, email: true, providerProfile: { select: { businessName: true } } } },
  order: { select: { id: true, orderNumber: true, status: true, createdAt: true } },
});

@Injectable()
export class AdminDisputesRepository {
  constructor(private readonly prisma: PrismaService) {}

  countStats(where: Prisma.DisputeWhereInput) {
    return this.prisma.$transaction([
      this.prisma.dispute.count({ where }),
      this.prisma.dispute.count({ where: { ...where, status: DisputeStatus.PENDING } }),
      this.prisma.dispute.count({ where: { ...where, status: DisputeStatus.APPROVED } }),
      this.prisma.dispute.count({ where: { ...where, status: DisputeStatus.REJECTED } }),
    ]);
  }

  findDisputesAndCount(params: { where: Prisma.DisputeWhereInput; orderBy: Prisma.DisputeOrderByWithRelationInput; skip: number; take: number }) {
    return this.prisma.$transaction([
      this.prisma.dispute.findMany({ where: params.where, include: DISPUTE_INCLUDE, orderBy: params.orderBy, skip: params.skip, take: params.take }),
      this.prisma.dispute.count({ where: params.where }),
    ]);
  }

  findById(id: string) {
    return this.prisma.dispute.findUnique({ where: { id }, include: DISPUTE_INCLUDE });
  }

  create(data: Prisma.DisputeUncheckedCreateInput) {
    return this.prisma.dispute.create({ data, include: DISPUTE_INCLUDE });
  }

  updateStatus(id: string, data: Prisma.DisputeUpdateInput) {
    return this.prisma.dispute.update({ where: { id }, data, include: DISPUTE_INCLUDE });
  }
}
