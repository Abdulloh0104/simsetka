import { Module } from "@nestjs/common";
import { BotService } from "./bot.service";
import { BotUpdate } from "./bot.update";
import { SequelizeModule } from "@nestjs/sequelize";
import { Staff } from "./model/staff.model";
import { StaffService } from "./staff/staff.service";
import { StaffUpdate } from "./staff/staff.update";

@Module({
  imports: [SequelizeModule.forFeature([ Staff])],
  controllers: [],
  providers: [
    BotService,
    StaffService,
    StaffUpdate,
    BotUpdate,
  ],
  exports: [BotService],
})
export class BotModule {}
