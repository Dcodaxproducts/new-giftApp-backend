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
  it('allows super admin without checking permission payload', () => {
    const reflector = new Reflector();
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['users.read']);
    const guard = new PermissionsGuard(reflector);

    expect(guard.canActivate(contextWithUser({ role: UserRole.SUPER_ADMIN }))).toBe(true);
  });

  it('allows admin with required permission', () => {
    const reflector = new Reflector();
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['users.read']);
    const guard = new PermissionsGuard(reflector);

    const result = guard.canActivate(contextWithUser({
      role: UserRole.STAFF,
      permissions: { users: ['read'] },
    }));

    expect(result).toBe(true);
  });

  it('rejects admin without required permission', () => {
    const reflector = new Reflector();
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['providers.approve']);
    const guard = new PermissionsGuard(reflector);

    expect(() => guard.canActivate(contextWithUser({
      role: UserRole.STAFF,
      permissions: { providers: ['read'] },
    }))).toThrow(ForbiddenException);
  });

  it('grants a granular action from its CRUD verb (approve <- update)', () => {
    const reflector = new Reflector();
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['providers.approve']);
    const guard = new PermissionsGuard(reflector);

    expect(guard.canActivate(contextWithUser({
      role: UserRole.STAFF,
      permissions: { providers: ['update'] },
    }))).toBe(true);
  });

  it('maps suspend, status.update and resetPassword onto update', () => {
    const reflector = new Reflector();
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([
      'users.suspend',
      'users.status.update',
      'users.resetPassword',
    ]);
    const guard = new PermissionsGuard(reflector);

    expect(guard.canActivate(contextWithUser({
      role: UserRole.STAFF,
      permissions: { users: ['update'] },
    }))).toBe(true);
  });

  it('maps export onto read (no update grant needed)', () => {
    const reflector = new Reflector();
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['users.export']);
    const guard = new PermissionsGuard(reflector);

    expect(guard.canActivate(contextWithUser({
      role: UserRole.STAFF,
      permissions: { users: ['read'] },
    }))).toBe(true);
  });

  it('does not let read unlock an update action', () => {
    const reflector = new Reflector();
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['users.suspend']);
    const guard = new PermissionsGuard(reflector);

    expect(() => guard.canActivate(contextWithUser({
      role: UserRole.STAFF,
      permissions: { users: ['read'] },
    }))).toThrow(ForbiddenException);
  });

  it.each([UserRole.REGISTERED_USER, UserRole.PROVIDER])(
    'rejects %s from admin permission checks',
    (role: UserRole) => {
      const reflector = new Reflector();
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['users.read']);
      const guard = new PermissionsGuard(reflector);

      expect(() => guard.canActivate(contextWithUser({ role }))).toThrow(ForbiddenException);
    },
  );

  it('uses permission metadata key', () => {
    expect(PERMISSIONS_KEY).toBe('permissions');
  });

  it('gates broadcasts by its create verb', () => {
    const reflector = new Reflector();
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['broadcasts.create']);
    const guard = new PermissionsGuard(reflector);

    expect(guard.canActivate(contextWithUser({
      role: UserRole.STAFF,
      permissions: { broadcasts: ['create'] },
    }))).toBe(true);

    expect(() => guard.canActivate(contextWithUser({
      role: UserRole.STAFF,
      permissions: { broadcasts: ['read'] },
    }))).toThrow(ForbiddenException);
  });
});
