// company-company-branch-department.entity.ts
import {
  Table,
  Model,
  DataType,
  ForeignKey,
  // BelongsTo,
  Column,
  // Index,
} from 'sequelize-typescript';
import { CompanyBranchDepartment } from '../companyBranch-department';
import { User } from '../users/entities/user.entity';

@Table
// ({
//   indexes: [
//     {
//       // type: 'unique',
//       unique: true,
//       fields: ['userId', 'companyBranchDepartmentId'],
//       name: 'CompanyBranchDepartments_userId_companyBranchDepartmentId_unique',
//     },
//   ],
// })
export class UserCompanyBranchDepartment extends Model {
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

  @ForeignKey(() => CompanyBranchDepartment)
  @Column({ allowNull: false, onDelete: 'NO ACTION' })
  companyBranchDepartmentId: number;

  @ForeignKey(() => User)
  @Column({ allowNull: false, onDelete: 'NO ACTION' })
  userId: number;
}
