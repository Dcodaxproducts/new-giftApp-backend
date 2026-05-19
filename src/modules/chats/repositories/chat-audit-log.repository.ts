import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class ChatAuditLogRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.ChatAuditLogUncheckedCreateInput) {
    return this.prisma.chatAuditLog.create({ data });
  }

  findForThread(threadId: string) {
    return this.prisma.chatAuditLog.findMany({
      where: { threadId },
      include: { actor: { select: { id: true, role: true, firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
}
