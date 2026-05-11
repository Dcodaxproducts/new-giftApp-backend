import { OpenAPIObject } from '@nestjs/swagger';
import { applySwaggerAccessMetadata, getSwaggerAccessRule } from './swagger-access';

describe('Swagger access metadata', () => {
  it('documents role-specific APIs without falling back to generic Authenticated', () => {
    expect(getSwaggerAccessRule('GET', '/api/v1/admin-roles')?.allowedRoles).toBe('SUPER_ADMIN');
    expect(getSwaggerAccessRule('PATCH', '/api/v1/providers/{id}/status')?.allowedRoles).toContain('SUPER_ADMIN or ADMIN with provider lifecycle permission');
    expect(getSwaggerAccessRule('GET', '/api/v1/provider/inventory')?.allowedRoles).toBe('PROVIDER');
    expect(getSwaggerAccessRule('GET', '/api/v1/customer/wallet/history')?.allowedRoles).toBe('REGISTERED_USER');
    expect(getSwaggerAccessRule('GET', '/api/v1/audit-logs')?.allowedRoles).toBe('SUPER_ADMIN');
  });

  it('applies explicit x-allowed-roles and descriptions to OpenAPI operations', () => {
    const document = {
      paths: {
        '/api/v1/providers/{id}/status': { patch: { security: [{ bearer: [] }] } },
        '/api/v1/customer/wallet/history': { get: { security: [{ bearer: [] }] } },
        '/api/v1/gift-categories/lookup': { get: { security: [{ bearer: [] }] } },
      },
    } as unknown as OpenAPIObject;

    applySwaggerAccessMetadata(document);

    const providerStatus = document.paths['/api/v1/providers/{id}/status']?.patch as unknown as { 'x-allowed-roles': string; description: string };
    const walletHistory = document.paths['/api/v1/customer/wallet/history']?.get as unknown as { 'x-allowed-roles': string; description: string };
    const publicLookup = document.paths['/api/v1/gift-categories/lookup']?.get as unknown as { 'x-allowed-roles': string; security?: unknown };

    expect(providerStatus['x-allowed-roles']).toContain('SUPER_ADMIN or ADMIN with provider lifecycle permission');
    expect(providerStatus.description).toContain('APPROVE requires providers.approve');
    expect(walletHistory['x-allowed-roles']).toBe('REGISTERED_USER');
    expect(publicLookup['x-allowed-roles']).toBe('PUBLIC');
    expect(publicLookup.security).toBeUndefined();
  });
});
