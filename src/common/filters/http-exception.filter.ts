import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const isHttpException = exception instanceof HttpException;
    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;
    const payload = isHttpException ? exception.getResponse() : null;
    const message =
      typeof payload === 'object' && payload !== null && 'message' in payload
        ? payload.message
        : exception instanceof Error
          ? exception.message
          : 'Internal server error';

    response.status(status).json({
      success: false,
      error: {
        code: isHttpException ? exception.name : 'InternalServerError',
        message,
      },
      meta: {
        statusCode: status,
        timestamp: new Date().toISOString(),
      },
    });
  }
}
