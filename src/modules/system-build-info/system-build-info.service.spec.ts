import { ConfigService } from '@nestjs/config';
import { SystemBuildInfoService } from './system-build-info.service';

describe('SystemBuildInfoService', () => {
  it('returns safe build-info data without secrets', () => {
    const config = new ConfigService({
      APP_VERSION: '9.9.9',
      COMMIT_SHA: 'abc123',
      BUILD_TIME: '2026-05-25T10:00:00.000Z',
      OPENAPI_GENERATED_AT: '2026-05-25T10:01:00.000Z',
      JWT_SECRET: 'must-not-leak',
      DATABASE_URL: 'postgresql://secret',
    });
    const result = new SystemBuildInfoService(config).getBuildInfo();

    expect(result).toEqual({
      data: {
        appName: 'Gift App Backend',
        version: '9.9.9',
        commitSha: 'abc123',
        buildTime: '2026-05-25T10:00:00.000Z',
        openapiGeneratedAt: '2026-05-25T10:01:00.000Z',
      },
      message: 'Build info fetched successfully.',
    });
    expect(JSON.stringify(result)).not.toContain('must-not-leak');
    expect(JSON.stringify(result)).not.toContain('postgresql://secret');
  });
});
