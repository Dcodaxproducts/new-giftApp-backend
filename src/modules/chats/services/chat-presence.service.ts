import { Injectable } from '@nestjs/common';
import { AuthUserContext } from '../../../common/decorators/current-user.decorator';

type PresenceRecord = { user: AuthUserContext; socketIds: Set<string>; lastSeenAt: Date };

@Injectable()
export class ChatPresenceService {
  private readonly byUser = new Map<string, PresenceRecord>();
  private readonly socketToUser = new Map<string, string>();

  connect(socketId: string, user: AuthUserContext): { becameOnline: boolean; lastSeenAt: Date } {
    const existing = this.byUser.get(user.uid);
    const lastSeenAt = new Date();
    if (existing) {
      existing.socketIds.add(socketId);
      existing.lastSeenAt = lastSeenAt;
      this.socketToUser.set(socketId, user.uid);
      return { becameOnline: false, lastSeenAt };
    }
    this.byUser.set(user.uid, { user, socketIds: new Set([socketId]), lastSeenAt });
    this.socketToUser.set(socketId, user.uid);
    return { becameOnline: true, lastSeenAt };
  }

  disconnect(socketId: string): { becameOffline: boolean; user?: AuthUserContext; lastSeenAt?: Date } {
    const userId = this.socketToUser.get(socketId);
    if (!userId) return { becameOffline: false };
    this.socketToUser.delete(socketId);
    const record = this.byUser.get(userId);
    if (!record) return { becameOffline: false };
    record.socketIds.delete(socketId);
    record.lastSeenAt = new Date();
    if (record.socketIds.size > 0) return { becameOffline: false, user: record.user, lastSeenAt: record.lastSeenAt };
    this.byUser.delete(userId);
    return { becameOffline: true, user: record.user, lastSeenAt: record.lastSeenAt };
  }

  ping(socketId: string): Date | null {
    const userId = this.socketToUser.get(socketId);
    if (!userId) return null;
    const record = this.byUser.get(userId);
    if (!record) return null;
    record.lastSeenAt = new Date();
    return record.lastSeenAt;
  }

  isOnline(userId: string): boolean { return this.byUser.has(userId); }
  lastSeenAt(userId: string): Date | null { return this.byUser.get(userId)?.lastSeenAt ?? null; }
}
