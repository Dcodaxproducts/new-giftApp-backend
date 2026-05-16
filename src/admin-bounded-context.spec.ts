import { existsSync, readFileSync } from 'fs';

describe('admin bounded-context source ownership', () => {
  it('keeps admin-management DTO source local', () => {
    const source = readFileSync('src/modules/admin-management/dto/admin-management.dto.ts', 'utf8');

    expect(source).toContain('export class CreateAdminDto');
    expect(source).toContain('export class ListAdminsDto');
    expect(source).toContain('export class PermanentlyDeleteAdminDto');
    expect(source).not.toContain('CreateAdminRoleDto');
    expect(source).not.toContain("from '../../auth/dto/admin-management.dto'");
  });

  it('keeps admin-roles DTO source local', () => {
    const source = readFileSync('src/modules/admin-roles/dto/admin-roles.dto.ts', 'utf8');

    expect(source).toContain('export class CreateAdminRoleDto');
    expect(source).toContain('export class ListAdminRolesDto');
    expect(source).toContain('export class UpdateRolePermissionsDto');
    expect(source).not.toContain('CreateAdminDto');
    expect(source).not.toContain("from '../../auth/dto/admin-management.dto'");
  });

  it('owns permission catalog outside auth with stable permission keys', () => {
    const source = readFileSync('src/modules/admin-roles/constants/permission-catalog.ts', 'utf8');

    expect(existsSync('src/modules/auth/permission-catalog.ts')).toBe(false);
    expect(source).toContain("module: 'admins'");
    expect(source).toContain("key: 'resetPassword'");
    expect(source).toContain("module: 'providerDisputes'");
    expect(source).toContain("key: 'logs.export'");
    expect(source).toContain('SUPER_ADMIN_PERMISSIONS');
  });

  it('keeps legacy admin/RBAC repositories out of auth module ownership', () => {
    const authModule = readFileSync('src/modules/auth/auth.module.ts', 'utf8');

    expect(existsSync('src/modules/auth/admin-staff.repository.ts')).toBe(false);
    expect(existsSync('src/modules/auth/admin-roles.repository.ts')).toBe(false);
    expect(existsSync('src/modules/auth/permissions-catalog.repository.ts')).toBe(false);
    expect(authModule).not.toContain('AdminStaffRepository');
    expect(authModule).not.toContain('AdminRolesRepository');
    expect(authModule).not.toContain('PermissionsCatalogRepository');
  });

  it('keeps provider/user management DTOs out of auth dto files', () => {
    const authDto = readFileSync('src/modules/auth/dto/auth.dto.ts', 'utf8');
    const providerDto = readFileSync('src/modules/provider-management/dto/provider-management.dto.ts', 'utf8');
    const userController = readFileSync('src/modules/user-management/user-management.controller.ts', 'utf8');

    expect(existsSync('src/modules/auth/dto/admin-auth.dto.ts')).toBe(false);
    expect(authDto).toContain('export class GuestSessionDto');
    expect(authDto).not.toContain('RejectProviderDto');
    expect(authDto).not.toContain('UpdateUserActiveStatusDto');
    expect(providerDto).toContain('export class RejectProviderDto');
    expect(userController).toContain("@Patch(':id/status')");
  });
});
