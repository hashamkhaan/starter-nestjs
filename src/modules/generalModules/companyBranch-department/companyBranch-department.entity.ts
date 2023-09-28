// company-company-branch-department.entity.ts
import {
  Table,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  BelongsToMany,
  Column,
  // Index,
} from 'sequelize-typescript';
import { CompanyBranch } from '../company-branch/company-branch.entity';
import { Department } from '../departments/entities/department.entity';
import { User } from '../users/entities/user.entity';
import { UserCompanyBranchDepartment } from '../user-companyBranchDepartment';

@Table
export class CompanyBranchDepartment extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  id: number;

  @ForeignKey(() => CompanyBranch)
  @Column({
    type: DataType.INTEGER,
    allowNull: false, // Add NOT NULL constraint
    onDelete: 'NO ACTION',
  })
  companyBranchId: number;

  @ForeignKey(() => Department)
  @Column({
    type: DataType.INTEGER,
    allowNull: false, // Add NOT NULL constraint
    onDelete: 'NO ACTION',
  })
  departmentId: number;
  @Column({
    type: DataType.TINYINT,
    defaultValue: 1,
    allowNull: false,
  })
  isActive: number;

  @BelongsToMany(() => User, () => UserCompanyBranchDepartment)
  users: User[];
  @BelongsTo(() => CompanyBranch)
  companyBranch: CompanyBranch;
  @BelongsTo(() => Department)
  department: Department;
}
