import { readFileSync } from 'fs';
import { join } from 'path';

describe('Provider notification preferences source safety', () => {
  const controller = readFileSync(join(__dirname, 'notifications.controller.ts'), 'utf8');
  const service = readFileSync(join(__dirname, 'notifications.service.ts'), 'utf8');
  const dto = readFileSync(join(__dirname, 'dto/broadcast-notifications.dto.ts'), 'utf8');
  const schema = readFileSync(join(__dirname, '../../../prisma/schema.prisma'), 'utf8');

  it('reuses generic notifications preferences endpoints', () => {
    expect(controller).toContain("@Get('preferences')");
    expect(controller).toContain("@Patch('preferences')");
    expect(controller).not.toContain('provider/settings/notifications');
  });

  it('supports provider-specific preference fields on own preference record', () => {
    expect(schema).toContain('providerOrderAlertsJson');
    expect(schema).toContain('providerAccountActivityJson');
    expect(schema).toContain('providerMarketingUpdatesJson');
    expect(dto).toContain('providerOrderAlerts');
    expect(service).toContain('providerOrderAlertsJson: dto.providerOrderAlerts');
    expect(service).toContain('where: { userId: user.uid }');
  });
});
