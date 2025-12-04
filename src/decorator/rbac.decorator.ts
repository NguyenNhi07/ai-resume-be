import { SetMetadata } from '@nestjs/common';
import { AccessRole } from 'src/common/enums';

export const RBAC_METADATA_KEY = 'role-base-access-control';

export const RoleBaseAccessControl = (role: AccessRole | AccessRole[] | true) => {
  if (Array.isArray(role)) {
    return SetMetadata(RBAC_METADATA_KEY, role);
  }
  if (role === true) {
    const allRoleExceptPublic = Object.values(AccessRole).filter(
      (r) => r !== AccessRole.Public,
    );
    return SetMetadata(RBAC_METADATA_KEY, allRoleExceptPublic);
  }
  return SetMetadata(RBAC_METADATA_KEY, [role]);
};
