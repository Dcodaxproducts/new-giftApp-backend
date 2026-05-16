import { readFileSync } from 'fs';
import { join } from 'path';

describe('User management repository cleanup', () => {
  const moduleDir = __dirname;
  const service = readFileSync(join(moduleDir, '../services/user-management.service.ts'), 'utf8');
  const repository = readFileSync(join(moduleDir, '../repositories/user-management.repository.ts'), 'utf8');
  const moduleFile = readFileSync(join(moduleDir, '../user-management.module.ts'), 'utf8');
  const controller = readFileSync(join(moduleDir, '../controllers/user-management.controller.ts'), 'utf8');

  it('keeps Prisma access inside UserManagementRepository', () => {
    expect(service).not.toContain('PrismaService');
    expect(service).not.toContain('this.prisma');
    expect(repository).toContain('constructor(private readonly prisma: PrismaService)');
    expect(moduleFile).toContain('UserManagementRepository');
  });

  it('repository owns registered-user reads, activity reads, status writes, password writes, and permanent delete danger-zone writes', () => {
    expect(repository).toContain('findManyUsers');
    expect(repository).toContain('countUsers');
    expect(repository).toContain('findUserById');
    expect(repository).toContain('findUserActivity');
    expect(repository).toContain('updateUser(');
    expect(repository).toContain('updateUserStatus');
    expect(repository).toContain('suspendUser');
    expect(repository).toContain('unsuspendUser');
    expect(repository).toContain('updateUserPasswordHash');
    expect(repository).toContain('deleteRegisteredUserPermanently');
    expect(repository).toContain('authSession.deleteMany');
    expect(repository).toContain('customerWalletLedger.deleteMany');
    expect(repository).toContain('loginAttempt.updateMany');
    expect(repository).toContain('user.delete');
  });

  it('service preserves registered-user-only management rules and business orchestration', () => {
    expect(service).toContain('role: UserRole.REGISTERED_USER');
    expect(service).toContain('deletedAt: null');
    expect(service).toContain('bcrypt.hash');
    expect(service).toContain('sendPasswordChangedEmail');
    expect(service).toContain('createPasswordChangedNotification');
    expect(service).toContain('recordAudit');
    expect(service).toContain('toDetail');
    expect(service).toContain('toStatusResponse');
    expect(service).toContain('Suspension reason is required');
  });

  it('controller keeps routes, permissions, roles, and Swagger tag stable', () => {
    expect(controller).toContain("@ApiTags('02 Admin - User Management')");
    expect(controller).toContain('@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)');
    expect(controller).toContain("@Permissions('users.read')");
    expect(controller).toContain("@Permissions('users.export')");
    expect(controller).toContain("@Permissions('users.update')");
    expect(controller).toContain("@Permissions('users.suspend')");
    expect(controller).toContain("@Permissions('users.resetPassword')");
    expect(controller).toContain('@Roles(UserRole.SUPER_ADMIN)');
    expect(controller).toContain("@Get(':id/activity')");
    expect(controller).toContain("@Get(':id/stats')");
    expect(controller).toContain("@Delete(':id')");
  });
});
