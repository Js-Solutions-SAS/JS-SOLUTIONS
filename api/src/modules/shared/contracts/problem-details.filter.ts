import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

import { generateCorrelationId } from '../../../common/ids';

@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const request = context.getRequest<Request>();
    const response = context.getResponse<Response>();

    const fallbackCorrelationId = generateCorrelationId('error');
    const correlationId =
      String(request.headers['x-correlation-id'] || '').trim() ||
      (typeof request.body?.correlationId === 'string'
        ? request.body.correlationId.trim()
        : '') ||
      fallbackCorrelationId;

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      const defaultMessage = exception.message || 'Request failed.';

      const message =
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : typeof (exceptionResponse as { message?: unknown }).message ===
                'string'
            ? String((exceptionResponse as { message: string }).message)
            : defaultMessage;

      response.status(status).json({
        success: false,
        error: {
          code: `HTTP_${status}`,
          message,
          details:
            typeof exceptionResponse === 'object' && exceptionResponse
              ? (exceptionResponse as Record<string, unknown>)
              : undefined,
        },
        correlationId,
      });
      return;
    }

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Unexpected server error.',
      },
      correlationId,
    });
  }
}
