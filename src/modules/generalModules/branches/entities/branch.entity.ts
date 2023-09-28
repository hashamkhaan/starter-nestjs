/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Table,
  Column,
  Model,
  DataType,
  BelongsToMany,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { CompanyBranch } from '../../company-branch';
import { Company } from '../../companies/entities/company.entity';
import { City } from '../../cities';
import { CompanyBranchDepartment } from '../../companyBranch-department';

@Table
export class Branch extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  id: number;
  @ForeignKey(() => City)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    onDelete: 'NO ACTION',
  })
  cityId: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: {
      name: 'unique_branch_name',
      msg: 'Branch name must be unique.',
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
    type: DataType.STRING,
    allowNull: false,
    defaultValue: 'None',
  })
  code: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    defaultValue: 'None',
  })
  friendlyName: string;
  @Column({
    type: DataType.STRING,
    allowNull: true,
    defaultValue: 'None',
  })
  address: string;
  @Column({
    type: DataType.STRING,
    allowNull: true,
    defaultValue: 'None',
  })
  phone: string;
  @Column({
    type: DataType.STRING,
    allowNull: true,
    defaultValue: 'None',
  })
  email: string;

  @Column({
    type: DataType.TINYINT,
    defaultValue: 1,
    allowNull: false,
  })
  isActive: number;

  @BelongsToMany(() => Company, () => CompanyBranch)
  companies: Company[];
  @BelongsTo(() => City)
  city: City;
}

export default Branch;
