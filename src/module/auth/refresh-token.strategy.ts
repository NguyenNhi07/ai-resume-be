import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ServerConfig } from '@server/config';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtTokenType } from './auth.enum';
import { JwtPayload, UserJwtPayload } from './auth.type';

/**
 * The workflow for the refresh token strategy in the provided implementation is as follows:
 *
 * ### 1. **Client Sends Refresh Token**
 *    - The client sends a request to the `refresh-token` endpoint, including the refresh token in the `Authorization` header as a Bearer token.
 *
 * ### 2. **RefreshTokenGuard Activates**
 *    - The `RefreshTokenGuard` is applied to the `refresh-token` endpoint. It uses the `jwt-refresh` strategy to validate the refresh token.
 *
 * ### 3. **RefreshTokenStrategy Validates Token**
 *    - The `RefreshTokenStrategy` extracts the token from the `Authorization` header using `ExtractJwt.fromAuthHeaderAsBearerToken()`.
 *    - The token is verified using the secret key (`JWT_SECRET`).
 *    - The `validate` method checks if the token type is `REFRESH_TOKEN`. If invalid, an `UnauthorizedException` is thrown.
 *    - If valid, the payload (e.g., `userId` and `role`) is returned.
 * */
@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: ServerConfig.get().JWT_SECRET,
    });
  }

  validate(payload: JwtPayload): UserJwtPayload {
    if (payload.type !== JwtTokenType.RefreshToken) {
      throw new UnauthorizedException('Invalid token type');
    }
    return { id: payload.userId, role: payload.role };
  }
}
