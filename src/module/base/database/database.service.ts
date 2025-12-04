import { Injectable, OnModuleInit } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { ServerConfig } from '@server/config';
import { _ } from '@server/libs/lodash';
import { getCurrentDate } from 'src/common/helpers/time';

@Injectable()
export class DatabaseService extends PrismaClient implements OnModuleInit {
  constructor() {
    super({
      log: ServerConfig.getPrismaLogLevel(),
    });
  }

  async onModuleInit() {
    await this.$connect();
    // this.$use(this.softDeleteMiddleware);
    this.$use(this.findManyByCreatedTimeDesc);
  }

  /**
   * orderBy = object only contain 1 key, if not 500 will be returned
   * */
  private async findManyByCreatedTimeDesc(
    params: Prisma.MiddlewareParams,
    next: (params: Prisma.MiddlewareParams) => Promise<void>,
  ) {
    const orderBy = _.get(params, 'args.orderBy');
    const hasOrderBy = _.has(params, 'args.orderBy');
    const isEmpty = _.isEmpty(orderBy);

    if (params.action !== 'findMany') {
      return next(params);
    }
    if (hasOrderBy && isEmpty) {
      _.set(params, 'args.orderBy', [{ createdAt: Prisma.SortOrder.desc }]);
      return next(params);
    }

    const newOrderBy = [];
    if (_.isPlainObject(orderBy)) newOrderBy.push(orderBy);
    if (_.isArray(orderBy)) newOrderBy.push(...orderBy);
    newOrderBy.push({ createdAt: Prisma.SortOrder.desc });
    _.set(params, 'args.orderBy', newOrderBy);

    return next(params);
  }

  private async softDeleteMiddleware(
    params: Prisma.MiddlewareParams,
    next: (params: Prisma.MiddlewareParams) => Promise<void>,
  ) {
    switch (params.action) {
      case 'findFirst':
      case 'update':
      case 'findMany':
      case 'findUnique':
      case 'updateMany':
      case 'findFirstOrThrow':
      case 'findUniqueOrThrow':
      case 'count':
      case 'upsert':
      case 'aggregate':
      case 'groupBy':
        _.set(params, 'args.where.deletedAt', null);
        break;
      case 'delete':
      case 'deleteMany':
        params.action = params.action === 'delete' ? 'update' : 'updateMany';
        _.set(params, 'args.where.deletedAt', null);
        _.set(params, 'args.data.deletedAt', getCurrentDate());
        break;
      default:
    }

    return next(params);
  }
}
