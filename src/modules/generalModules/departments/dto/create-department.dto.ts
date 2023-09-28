import { IsNotEmpty, IsString, Length } from 'class-validator';
export class CreateDepartmentDto {
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
}
