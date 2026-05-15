import { readFileSync } from 'fs';
import { join } from 'path';

describe('Provider profile auth surface source safety', () => {
  const controller = readFileSync(join(__dirname, 'auth.controller.ts'), 'utf8');
  const service = readFileSync(join(__dirname, 'auth.service.ts'), 'utf8');
  const authRepository = readFileSync(join(__dirname, 'auth.repository.ts'), 'utf8');
  const authSessionsRepository = readFileSync(join(__dirname, 'auth-sessions.repository.ts'), 'utf8');
  const dto = readFileSync(join(__dirname, 'dto/auth.dto.ts'), 'utf8');
  const schema = readFileSync(join(__dirname, '../../../prisma/schema.prisma'), 'utf8');

  it('uses generic auth endpoints for profile, password, and sessions', () => {
    expect(controller).toContain("@Get('me')");
    expect(controller).toContain("@Patch('me')");
    expect(controller).toContain("@Patch('change-password')");
    expect(controller).toContain("@Get('sessions')");
    expect(controller).toContain("@Post('sessions/logout-all')");
    expect(controller).toContain("@Delete('sessions/:id')");
  });

  it('auth me returns provider summary and no sensitive token/hash fields', () => {
    expect(service).toContain('provider: {');
    expect(service).toContain('memberSince: user.createdAt');
    expect(service).toContain("status: user.isActive ? 'ACTIVE' : 'INACTIVE'");
    expect(service).not.toContain('password: user.password');
    expect(service).not.toContain('refreshTokenHash: user.refreshTokenHash');
  });

  it('patch me updates only common own profile fields', () => {
    expect(dto).toContain('class UpdateOwnProfileDto');
    expect(service).toContain('async updateMe(user: AuthUserContext');
    expect(authRepository).toContain('where: { id: userId }');
    expect(service).toContain('firstName: dto.firstName');
    expect(service).not.toContain('role: dto.role');
    expect(dto).not.toContain('isActive');
    expect(dto).not.toContain('approvalStatus');
  });

  it('generic auth sessions are own-user scoped and do not expose refresh token hashes', () => {
    expect(schema).toContain('model AuthSession');
    expect(authSessionsRepository).toContain('userId');
    expect(service).toContain('isCurrent: session.id === user.sessionId');
    expect(service).toContain('revokedAt: new Date()');
    expect(service).not.toContain('refreshTokenHash: session.refreshTokenHash');
  });
});
