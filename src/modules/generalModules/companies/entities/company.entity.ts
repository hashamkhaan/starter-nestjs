import {
  Table,
  Column,
  Model,
  DataType,
  BelongsToMany,
  BelongsTo,
  ForeignKey,
  HasMany,
} from 'sequelize-typescript';
import { Branch } from '../../branches/entities/branch.entity';
import { CompanyBranch } from '../../company-branch';
import { CompanyType } from '../../company-types';

@Table
export class Company extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  id: number;
  @ForeignKey(() => CompanyType)
  @Column({ allowNull: false, onDelete: 'NO ACTION' })
  @Column({
    type: DataType.INTEGER,
    allowNull: false, // Add NOT NULL constraint
  })
  companyTypeId: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: {
      name: 'unique_company_name',
      msg: 'Company name must be unique.',
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
  @BelongsToMany(() => Branch, () => CompanyBranch)
  branches: Branch[];

  @BelongsTo(() => CompanyType)
  companyType: CompanyType;
  @HasMany(() => CompanyBranch)
  companyBranches: CompanyBranch;
}

// You can define associations here if needed

export default Company;
