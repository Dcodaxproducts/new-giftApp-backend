import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { ProviderApprovalStatus, UserRole } from '@prisma/client';
import { readFileSync } from 'fs';
import { JwtAuthGuard } from './jwt-auth.guard';

function contextWithHeader(token = 'Bearer token', path = '/api/v1/auth/me'): ExecutionContext {
  const request: { headers: Record<string, string>; path: string; user?: unknown } = { headers: { authorization: token }, path };
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

function createGuard(options: {
  payload?: Record<string, unknown>;
  user?: Record<string, unknown> | null;
  session?: Record<string, unknown> | null;
  verifyRejects?: boolean;
} = {}) {
  const repository = {
    findUserForJwtGuard: jest.fn().mockResolvedValue(options.user ?? {
      id: 'admin_1',
      role: UserRole.ADMIN,
      isActive: true,
      deletedAt: null,
      adminRoleId: 'role_1',
      adminRole: { id: 'role_1', isActive: true, deletedAt: null, permissions: { gifts: ['create'] } },
    }),
    findActiveSessionForJwtGuard: jest.fn().mockResolvedValue(Object.prototype.hasOwnProperty.call(options, 'session') ? options.session : { id: 'session_1' }),
  };
  const guard = new JwtAuthGuard(
    options.verifyRejects
      ? ({ verifyAsync: jest.fn().mockRejectedValue(new Error('bad token')) } as never)
      : ({ verifyAsync: jest.fn().mockResolvedValue(options.payload ?? { uid: 'admin_1', role: UserRole.ADMIN }) } as never),
    { get: jest.fn().mockReturnValue('secret') } as never,
    repository as never,
  );

  return { guard, repository };
}

describe('JwtAuthGuard', () => {
  it('loads fresh ADMIN role permissions from active AdminRole', async () => {
    const { guard } = createGuard();

    const context = contextWithHeader();
    await expect(guard.canActivate(context)).resolves.toBe(true);
    const request = context.switchToHttp().getRequest<{ user?: { permissions?: unknown } }>();
    expect(request.user).toEqual({ uid: 'admin_1', role: UserRole.ADMIN, permissions: { gifts: ['create'] }, sessionId: undefined });
  });

  it('returns unauthorized when bearer token is missing', async () => {
    const { guard } = createGuard();

    await expect(guard.canActivate(contextWithHeader('', '/api/v1/auth/me'))).rejects.toThrow('Missing bearer token');
  });

  it('rejects invalid bearer token', async () => {
    const { guard } = createGuard({ verifyRejects: true });

    await expect(guard.canActivate(contextWithHeader())).rejects.toThrow(UnauthorizedException);
  });

  it('rejects inactive or deleted users', async () => {
    const { guard: inactiveGuard } = createGuard({ user: { id: 'user_1', role: UserRole.ADMIN, isActive: false, deletedAt: null } });
    await expect(inactiveGuard.canActivate(contextWithHeader())).rejects.toThrow(ForbiddenException);

    const { guard: deletedGuard } = createGuard({ user: { id: 'user_1', role: UserRole.ADMIN, isActive: true, deletedAt: new Date() } });
    await expect(deletedGuard.canActivate(contextWithHeader())).rejects.toThrow(ForbiddenException);
  });

  it('blocks ADMIN users with inactive or missing AdminRole', async () => {
    const { guard: inactiveRoleGuard } = createGuard({ user: {
      id: 'admin_1',
      role: UserRole.ADMIN,
      isActive: true,
      deletedAt: null,
      adminRoleId: 'role_1',
      adminRole: { id: 'role_1', isActive: false, deletedAt: null, permissions: { gifts: ['create'] } },
    } });
    await expect(inactiveRoleGuard.canActivate(contextWithHeader())).rejects.toThrow(ForbiddenException);

    const { guard: missingRoleGuard } = createGuard({ user: {
      id: 'admin_1',
      role: UserRole.ADMIN,
      isActive: true,
      deletedAt: null,
      adminRoleId: null,
      adminRole: null,
    } });
    await expect(missingRoleGuard.canActivate(contextWithHeader())).rejects.toThrow(ForbiddenException);
  });

  it('blocks pending providers from selling modules while allowing business info', async () => {
    const { guard } = createGuard({
      payload: { uid: 'provider_1', role: UserRole.PROVIDER },
      user: {
        id: 'provider_1',
        role: UserRole.PROVIDER,
        isActive: true,
        deletedAt: null,
        providerApprovalStatus: ProviderApprovalStatus.PENDING,
        suspendedAt: null,
      },
    });

    await expect(guard.canActivate(contextWithHeader('Bearer token', '/api/v1/provider/inventory'))).rejects.toThrow('Your provider account is pending approval. You cannot access this module yet.');
    await expect(guard.canActivate(contextWithHeader('Bearer token', '/api/v1/provider/chats'))).rejects.toThrow('Your provider account is pending approval. You cannot access this module yet.');
    await expect(guard.canActivate(contextWithHeader('Bearer token', '/api/v1/provider/reviews'))).rejects.toThrow('Your provider account is pending approval. You cannot access this module yet.');
    await expect(guard.canActivate(contextWithHeader('Bearer token', '/api/v1/provider/business-info'))).resolves.toBe(true);
  });

  it('accepts a valid sessionId and rejects a revoked or missing session', async () => {
    const { guard, repository } = createGuard({ payload: { uid: 'user_1', role: UserRole.REGISTERED_USER, sessionId: 'session_1' }, user: { id: 'user_1', role: UserRole.REGISTERED_USER, isActive: true, deletedAt: null } });

    await expect(guard.canActivate(contextWithHeader())).resolves.toBe(true);
    expect(repository.findActiveSessionForJwtGuard).toHaveBeenCalledWith('session_1', 'user_1');

    const { guard: revokedGuard } = createGuard({ payload: { uid: 'user_1', role: UserRole.REGISTERED_USER, sessionId: 'session_1' }, user: { id: 'user_1', role: UserRole.REGISTERED_USER, isActive: true, deletedAt: null }, session: null });
    await expect(revokedGuard.canActivate(contextWithHeader())).rejects.toThrow('Session has expired');
  });

  it('no longer imports PrismaService or uses this.prisma and repository owns DB lookups', () => {
    const guardSource = readFileSync('src/common/guards/jwt-auth.guard.ts', 'utf8');
    const repositorySource = readFileSync('src/common/repositories/jwt-auth.repository.ts', 'utf8');

    expect(guardSource).not.toContain('PrismaService');
    expect(guardSource).not.toContain('this.prisma');
    expect(guardSource).toContain('repository.findUserForJwtGuard');
    expect(guardSource).toContain('repository.findActiveSessionForJwtGuard');
    expect(repositorySource).toContain('constructor(private readonly prisma: PrismaService)');
    expect(repositorySource).toContain('findUserForJwtGuard');
    expect(repositorySource).toContain('findActiveSessionForJwtGuard');
  });
});
