import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { OfferWithRelations, promotionalOfferInclude } from './promotional-offers.repository';

@Injectable()
export class ProviderOffersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findProviderItem(providerId: string, itemId: string) {
    return this.prisma.gift.findFirst({ where: { id: itemId, providerId, deletedAt: null } });
  }

  findProviderOfferById(providerId: string, id: string): Promise<OfferWithRelations | null> {
    return this.prisma.promotionalOffer.findFirst({ where: { id, providerId, deletedAt: null }, include: promotionalOfferInclude });
  }

  findProviderOffersAndCount(params: Prisma.PromotionalOfferFindManyArgs & { where: Prisma.PromotionalOfferWhereInput }): Promise<[OfferWithRelations[], number]> {
    return this.prisma.$transaction([
      this.prisma.promotionalOffer.findMany(params),
      this.prisma.promotionalOffer.count({ where: params.where }),
    ]) as Promise<[OfferWithRelations[], number]>;
  }

  createProviderOffer(data: Prisma.PromotionalOfferUncheckedCreateInput): Promise<OfferWithRelations> {
    return this.prisma.promotionalOffer.create({ data, include: promotionalOfferInclude });
  }

  updateProviderOffer(id: string, data: Prisma.PromotionalOfferUncheckedUpdateInput): Promise<OfferWithRelations> {
    return this.prisma.promotionalOffer.update({ where: { id }, data, include: promotionalOfferInclude });
  }

  updateProviderOfferStatus(id: string, data: Prisma.PromotionalOfferUncheckedUpdateInput) {
    return this.updateProviderOffer(id, data);
  }

  deleteProviderOffer(id: string) {
    return this.prisma.promotionalOffer.delete({ where: { id } });
  }
}
