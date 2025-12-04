import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { SRequest } from '@server/platform/interfaces';

export const User = createParamDecorator((data: string, ctx: ExecutionContext) => {
  const request: SRequest = ctx.switchToHttp().getRequest();
  return data ? request.user?.[data] : request.user;
});
