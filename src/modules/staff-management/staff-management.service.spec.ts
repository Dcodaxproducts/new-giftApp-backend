/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { ConflictException, ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { readFileSync } from 'fs';
import { StaffManagementService } from './staff-management.service';

const superAdmin = { uid: 'super_1', role: UserRole.SUPER_ADMIN };
const staffRole = {
  id: 'role_1',
  name: 'Gift Manager',
  slug: 'GIFT_MANAGER',
  description: 'Gift manager',
  permissions: { gifts: ['create'] },
};
const adminUser = {
  id: 'admin_1',
  email: 'staff@example.com',
  role: UserRole.STAFF,
  firstName: 'Ops',
  lastName: 'User',
  phone: null,
  avatarUrl: null,
  staffProfile: { staffRoleId: 'role_1', staffRole },
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
};

function createService() {
  const repository = {
    findStaffRoleById: jest.fn().mockResolvedValue(staffRole),
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
  const service = new StaffManagementService(auditLog as never, repository as never);
  return { service, repository, config, mailer, auditLog };
}

describe('StaffManagementService', () => {
  it('has local repository boundary and no longer only delegates to AuthService', () => {
    const source = readFileSync('src/modules/staff-management/staff-management.service.ts', 'utf8');
    const repositorySource = readFileSync('src/modules/staff-management/staff-management.repository.ts', 'utf8');
    expect(source).toContain('StaffManagementRepository');
    expect(source).not.toContain('AuthService');
    expect(source).toContain('this.repository.createAdminUser');
    expect(repositorySource).toContain('createAdminUser');
    expect(repositorySource).toContain('deleteAdminPermanently');
  });

  it('creates a staff user with the provided password', async () => {
    const { service, auditLog } = createService();
    const result = await service.create(superAdmin, {
      email: 'staff@example.com',
      password: 'Temp@123456',
      firstName: 'Ops',
      lastName: 'User',
      roleId: 'role_1',
    });
    expect(result.message).toBe('Staff user created successfully.');
    expect(result.data).toEqual({ id: 'admin_1', email: 'staff@example.com', role: UserRole.STAFF, roleId: 'role_1' });
    expect(auditLog.write).toHaveBeenCalledWith(expect.objectContaining({ action: 'ADMIN_CREATED', targetId: 'admin_1' }));
  });

  it('admin list/details/update/password/delete behavior remains unchanged', async () => {
    const { service, repository, auditLog } = createService();
    await expect(service.list(superAdmin, {})).resolves.toEqual(expect.objectContaining({ message: 'Staff fetched successfully' }));
    await expect(service.details(superAdmin, 'admin_1')).resolves.toEqual(expect.objectContaining({ message: 'Staff details fetched successfully' }));
    await expect(service.update(superAdmin, 'admin_1', { email: 'Staff.Updated@Example.com', firstName: 'Updated' })).resolves.toEqual(expect.objectContaining({ message: 'Staff updated successfully' }));
    expect(repository.updateAdminUser).toHaveBeenCalledWith('admin_1', expect.objectContaining({ userData: expect.objectContaining({ email: 'staff.updated@example.com', firstName: 'Updated' }) }));
    await expect(service.update(superAdmin, 'admin_1', { isActive: false, reason: 'Staff access paused.' })).resolves.toEqual(expect.objectContaining({ message: 'Staff updated successfully' }));
    await expect(service.update(superAdmin, 'admin_1', { isActive: true, reason: 'Staff account re-enabled.' })).resolves.toEqual(expect.objectContaining({ message: 'Staff updated successfully' }));
    expect(repository.updateAdminUser).toHaveBeenCalledWith('admin_1', expect.objectContaining({ userData: expect.objectContaining({ isActive: false, refreshTokenHash: null }) }));
    expect(auditLog.write).toHaveBeenCalledWith(expect.objectContaining({ action: 'ADMIN_UPDATED', afterJson: expect.objectContaining({ reason: 'Staff account re-enabled.' }) }));
    await expect(service.resetPassword(superAdmin, 'admin_1', {})).resolves.toEqual({ data: null, message: 'Temporary password generated successfully' });
    await expect(service.permanentlyDelete(superAdmin, 'admin_1')).resolves.toEqual({ data: { deletedStaffId: 'admin_1' }, message: 'Staff user permanently deleted successfully.' });
    expect(repository.deleteAdminPermanently).toHaveBeenCalledWith('admin_1');
    expect(auditLog.write).toHaveBeenCalledWith(expect.objectContaining({ action: 'ADMIN_STAFF_PERMANENTLY_DELETED' }));
  });

  it('preserves duplicate user protection and self-delete protection', async () => {
    const { service, repository } = createService();
    repository.findAdminByEmail.mockResolvedValueOnce(adminUser);
    await expect(service.create(superAdmin, {
      email: 'staff@example.com',
      password: 'Temp@123456',
      firstName: 'Ops',
      lastName: 'User',
      roleId: 'role_1',
    })).rejects.toThrow(ConflictException);

    repository.findAdminByEmail.mockResolvedValueOnce({ ...adminUser, id: 'admin_2', email: 'taken@example.com' });
    await expect(service.update(superAdmin, 'admin_1', { email: 'taken@example.com' })).rejects.toThrow(ConflictException);

    await expect(service.permanentlyDelete({ uid: 'admin_1', role: UserRole.SUPER_ADMIN }, 'admin_1')).rejects.toThrow(ForbiddenException);
  });

  it('preserves super admin downgrade and last-active safety checks', async () => {
    const { service, repository } = createService();
    const superAdminUser = { ...adminUser, id: 'super_1', role: UserRole.SUPER_ADMIN };

    repository.findAdminById.mockResolvedValue(superAdminUser);
    await expect(service.update({ uid: 'other_super', role: UserRole.SUPER_ADMIN }, 'super_1', { roleId: 'role_1' })).rejects.toThrow(ForbiddenException);

    repository.countOtherActiveSuperAdmins.mockResolvedValueOnce(0);
    await expect(service.update({ uid: 'other_super', role: UserRole.SUPER_ADMIN }, 'super_1', { isActive: false })).rejects.toThrow(ForbiddenException);
    await expect(service.update({ uid: 'super_1', role: UserRole.SUPER_ADMIN }, 'super_1', { isActive: false })).rejects.toThrow(ForbiddenException);
  });

  it('removes old admin active-status route from Swagger', () => {
    const controller = readFileSync('src/modules/staff-management/staff-management.controller.ts', 'utf8');
    const openapi = JSON.parse(readFileSync('docs/generated/openapi.json', 'utf8')) as { paths: Record<string, { patch?: { requestBody?: { content?: { 'application/json'?: { examples?: Record<string, unknown> } } } } }> };
    expect(controller).toContain("@Patch(':id')");
    expect(controller).not.toContain("@Patch(':id/active-status')");
    expect(openapi.paths['/api/v1/staff/{id}']).toBeDefined();
    expect(openapi.paths['/api/v1/staff/{id}/active-status']).toBeUndefined();
    expect(Object.keys(openapi.paths['/api/v1/staff/{id}']?.patch?.requestBody?.content?.['application/json']?.examples ?? {})).toEqual(expect.arrayContaining(['updateStaffProfile', 'activateStaff', 'deactivateStaff']));
  });
});
