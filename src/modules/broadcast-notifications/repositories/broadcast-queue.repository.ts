import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class BroadcastQueueRepository {
  constructor(private readonly prisma: PrismaService) {}

  findBroadcastById(broadcastId: string) {
    return this.prisma.broadcast.findUnique({ where: { id: broadcastId } });
  }
}
