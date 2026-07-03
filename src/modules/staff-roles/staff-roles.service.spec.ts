import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { readFileSync } from 'fs';
import { StaffRolesService } from './staff-roles.service';

const superAdmin = { uid: 'super_1', role: UserRole.SUPER_ADMIN };
const role = {
  id: 'role_1',
  name: 'Gift Manager',
  slug: 'GIFT_MANAGER',
  description: 'Gift manager',
  permissions: { gifts: ['read'] },
  createdAt: new Date(),
};

function createService() {
  const repository = {
    findManyStaffRoles: jest.fn().mockResolvedValue([{ ...role, _count: { staffProfiles: 1 } }]),
    findStaffRoleById: jest.fn().mockResolvedValue(role),
    findStaffRoleBySlug: jest.fn().mockResolvedValue(null),
    createStaffRole: jest.fn().mockResolvedValue(role),
    updateStaffRole: jest.fn().mockResolvedValue(role),
    updateStaffRolePermissions: jest.fn().mockResolvedValue({ ...role, permissions: { gifts: ['create'] } }),
    countAdminsUsingRole: jest.fn().mockResolvedValue(0),
    deleteStaffRole: jest.fn().mockResolvedValue(undefined),
  };
  const auditLog = { write: jest.fn().mockResolvedValue(undefined) };
  const service = new StaffRolesService(auditLog as never, repository as never);
  return { service, repository, auditLog };
}

describe('StaffRolesService', () => {
  it('has local repositories and no longer only delegates to AuthService', () => {
    const source = readFileSync('src/modules/staff-roles/staff-roles.service.ts', 'utf8');
    const repositorySource = readFileSync('src/modules/staff-roles/staff-roles.repository.ts', 'utf8');
    expect(source).toContain('StaffRolesRepository');
    expect(source).not.toContain('AuthService');
    expect(source).toContain('this.repository.createStaffRole');
    expect(repositorySource).toContain('updateStaffRolePermissions');
  });

  it('staff role CRUD behavior remains unchanged', async () => {
    const { service, repository, auditLog } = createService();
    await expect(service.list(superAdmin as never, {})).resolves.toEqual(expect.objectContaining({ message: 'Staff roles fetched successfully' }));
    await expect(service.details(superAdmin as never, 'role_1')).resolves.toEqual(expect.objectContaining({ message: 'Staff role fetched successfully' }));
    await expect(service.create(superAdmin as never, { name: 'Gift Manager', permissions: { gifts: ['read'] } })).resolves.toEqual(expect.objectContaining({ message: 'Staff role created successfully' }));
    await expect(service.update(superAdmin as never, 'role_1', { name: 'Gift Manager' })).resolves.toEqual(expect.objectContaining({ message: 'Staff role updated successfully' }));
    await expect(service.updatePermissions(superAdmin as never, 'role_1', { permissions: { gifts: ['create'] } })).resolves.toEqual({ data: { id: 'role_1', permissions: { gifts: ['create'] } }, message: 'Role permissions updated successfully' });
    await expect(service.delete(superAdmin as never, 'role_1')).resolves.toEqual({ data: null, message: 'Staff role deleted successfully' });
    expect(repository.deleteStaffRole).toHaveBeenCalledWith('role_1');
    expect(auditLog.write).toHaveBeenCalledWith(expect.objectContaining({ action: 'STAFF_ROLE_DELETED' }));
  });

  it('lists newest staff roles first', async () => {
    const { service, repository } = createService();
    await service.list(superAdmin, {});
    expect(repository.findManyStaffRoles).toHaveBeenCalledWith(expect.objectContaining({ orderBy: { createdAt: 'desc' } }));
  });

  it('preserves super admin role protections and assigned-role delete protection', async () => {
    const { service, repository } = createService();
    repository.findStaffRoleById.mockResolvedValueOnce({ ...role, slug: UserRole.SUPER_ADMIN });
    await expect(service.update(superAdmin as never, 'role_1', { name: 'x' })).rejects.toThrow(ForbiddenException);

    repository.findStaffRoleById.mockResolvedValueOnce(role);
    repository.countAdminsUsingRole.mockResolvedValueOnce(2);
    await expect(service.delete(superAdmin as never, 'role_1')).rejects.toThrow(BadRequestException);
  });
});
