import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AuthSessionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  touchSession(id: string) {
    return this.prisma.authSession.update({ where: { id }, data: { lastActiveAt: new Date() } });
  }

  createRefreshSession(params: { userId: string; deviceName: string; ipAddress?: string; userAgent?: string }) {
    return this.prisma.authSession.create({ data: { userId: params.userId, refreshTokenHash: 'pending', deviceName: params.deviceName, ipAddress: params.ipAddress, userAgent: params.userAgent, lastActiveAt: new Date() } });
  }

  storeRefreshTokenHash(userId: string, sessionId: string, refreshTokenHash: string) {
    return this.prisma.$transaction([
      this.prisma.user.update({ where: { id: userId }, data: { refreshTokenHash } }),
      this.prisma.authSession.update({ where: { id: sessionId }, data: { refreshTokenHash } }),
    ]);
  }

  findRefreshSession(id: string, userId: string) {
    return this.prisma.authSession.findFirst({ where: { id, userId, revokedAt: null } });
  }

  revokeCurrentSession(id: string, userId: string) {
    return this.prisma.authSession.updateMany({ where: { id, userId, revokedAt: null }, data: { revokedAt: new Date() } });
  }

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
