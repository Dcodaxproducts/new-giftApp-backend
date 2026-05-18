import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { GUEST_CAPABILITIES_KEY } from '../decorators/guest-capabilities.decorator';

@Injectable()
export class GuestCapabilitiesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(GUEST_CAPABILITIES_KEY, [context.getHandler(), context.getClass()]);
    if (!required?.length) return true;
    const request = context.switchToHttp().getRequest<{ user?: { role?: UserRole; capabilities?: string[] } }>();
    const user = request.user;
    if (user?.role !== UserRole.GUEST_USER) return true;
    const granted = new Set(user.capabilities ?? []);
    if (!required.every((capability) => granted.has(capability))) throw new ForbiddenException('Guest session does not have the required capability');
    return true;
  }
}
