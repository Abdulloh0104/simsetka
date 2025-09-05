import { AllowNull, Column, DataType, Model, Table } from "sequelize-typescript";

interface IStaffCreation {
  user_id?: number | undefined;
  username?: string;
  first_name?: string;
  last_name?: string;
  lang?: string;
  last_state?: string;
}

@Table({ tableName: "staff" })
export class Staff extends Model<Staff, IStaffCreation> {
  @Column({
    type: DataType.BIGINT,
    primaryKey: true,
  })
  declare user_id: number;

  @Column({
    type: DataType.STRING,
  })
  declare username: string;

  @Column({
    type: DataType.STRING,
  })
  declare first_name: string;

  @Column({
    type: DataType.STRING(50),
  })
  declare last_name: string;

  @Column({
    type: DataType.STRING(15),
  })
  declare phone_number: string;

  @Column({
    type: DataType.STRING(3),
  })
  declare lang: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  declare status: boolean;
  //--------------------------------
  @Column({
    type: DataType.STRING,
  })
  declare name: string;

  @Column({
    type: DataType.STRING(15),
  })
  declare age: string;

  @Column({
    type: DataType.STRING,
  })
  declare city: string;

  @Column({
    type: DataType.STRING,
  })
  declare is_convicted: string;

  @Column({
    type: DataType.TEXT,
  })
  declare note?: string;

  @Column({
    type: DataType.BIGINT,
    allowNull: true, // null qiymatga ruxsat beradi
  })
  declare last_message_id?: number | null;

  @Column({
    type: DataType.STRING,
  })
  declare last_state: string;

  @Column({
    type: DataType.STRING,
  })
  declare employer: string;

  @Column({
    type: DataType.BIGINT,
    allowNull: true, // necha marta ariza topshirilgani
  })
  declare apply_count?: number | null;
}
