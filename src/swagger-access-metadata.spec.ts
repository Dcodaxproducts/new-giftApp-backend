import { OpenAPIObject } from '@nestjs/swagger';
import { applySwaggerAccessMetadata } from './swagger-access';

type TestMethod = 'get' | 'post' | 'patch' | 'delete';

function documentWith(paths: Record<string, Partial<Record<TestMethod, Record<string, unknown>>>>): OpenAPIObject {
  return {
    openapi: '3.0.0',
    info: { title: 'test', version: '1.0.0' },
    paths: paths as OpenAPIObject['paths'],
  };
}

describe('Swagger access metadata', () => {
  it.each([
    ['get', '/api/v1/admin-roles', 'SUPER_ADMIN'],
    ['get', '/api/v1/permissions/catalog', 'SUPER_ADMIN'],
    ['get', '/api/v1/admins', 'SUPER_ADMIN'],
    ['delete', '/api/v1/users/{id}', 'SUPER_ADMIN'],
    ['delete', '/api/v1/providers/{id}', 'SUPER_ADMIN'],
    ['patch', '/api/v1/providers/{id}/status', 'SUPER_ADMIN or ADMIN with provider lifecycle permission (APPROVE=>providers.approve, REJECT=>providers.reject, SUSPEND=>providers.suspend, UNSUSPEND=>providers.suspend, UPDATE_STATUS=>providers.updateStatus)'],
    ['get', '/api/v1/provider/inventory', 'PROVIDER'],
    ['get', '/api/v1/provider/orders/{id}', 'PROVIDER'],
    ['get', '/api/v1/customer/wallet/history', 'REGISTERED_USER'],
    ['get', '/api/v1/audit-logs', 'SUPER_ADMIN'],
    ['patch', '/api/v1/referral-settings', 'SUPER_ADMIN'],
    ['get', '/api/v1/media-upload-policy', 'SUPER_ADMIN or ADMIN with mediaPolicy.read'],
    ['patch', '/api/v1/media-upload-policy', 'SUPER_ADMIN'],
    ['post', '/api/v1/broadcasts', 'SUPER_ADMIN or ADMIN with broadcasts.create'],
    ['patch', '/api/v1/broadcasts/{id}/schedule', 'SUPER_ADMIN or ADMIN with broadcasts.schedule'],
  ] as const)('documents %s %s as %s', (method, path, expected) => {
    const document = documentWith({ [path]: { [method]: { security: [{ bearer: [] }] } } });

    applySwaggerAccessMetadata(document);

    const operation = document.paths[path]?.[method] as unknown as Record<string, unknown>;
    expect(operation['x-allowed-roles']).toBe(expected);
    expect(operation.description).not.toContain('Authenticated');
  });

  it('keeps universal auth endpoints as authenticated and public endpoints as public', () => {
    const document = documentWith({
      '/api/v1/auth/me': { get: { security: [{ bearer: [] }] } },
      '/api/v1/auth/login': { post: {} },
    });

    applySwaggerAccessMetadata(document);

    expect((document.paths['/api/v1/auth/me']?.get as unknown as Record<string, unknown>)['x-access']).toBe('Authenticated');
    expect((document.paths['/api/v1/auth/login']?.post as unknown as Record<string, unknown>)['x-access']).toBe('PUBLIC');
  });
});
