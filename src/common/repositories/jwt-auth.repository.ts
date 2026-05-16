import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class JwtAuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  findUserForJwtGuard(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: { adminRole: true },
    });
  }

  findActiveSessionForJwtGuard(sessionId: string, userId: string) {
    return this.prisma.authSession.findFirst({
      where: { id: sessionId, userId, revokedAt: null },
      select: { id: true },
    });
  }
}
