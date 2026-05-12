import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  StreamableFile,
} from '@nestjs/common';
import { Observable, mergeMap } from 'rxjs';
import { MediaUrlSignerService } from '../services/media-url-signer.service';

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
  constructor(private readonly mediaUrlSigner: MediaUrlSignerService) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<ApiResult<T> | StreamableFile>,
  ): Observable<ApiEnvelope<T> | StreamableFile> {
    const request = context.switchToHttp().getRequest<{ method?: string }>();
    const shouldSignMediaUrls = request.method === 'GET';

    return next.handle().pipe(
      mergeMap(async (result) => {
        if (result instanceof StreamableFile) {
          return result;
        }

        const data = shouldSignMediaUrls ? await this.mediaUrlSigner.signResponseImages(result.data) : result.data;

        return {
          success: true as const,
          data,
          message: result.message ?? 'OK',
          ...(result.meta ? { meta: result.meta } : {}),
        };
      }),
    );
  }
}
