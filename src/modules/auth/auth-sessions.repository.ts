import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AuthSessionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findActiveSessionsByUserId(userId: string) {
    return this.prisma.authSession.findMany({ where: { userId, revokedAt: null }, orderBy: { lastActiveAt: 'desc' } });
  }

  revokeOtherSessions(userId: string, currentSessionId?: string) {
    return this.prisma.authSession.updateMany({ where: { userId, revokedAt: null, id: currentSessionId ? { not: currentSessionId } : undefined }, data: { revokedAt: new Date() } });
  }

  findActiveSessionForUser(userId: string, id: string) {
    return this.prisma.authSession.findFirst({ where: { id, userId, revokedAt: null } });
  }

  deleteSession(id: string) {
    return this.prisma.authSession.delete({ where: { id } });
  }
}
