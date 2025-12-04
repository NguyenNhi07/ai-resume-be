import { applyDecorators } from '@nestjs/common';
import { _ } from '@server/libs/lodash';
import {
  isEmpty,
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';
import { SORT_ORDERS } from 'src/common/const/database';
import { PropertyDto } from './property-dto.decorator';

export function MultipleOrderBy(
  properties: string[],
  validationOptions?: ValidationOptions,
) {
  return function (object: Object, propertyName: string) {
    const propertiesKeys = _.isArray(properties) ? properties : Object.keys(properties);
    let message = validationOptions?.message;
    // error data
    let errorCode: number = 0;
    let errorField: string = '';

    applyDecorators(
      PropertyDto({
        type: String,
        required: false,
        validated: true,
        structure: 'array',
        description: `<b>Accepted fields</b>: ${propertiesKeys.join(', ')}`,
      }),
    )(object, propertyName);

    registerDecorator({
      name: 'multipleOrderBy',
      target: object.constructor,
      propertyName: propertyName,
      // constraints: [properties],
      options: validationOptions,
      validator: {
        validate(values: string, _args: ValidationArguments) {
          for (const value of values) {
            const [key, order] = value.split(':');
            errorField = key;
            if (isEmpty(key) || isEmpty(order)) {
              errorCode = 1;
              return false;
            }
            if (!SORT_ORDERS.includes(order as any)) {
              errorCode = 2;
              return false;
            }
            if (!propertiesKeys.includes(key)) {
              errorCode = 3;
              return false;
            }
          }
          return true;
        },
        defaultMessage(args: ValidationArguments) {
          if (!!message) {
            if (typeof message === 'function') return message(args);
            return message;
          }
          switch (errorCode) {
            case 1:
            case 3:
              return `${args.property} contain invalid value for sorting key: ${errorField}. It must be one of the following: ${propertiesKeys.join(', ')}`;
            case 2:
              return `${args.property} contain invalid value for sorting value: ${errorField}. It must be one of the following: ${SORT_ORDERS.join(', ')}`;
            default:
              return `${args.property} must be an array of strings in the format "field:order", where field is one of the following: ${propertiesKeys.join(', ')} and order is one of the following: ${SORT_ORDERS.join(', ')}`;
          }
        },
      },
    });
  };
}
