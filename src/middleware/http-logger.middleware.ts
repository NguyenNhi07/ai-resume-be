import { Injectable, NestMiddleware } from '@nestjs/common';
import { ServerLogger } from '@server/logger';
import { SRequest, SResponse } from '@server/platform';
import { NextFunction } from 'express';

@Injectable()
export class HttpLoggerMiddleware implements NestMiddleware {
  public use(req: SRequest, res: SResponse, next: NextFunction) {
    req.startAt = new Date();
    ServerLogger.http({
      data: req,
      type: 'request',
      context: `HttpLoggerMiddleware`,
    });

    res.on('finish', async () => {
      res.endAt = new Date();
      ServerLogger.http({
        data: res,
        type: 'response',
        context: `HttpLoggerMiddleware`,
      });
    });

    res.on('error', (error) =>
      ServerLogger.error({
        error,
        message: `res.onError`,
        context: `HttpLoggerMiddleware`,
      }),
    );

    // extracting response's body
    let body = {};
    const chunks = [];
    const originResponseEnd = res.end;
    res.end = (chunk: any) => {
      if (chunk) chunks.push(Buffer.from(chunk));
      body = Buffer.concat(chunks).toString('utf8');
      res.body = body;
      return originResponseEnd.call(res, body);
    };

    next();
  }
}
