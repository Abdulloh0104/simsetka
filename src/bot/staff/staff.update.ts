import {
  Action,
  Command,
  Ctx,
  Hears,
  On,
  Start,
  Update,
} from "nestjs-telegraf";
import { Markup, Context } from "telegraf";
import { BotService } from "../bot.service";
import { StaffService } from "./staff.service";

@Update()
export class StaffUpdate {
  constructor(
    private readonly botService: BotService,
    private readonly staffService: StaffService
  ) {}

  @Hears("RO'YXATDAN O'TISH")
  async onClickRegister(@Ctx() ctx: Context) {
    return this.staffService.onClickRegister(ctx);
  }

  @Hears("Mening xodimlarim")
  async onMyAddresses(@Ctx() ctx: Context) {
    return this.staffService.onNewWorkers(ctx);
  }

  @Hears("✅ TASDIQLASH")
  async onApproved(@Ctx() ctx: Context) {
    return this.staffService.onApproved(ctx);
  }

  @Hears("❌ BEKOR QILISH")
  async onCancel(@Ctx() ctx: Context) {
    return this.staffService.onCancel(ctx);
  }

  @Action(/^note_+\d+/)
  async onClickNote(@Ctx() ctx: Context) {
    await this.staffService.onClickNote(ctx);
  } // admin note qo'shishi uchun ishlataman

  @Action(/^deleteNote_+\d+/)
  async onClickDeleteNote(@Ctx() ctx: Context) {
    await this.staffService.onClickDeleteNote(ctx);
  } // admin note qo'shishi uchun ishlataman

  @Action(/^app_+\d+/)
  async onClickHired(@Ctx() ctx: Context) {
    await this.staffService.onClickHired(ctx);
  } // admin ishga olganini bildirish uchun ishlatiladi

  @Action(/^del_+\d+/)
  async onClickDelete(@Ctx() ctx: Context) {
    await this.staffService.onClickDelete(ctx);
  }

  @Action(/^responsetouser_\d+_\d+$/)
  async responseToUser(ctx: Context) {
    return this.staffService.responseToUser(ctx);
  }

  @Action(/^city_.+_\d+$/)
  async onClickCity(@Ctx() ctx: Context) {
    return this.staffService.onClickCity(ctx);
  }

  @Action(/^convicted_.+_\d+$/)
  async isConvicted(ctx: Context) {
    return this.staffService.isConvicted(ctx);
  }

  @Hears("📄 Mening So'rovnomam")
  async onMySurvey(ctx: Context) {
    return this.staffService.onMySurvey(ctx);
  }
  @Hears("📤 Botni yuborish")
  async onRefferal(ctx: Context) {
    return this.staffService.onRefferal(ctx);
  }
  @Hears("🏢 Korxona haqida")
  async onEnterprise(ctx: Context) {
    return this.staffService.onEnterprise(ctx);
  }
  @Hears("ℹ️ Bot haqida")
  async aboutBotUz(ctx: Context) {
    return this.staffService.aboutBot(ctx);
  }
  @Hears("🔝 Asosiy menu")
  async toMainMenu(ctx: Context) {
    return this.staffService.toMainMenu(ctx);
  }

}
