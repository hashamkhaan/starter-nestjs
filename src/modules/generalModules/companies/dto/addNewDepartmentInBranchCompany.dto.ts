import { IsNotEmpty, IsOptional } from 'class-validator';
export class AddNewDepartmentInBranchCompanyDto {
  @IsNotEmpty({ message: 'Branch is required.' })
  branchId: number;
  @IsOptional()
  companyId?: number;
  @IsNotEmpty({ message: 'departmentId is required.' })
  departmentId: number;
}
