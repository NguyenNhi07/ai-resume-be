import { ValidationPipe } from '@nestjs/common';
import { ValidationPipeOptions } from '@nestjs/common/pipes/validation.pipe';
import { ValidationError } from 'class-validator';
import { ERROR_RESPONSE } from 'src/common/const';
import { ServerException } from 'src/exception/server.exception';

interface PayloadValidationPipeOptions extends ValidationPipeOptions {
  protocol: 'http' | 'websocket';
}

const classValidatorExceptionFactory = (errors: any) => {
  const getDetails = (acc: object, val: ValidationError) => {
    const { property, constraints, children } = val;
    if (constraints) {
      acc[property] = Object.values(constraints).join(', ');
    } else {
      acc[property] = children.reduce(getDetails, {});
    }
    return acc;
  };
  const exceptionResponse = {
    ...ERROR_RESPONSE.REQUEST_PAYLOAD_VALIDATE_ERROR,
    message: `ValidateFailed: ${errors.map((e) => e.property).join(', ')}`,
    details: errors.reduce(getDetails, {}),
  };
  return new ServerException(exceptionResponse);
};

/**
 * A custom validation pipe that extends the NestJS ValidationPipe.
 * This pipe transforms and validates incoming request payloads.
 * If validation fails, it throws a <b>ServerException</b> by default with detailed error information.<br>
 * You can also you options.protocol === websocket to throw <b>WebsocketException</b>
 *
 **/
class PayloadValidationPipe extends ValidationPipe {
  constructor(options?: PayloadValidationPipeOptions) {
    super({
      transform: true,
      whitelist: true,
      transformOptions: { enableImplicitConversion: true },
      forbidNonWhitelisted: true,
      exceptionFactory: classValidatorExceptionFactory,
      ...options,
    });
  }
}

export { PayloadValidationPipe, classValidatorExceptionFactory };
