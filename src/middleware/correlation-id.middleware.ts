import { Injectable, NestMiddleware } from '@nestjs/common';
import { AsyncStorage } from '@server/async-storage';
import { uuidv4 } from '@server/libs/uuid';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const correlationId = (req.headers['X-Correlation-Id'] as string) || uuidv4();
    req.headers['X-Correlation-Id'] = correlationId;
    res.setHeader('X-Correlation-Id', correlationId);
    AsyncStorage.setCorrelationId(correlationId);
    next();
  }
}
