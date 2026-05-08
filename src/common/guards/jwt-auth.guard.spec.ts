import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from './jwt-auth.guard';

function contextWithHeader(token = 'Bearer token'): ExecutionContext {
  const request: { headers: Record<string, string>; user?: unknown } = { headers: { authorization: token } };
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

describe('JwtAuthGuard', () => {
  it('loads fresh ADMIN role permissions from active AdminRole', async () => {
    const guard = new JwtAuthGuard(
      { verifyAsync: jest.fn().mockResolvedValue({ uid: 'admin_1', role: UserRole.ADMIN }) } as never,
      { get: jest.fn().mockReturnValue('secret') } as never,
      {
        user: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'admin_1',
            role: UserRole.ADMIN,
            isActive: true,
            deletedAt: null,
            adminRoleId: 'role_1',
            adminRole: { id: 'role_1', isActive: true, deletedAt: null, permissions: { gifts: ['create'] } },
          }),
        },
      } as never,
    );

    const context = contextWithHeader();
    await expect(guard.canActivate(context)).resolves.toBe(true);
    const request = context.switchToHttp().getRequest<{ user?: { permissions?: unknown } }>();
    expect(request.user).toEqual({ uid: 'admin_1', role: UserRole.ADMIN, permissions: { gifts: ['create'] } });
  });

  it('blocks inactive ADMIN users', async () => {
    const guard = new JwtAuthGuard(
      { verifyAsync: jest.fn().mockResolvedValue({ uid: 'admin_1', role: UserRole.ADMIN }) } as never,
      { get: jest.fn().mockReturnValue('secret') } as never,
      { user: { findUnique: jest.fn().mockResolvedValue({ id: 'admin_1', role: UserRole.ADMIN, isActive: false, deletedAt: null }) } } as never,
    );

    await expect(guard.canActivate(contextWithHeader())).rejects.toThrow(ForbiddenException);
  });

  it('blocks ADMIN users with inactive AdminRole', async () => {
    const guard = new JwtAuthGuard(
      { verifyAsync: jest.fn().mockResolvedValue({ uid: 'admin_1', role: UserRole.ADMIN }) } as never,
      { get: jest.fn().mockReturnValue('secret') } as never,
      {
        user: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'admin_1',
            role: UserRole.ADMIN,
            isActive: true,
            deletedAt: null,
            adminRoleId: 'role_1',
            adminRole: { id: 'role_1', isActive: false, deletedAt: null, permissions: { gifts: ['create'] } },
          }),
        },
      } as never,
    );

    await expect(guard.canActivate(contextWithHeader())).rejects.toThrow(ForbiddenException);
  });

  it('rejects invalid bearer token', async () => {
    const guard = new JwtAuthGuard(
      { verifyAsync: jest.fn().mockRejectedValue(new Error('bad token')) } as never,
      { get: jest.fn().mockReturnValue('secret') } as never,
      { user: { findUnique: jest.fn() } } as never,
    );

    await expect(guard.canActivate(contextWithHeader())).rejects.toThrow(UnauthorizedException);
  });
});
