import { readFileSync } from 'fs';
import { join } from 'path';

describe('Broadcast Swagger grouping', () => {
  it('keeps broadcasts under Broadcast Notifications, not Notifications', () => {
    const source = readFileSync(join(__dirname, 'broadcasts.controller.ts'), 'utf8');
    expect(source).toContain("@ApiTags('Broadcast Notifications')");
    expect(source).not.toContain("@ApiTags('Notifications')");
  });
});
