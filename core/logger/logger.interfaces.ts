import { SocketClient, SRequest, SResponse } from '../platform';

export interface LoggingParams {
  context: string;
  message: string;
  meta?: object;
}

export interface ErrorLoggingParams extends LoggingParams {
  error: any;
}

export interface HttpLogParams {
  type: 'response' | 'request';
  data: SResponse | SRequest;
  context: string;
}

export interface WebsocketLogParams {
  context: string;
  event: string;
  client: SocketClient;
  bodyData: any;
  emitData: any;
  error?: any;
}

export interface DistributedLoggingParams extends LoggingParams {
  [key: string]: any;
}
