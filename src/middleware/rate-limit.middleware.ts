import { Injectable, NestMiddleware } from '@nestjs/common';
import { ServerConfig } from '@server/config';
import { rateLimit } from 'express-rate-limit';
import { ERROR_RESPONSE } from 'src/common/const';

/**
 * @overview `RateLimitMiddleware` is a middleware that limits the number of requests a client can make to the API within a certain time period.
 * This is done to prevent abuse and save resources.
 *
 * The middleware uses the `express-rate-limit` library to apply rate limiting. The limit value is configurable and is retrieved from the application's ServerConfig.get().
 *
 * If a client exceeds the maximum number of allowed requests, the middleware responds with an error message defined in `ERROR_RESPONSE.TOO_MANY_REQUEST`.
 *
 * todo: re-config this middleware
 * todo: announce to admin when a hacker try to bruce-force
 */
@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  use(req: any, res: any, next: () => void) {
    const limiter = rateLimit({
      message: ERROR_RESPONSE.TOO_MANY_REQUEST,
      limit: ServerConfig.get().THROTTLER_LIMIT,
    });
    return limiter(req, res, next);
  }
}
