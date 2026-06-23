import { readdirSync, readFileSync, statSync } from 'fs';
import { join, relative } from 'path';

describe('notification direct-write guard', () => {
  const root = join(__dirname, '../../..');
  const allowed = new Set([
    'modules/notifications/repositories/notifications.repository.ts',
    'modules/notifications/notification-dispatch.service.ts',
  ]);

  function files(dir: string): string[] {
    return readdirSync(dir).flatMap((entry) => {
      const path = join(dir, entry);
      if (entry === 'specs' || entry === 'node_modules') return [];
      return statSync(path).isDirectory() ? files(path) : path.endsWith('.ts') ? [path] : [];
    });
  }

  it('blocks notification creates outside the dispatcher/repository layer', () => {
    const offenders = files(root).filter((path) => {
      const modulePath = relative(root, path).replace(/\\/g, '/');
      if (allowed.has(modulePath)) return false;
      const source = readFileSync(path, 'utf8');
      return /(?:prisma|tx)\.notification\.create(?:Many)?\s*\(/.test(source);
    });

    expect(offenders.map((path) => relative(root, path).replace(/\\/g, '/'))).toEqual([]);
  });
});
