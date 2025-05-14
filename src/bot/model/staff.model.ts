import { Column, DataType, Model, Table } from "sequelize-typescript";

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
    type: DataType.ENUM(
      "SARTAROSH",
      "GUZALLIK",
      "ZARGAR",
      "SOATSOZ",
      "ETIKDOZ"
    ),
  })
  declare occupation: string;

  @Column({
    type: DataType.STRING,
  })
  declare name: string;

  @Column({
    type: DataType.STRING,
  })
  declare ustaxonaNomi: string;

  @Column({
    type: DataType.STRING,
  })
  declare address: string;

  @Column({
    type: DataType.STRING,
  })
  declare muljal: string;

  @Column({
    type: DataType.STRING,
  })
  declare location: string;

  @Column({
    type: DataType.TIME,
  })
  declare start: string;

  @Column({
    type: DataType.TIME,
  })
  declare end: string;

  @Column({
    type: DataType.STRING,
  })
  declare avgClientTime: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  declare isApproved: boolean;

  @Column({
    type: DataType.STRING,
  })
  declare last_state: string;
}
