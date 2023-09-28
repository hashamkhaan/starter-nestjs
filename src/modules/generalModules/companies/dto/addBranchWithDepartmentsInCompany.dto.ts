import {
  IsNotEmpty,
  ArrayNotEmpty,
  IsOptional,
  IsEmail,
  ValidateIf,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
// import { IgnoreEmptyEmail } from 'src/common/decorators/others/ignore-empty-email.decorator'; // Import your custom decorator

export class AddBranchWithDepartmentsInCompanyDto {
  @IsNotEmpty({ message: 'Branch is required.' })
  branchId: number;
  @IsOptional()
  companyId: number;

  @ArrayNotEmpty({ message: 'Provide atleast one department.' })
  departments: number[];
}
