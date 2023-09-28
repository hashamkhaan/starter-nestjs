// branch-department.entity.ts
import { Table, DataType, Model, Column } from 'sequelize-typescript';

@Table
export class Right extends Model {
  @Column
  name: string;

  @Column
  description: string;
  @Column({
    type: DataType.TINYINT,
    defaultValue: 1,
    allowNull: false,
  })
  isActive: number;
}
