import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Prisma, UserRole } from '@prisma/client';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      user?: { role?: UserRole; permissions?: Prisma.JsonValue };
    }>();
    const user = request.user;

    if (user?.role === UserRole.SUPER_ADMIN) {
      return true;
    }

    if (user?.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Your role does not have the required permission');
    }

    const grantedPermissions = this.flattenPermissions(user.permissions);
    const requiresDynamicBroadcastSchedule = requiredPermissions.includes('broadcasts.send') && requiredPermissions.includes('broadcasts.schedule');
    const hasPermission = requiresDynamicBroadcastSchedule
      ? requiredPermissions.some((permission) => grantedPermissions.has(permission))
      : requiredPermissions.every((permission) => grantedPermissions.has(permission));

    if (!hasPermission) {
      throw new ForbiddenException('Your role does not have the required permission');
    }

    return true;
  }

  private flattenPermissions(permissions?: Prisma.JsonValue): Set<string> {
    const granted = new Set<string>();

    if (!permissions || typeof permissions !== 'object' || Array.isArray(permissions)) {
      return granted;
    }

    for (const [module, values] of Object.entries(permissions)) {
      if (!Array.isArray(values)) {
        continue;
      }

      for (const value of values) {
        if (typeof value === 'string') {
          granted.add(`${module}.${value}`);
          granted.add(`${module}.${this.normalizePermission(value)}`);
        }
      }
    }

    return granted;
  }

  private normalizePermission(permission: string): string {
    if (permission === 'updateStatus') {
      return 'status.update';
    }

    if (permission === 'status.update') {
      return 'updateStatus';
    }

    return permission.replace(/^resetPassword$/, 'resetPassword');
  }
}
