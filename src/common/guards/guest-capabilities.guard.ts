import { CanActivate, ExecutionContext, ForbiddenException, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { Request } from 'express';
import { GUEST_CAPABILITIES_KEY } from '../decorators/guest-capabilities.decorator';
import { GuestAccessSettingsService } from '../../modules/guest-access/services/guest-access-settings.service';

type GuestRateBucket = { count: number; windowStartedAt: number };

@Injectable()
export class GuestCapabilitiesGuard implements CanActivate {
  private readonly buckets = new Map<string, GuestRateBucket>();

  constructor(
    private readonly reflector: Reflector,
    private readonly settings: GuestAccessSettingsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string[]>(GUEST_CAPABILITIES_KEY, [context.getHandler(), context.getClass()]);
    if (!required?.length) return true;
    const request = context.switchToHttp().getRequest<Request & { user?: { role?: UserRole; guestSessionId?: string; capabilities?: string[] } }>();
    const user = request.user;
    if (user?.role !== UserRole.GUEST_USER) return true;
    await this.assertRateLimit(user.guestSessionId ?? 'unknown', request.ip);
    const granted = new Set(user.capabilities ?? []);
    if (!required.every((capability) => granted.has(capability))) throw new ForbiddenException('Guest session does not have the required capability');
    return true;
  }

  private async assertRateLimit(guestSessionId: string, ipAddress?: string): Promise<void> {
    const limit = (await this.settings.getSettings()).maxRequestsPerMinute;
    if (!limit) return;
    const now = Date.now();
    const key = `${guestSessionId}:${ipAddress ?? 'unknown'}`;
    const bucket = this.buckets.get(key);
    if (!bucket || now - bucket.windowStartedAt >= 60_000) {
      this.buckets.set(key, { count: 1, windowStartedAt: now });
      return;
    }
    bucket.count += 1;
    if (bucket.count > limit) throw new HttpException('Guest request rate limit exceeded', HttpStatus.TOO_MANY_REQUESTS);
  }
}
