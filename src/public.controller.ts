import { Controller, Get, Header } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';

type HealthResponse = {
  data: {
    status: 'ok';
    service: 'Gift App Backend';
    company: 'Dcodax Technologies';
    uptime: number;
    timestamp: string;
  };
  message: 'Service is healthy.';
};

@ApiExcludeController()
@Controller()
export class PublicController {
  @Get('/')
  getHome(): HealthResponse {
    return this.healthResponse();
  }

  @Get('/health')
  getHealth(): HealthResponse {
    return this.healthResponse();
  }

  @Get('/health/ready')
  @Header('Cache-Control', 'no-store')
  getReadiness() {
    return { data: { status: 'ready', database: 'not_checked', service: 'Gift App Backend', timestamp: new Date().toISOString() }, message: 'Service is ready.' };
  }

  private healthResponse(): HealthResponse {
    return {
      data: {
        status: 'ok',
        service: 'Gift App Backend',
        company: 'Dcodax Technologies',
        uptime: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
      },
      message: 'Service is healthy.',
    };
  }
}
