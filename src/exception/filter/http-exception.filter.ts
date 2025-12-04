import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { ServerConfig } from '@server/config';
import { _ } from '@server/libs/lodash';
import { ServerLogger } from '@server/logger';
import { HttpErrorResponseDto } from '@server/platform/dtos';
import { Request, Response } from 'express';
import { ERROR_RESPONSE } from 'src/common/const';
import { convertErrorToObject } from 'src/common/helpers/error';

/**
 * HttpExceptionFilter is a global exception filter in the application which catches all unhandled exceptions.
 *
 * When an exception is caught, it logs the error details and sends a response with the error message,
 * status code, timestamp, and the request path.
 *
 * In production environment, the detailed error information is not included in the response for security reasons.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly httpAdapterHost?: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const request = host.switchToHttp().getRequest<Request>();
    const errorData: Partial<HttpErrorResponseDto> = {
      statusCode: HttpStatus.BAD_REQUEST,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    if (exception instanceof HttpException) {
      let exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'string') {
        exceptionResponse = { message: exceptionResponse };
      }
      _.assign(errorData, { statusCode: exception.getStatus() }, exceptionResponse);
    } else {
      _.assign(errorData, {
        ...ERROR_RESPONSE.SOMETHING_WENT_WRONG,
        details: convertErrorToObject(exception),
      });
      ServerLogger.error({
        context: `HttpExceptionFilter.catch`,
        error: exception,
        message: `A non-http error being throw somewhere`,
      });
    }

    const statusCode = errorData.statusCode;
    response.status(statusCode).json({
      ...errorData,
      ...(ServerConfig.isProductionEnv() && { details: null }),
    });
  }
}
