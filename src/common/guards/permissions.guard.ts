import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Prisma, UserRole } from '@prisma/client';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

// The dashboard grants staff only 4 CRUD verbs per module. Every granular backend
// action is collapsed onto one of those verbs so a single CRUD grant unlocks it.
// Read-only / data-out actions (no mutation) collapse to `read`.
const READ_ACTIONS = new Set(['read', 'export', 'analytics.read', 'receipt.download', 'generate']);
// Actions that spin up a new record or workflow collapse to `create`.
const CREATE_ACTIONS = new Set(['create', 'initiate']);
// Actions that remove a record collapse to `delete`.
const DELETE_ACTIONS = new Set(['delete']);
// Everything else (update, status.update, suspend, approve, reject, moderate, refund, ...) collapses to `update`.

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

    if (user?.role !== UserRole.STAFF) {
      throw new ForbiddenException('Your role does not have the required permission');
    }

    const grantedPermissions = this.flattenPermissions(user.permissions);
    const hasPermission = requiredPermissions.every((permission) =>
      grantedPermissions.has(this.toCrudPermission(permission)),
    );

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
          // Store the CRUD-collapsed form so both CRUD and legacy granular grants resolve.
          granted.add(this.toCrudPermission(`${module}.${value}`));
        }
      }
    }

    return granted;
  }

  // Collapse any granular permission (users.suspend, providers.approve, transactions.refund, ...)
  // onto its CRUD verb (users.update, providers.update, transactions.update) so the 4-verb
  // dashboard model gates every endpoint.
  private toCrudPermission(permission: string): string {
    const firstDot = permission.indexOf('.');
    if (firstDot === -1) {
      return permission;
    }

    const module = permission.slice(0, firstDot);
    const action = permission.slice(firstDot + 1);

    let verb = 'update';
    if (READ_ACTIONS.has(action)) {
      verb = 'read';
    } else if (CREATE_ACTIONS.has(action)) {
      verb = 'create';
    } else if (DELETE_ACTIONS.has(action)) {
      verb = 'delete';
    }

    return `${module}.${verb}`;
  }
}
