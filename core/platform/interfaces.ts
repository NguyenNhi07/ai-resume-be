import * as core from 'express-serve-static-core';
import { Request, Response } from 'express';
import { Server, Socket } from 'socket.io';
import { UserJwtPayload } from 'src/module/auth/auth.type';

/**
 * @overview Server request interface which is extended from express's Request
 * */
export interface SRequest<
  P = core.ParamsDictionary,
  ResBody = any,
  ReqBody = any,
  ReqQuery = core.Query,
  Locals extends Record<string, any> = Record<string, any>,
> extends Request<P, ResBody, ReqBody, ReqQuery, Locals> {
  user?: UserJwtPayload;
  startAt: Date;
}

/**
 * @overview Server response interface which is extended from express's Response
 * */
export interface SResponse<
  ResBody = any,
  Locals extends Record<string, any> = Record<string, any>,
> extends Response<ResBody, Locals> {
  endAt: Date;
  body: any; // for http response logging
  req: SRequest;
}

export interface MulterFile extends Express.Multer.File {}

export interface SocketServer extends Server {}

export interface SocketClient extends Socket {}
