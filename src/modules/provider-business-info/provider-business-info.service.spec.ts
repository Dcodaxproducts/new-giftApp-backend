import { readFileSync } from 'fs';
import { join } from 'path';

describe('Provider business info source safety', () => {
  const controller = readFileSync(join(__dirname, 'provider-business-info.controller.ts'), 'utf8');
  const service = readFileSync(join(__dirname, 'provider-business-info.service.ts'), 'utf8');
  const dto = readFileSync(join(__dirname, 'dto/provider-business-info.dto.ts'), 'utf8');

  it('exposes provider-only business info endpoints without duplicate profile routes', () => {
    expect(controller).toContain("@ApiTags('03 Provider - Business Info')");
    expect(controller).toContain("@Controller('provider/business-info')");
    expect(controller).toContain('@Roles(UserRole.PROVIDER)');
    expect(controller).toContain('@Get()');
    expect(controller).toContain('@Patch()');
  });

  it('updates own provider only and blocks status self-approval fields', () => {
    expect(service).toContain('where: { id, role: UserRole.PROVIDER');
    expect(service).toContain('where: { id: user.uid }');
    expect(dto).not.toContain('approvalStatus');
    expect(dto).not.toContain('isActive');
    expect(service).not.toContain('providerApprovalStatus: dto.approvalStatus');
    expect(service).not.toContain('isActive: dto.isActive');
  });

  it('material business changes trigger pending verification, audit, and admin notification', () => {
    expect(service).toContain('materialChange');
    expect(service).toContain('ProviderApprovalStatus.PENDING');
    expect(service).toContain('PROVIDER_BUSINESS_INFO_UPDATED');
    expect(service).toContain('providerWebsite: dto.website');
    expect(service).toContain('ADMIN_PROVIDER_REVIEW_NEEDED');
  });
});
