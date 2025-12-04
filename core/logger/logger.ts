import * as process from 'process';
import * as winston from 'winston';
import * as Transports from 'winston-transport';
import safeStringify from 'safe-stable-stringify';
import { ServerConfig } from '../config';
import { convertErrorToObject } from 'src/common/helpers/error';
import { AsyncStorage } from '../async-storage';
import { UnexpectedError } from '../errors/unexpected';
import { _ } from '../libs/lodash';
import { Time } from '../libs/time';
import { SResponse } from '../platform';
import { format as winstonFormat } from 'winston';
import {
  ErrorLoggingParams,
  HttpLogParams,
  LoggingParams,
  WebsocketLogParams,
} from './logger.interfaces';
import { LogColor, LogLevels } from './logger.types';

export class ServerLogger {
  private static winstonLogger = ServerLogger.initialize();
  public static levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
  };

  private constructor() {}

  public static error(data: ErrorLoggingParams): void {
    this.setEssentialData(data);
    this.setExtraMetadata(data);
    data.error = convertErrorToObject(data.error);
    this.winstonLogger.error(data);
  }

  public static async errorAsync(data: ErrorLoggingParams): Promise<void> {
    return this.error(data);
  }

  public static warn(data: LoggingParams): void {
    this.setEssentialData(data);
    this.setExtraMetadata(data);
    this.winstonLogger.warn(data);
  }

  public static async warnAsync(data: LoggingParams): Promise<void> {
    return this.warn(data);
  }

  public static info(data: LoggingParams): void {
    this.setEssentialData(data);
    this.setExtraMetadata(data);
    this.winstonLogger.info(data);
  }

  public static async infoAsync(data: LoggingParams): Promise<void> {
    return this.info(data);
  }

  /**
   * Not work without http-logger.middleware.ts
   **/
  public static http(logParams: HttpLogParams): void {
    const httpData: any = {
      type: logParams.type,
      context: logParams.context,
    };
    this.setEssentialData(httpData);
    this.setHttpData(logParams, httpData);
    this.winstonLogger.log('http', httpData);
  }

  public static async httpAsync(logParams: HttpLogParams): Promise<void> {
    return this.http(logParams);
  }

  /**
   *
   **/
  public static ws(data: WebsocketLogParams): void {
    this.setEssentialData(data);
    this.setExtraMetadata(data);
    const { client, error, ...logData } = data;
    _.assign(logData, {
      clientId: client.id,
      type: `websocket`,
      error: error && convertErrorToObject(error),
    });
    this.winstonLogger.log('http', logData);
  }

  public static debug(data: LoggingParams): void {
    this.setEssentialData(data);
    this.setExtraMetadata(data);
    this.winstonLogger.debug(data);
  }

  public static async debugAsync(data: LoggingParams): Promise<void> {
    return this.debug(data);
  }

  /**
   * Initializes the Winston logger with the specified options.
   **/
  private static initialize(): winston.Logger {
    const jsonLogFormat = winstonFormat.combine(
      winstonFormat.timestamp(),
      winstonFormat.json(),
    );

    const options = {
      levels: this.levels,
      transports: [
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
          format: jsonLogFormat,
        }),
        new winston.transports.File({
          filename: 'logs/combined.log',
          format: jsonLogFormat,
          level: 'debug',
        }),
      ] as Transports[],
    };
    if (!ServerConfig.isProductionEnv()) {
      options.transports.push(
        new winston.transports.Console({
          format: winstonFormat.printf(this.getConsoleLogFormat),
        }),
      );
    }

    return winston.createLogger(options);
  }

  private static getConsoleLogFormat(logInfo: any): string {
    const { level, context, message, error, system, ...rest } = logInfo;
    const levelColor = ServerLogger.getLogLevelColor(level);
    const colorize = ServerLogger.colorize;

    // preprocess data into pretty json
    let data: string = '';
    if (Object.values(rest).length || error) {
      let metadata = safeStringify({ ...rest, system, error }, null, ' ');
      metadata = metadata.replaceAll('\\n', '\n');
      data = data.concat(colorize('with data attached:', levelColor), '\n', metadata);
    }

    // color and format
    const prefix = colorize(`[${ServerConfig.get().APP_NAME}]  -`);
    const timestamp = Time().format(`MM/DD/YYYY HH:mm:ss Z`);
    const logLevel = colorize(level.toUpperCase().padStart(7, ' '), levelColor);
    const contextFormatted = colorize(`[${context}]`, 'yellow');
    const colorizedMessage = colorize(message, levelColor);

    return `${prefix} ${timestamp} ${logLevel} ${contextFormatted} ${colorizedMessage} ${data}`;
  }

  private static setHttpData(logParams: HttpLogParams, httpData: any) {
    switch (logParams.type) {
      case 'request':
        httpData.request = _.pick(logParams.data, [
          'httpVersion',
          'upgrade',
          'url',
          'method',
          'statusCode',
          'baseUrl',
          'originalUrl',
          'params',
          'query',
          'body',
          'secret',
          'cookies',
          'signedCookies',
          'xhr',
          'headers',
          'session',
          'ip',
          'hostname',
          'secure',
          'urlencoded',
          'protocol',
        ]);
        httpData.request.headers = _.omit(httpData.request.headers, 'authorization');
        break;
      case 'response':
        const response = logParams.data as SResponse;
        httpData.response = _.pick(logParams.data, [
          '_contentLength',
          '_hasBody',
          '_header', // may omit
          'body',
          'statusCode',
          'statusMessage',
        ]);
        httpData.responseTime = Time(response.endAt).diff(response.req.startAt);
        break;
      default:
    }
  }

  private static setEssentialData(data: any) {
    const correlationId = AsyncStorage.getCorrelationId();
    if (correlationId) {
      data.correlationId = correlationId;
    }
  }

  private static setExtraMetadata(data: any) {
    if (ServerConfig.isLocalEnv()) return;
    data.system = {
      pid: process.pid,
    };
  }

  private static colorize(text: string, color: LogColor = 'magentaBright') {
    switch (color) {
      case 'bold':
        return `\x1B[1m${text}\x1B[0m`;
      case 'red':
        return `\x1B[31m${text}\x1B[39m`;
      case 'green':
        return `\x1B[32m${text}\x1B[39m`;
      case 'yellow':
        return `\x1B[33m${text}\x1B[39m`;
      case 'blue':
        return `\x1B[34${text}\x1B[39m`;
      case 'white':
        return `\x1B[39m${text}\x1B[39m`;
      case 'orange':
        return `\x1B[38;5;208m${text}\x1B[39m`;
      case 'magentaBright':
        return `\x1B[95m${text}\x1B[39m`;
      case 'cyanBright':
        return `\x1B[96m${text}\x1B[39m`;
      case 'lightYellow':
        return `\x1B[93m${text}\x1B[39m`;
      default:
        throw new UnexpectedError(`LoggerService.colorize: Unsupported color`);
    }
  }

  private static getLogLevelColor(level: LogLevels): LogColor {
    switch (level) {
      case 'error':
        return 'red';
      case 'warn':
        return 'lightYellow';
      case 'info':
        return 'magentaBright';
      case 'debug':
        return 'blue';
      case 'http':
      case 'verbose':
      default:
        return 'white';
    }
  }
}
