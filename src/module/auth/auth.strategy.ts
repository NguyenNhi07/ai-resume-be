import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ServerConfig } from '@server/config';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload, UserJwtPayload } from './auth.type';

/**
 * @workflow jwt
 * 1. JWT Extraction: The JwtStrategy extracts the JWT from the Authorization header
 * 2. Token Verification: The JwtStrategy verifies the token using the secret key defined in the configuration.
 * 3. Payload Validation: The validate method of the JwtStrategy is called with the decoded JWT payload.
 * 4. Request Handling: If the user is successfully validated, the request proceeds to the route handler.
 * The user information is attached to the request object.
 * */
@Injectable()
export class AuthStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: ServerConfig.get().JWT_SECRET,
    });
  }

  /**
   * This method used to validate the user and attach the user information to the request object.
   */
  validate(payload: JwtPayload): UserJwtPayload {
    return { id: payload.userId, role: payload.role, businessId: payload.businessId };
  }
}
