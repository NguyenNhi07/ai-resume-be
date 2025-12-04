import { Time } from '@server/libs/time';
import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

export function IsDateFormat(format: string, validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isDateFormat',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [format],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') {
            return false;
          }
          return Time(value, args.constraints[0], true).isValid();
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be in the format ${args.constraints[0]}`;
        },
      },
    });
  };
}
