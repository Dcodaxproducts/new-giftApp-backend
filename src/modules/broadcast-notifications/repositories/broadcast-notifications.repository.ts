import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class BroadcastNotificationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  createBroadcast(data: Prisma.BroadcastUncheckedCreateInput) {
    return this.prisma.broadcast.create({ data });
  }
}
