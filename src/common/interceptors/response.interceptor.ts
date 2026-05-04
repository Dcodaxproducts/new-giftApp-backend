import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';

export interface ApiResult<T> {
  data: T;
  message?: string;
  meta?: Record<string, unknown>;
}

@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<ApiResult<T>, { success: true; data: T; message: string; meta?: Record<string, unknown> }>
{
  intercept(
    _context: ExecutionContext,
    next: CallHandler<ApiResult<T>>,
  ): Observable<{ success: true; data: T; message: string; meta?: Record<string, unknown> }> {
    return next.handle().pipe(
      map((result) => ({
        success: true,
        data: result.data,
        message: result.message ?? 'OK',
        ...(result.meta ? { meta: result.meta } : {}),
      })),
    );
  }
}
