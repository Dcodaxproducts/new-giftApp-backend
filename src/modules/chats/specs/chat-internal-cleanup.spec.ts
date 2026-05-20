import { existsSync, readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

const projectRoot = join(__dirname, '../../../..');
const srcRoot = join(projectRoot, 'src');
const legacyCustomerProviderService = ['Customer', 'Provider', 'Interactions', 'Service'].join('');
const legacyProviderService = ['Provider', 'Interactions', 'Service'].join('');
const legacySupportService = ['Support', 'Chat', 'Service'].join('');
const legacyCustomerSwaggerGroup = ['05 Customer', 'Provider Chat'].join(' - ');
const legacyProviderSwaggerGroup = ['03 Provider', 'Buyer Chat'].join(' - ');
const legacySupportSwaggerGroup = ['02 Admin', 'Support Chat'].join(' - ');

function filesUnder(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    return statSync(path).isDirectory() ? filesUnder(path) : [path];
  });
}

describe('Chat internal cleanup static guards', () => {
  const main = readFileSync(join(srcRoot, 'main.ts'), 'utf8');
  const chatsFiles = filesUnder(join(srcRoot, 'modules/chats')).filter((file) => !file.includes('specs')).map((file) => readFileSync(file, 'utf8')).join('\n');

  it('removes legacy chat modules and repositories', () => {
    expect(existsSync(join(srcRoot, 'modules/support-chat'))).toBe(false);
    expect(existsSync(join(srcRoot, 'modules/chat-realtime'))).toBe(false);
    expect(existsSync(join(srcRoot, 'modules/customer-provider-interactions/repositories/customer-chats.repository.ts'))).toBe(false);
    expect(existsSync(join(srcRoot, 'modules/provider-interactions/repositories/provider-buyer-chat.repository.ts'))).toBe(false);
  });

  it('keeps chats module free of legacy chat service dependencies', () => {
    for (const forbidden of [
      legacyCustomerProviderService,
      legacyProviderService,
      legacySupportService,
      ['..', 'support-chat'].join('/'),
      ['..', 'chat-realtime'].join('/'),
    ]) {
      expect(chatsFiles).not.toContain(forbidden);
    }
  });

  it('keeps chat services behind repositories for database access', () => {
    const serviceFiles = filesUnder(join(srcRoot, 'modules/chats/services')).map((file) => readFileSync(file, 'utf8')).join('\n');

    expect(serviceFiles).not.toContain('PrismaService');
    expect(serviceFiles).not.toContain('this.prisma');
  });

  it('keeps only the chat Swagger group', () => {
    for (const forbidden of [
      `'${legacyCustomerSwaggerGroup}'`,
      `'${legacyProviderSwaggerGroup}'`,
      `'${legacySupportSwaggerGroup}'`,
    ]) {
      expect(main).not.toContain(forbidden);
    }
    expect(main).toContain("'08 Chat - Unified Threads'");
  });
});
