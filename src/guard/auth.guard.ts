import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard as PassportAuthGuard } from '@nestjs/passport';
import { AsyncStorage } from '@server/async-storage';
import { SRequest } from '@server/platform';
import { ERROR_RESPONSE } from 'src/common/const';
import { AccessRole } from 'src/common/enums';
import { convertErrorToObject } from 'src/common/helpers/error';
import { RBAC_METADATA_KEY } from 'src/decorator';
import { ServerException } from 'src/exception';

/**
 * @workflow PassportAuthGuard with jwt veryfication
 *
 * 1. AuthGuard.canActivate() -> super.canActivate()
 * 2. JwtStrategy.validate()
 * 3. AuthGuard.handleRequest()
 */
@Injectable()
export class AuthGuard extends PassportAuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const apiRoles = this.reflector.getAllAndOverride<AccessRole[]>(RBAC_METADATA_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (apiRoles.includes(AccessRole.Public)) {
      return true;
    }

    // trigger strategy
    const isValidToken = await super.canActivate(context);
    if (!isValidToken) {
      throw new ServerException(ERROR_RESPONSE.UNAUTHORIZED);
    }

    const request: SRequest = this.getRequest(context);

    // Role check
    const user = request.user;
    if (!apiRoles.includes(user.role as AccessRole)) {
      throw new ServerException({
        ...ERROR_RESPONSE.ROLE_ACCESS_DENIED,
        details: { userRole: user.role, apiRoles },
      });
    }

    // set userId and userRole to AsyncStorage
    AsyncStorage.setUserId(user.id);
    AsyncStorage.setBusinessId(user.businessId);
    AsyncStorage.setUserRole(user.role);

    return true;
  }

  /**
   * @brief Custom error when super.canActivate(context) || JwtStrategy.validate fail
   *
   * @param err error threw from JwtStrategy.validate
   * @param user payload returned from JwtStrategy.validate (UserJwtPayload)
   * @param info error info when jwt verify fail
   */
  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      throw new ServerException({
        ...ERROR_RESPONSE.UNAUTHORIZED,
        message: info?.message,
        details: convertErrorToObject(info),
      });
    }
    return user;
  }
}
