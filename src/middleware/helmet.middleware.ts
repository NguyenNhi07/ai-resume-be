import { Injectable, NestMiddleware } from '@nestjs/common';
import helmet, { HelmetOptions } from 'helmet';

@Injectable()
export class HelmetMiddleware implements NestMiddleware {
  public static configure(opts: HelmetOptions) {
    this.options = opts;
  }

  private static options: HelmetOptions;

  public use(req: any, res: any, next: any) {
    if (HelmetMiddleware.options) {
      helmet(HelmetMiddleware.options)(req, res, next);
    } else {
      helmet()(req, res, next);
    }
  }
}
