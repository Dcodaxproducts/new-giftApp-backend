import { readFileSync } from 'fs';
import { join } from 'path';

describe('AdminManagementController danger delete', () => {
  it('DELETE /admins/:id is SUPER_ADMIN only and documents permanent delete warning', () => {
    const controller = readFileSync(join(__dirname, 'admin-management.controller.ts'), 'utf8');
    expect(controller).toContain("@ApiTags('02 Admin - Staff Management')");
    expect(controller).toContain("@Delete(':id')");
    expect(controller).toContain('@Roles(UserRole.SUPER_ADMIN)');
    expect(controller).toContain('Permanently delete admin staff user');
    expect(controller).toContain('DANGER:');
    expect(controller).toContain('permanentlyDelete(user, id, dto)');
  });
});
