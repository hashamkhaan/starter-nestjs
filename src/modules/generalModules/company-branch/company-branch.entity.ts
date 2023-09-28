// company-company-branch-department.entity.ts
import {
  Table,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  Column,
  HasMany,
  // Index,
} from 'sequelize-typescript';
import { Branch } from '../branches/entities/branch.entity';
import { Company } from '../companies/entities/company.entity';
import { CompanyBranchDepartment } from '../companyBranch-department';

@Table
export class CompanyBranch extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  id: number;
  @Column({
    type: DataType.TINYINT,
    defaultValue: 1,
    allowNull: false,
  })
  isActive: number;

  @ForeignKey(() => Branch)
  @Column({ allowNull: false, onDelete: 'NO ACTION' })
  branchId: number;

  @ForeignKey(() => Company)
  @Column({ allowNull: false, onDelete: 'NO ACTION' })
  companyId: number;

  @BelongsTo(() => Branch)
  branch: Branch;
  @BelongsTo(() => Company)
  company: Company;
  @HasMany(() => CompanyBranchDepartment)
  companyBranchDepartments: CompanyBranchDepartment[];
}
