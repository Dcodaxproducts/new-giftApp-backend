import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const srcRoot = __dirname;
const docsRoot = join(__dirname, '../docs');

function filesUnder(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    return statSync(path).isDirectory() ? filesUnder(path) : [path];
  });
}

describe('API response envelope guards', () => {
  it('registers global success and failure envelope handlers', () => {
    const appModule = readFileSync(join(srcRoot, 'app.module.ts'), 'utf8');
    const main = readFileSync(join(srcRoot, 'main.ts'), 'utf8');

    expect(appModule).toContain('ResponseInterceptor');
    expect(main).toContain('app.useGlobalInterceptors(app.get(ResponseInterceptor))');
    expect(main).toContain('app.useGlobalFilters(new HttpExceptionFilter())');
  });

  it('keeps controllers away from manual Express responses', () => {
    const controllerSources = filesUnder(join(srcRoot, 'modules'))
      .filter((file) => file.endsWith('.controller.ts'))
      .map((file) => readFileSync(file, 'utf8'))
      .join('\n');

    expect(controllerSources).not.toContain('@Res(');
    expect(controllerSources).not.toContain('@Response(');
    expect(controllerSources).not.toContain('.json(');
  });

  it('documents StreamableFile downloads as explicit raw-response exceptions', () => {
    const docs = readFileSync(join(docsRoot, 'response-envelope.md'), 'utf8');

    expect(docs).toContain('{ success, data, message, meta? }');
    expect(docs).toContain('StreamableFile');
    expect(docs).toContain('intentionally do **not** use the JSON envelope');
  });
});
