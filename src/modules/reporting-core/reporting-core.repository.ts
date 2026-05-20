import { Injectable } from '@nestjs/common';

@Injectable()
export class ReportingCoreRepository {
  createLifecycleEvent(input: { domain: string; reportId: string; action: string; metadata?: Record<string, unknown> }) {
    return Promise.resolve({ ...input, recorded: true });
  }
}
