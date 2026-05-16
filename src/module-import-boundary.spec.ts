import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const fullPath = join(dir, entry);
    if (statSync(fullPath).isDirectory()) return files(fullPath);
    return fullPath.endsWith('.module.ts') ? [fullPath] : [];
  });
}

describe('module import boundaries', () => {
  const moduleFiles = files(join(process.cwd(), 'src'));

  it('does not import AuthModule from feature modules that do not inject AuthService', () => {
    const offenders = moduleFiles
      .filter((filePath) => !filePath.endsWith('app.module.ts'))
      .filter((filePath) => !filePath.endsWith('modules/auth/auth.module.ts'))
      .filter((filePath) => readFileSync(filePath, 'utf8').includes('import { AuthModule }'));

    expect(offenders).toEqual([]);
  });

  it('only registers JwtModule where JwtService is directly injected', () => {
    const allowed = [
      'src/common/auth/jwt-auth.module.ts',
      'src/modules/auth/auth.module.ts',
      'src/modules/broadcast-notifications/broadcast-notifications.module.ts',
    ].map((path) => join(process.cwd(), path));

    const offenders = moduleFiles
      .filter((filePath) => readFileSync(filePath, 'utf8').includes('JwtModule.register({})'))
      .filter((filePath) => !allowed.includes(filePath));

    expect(offenders).toEqual([]);
  });
});
