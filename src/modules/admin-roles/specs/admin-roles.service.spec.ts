import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { readFileSync } from 'fs';
import { AdminRolesService } from '../services/admin-roles.service';

const superAdmin = { uid: 'super_1', role: UserRole.SUPER_ADMIN };
const role = {
  id: 'role_1',
  name: 'Gift Manager',
  slug: 'GIFT_MANAGER',
  description: 'Gift manager',
  permissions: { gifts: ['read'] },
  isSystem: false,
  isActive: true,
  deletedAt: null,
  createdAt: new Date(),
};

function createService() {
  const repository = {
    findManyAdminRoles: jest.fn().mockResolvedValue([{ ...role, _count: { admins: 1 } }]),
    findAdminRoleById: jest.fn().mockResolvedValue(role),
    findAdminRoleBySlug: jest.fn().mockResolvedValue(null),
    createAdminRole: jest.fn().mockResolvedValue(role),
    updateAdminRole: jest.fn().mockResolvedValue(role),
    updateAdminRolePermissions: jest.fn().mockResolvedValue({ ...role, permissions: { gifts: ['create'] } }),
    countAdminsUsingRole: jest.fn().mockResolvedValue(0),
    deleteAdminRole: jest.fn().mockResolvedValue(undefined),
  };
  const auditLog = { write: jest.fn().mockResolvedValue(undefined) };
  const catalogRepository = { getPermissionCatalog: jest.fn().mockReturnValue([{ module: 'admins' }]) };
  const service = new AdminRolesService(auditLog as never, repository as never, catalogRepository);
  return { service, repository, auditLog, catalogRepository };
}

describe('AdminRolesService', () => {
  it('has local repositories and no longer only delegates to AuthService', () => {
    const source = readFileSync('src/modules/admin-roles/services/admin-roles.service.ts', 'utf8');
    const repositorySource = readFileSync('src/modules/admin-roles/repositories/admin-roles.repository.ts', 'utf8');
    const catalogSource = readFileSync('src/modules/admin-roles/repositories/permissions-catalog.repository.ts', 'utf8');
    expect(source).toContain('AdminRolesRepository');
    expect(source).toContain('PermissionsCatalogRepository');
    expect(source).not.toContain('AuthService');
    expect(source).toContain('this.repository.createAdminRole');
    expect(repositorySource).toContain('updateAdminRolePermissions');
    expect(catalogSource).toContain('getPermissionCatalog');
  });

  it('admin role CRUD behavior remains unchanged', async () => {
    const { service, repository, auditLog } = createService();
    await expect(service.list(superAdmin as never, {})).resolves.toEqual(expect.objectContaining({ message: 'Admin roles fetched successfully' }));
    await expect(service.details(superAdmin as never, 'role_1')).resolves.toEqual(expect.objectContaining({ message: 'Admin role fetched successfully' }));
    await expect(service.create(superAdmin as never, { name: 'Gift Manager', permissions: { gifts: ['read'] } })).resolves.toEqual(expect.objectContaining({ message: 'Admin role created successfully' }));
    await expect(service.update(superAdmin as never, 'role_1', { name: 'Gift Manager' })).resolves.toEqual(expect.objectContaining({ message: 'Admin role updated successfully' }));
    await expect(service.updatePermissions(superAdmin as never, 'role_1', { permissions: { gifts: ['create'] } })).resolves.toEqual({ data: { id: 'role_1', permissions: { gifts: ['create'] } }, message: 'Role permissions updated successfully' });
    await expect(service.delete(superAdmin as never, 'role_1')).resolves.toEqual({ data: null, message: 'Admin role deleted successfully' });
    expect(repository.deleteAdminRole).toHaveBeenCalledWith('role_1');
    expect(auditLog.write).toHaveBeenCalledWith(expect.objectContaining({ action: 'ADMIN_ROLE_DELETED' }));
  });

  it('permission catalog behavior remains unchanged', () => {
    const { service, catalogRepository } = createService();
    expect(service.catalog()).toEqual({ data: [{ module: 'admins' }], message: 'Permission catalog fetched successfully' });
    expect(catalogRepository.getPermissionCatalog).toHaveBeenCalled();
  });

  it('preserves system role protections and assigned-role delete protection', async () => {
    const { service, repository } = createService();
    repository.findAdminRoleById.mockResolvedValueOnce({ ...role, slug: UserRole.SUPER_ADMIN });
    await expect(service.update(superAdmin as never, 'role_1', { name: 'x' })).rejects.toThrow(ForbiddenException);

    repository.findAdminRoleById.mockResolvedValueOnce({ ...role, isSystem: true });
    await expect(service.delete(superAdmin as never, 'role_1')).rejects.toThrow(ForbiddenException);

    repository.findAdminRoleById.mockResolvedValueOnce(role);
    repository.countAdminsUsingRole.mockResolvedValueOnce(2);
    await expect(service.delete(superAdmin as never, 'role_1')).rejects.toThrow(BadRequestException);
  });
});
