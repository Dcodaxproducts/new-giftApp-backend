import { ConflictException, ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { readFileSync } from 'fs';
import { AdminManagementService } from './admin-management.service';

const superAdmin = { uid: 'super_1', role: UserRole.SUPER_ADMIN };
const adminRole = {
  id: 'role_1',
  name: 'Gift Manager',
  slug: 'GIFT_MANAGER',
  description: 'Gift manager',
  permissions: { gifts: ['create'] },
  isActive: true,
  deletedAt: null,
};
const adminUser = {
  id: 'admin_1',
  email: 'staff@example.com',
  role: UserRole.ADMIN,
  firstName: 'Ops',
  lastName: 'User',
  phone: null,
  avatarUrl: null,
  adminTitle: 'Ops',
  adminRoleId: 'role_1',
  adminPermissions: { gifts: ['create'] },
  isVerified: true,
  isActive: true,
  isApproved: true,
  mustChangePassword: true,
  providerApprovalStatus: null,
  verificationOtp: null,
  verificationOtpExpiresAt: null,
  lastLoginAt: null,
  refreshTokenHash: 'refresh',
  deletedAt: null,
  createdAt: new Date(),
  adminRole,
};

function createService() {
  const repository = {
    findAdminRoleById: jest.fn().mockResolvedValue(adminRole),
    findAdminByEmail: jest.fn().mockResolvedValue(null),
    createAdminUser: jest.fn().mockResolvedValue(adminUser),
    findManyAdmins: jest.fn().mockResolvedValue([adminUser]),
    countAdmins: jest.fn().mockResolvedValue(1),
    findAdminById: jest.fn().mockResolvedValue(adminUser),
    updateAdminUser: jest.fn().mockResolvedValue(adminUser),
    countOtherActiveSuperAdmins: jest.fn().mockResolvedValue(1),
    updateAdminPasswordHash: jest.fn().mockResolvedValue(undefined),
    deleteAdminPermanently: jest.fn().mockResolvedValue(undefined),
  };
  const config = { get: jest.fn().mockReturnValue('https://app.giftapp.com') };
  const mailer = { sendAdminInviteEmail: jest.fn().mockResolvedValue(undefined) };
  const auditLog = { write: jest.fn().mockResolvedValue(undefined) };
  const service = new AdminManagementService(config as never, mailer as never, auditLog as never, repository as never);
  return { service, repository, config, mailer, auditLog };
}

describe('AdminManagementService', () => {
  it('has local repository boundary and no longer only delegates to AuthService', () => {
    const source = readFileSync('src/modules/admin-management/admin-management.service.ts', 'utf8');
    const repositorySource = readFileSync('src/modules/admin-management/admin-management.repository.ts', 'utf8');
    expect(source).toContain('AdminManagementRepository');
    expect(source).not.toContain('AuthService');
    expect(source).toContain('this.repository.createAdminUser');
    expect(repositorySource).toContain('createAdminUser');
    expect(repositorySource).toContain('deleteAdminPermanently');
  });

  it('admin creation behavior remains unchanged', async () => {
    const { service, mailer, auditLog } = createService();
    const result = await service.create(superAdmin, {
      email: 'staff@example.com',
      temporaryPassword: 'Temp@123456',
      generateTemporaryPassword: false,
      mustChangePassword: true,
      firstName: 'Ops',
      lastName: 'User',
      roleId: 'role_1',
      sendInviteEmail: true,
    });
    expect(result.message).toBe('Admin staff user created successfully and invite email sent.');
    expect(result.data).toEqual({ id: 'admin_1', email: 'staff@example.com', role: UserRole.ADMIN, roleId: 'role_1', inviteEmailSent: true });
    expect(mailer.sendAdminInviteEmail).toHaveBeenCalled();
    expect(auditLog.write).toHaveBeenCalledWith(expect.objectContaining({ action: 'ADMIN_CREATED', targetId: 'admin_1' }));
  });

  it('admin list/details/update/password/delete behavior remains unchanged', async () => {
    const { service, repository, auditLog } = createService();
    await expect(service.list(superAdmin, {})).resolves.toEqual(expect.objectContaining({ message: 'Admins fetched successfully' }));
    await expect(service.details(superAdmin, 'admin_1')).resolves.toEqual(expect.objectContaining({ message: 'Admin details fetched successfully' }));
    await expect(service.update(superAdmin, 'admin_1', { firstName: 'Updated' })).resolves.toEqual(expect.objectContaining({ message: 'Admin updated successfully' }));
    await expect(service.resetPassword(superAdmin, 'admin_1', {})).resolves.toEqual({ data: null, message: 'Temporary password generated successfully' });
    await expect(service.permanentlyDelete(superAdmin, 'admin_1', { confirmation: 'PERMANENTLY_DELETE_ADMIN', reason: 'Cleanup' })).resolves.toEqual({ data: { deletedAdminId: 'admin_1' }, message: 'Admin staff user permanently deleted successfully.' });
    expect(repository.deleteAdminPermanently).toHaveBeenCalledWith('admin_1');
    expect(auditLog.write).toHaveBeenCalledWith(expect.objectContaining({ action: 'ADMIN_STAFF_PERMANENTLY_DELETED' }));
  });

  it('preserves duplicate user protection and self-delete protection', async () => {
    const { service, repository } = createService();
    repository.findAdminByEmail.mockResolvedValueOnce(adminUser);
    await expect(service.create(superAdmin, {
      email: 'staff@example.com',
      temporaryPassword: 'Temp@123456',
      generateTemporaryPassword: false,
      firstName: 'Ops',
      lastName: 'User',
      roleId: 'role_1',
    })).rejects.toThrow(ConflictException);

    await expect(service.permanentlyDelete({ uid: 'admin_1', role: UserRole.SUPER_ADMIN }, 'admin_1', { confirmation: 'PERMANENTLY_DELETE_ADMIN', reason: 'Cleanup' })).rejects.toThrow(ForbiddenException);
  });
});
