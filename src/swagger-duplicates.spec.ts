import { readFileSync } from 'fs';
import { join } from 'path';

type Operation = { tags?: string[] };
type PathItem = Record<string, Operation>;

type OpenApi = { paths: Record<string, PathItem> };

const httpMethods = new Set(['get', 'post', 'put', 'patch', 'delete', 'options', 'head']);

function loadSpec(): OpenApi {
  return JSON.parse(readFileSync(join(__dirname, '../docs/generated/openapi.json'), 'utf8')) as OpenApi;
}

describe('Swagger duplicate rendering guards', () => {
  const spec = loadSpec();

  it('does not assign duplicate tags to any operation', () => {
    const duplicateTags: string[] = [];
    for (const [path, item] of Object.entries(spec.paths)) {
      for (const [method, operation] of Object.entries(item)) {
        if (!httpMethods.has(method)) continue;
        const tags = operation.tags ?? [];
        if (new Set(tags).size !== tags.length) duplicateTags.push(`${method.toUpperCase()} ${path}: ${tags.join(', ')}`);
      }
    }
    expect(duplicateTags).toEqual([]);
  });

  it('does not render one operation under multiple Swagger tags', () => {
    const multiTagged: string[] = [];
    for (const [path, item] of Object.entries(spec.paths)) {
      for (const [method, operation] of Object.entries(item)) {
        if (!httpMethods.has(method)) continue;
        const tags = operation.tags ?? [];
        if (tags.length > 1) multiTagged.push(`${method.toUpperCase()} ${path}: ${tags.join(', ')}`);
      }
    }
    expect(multiTagged).toEqual([]);
  });

  it('does not contain duplicate method and path operations', () => {
    const seen = new Set<string>();
    const duplicates: string[] = [];
    for (const [path, item] of Object.entries(spec.paths)) {
      for (const method of Object.keys(item)) {
        if (!httpMethods.has(method)) continue;
        const key = `${method.toUpperCase()} ${path}`;
        if (seen.has(key)) duplicates.push(key);
        seen.add(key);
      }
    }
    expect(duplicates).toEqual([]);
  });

  it('keeps admin provider payout routes only under provider payouts tag', () => {
    const invalid: string[] = [];
    for (const [path, item] of Object.entries(spec.paths)) {
      if (!path.startsWith('/api/v1/admin/provider-payouts')) continue;
      for (const [method, operation] of Object.entries(item)) {
        if (!httpMethods.has(method)) continue;
        const tags = operation.tags ?? [];
        if (tags.length !== 1 || tags[0] !== '02 Admin - Provider Payouts') invalid.push(`${method.toUpperCase()} ${path}: ${tags.join(', ')}`);
      }
    }
    expect(invalid).toEqual([]);
  });
});
