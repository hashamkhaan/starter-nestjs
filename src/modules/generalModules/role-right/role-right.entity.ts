// branch-department.entity.ts
import {
  Table,
  Model,
  ForeignKey,
  BelongsTo,
  DataType,
  Column,
} from 'sequelize-typescript';
import { Role } from '../roles/entities/role.entity';
import { Right } from '../rights/index';

@Table
export class RoleRight extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  id: number;
  @ForeignKey(() => Role)
  @Column({ allowNull: false, onDelete: 'NO ACTION' })
  roleId: number;

  @ForeignKey(() => Right)
  @Column({ allowNull: false, onDelete: 'NO ACTION' })
  rightId: number;
  @Column({
    type: DataType.TINYINT,
    defaultValue: 1,
    allowNull: false,
  })
  isActive: number;

  @BelongsTo(() => Role)
  role: Role;

  @BelongsTo(() => Right)
  right: Right;
}
