import { applyDecorators, Type } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptions } from '@nestjs/swagger';
import { _ } from '@server/libs/lodash';
import {
  Expose,
  Transform,
  TransformFnParams,
  Type as TransformType,
} from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  isBooleanString,
  IsDate,
  isEmpty,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
  ValidationArguments,
} from 'class-validator';
import 'reflect-metadata';
import { ERROR_RESPONSE } from 'src/common/const';
import { ServerException } from 'src/exception';

type PropertyType = Type<unknown> | Function | Record<string, any> | 'file';
type PropertyStructure = 'array' | 'enum' | 'enumArray' | 'dto' | 'dtoArray';

interface PropertyDtoOptions {
  type: PropertyType;
  structure?: PropertyStructure;
  validated?: boolean;
  required?: boolean;
  example?: any;
  defaultValue?: any;
  description?: string;
  validateGroup?: string[];
}

class PropertyDtoBuilder {
  readonly decorators: PropertyDecorator[] = [Expose()];
  readonly stackStrace: any[] = [];
  //
  private propertyOptions: ApiPropertyOptions;
  private type: Type<unknown>;
  private isFile: boolean;
  private isEnum: boolean;
  private isDto: boolean;
  private isArray: boolean;
  private example: any;
  private validateGroup?: string[];
  private isValidated: boolean;

  constructor(
    private readonly target: Object,
    private readonly propertyKey: string,
    private readonly options?: PropertyDtoOptions,
  ) {
    this.prepare();
    this.setMetadata();
    this.setSwagger();
    this.setTransform();
    this.setValidate();
  }

  private prepare() {
    const { structure, validated, validateGroup, ...propertyOptions } = {
      validated: false,
      required: false,
      ...this.options,
    };
    this.isValidated = validated;
    this.validateGroup = validateGroup;
    this.propertyOptions = propertyOptions;
    this.isFile = propertyOptions.type === 'file';
    this.type = (this.isFile ? String : propertyOptions.type) as Type<unknown>;
    this.isEnum = structure === 'enum' || structure === 'enumArray';
    this.isDto = structure === 'dto' || structure === 'dtoArray';
    this.isArray =
      structure === 'array' || structure === 'enumArray' || structure === 'dtoArray';
    this.example = _.get(propertyOptions, 'example', propertyOptions.defaultValue);
  }

  private setMetadata() {
    // Get all metadata keys
    const keys = Reflect.getMetadataKeys(this.target, this.propertyKey);
    // Get all metadata values
    const metadata = keys.map((key) => ({
      key,
      value: Reflect.getMetadata(key, this.target, this.propertyKey),
    }));
  }

  private setSwagger() {
    const apiProperty = ApiProperty({
      ...this.propertyOptions,
      type: this.type,
      ...(this.isFile && { format: 'binary' }),
      ...(this.isEnum && { enum: this.type, enumName: this.type.name }),
      isArray: this.isArray,
      example: this.example,
      required: this.propertyOptions.required,
    });
    this.decorators.push(apiProperty);
  }

  /**
   * Add class-transformer decorators
   **/
  private setTransform() {
    const transformers: PropertyDecorator[] = [];

    // transform all type with default value
    if (_.has(this.options, 'defaultValue')) {
      const setDefaultValue = Transform(({ value }: TransformFnParams) => {
        if (value === undefined) {
          // if (!this.options.defaultValue) return;
          return this.options.defaultValue;
        }
        return value;
      });
      transformers.push(setDefaultValue);
    }

    switch (this.type) {
      case Number:
        transformers.push(TransformType(() => Number));
        break;
      case Boolean:
        const transformBool = Transform(({ value, key }: TransformFnParams) => {
          if (isEmpty(value)) return;
          if (!isBooleanString(value)) {
            throw new ServerException({
              ...ERROR_RESPONSE.REQUEST_PAYLOAD_VALIDATE_ERROR,
              message: `Property ${key} is not boolean`,
              details: { key: value },
            });
          }
          return value === 'true';
        });
        transformers.push(
          TransformType(() => String),
          transformBool,
        );
        break;
      case Date:
      case String:
      default:
      // do nothing
    }

    if (this.isDto) {
      transformers.push(TransformType(() => this.type));
    }
    if (this.isArray) {
      transformers.push(
        Transform(({ value }: TransformFnParams) => {
          if (isEmpty(value) || Array.isArray(value)) {
            return value;
          }
          return [value];
        }),
      );
    }

    this.decorators.push(...transformers);
  }

  /**
   * Add class-validator decorators
   * Note: If the property is required, it will be validated as not empty.
   * If the property is not required, it will be validated as optional.
   **/
  private setValidate() {
    const validators: PropertyDecorator[] = [];
    const validationOption = { each: this.isArray, groups: this.validateGroup };

    if (this.propertyOptions.required && !this.isFile) {
      validators.push(IsNotEmpty(validationOption));
    } else {
      validators.push(IsOptional(validationOption));
    }

    if (!this.isValidated) {
      // if dto is not validate then stop here
      return this.decorators.push(...validators);
    }

    switch (this.type) {
      case String:
        validators.push(IsString(validationOption));
        break;
      case Number:
        validators.push(IsNumber({}, validationOption));
        break;
      case Date:
        validators.push(IsDate(validationOption));
        break;
      case Boolean:
        validators.push(IsBoolean(validationOption));
        break;
      default:
        if (this.type && !this.isEnum && !this.isDto) {
          this.stackStrace.push(
            `Property type ${this.type.name} is not Primitive type but are not specified structure (enum, dto)`,
          );
        }
    }

    if (this.isArray) {
      validators.push(IsArray({ groups: this.validateGroup }));
    }
    if (this.isEnum) {
      validators.push(IsEnum(this.type, validationOption));
    }
    if (this.isDto) {
      validators.push(
        ValidateNested({
          groups: this.validateGroup,
          message: this.getValidateNestedMessage,
        }),
      );
    }

    this.decorators.push(...validators);
  }

  private isPrimitiveType(type: Type): boolean {
    switch (type) {
      case String:
      case Number:
      case Date:
      case Boolean:
        return true;
      default:
        return false;
    }
  }

  private getValidateNestedMessage(arg: ValidationArguments) {
    return `Field ${arg.property} with type=${this.type.name} can not validate nested`;
  }
}

/**
 * Comprehensive decorator for DTO's property. Must use everywhere
 * Note:
 * 1. When validateGroup is set, payload-validation.pipe is by passed by ValidateIf(() => isValidateByDefault). However, we can operate the validation by using validate()
 * 2. class-transformer always executes before class-validator
 *
 * @param {PropertyDtoOptions} options - The options for the property.
 * @returns The decorators for the property.
 */
function PropertyDto(options?: PropertyDtoOptions) {
  return (target: Object, propertyKey: string) => {
    const builder = new PropertyDtoBuilder(target, propertyKey, options);
    applyDecorators(...builder.decorators)(target, propertyKey);
  };
}

export { PropertyDto };
