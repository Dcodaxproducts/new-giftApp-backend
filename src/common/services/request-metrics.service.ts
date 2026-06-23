import { Injectable } from '@nestjs/common';

export type RequestMetricSample = {
  timestamp: Date;
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
};

type RequestMetricInput = Omit<RequestMetricSample, 'timestamp'> & { timestamp?: Date };

@Injectable()
export class RequestMetricsService {
  private readonly maxSamples = 10_000;
  private readonly samples: RequestMetricSample[] = [];

  record(input: RequestMetricInput): void {
    this.samples.push({
      timestamp: input.timestamp ?? new Date(),
      method: input.method,
      path: input.path,
      statusCode: input.statusCode,
      durationMs: Math.max(0, Number(input.durationMs.toFixed(2))),
    });

    if (this.samples.length > this.maxSamples) {
      this.samples.splice(0, this.samples.length - this.maxSamples);
    }
  }

  getSamples(since?: Date): RequestMetricSample[] {
    if (!since) return [...this.samples];
    return this.samples.filter((sample) => sample.timestamp >= since);
  }
}
