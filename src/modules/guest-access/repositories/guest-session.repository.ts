import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
@Injectable()
export class GuestSessionRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.GuestSessionUncheckedCreateInput) {
    return this.prisma.guestSession.create({ data });
  }

  findActive(guestSessionId: string) {
    return this.prisma.guestSession.findFirst({
      where: { guestSessionId, revokedAt: null, expiresAt: { gt: new Date() } },
    });
  }

  touchLastSeen(id: string) {
    return this.prisma.guestSession.update({ where: { id }, data: { lastSeenAt: new Date() } });
  }
}
