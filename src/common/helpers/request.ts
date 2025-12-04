import { PaginationQueryDto } from '@server/platform/dtos';
import { validate, ValidatorOptions } from 'class-validator';
import { classValidatorExceptionFactory } from 'core/pipe';
import { ERROR_RESPONSE } from 'src/common/const';
import { ServerException } from 'src/exception';

export function validatePaginationQueryDto<T extends PaginationQueryDto>(query: T) {
  const { pageSize, page, lastItemId } = query;

  if (!lastItemId && !page) {
    throw new ServerException({
      ...ERROR_RESPONSE.UNPROCESSABLE_ENTITY,
      message: `page or lastItemId is required depending on the query type (page-based or cursor-based)`,
      details: { query },
    });
  }

  const take = pageSize;
  const skip = (page - 1) * pageSize;
  return { page, pageSize, take, skip };
}

/**
 * It is good to make validatorExceptionFactory is the same as PayloadValidationPipe.exceptionFactory
 **/
export async function validateDtoByGroups(
  dto: object,
  groups?: string[],
  validatorOptions?: ValidatorOptions,
) {
  const validateErrors = await validate(dto, {
    groups,
    forbidNonWhitelisted: false,
    ...validatorOptions,
  });

  if (validateErrors.length) {
    throw classValidatorExceptionFactory(validateErrors);
  }
}
