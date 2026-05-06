import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  StreamableFile,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';

export interface ApiResult<T> {
  data: T;
  message?: string;
  meta?: Record<string, unknown>;
}

type ApiEnvelope<T> = {
  success: true;
  data: T;
  message: string;
  meta?: Record<string, unknown>;
};

@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<ApiResult<T> | StreamableFile, ApiEnvelope<T> | StreamableFile>
{
  intercept(
    _context: ExecutionContext,
    next: CallHandler<ApiResult<T> | StreamableFile>,
  ): Observable<ApiEnvelope<T> | StreamableFile> {
    return next.handle().pipe(
      map((result) => {
        if (result instanceof StreamableFile) {
          return result;
        }

        return {
          success: true,
          data: result.data,
          message: result.message ?? 'OK',
          ...(result.meta ? { meta: result.meta } : {}),
        };
      }),
    );
  }
}
