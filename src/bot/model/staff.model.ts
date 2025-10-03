import {
  AllowNull,
  Column,
  DataType,
  Model,
  Table,
} from "sequelize-typescript";

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
    type: DataType.STRING(32),
  })
  declare username: string;

  @Column({
    type: DataType.STRING(64),
  })
  declare first_name: string;

  @Column({
    type: DataType.STRING(64),
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
    type: DataType.STRING(30),
  })
  declare name: string; // max:30 letter

  @Column({
    type: DataType.SMALLINT,
  })
  declare age: number; // please change into number max age : 70

  @Column({
    type: DataType.STRING(30),
  })
  declare city: string; //max :30 letter

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
    type: DataType.BIGINT,
    allowNull: true, // null qiymatga ruxsat beradi
  })
  declare admin_message_id?: number | null;

  @Column({
    type: DataType.STRING,
  })
  declare last_state: string;

  @Column({
    type: DataType.STRING,
  })
  declare employer: string;

  @Column({
    type: DataType.SMALLINT,
    allowNull: true, // haow many times user uplied
  })
  declare apply_count?: number | null; //max : 3
}
