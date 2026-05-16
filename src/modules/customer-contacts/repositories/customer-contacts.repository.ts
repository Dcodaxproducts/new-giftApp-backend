import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class CustomerContactsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findManyForList(params: { where: Prisma.CustomerContactWhereInput; orderBy: Prisma.CustomerContactOrderByWithRelationInput; skip: number; take: number }) {
    return this.prisma.$transaction([
      this.prisma.customerContact.findMany(params),
      this.prisma.customerContact.count({ where: params.where }),
    ]);
  }

  create(data: Prisma.CustomerContactUncheckedCreateInput) {
    return this.prisma.customerContact.create({ data });
  }

  findOwnedByUser(userId: string, id: string) {
    return this.prisma.customerContact.findFirst({ where: { id, userId, deletedAt: null } });
  }

  update(id: string, data: Prisma.CustomerContactUncheckedUpdateInput) {
    return this.prisma.customerContact.update({ where: { id }, data });
  }

  delete(id: string) {
    return this.prisma.customerContact.delete({ where: { id } });
  }
}
