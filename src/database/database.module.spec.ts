import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

describe('DatabaseModule wiring', () => {
  const sourceRoot = join(process.cwd(), 'src');

  function moduleFiles(dir: string): string[] {
    return readdirSync(dir).flatMap((entry) => {
      const fullPath = join(dir, entry);
      if (statSync(fullPath).isDirectory()) return moduleFiles(fullPath);
      return entry.endsWith('.module.ts') ? [fullPath] : [];
    });
  }

  it('exports PrismaService from DatabaseModule', () => {
    const source = readFileSync(join(sourceRoot, 'database/database.module.ts'), 'utf8');

    expect(source).toContain('providers: [PrismaService]');
    expect(source).toContain('exports: [PrismaService]');
  });

  it('keeps PrismaService out of feature module provider arrays', () => {
    const offenders = moduleFiles(sourceRoot)
      .filter((filePath) => !filePath.endsWith('database.module.ts'))
      .filter((filePath) => /providers\s*:\s*\[[^\]]*\bPrismaService\b/.test(readFileSync(filePath, 'utf8')));

    expect(offenders).toEqual([]);
  });
});
