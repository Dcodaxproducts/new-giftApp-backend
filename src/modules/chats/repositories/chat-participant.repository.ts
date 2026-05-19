import { Injectable } from '@nestjs/common';
import { ChatParticipantRole } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class ChatParticipantRepository {
  constructor(private readonly prisma: PrismaService) {}

  upsert(params: { threadId: string; userId: string; role: ChatParticipantRole }) {
    return this.prisma.chatParticipant.upsert({
      where: { threadId_userId: { threadId: params.threadId, userId: params.userId } },
      update: { role: params.role, leftAt: null },
      create: params,
    });
  }

  findActive(threadId: string, userId: string) {
    return this.prisma.chatParticipant.findFirst({ where: { threadId, userId, leftAt: null } });
  }
}
