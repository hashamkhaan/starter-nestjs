import {
  IsNotEmpty,
  IsString,
  Length,
  ValidateIf,
  IsOptional,
  IsEmail,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBranchDto {
  id: number;

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
  @IsNotEmpty({ message: 'cityId is required.' })
  cityId: number;

  @IsNotEmpty({ message: 'Branch code is required.' })
  code: string;

  @IsOptional()
  friendlyName: string;
  @IsOptional()
  address: string;
  @IsOptional()
  phone: string;
  @ApiPropertyOptional({ description: 'User email address' })
  @IsOptional()
  @ValidateIf((o) => o.email != '')
  @IsEmail({}, { message: 'Invalid email format' })
  email?: string;
}
