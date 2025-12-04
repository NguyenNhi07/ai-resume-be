import { applyDecorators } from '@nestjs/common';
import 'reflect-metadata';
import { AccessRole } from 'src/common/enums';
import { RoleBaseAccessControl } from 'src/decorator/rbac.decorator';

function PublicApi() {
  return applyDecorators(RoleBaseAccessControl(AccessRole.Public));
}

export { PublicApi };
