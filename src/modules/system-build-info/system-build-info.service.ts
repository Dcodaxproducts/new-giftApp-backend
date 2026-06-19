import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OPENAPI_GENERATED_AT, PACKAGE_VERSION } from '../../generated/build-info';

type BuildInfo = {
  appName: 'Gift App Backend';
  version: string;
  commitSha: string | null;
  buildTime: string | null;
  openapiGeneratedAt: string | null;
};

@Injectable()
export class SystemBuildInfoService {
  constructor(private readonly configService: ConfigService) {}

  getBuildInfo(): { data: BuildInfo; message: 'Build info fetched successfully.' } {
    return {
      data: {
        appName: 'Gift App Backend',
        version: this.configService.get<string>('APP_VERSION') ?? PACKAGE_VERSION,
        commitSha: this.firstConfigValue(['COMMIT_SHA', 'GIT_SHA', 'GITHUB_SHA', 'VERCEL_GIT_COMMIT_SHA']),
        buildTime: this.firstConfigValue(['BUILD_TIME', 'BUILD_TIMESTAMP', 'CI_BUILD_TIME']),
        openapiGeneratedAt: this.configService.get<string>('OPENAPI_GENERATED_AT') ?? OPENAPI_GENERATED_AT,
      },
      message: 'Build info fetched successfully.',
    };
  }

  private firstConfigValue(keys: string[]): string | null {
    for (const key of keys) {
      const value = this.configService.get<string>(key);
      if (value) return value;
    }

    return null;
  }
}
