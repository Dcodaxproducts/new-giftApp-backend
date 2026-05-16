import { Injectable } from '@nestjs/common';
import { Gift, PromotionalOffer, PromotionalOfferApprovalStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';

export type OfferWithRelations = PromotionalOffer & {
  item: Pick<Gift, 'id' | 'name' | 'imageUrls' | 'price' | 'currency' | 'status' | 'moderationStatus'>;
  provider: { id: string; email: string; providerBusinessName: string | null; firstName: string; lastName: string };
};

export const promotionalOfferInclude = {
  item: { select: { id: true, name: true, imageUrls: true, price: true, currency: true, status: true, moderationStatus: true } },
  provider: { select: { id: true, email: true, providerBusinessName: true, firstName: true, lastName: true } },
} as const;

@Injectable()
export class PromotionalOffersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findManyOffers(params: Prisma.PromotionalOfferFindManyArgs): Promise<OfferWithRelations[]> {
    return this.prisma.promotionalOffer.findMany(params) as Promise<OfferWithRelations[]>;
  }

  countOffers(where: Prisma.PromotionalOfferWhereInput) {
    return this.prisma.promotionalOffer.count({ where });
  }

  findOffersAndCount(params: Prisma.PromotionalOfferFindManyArgs & { where: Prisma.PromotionalOfferWhereInput }): Promise<[OfferWithRelations[], number]> {
    return this.prisma.$transaction([
      this.prisma.promotionalOffer.findMany(params),
      this.prisma.promotionalOffer.count({ where: params.where }),
    ]) as Promise<[OfferWithRelations[], number]>;
  }

  findOfferById(id: string): Promise<OfferWithRelations | null> {
    return this.prisma.promotionalOffer.findFirst({ where: { id, deletedAt: null }, include: promotionalOfferInclude });
  }

  createOffer(data: Prisma.PromotionalOfferUncheckedCreateInput): Promise<OfferWithRelations> {
    return this.prisma.promotionalOffer.create({ data, include: promotionalOfferInclude });
  }

  updateOffer(id: string, data: Prisma.PromotionalOfferUncheckedUpdateInput): Promise<OfferWithRelations> {
    return this.prisma.promotionalOffer.update({ where: { id }, data, include: promotionalOfferInclude });
  }

  approveOffer(id: string, data: Prisma.PromotionalOfferUncheckedUpdateInput) {
    return this.updateOffer(id, data);
  }

  rejectOffer(id: string, data: Prisma.PromotionalOfferUncheckedUpdateInput) {
    return this.updateOffer(id, data);
  }

  updateOfferStatus(id: string, data: Prisma.PromotionalOfferUncheckedUpdateInput) {
    return this.updateOffer(id, data);
  }

  deleteOffer(id: string) {
    return this.prisma.promotionalOffer.delete({ where: { id } });
  }

  async countOfferStats(now: Date) {
    const base = { deletedAt: null };
    const [totalOffers, activeOffers, scheduledOffers, pendingApproval, expiredOffers, rejectedOffers] = await this.prisma.$transaction([
      this.prisma.promotionalOffer.count({ where: base }),
      this.prisma.promotionalOffer.count({ where: { ...base, isActive: true, approvalStatus: PromotionalOfferApprovalStatus.APPROVED, startDate: { lte: now }, OR: [{ endDate: null }, { endDate: { gt: now } }] } }),
      this.prisma.promotionalOffer.count({ where: { ...base, isActive: true, approvalStatus: PromotionalOfferApprovalStatus.APPROVED, startDate: { gt: now } } }),
      this.prisma.promotionalOffer.count({ where: { ...base, approvalStatus: PromotionalOfferApprovalStatus.PENDING } }),
      this.prisma.promotionalOffer.count({ where: { ...base, endDate: { lte: now } } }),
      this.prisma.promotionalOffer.count({ where: { ...base, approvalStatus: PromotionalOfferApprovalStatus.REJECTED } }),
    ]);
    return { totalOffers, activeOffers, scheduledOffers, pendingApproval, expiredOffers, rejectedOffers };
  }
}
