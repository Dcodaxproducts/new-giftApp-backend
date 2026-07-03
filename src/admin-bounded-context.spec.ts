import { existsSync, readFileSync } from 'fs';

describe('admin bounded-context source ownership', () => {
  it('keeps staff-management DTO source local', () => {
    const source = readFileSync('src/modules/staff-management/dto/staff-management.dto.ts', 'utf8');

    expect(source).toContain('export class CreateAdminDto');
    expect(source).toContain('export class ListAdminsDto');
    expect(source).not.toContain('export class PermanentlyDeleteAdminDto');
    expect(source).not.toContain('CreateStaffRoleDto');
    expect(source).not.toContain("from '../../auth/dto/staff-management.dto'");
  });

  it('keeps staff-roles DTO source local', () => {
    const source = readFileSync('src/modules/staff-roles/dto/staff-roles.dto.ts', 'utf8');

    expect(source).toContain('export class CreateStaffRoleDto');
    expect(source).toContain('export class ListStaffRolesDto');
    expect(source).toContain('export class UpdateRolePermissionsDto');
    expect(source).not.toContain('CreateAdminDto');
    expect(source).not.toContain("from '../../auth/dto/staff-management.dto'");
  });

  it('owns permission catalog outside auth with stable permission keys', () => {
    const source = readFileSync('src/modules/staff-roles/constants/permission-catalog.ts', 'utf8');

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
    expect(existsSync('src/modules/auth/staff-roles.repository.ts')).toBe(false);
    expect(existsSync('src/modules/auth/permissions-catalog.repository.ts')).toBe(false);
    expect(authModule).not.toContain('AdminStaffRepository');
    expect(authModule).not.toContain('StaffRolesRepository');
    expect(authModule).not.toContain('PermissionsCatalogRepository');
  });

  it('keeps provider/user management DTOs out of auth dto files', () => {
    const authDto = readFileSync('src/modules/auth/dto/auth.dto.ts', 'utf8');
    const providerDto = readFileSync('src/modules/provider-management/dto/provider-management.dto.ts', 'utf8');
    const userController = readFileSync('src/modules/user-management/controllers/user-management.controller.ts', 'utf8');

    expect(existsSync('src/modules/auth/dto/admin-auth.dto.ts')).toBe(false);
    expect(authDto).not.toContain('export class CreateGuestSessionDto');
    expect(authDto).not.toContain('RejectProviderDto');
    expect(authDto).not.toContain('UpdateUserActiveStatusDto');
    expect(providerDto).toContain('export class RejectProviderDto');
    expect(userController).toContain("@Patch(':id/status')");
  });
});
