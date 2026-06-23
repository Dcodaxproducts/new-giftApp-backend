import { readdirSync, readFileSync, statSync } from 'fs';
import { join, relative } from 'path';

describe('notification dispatch hardening guard', () => {
  const root = join(__dirname, '../../..');
  const allowedDirectCreate = new Set([
    'modules/notifications/repositories/notifications.repository.ts',
    'modules/notifications/notification-dispatch.service.ts',
  ]);

  function files(dir: string): string[] {
    return readdirSync(dir).flatMap((entry) => {
      const filePath = join(dir, entry);
      if (entry === 'specs' || entry === 'node_modules') return [];
      return statSync(filePath).isDirectory() ? files(filePath) : filePath.endsWith('.ts') ? [filePath] : [];
    });
  }

  it('contains no notification fallbacks or direct business notification writes', () => {
    const offenders: string[] = [];
    for (const filePath of files(root)) {
      const rel = relative(root, filePath).replace(/\\/g, '/');
      const source = readFileSync(filePath, 'utf8');
      if (source.includes('notificationDispatch ??') || source.includes('notification?.create(')) {
        offenders.push(rel);
        continue;
      }
      if (!allowedDirectCreate.has(rel) && /prisma\.notification\.create(?:Many)?\s*\(/.test(source)) {
        offenders.push(rel);
      }
    }
    expect(offenders).toEqual([]);
  });
});
