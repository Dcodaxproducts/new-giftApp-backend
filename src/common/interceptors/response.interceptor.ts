import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  NestInterceptor,
  StreamableFile,
} from '@nestjs/common';
import { Observable, catchError, mergeMap, throwError } from 'rxjs';
import { MediaUrlSignerService } from '../services/media-url-signer.service';
import { RequestMetricsService } from '../services/request-metrics.service';

export interface ApiResult<T> {
  data?: T;
  message?: string;
  meta?: Record<string, unknown>;
}

type ApiEnvelope<T> = {
  success: true;
  data: T | null;
  message: string;
  meta?: Record<string, unknown>;
};

@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<ApiResult<T> | T | StreamableFile, ApiEnvelope<T> | StreamableFile>
{
  constructor(
    private readonly mediaUrlSigner: MediaUrlSignerService,
    private readonly requestMetrics: RequestMetricsService,
  ) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<ApiResult<T> | T | StreamableFile>,
  ): Observable<ApiEnvelope<T> | StreamableFile> {
    const request = context.switchToHttp().getRequest<{ method?: string; originalUrl?: string; url?: string }>();
    const startedAt = process.hrtime.bigint();
    const shouldSignMediaUrls = request.method === 'GET';

    return next.handle().pipe(
      mergeMap(async (result) => {
        if (result instanceof StreamableFile) {
          this.recordMetric(request, context, startedAt);
          return result;
        }

        const normalized = this.normalizeResult(result);
        const data = shouldSignMediaUrls ? await this.mediaUrlSigner.signResponseImages(normalized.data) : normalized.data;

        this.recordMetric(request, context, startedAt);
        return {
          success: true as const,
          data,
          message: normalized.message,
          ...(normalized.meta ? { meta: normalized.meta } : {}),
        };
      }),
      catchError((error: unknown) => {
        this.recordMetric(request, context, startedAt, error);
        return throwError(() => error);
      }),
    );
  }

  private normalizeResult(result: ApiResult<T> | T | undefined): ApiEnvelope<T> {
    if (this.isRecord(result) && result.success === true && 'data' in result) {
      return {
        success: true,
        data: result.data as T | null,
        message: typeof result.message === 'string' ? result.message : 'OK',
        ...(this.isRecord(result.meta) ? { meta: result.meta } : {}),
      };
    }

    if (this.isRecord(result) && ('data' in result || 'message' in result || 'meta' in result)) {
      return {
        success: true,
        data: 'data' in result ? result.data as T ?? null : null,
        message: typeof result.message === 'string' ? result.message : 'OK',
        ...(this.isRecord(result.meta) ? { meta: result.meta } : {}),
      };
    }

    return { success: true, data: result as T ?? null, message: 'OK' };
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  private recordMetric(
    request: { method?: string; originalUrl?: string; url?: string },
    context: ExecutionContext,
    startedAt: bigint,
    error?: unknown,
  ): void {
    const response = context.switchToHttp().getResponse<{ statusCode?: number }>();
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    const statusCode = error instanceof HttpException ? error.getStatus() : error ? 500 : response.statusCode ?? 200;

    this.requestMetrics.record({
      method: request.method ?? 'UNKNOWN',
      path: request.originalUrl ?? request.url ?? 'unknown',
      statusCode,
      durationMs,
    });
  }
}
