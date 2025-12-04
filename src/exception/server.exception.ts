import { HttpException, HttpStatus } from '@nestjs/common';
import { _ } from '@server/libs/lodash';
import { HttpErrorResponseDto } from '@server/platform/dtos';

export class ServerException extends HttpException {
  constructor(response: HttpErrorResponseDto, status?: number) {
    const statusCode: number =
      status || _.get(response, 'statusCode', HttpStatus.BAD_REQUEST);
    super({ ...response }, statusCode);
  }
}
