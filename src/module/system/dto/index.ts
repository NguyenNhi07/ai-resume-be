import { UserStatus } from '@prisma/client';
import { DatabaseModelFields } from '@server/libs/database';
import { PropertyDto } from 'src/decorator';
import { MultipleOrderBy } from 'src/decorator/multiple-order-by.decorator';

export class TestNestjsRestfulPayloadBodyDto {
  @PropertyDto({
    type: Boolean,
    required: false,
  })
  bool: boolean;

  @PropertyDto({
    type: UserStatus,
    required: false,
    validated: true,
    structure: 'enum',
  })
  userStatus: UserStatus;

  @PropertyDto({
    type: UserStatus,
    required: false,
    validated: true,
    structure: 'enumArray',
  })
  userStatuses: UserStatus[];
}

export class TestNestjsRestfulPayloadQueryDto extends TestNestjsRestfulPayloadBodyDto {
  @PropertyDto({
    type: String,
    required: false,
    validated: true,
    structure: 'array',
  })
  @MultipleOrderBy(DatabaseModelFields.User)
  orderBy: string[];
}
