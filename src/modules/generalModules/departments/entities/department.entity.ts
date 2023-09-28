import {
  Table,
  Column,
  Model,
  DataType,
  BelongsToMany,
} from 'sequelize-typescript';
import { CompanyBranchDepartment } from '../../companyBranch-department/';
import { CompanyBranch } from '../../company-branch';

@Table
export class Department extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  id: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: {
      name: 'unique_department_name',
      msg: 'Department name must be unique.',
    },
    validate: {
      notNull: {
        msg: 'Name is required.',
      },
      notEmpty: {
        msg: 'Name cannot be empty.',
      },
      len: {
        args: [3, 50],
        msg: 'Name must be between 3 and 50 characters.',
      },
    },
  })
  name: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  description: string;
  @Column({
    type: DataType.TINYINT,
    defaultValue: 1,
    allowNull: false,
  })
  isActive: number;
  @BelongsToMany(() => CompanyBranch, () => CompanyBranchDepartment)
  companyBranches: CompanyBranch[];
}

export default Department;
