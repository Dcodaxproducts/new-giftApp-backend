import { Controller, Get, Header } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SystemBuildInfoService } from '../services/system-build-info.service';

@ApiTags('00 System')
@Controller('system')
export class SystemBuildInfoController {
  constructor(private readonly service: SystemBuildInfoService) {}

  @Get('build-info')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    summary: 'Fetch build and generated-doc metadata',
    description: 'PUBLIC. Safe deployment guard for comparing the live server build and Swagger/OpenAPI generation timestamp with the committed generated docs. Does not expose secrets.',
  })
  @ApiResponse({
    status: 200,
    schema: {
      example: {
        success: true,
        data: {
          appName: 'Gift App Backend',
          version: '0.1.0',
          commitSha: 'git_sha',
          buildTime: '2026-05-25T10:00:00.000Z',
          openapiGeneratedAt: '2026-05-25T10:00:00.000Z',
        },
        message: 'Build info fetched successfully.',
      },
    },
  })
  getBuildInfo() {
    return this.service.getBuildInfo();
  }
}
