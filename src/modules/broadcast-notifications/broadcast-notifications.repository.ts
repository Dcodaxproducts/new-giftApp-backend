import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class BroadcastNotificationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  createBroadcast(data: Prisma.BroadcastUncheckedCreateInput) {
    return this.prisma.broadcast.create({ data });
  }

  findManyBroadcasts(params: Prisma.BroadcastFindManyArgs) {
    return this.prisma.broadcast.findMany(params);
  }

  countBroadcasts(where: Prisma.BroadcastWhereInput) {
    return this.prisma.broadcast.count({ where });
  }

  findBroadcastsAndCount(params: Prisma.BroadcastFindManyArgs & { where: Prisma.BroadcastWhereInput }) {
    return this.prisma.$transaction([
      this.findManyBroadcasts(params),
      this.countBroadcasts(params.where),
    ]);
  }

  findBroadcastById(id: string) {
    return this.prisma.broadcast.findUnique({ where: { id } });
  }

  updateBroadcast(id: string, data: Prisma.BroadcastUncheckedUpdateInput) {
    return this.prisma.broadcast.update({ where: { id }, data });
  }

  updateBroadcastTargeting(id: string, data: Prisma.BroadcastUncheckedUpdateInput) {
    return this.updateBroadcast(id, data);
  }

  scheduleBroadcast(id: string, data: Prisma.BroadcastUncheckedUpdateInput) {
    return this.updateBroadcast(id, data);
  }

  cancelBroadcast(id: string, data: Prisma.BroadcastUncheckedUpdateInput) {
    return this.updateBroadcast(id, data);
  }
}
