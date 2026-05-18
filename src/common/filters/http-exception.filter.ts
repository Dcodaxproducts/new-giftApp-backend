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
    const payloadObject = typeof payload === 'object' && payload !== null ? payload as Record<string, unknown> : null;
    const message =
      payloadObject && 'message' in payloadObject
        ? payloadObject.message
        : exception instanceof Error
          ? exception.message
          : 'Internal server error';
    const errorCode =
      payloadObject && typeof payloadObject.code === 'string'
        ? payloadObject.code
        : isHttpException ? exception.name : 'InternalServerError';
    const errorDetails = payloadObject
      ? Object.fromEntries(Object.entries(payloadObject).filter(([key]) => !['code', 'error', 'message', 'statusCode'].includes(key)))
      : {};

    response.status(status).json({
      success: false,
      error: {
        code: errorCode,
        message,
        ...errorDetails,
      },
      meta: {
        statusCode: status,
        timestamp: new Date().toISOString(),
      },
    });
  }
}
