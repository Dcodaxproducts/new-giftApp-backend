import { Global, Module } from '@nestjs/common';
import { RequestMetricsService } from './services/request-metrics.service';

@Global()
@Module({
  providers: [RequestMetricsService],
  exports: [RequestMetricsService],
})
export class RequestMetricsModule {}
