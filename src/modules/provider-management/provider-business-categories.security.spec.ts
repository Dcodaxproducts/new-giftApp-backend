import { readFileSync } from 'fs';
import { join } from 'path';

describe('Provider business category security', () => {
  const controller = readFileSync(join(__dirname, 'provider-business-categories.controller.ts'), 'utf8');
  const service = readFileSync(join(__dirname, 'provider-business-categories.service.ts'), 'utf8');

  it('keeps only public list and protects details/mutations with dashboard roles and permissions', () => {
    expect(controller).toContain('@Permissions(\'providerBusinessCategories.read\')');
    expect(controller).toContain('@Permissions(\'providerBusinessCategories.create\')');
    expect(controller).toContain('@Permissions(\'providerBusinessCategories.update\')');
    expect(controller).toContain('@Permissions(\'providerBusinessCategories.delete\')');
    expect(controller).toContain('@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)');
    expect(controller).toContain('@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)');
    expect(controller.indexOf('@Get()')).toBeLessThan(controller.indexOf('@Post()'));
  });

  it('public list returns active non-deleted categories only and delete is soft guarded', () => {
    expect(service).toContain('isActive: true');
    expect(service).toContain('activeProviders > 0');
    expect(service).toContain('deletedAt: new Date()');
  });
});
