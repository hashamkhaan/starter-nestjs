import {
  IsNotEmpty,
  IsString,
  Length,
  ValidateNested,
  ArrayNotEmpty,
  IsNotEmptyObject,
  IsDefined,
  registerDecorator,
  ValidationOptions,
} from 'class-validator';
import { ValidationArguments } from 'class-validator';

import { Type } from 'class-transformer';

export class CreateCompanyDto {
  @IsNotEmpty({ message: 'name is required.' })
  @IsString({ message: 'name must be a string.' })
  @Length(3, 50, { message: 'name must be between 3 and 25 characters.' })
  name: string;

  @IsNotEmpty({ message: 'description is required.' })
  @IsString({ message: 'description must be a string.' })
  @Length(3, 50, {
    message: 'description must be between 3 and 50 characters.',
  })
  description: string;

  @ArrayNotEmpty({ message: 'PLease provide atleast one branch .' })
  branches: Branch[];
}

export class Branch {
  @IsDefined()
  id: number;
  @IsDefined()
  @IsNotEmptyObject()
  @ArrayNotEmpty({
    message: 'Please provide at least one Department in Branch.',
  })
  @ValidateNested({ each: true })
  @Type(() => Department)
  @ArrayNotEmptyAtLeastOne({
    message: 'Please provide at least one Department in Branch.',
  })
  departments: Department[];
}
export class Department {
  id: number;
}

// Custom validation rule for at least one department
export function ArrayNotEmptyAtLeastOne(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'arrayNotEmptyAtLeastOne',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          console.log(args);
          if (!Array.isArray(value) || value.length === 0) {
            return false;
          }

          return value.some((item: any) => item != null);
        },
        defaultMessage(args: ValidationArguments) {
          return `At least one element is required in '${args.property}'.`;
        },
      },
    });
  };
}
