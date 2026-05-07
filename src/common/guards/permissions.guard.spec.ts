import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { PermissionsGuard } from './permissions.guard';

function contextWithUser(user: unknown): ExecutionContext {
  return {
    getHandler: () => 'handler',
    getClass: () => 'class',
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

describe('PermissionsGuard', () => {
  it('allows admin with required permission', () => {
    const reflector = new Reflector();
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['users.read']);
    const guard = new PermissionsGuard(reflector);

    const result = guard.canActivate(contextWithUser({
      role: UserRole.ADMIN,
      permissions: { users: ['read'] },
    }));

    expect(result).toBe(true);
  });

  it('rejects admin without required permission', () => {
    const reflector = new Reflector();
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['providers.approve']);
    const guard = new PermissionsGuard(reflector);

    expect(() => guard.canActivate(contextWithUser({
      role: UserRole.ADMIN,
      permissions: { providers: ['read'] },
    }))).toThrow(ForbiddenException);
  });

  it('uses permission metadata key', () => {
    expect(PERMISSIONS_KEY).toBe('permissions');
  });

  it('allows broadcast schedule endpoint with either send or schedule permission', () => {
    const reflector = new Reflector();
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['broadcasts.send', 'broadcasts.schedule']);
    const guard = new PermissionsGuard(reflector);

    expect(guard.canActivate(contextWithUser({
      role: UserRole.ADMIN,
      permissions: { broadcasts: ['schedule'] },
    }))).toBe(true);
  });
});
