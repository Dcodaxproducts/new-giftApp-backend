import { existsSync, readdirSync, readFileSync, statSync } from 'fs';
import { join, relative } from 'path';

type Operation = { tags?: string[] };
type PathItem = Record<string, Operation>;
type OpenApi = { paths: Record<string, PathItem>; tags?: { name: string }[] };

const httpMethods = new Set(['get', 'post', 'put', 'patch', 'delete', 'options', 'head']);
const root = join(__dirname, '..');
const srcRoot = __dirname;
const generatedOpenApiPath = join(root, 'docs/generated/openapi.json');

function loadSpec(): OpenApi {
  return JSON.parse(readFileSync(generatedOpenApiPath, 'utf8')) as OpenApi;
}

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (['node_modules', 'dist', 'coverage', '.git'].includes(entry)) return [];
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

describe('CI static production guards', () => {
  const spec = loadSpec();

  it('has no duplicate method+path in generated OpenAPI', () => {
    const seen = new Set<string>();
    const duplicates: string[] = [];
    for (const [path, item] of Object.entries(spec.paths ?? {})) {
      for (const method of Object.keys(item ?? {})) {
        if (!httpMethods.has(method)) continue;
        const key = `${method.toUpperCase()} ${path}`;
        if (seen.has(key)) duplicates.push(key);
        seen.add(key);
      }
    }
    expect(duplicates).toEqual([]);
  });

  it('has no multi-tag OpenAPI operations unless allowlisted', () => {
    const allowlisted = new Set<string>();
    const multiTagged: string[] = [];
    for (const [path, item] of Object.entries(spec.paths ?? {})) {
      for (const [method, operation] of Object.entries(item ?? {})) {
        if (!httpMethods.has(method)) continue;
        const key = `${method.toUpperCase()} ${path}`;
        const tags = operation.tags ?? [];
        if (tags.length > 1 && !allowlisted.has(key)) multiTagged.push(`${key}: ${tags.join(', ')}`);
      }
    }
    expect(multiTagged).toEqual([]);
  });

  it('keeps old chat groups absent from OpenAPI', () => {
    const tagNames = new Set((spec.tags ?? []).map((tag) => tag.name));
    expect(tagNames.has('05 Customer - Provider Chat')).toBe(false);
    expect(tagNames.has('03 Provider - Buyer Chat')).toBe(false);
    expect(tagNames.has('02 Admin - Support Chat')).toBe(false);
    expect(tagNames.has('08 Chat - Threads')).toBe(true);
  });

  it('blocks direct notification writes outside notification infrastructure', () => {
    const allowed = new Set([
      'modules/notifications/repositories/notifications.repository.ts',
      'modules/notifications/notification-dispatch.service.ts',
    ]);
    const offenders = walk(srcRoot).filter((path) => {
      if (!path.endsWith('.ts') || path.endsWith('.spec.ts')) return false;
      const modulePath = relative(srcRoot, path).replace(/\\/g, '/');
      if (allowed.has(modulePath)) return false;
      const source = readFileSync(path, 'utf8');
      return /(?:prisma|tx)\.notification(?:DeliveryLog)?\.create(?:Many)?\s*\(/.test(source);
    });
    expect(offenders.map((path) => relative(srcRoot, path))).toEqual([]);
  });

  it('has no forbidden placeholder/demo strings in runtime paths', () => {
    const forbidden = [/Premium Gift Box/i, /TODO\(PROD\)/, /demo value/i];
    const offenders: string[] = [];
    for (const path of walk(srcRoot)) {
      if (!path.endsWith('.ts') || path.endsWith('.spec.ts')) continue;
      const relativePath = relative(srcRoot, path);
      const source = readFileSync(path, 'utf8');
      for (const pattern of forbidden) {
        if (pattern.test(source)) offenders.push(`${relativePath}: ${pattern}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('keeps docs guard scripts wired in package scripts', () => {
    const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as { scripts?: Record<string, string> };
    expect(pkg.scripts?.['docs:generate']).toBe('npm run docs:openapi');
    expect(pkg.scripts?.['docs:openapi']).toContain('generate-openapi.js');
    expect(pkg.scripts?.['docs:reference']).toBeUndefined();
    expect(pkg.scripts?.['docs:frontend']).toBeUndefined();
    expect(pkg.scripts?.['docs:pdf']).toBeUndefined();
    expect(pkg.scripts?.['docs:assert']).toContain('assert-generated-docs-current');
    expect(existsSync(join(root, 'scripts/docs/assert-generated-docs-current.js'))).toBe(true);
    expect(existsSync(join(root, 'scripts/docs/generate-openapi.js'))).toBe(true);
    expect(existsSync(join(root, 'scripts/docs/generate-api-reference.py'))).toBe(false);
    expect(existsSync(join(root, 'scripts/docs/generate-frontend-guide.py'))).toBe(false);
    expect(existsSync(join(root, 'scripts/docs/requirements.txt'))).toBe(false);
  });
});
