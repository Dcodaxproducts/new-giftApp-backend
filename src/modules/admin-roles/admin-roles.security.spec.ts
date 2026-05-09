import { readFileSync } from 'fs';
import { join } from 'path';

describe('Admin roles RBAC security', () => {
  const source = readFileSync(join(__dirname, 'admin-roles.controller.ts'), 'utf8');

  it('admin roles APIs are guarded and restricted to SUPER_ADMIN', () => {
    expect(source).toContain('@UseGuards(JwtAuthGuard, RolesGuard)');
    expect(source).toContain('@Roles(UserRole.SUPER_ADMIN)');
    expect(source).toContain("@Controller('admin-roles')");
    expect(source).toContain('constructor(adminRolesService: AdminRolesService)');
    expect(source).toContain('super(adminRolesService)');
  });

  it('permission catalog is read-only and SUPER_ADMIN only', () => {
    const catalogController = source.slice(source.indexOf('export class PermissionCatalogController'));
    expect(catalogController).toContain("@Get('catalog')");
    expect(catalogController).toContain('constructor(adminRolesService: AdminRolesService)');
    expect(catalogController).toContain('super(adminRolesService)');
    expect(catalogController).not.toContain('@Post');
    expect(catalogController).not.toContain('@Patch');
    expect(catalogController).not.toContain('@Delete');
  });
});
