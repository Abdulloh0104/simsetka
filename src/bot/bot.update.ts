import {
  Action,
  Command,
  Ctx,
  Hears,
  On,
  Start,
  Update,
} from "nestjs-telegraf";
import {Context } from "telegraf";
import { BotService } from "./bot.service";
import { UseFilters } from "@nestjs/common";
import { TelegrafExceptionFilter } from "../common/filters/telegraf-exception.filter";

@Update()
export class BotUpdate {
  constructor(private readonly botService: BotService) {}

  @UseFilters(TelegrafExceptionFilter)
  @Command("admin")
  async onAdminCommand(@Ctx() ctx: Context) {
    await this.botService.admin_menu(ctx);
  }

  @Start()
  async onStart(@Ctx() ctx: Context) {
    return this.botService.start(ctx);
  }

  @On("contact")
  async onContact(@Ctx() ctx: Context) {
    return this.botService.onContact(ctx);
  }

  @Command("stop")
  async onStop(@Ctx() ctx: Context) {
    return this.botService.onStop(ctx);
  }

  @On("text")
  async onText(@Ctx() ctx: Context) {
    return this.botService.onText(ctx);
  }

  @Command("help")
  async onCommandHelp(@Ctx() ctx: Context) {
    await ctx.reply("Ertaga yordam beraman");
  }
  @On("message")
  async onMessage(@Ctx() ctx: Context) {
    console.log(ctx.botInfo);
    console.log(ctx.chat);
    console.log(ctx.chat!.id);
    console.log(ctx.from);
    console.log(ctx.from!.id);
  }
}
