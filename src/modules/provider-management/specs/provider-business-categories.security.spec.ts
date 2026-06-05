import { readFileSync } from 'fs';
import { join } from 'path';

describe('Provider business category security', () => {
  const controller = readFileSync(join(__dirname, '../controllers/provider-business-categories.controller.ts'), 'utf8');
  const service = readFileSync(join(__dirname, '../services/provider-business-categories.service.ts'), 'utf8');
  const repository = readFileSync(join(__dirname, '../repositories/provider-business-categories.repository.ts'), 'utf8');

  it('keeps only public list and protects details/mutations with dashboard roles and permissions', () => {
    expect(controller).toContain('@Permissions(\'providerBusinessCategories.read\')');
    expect(controller).toContain('@Permissions(\'providerBusinessCategories.create\')');
    expect(controller).toContain('@Permissions(\'providerBusinessCategories.update\')');
    expect(controller).toContain('@Permissions(\'providerBusinessCategories.delete\')');
    expect(controller).toContain("@ApiTags('02 Admin - Provider Business Categories')");
    expect(controller).toContain('@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)');
    expect(controller).toContain('@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)');
    expect(controller.indexOf('@Get()')).toBeLessThan(controller.indexOf('@Post()'));
  });

  it('public list returns non-deleted categories and lookup returns active signup categories only', () => {
    expect(service).toContain('query.isActive === undefined ? {} : { isActive: query.isActive }');
    expect(service).toContain('return this.list({ ...query, isActive: true })');
    expect(service).toContain('activeProviders > 0');
    expect(repository).toContain('providerBusinessCategory.delete');
  });

  it('keeps route order unique and documents listing behavior', () => {
    expect(controller.indexOf('@Get()')).toBeLessThan(controller.indexOf("@Get('lookup')"));
    expect(controller.indexOf("@Get('lookup')")).toBeLessThan(controller.indexOf("@Get(':id')"));
    expect(controller).toContain('Lists provider business categories. By default returns all non-deleted categories. Use isActive=true or isActive=false to filter by active state.');
    expect(controller).toContain('Public/provider-signup dropdown. Returns active provider business categories only.');
  });
});
