import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

const runtimeRoots = ['services', 'repositories', 'controllers'];
const blockedRuntimePatterns = [
  /Premium Gift Box/i,
  /Alex Rivera/i,
  /Sarah Johnson/i,
  /Marcus Wright/i,
  /TechSolutions/i,
  /CloudTech/i,
  /Stripe Integration/i,
  /TODO\(PROD\)/i,
  /static data/i,
  /hardcoded stats/i,
  /\bplaceholder\b/i,
  /\bdemo\b/i,
  /System Auto-Flag/i,
  /Potential Missing Delivery/i,
  /All nodes stable/i,
  /Photo \+ message/i,
  /GPS late delivery/i,
];

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) return walk(path);
    return path.endsWith('.ts') && !path.endsWith('.spec.ts') ? [path] : [];
  });
}

function isRuntimeFile(path: string): boolean {
  return runtimeRoots.some((segment) => path.includes(`${segment}/`) || path.endsWith(`${segment}.ts`));
}

function runtimeContent(path: string): string {
  return readFileSync(path, 'utf8')
    .split('\n')
    .filter((line) => !line.trimStart().startsWith('@Api'))
    .join('\n');
}

describe('runtime static data guard', () => {
  it('does not ship known demo/static business data from module runtime code', () => {
    const files = walk(join(__dirname)).filter(isRuntimeFile);
    const violations = files.flatMap((file) => {
      const content = runtimeContent(file);
      return blockedRuntimePatterns
        .filter((pattern) => pattern.test(content))
        .map((pattern) => `${file}: ${pattern}`);
    });

    expect(violations).toEqual([]);
  });
});
