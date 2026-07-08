import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AdminDocumentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.DocumentCreateInput) {
    return this.prisma.document.create({ data });
  }

  findById(id: string) {
    return this.prisma.document.findUnique({ where: { id } });
  }

  findByName(name: string) {
    return this.prisma.document.findUnique({ where: { name } });
  }

  findMany(where: Prisma.DocumentWhereInput, skip: number, take: number) {
    return this.prisma.$transaction([
      this.prisma.document.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      this.prisma.document.count({ where }),
    ]);
  }

  update(id: string, data: Prisma.DocumentUpdateInput) {
    return this.prisma.document.update({ where: { id }, data });
  }
}
