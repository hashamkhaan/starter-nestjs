import {
  Table,
  Model,
  ForeignKey,
  DataType,
  Column,
  BelongsTo,
} from 'sequelize-typescript';
import { User } from '../users/entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import { Company } from '../companies/entities/company.entity';
import { Branch } from '../branches/entities/branch.entity';
import { Department } from '../departments/entities/department.entity';

@Table({
  indexes: [
    {
      unique: true,
      fields: ['companyId', 'branchId', 'departmentId', 'userId', 'roleId'],
      name: 'CompanyBranchDepartmentUserRoles_companyId_branchId_departmentId_userId_RoleId_unique',
    },
  ],
})
export class CompanyBranchDepartmentUserRoles extends Model {
  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false, // Add NOT NULL constraint
    onDelete: 'NO ACTION',
  })
  userId: number;

  @ForeignKey(() => Role)
  @Column({
    type: DataType.INTEGER,
    allowNull: false, // Add NOT NULL constraint
    onDelete: 'NO ACTION',
  })
  roleId: number;

  @ForeignKey(() => Company)
  @Column({
    type: DataType.INTEGER,
    // allowNull: false, // Add NOT NULL constraint
    onDelete: 'NO ACTION',
  })
  companyId: number;

  @ForeignKey(() => Branch)
  @Column({
    type: DataType.INTEGER,
    // allowNull: false, // Add NOT NULL constraint
    onDelete: 'NO ACTION',
  })
  branchId: number;

  @ForeignKey(() => Department)
  @Column({
    type: DataType.INTEGER,
    // allowNull: false, // Add NOT NULL constraint
    onDelete: 'NO ACTION',
  })
  departmentId: number;

  @BelongsTo(() => User)
  user: User;

  @BelongsTo(() => Role)
  role: Role;

  @BelongsTo(() => Company)
  company: Company;

  @BelongsTo(() => Branch)
  branch: Branch;

  @BelongsTo(() => Department)
  department: Department;
}
