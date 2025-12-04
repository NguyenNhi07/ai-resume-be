import { ServerConfig } from '@server/config';
import { UnexpectedError } from '@server/errors/unexpected';
import { jwt } from '@server/libs/jwt';

type MakeJwtCondition = 'VALID' | 'EXPIRED' | 'INVALID';

export async function makeJwtTokenByCondition(
  condition: MakeJwtCondition,
  payload: object,
  isBearer?: boolean,
) {
  let token: string;
  switch (condition) {
    case 'VALID':
      token = jwt.sign(payload, ServerConfig.get().JWT_SECRET);
      break;
    case 'EXPIRED':
      token = jwt.sign(payload, ServerConfig.get().JWT_SECRET, { expiresIn: 1 });
      await new Promise((resolve) => setTimeout(resolve, 1000));
      break;
    case 'INVALID':
      token = jwt.sign(payload, `invalid jwt secret`);
      break;
    default:
      throw new UnexpectedError(`makeJwtTokenByCondition invalid precondition`, {
        condition,
        payload,
        isBearer,
      });
  }
  return isBearer ? `Bearer ${token}` : token;
}
