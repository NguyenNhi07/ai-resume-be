import { ApiProperty } from '@nestjs/swagger';

export class HttpErrorResponseDto {
  @ApiProperty()
  message: string; // Error message

  @ApiProperty()
  statusCode: number; // HTTP status code

  @ApiProperty()
  errorCode?: number; // Optional error code

  @ApiProperty()
  timestamp?: string; // Timestamp of the exception

  @ApiProperty()
  path?: string; // Request path that caused the exception

  @ApiProperty()
  details?: Record<string, any>; // Additional details or metadata about the exception
}

export class WebsocketErrorResponseDto {
  @ApiProperty()
  message: string;

  @ApiProperty()
  errorCode?: number;

  @ApiProperty()
  timestamp?: string;

  @ApiProperty()
  event?: string;

  @ApiProperty()
  data?: string;

  @ApiProperty()
  details?: Record<string, any>; // Additional details or metadata about the exception
}
