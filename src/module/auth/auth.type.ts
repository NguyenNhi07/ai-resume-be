import { UserRole } from '@prisma/client';
import { JwtTokenType, JwtUserPermission } from './auth.enum';

export interface JwtPayload {
  iss?: string;
  sub?: string;
  aud?: string;
  exp: string;
  nbf?: string;
  iat: string;
  jti: string;
  userId: number;
  businessId?: number;
  role: UserRole;
  permissions?: JwtUserPermission[];
  type?: JwtTokenType;
}

export interface UserJwtPayload {
  id: number;
  role: UserRole;
  businessId?: number;
}
