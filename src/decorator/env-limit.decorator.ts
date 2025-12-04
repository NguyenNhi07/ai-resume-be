import { _ } from '@server/libs/lodash';
import { NodeEnv } from '@server/platform';
import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

export function EnvironmentLimit(
  properties: NodeEnv[],
  validationOptions?: ValidationOptions,
) {
  const allowedEnv = _.isArray(properties) ? properties : Object.keys(properties);
  let message = validationOptions?.message;
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'environmentLimit',
      target: object.constructor,
      propertyName: propertyName,
      // constraints: [properties],
      options: validationOptions,
      validator: {
        validate(value: string, _args: ValidationArguments) {
          const currentEnv = process.env.NODE_ENV as NodeEnv;
          return allowedEnv.includes(currentEnv);
        },
        defaultMessage(args: ValidationArguments) {
          if (!!message) {
            if (typeof message === 'function') return message(args);
            return message;
          }
          return `This api must be run in the following environments: ${allowedEnv.join(', ')}`;
        },
      },
    });
  };
}
